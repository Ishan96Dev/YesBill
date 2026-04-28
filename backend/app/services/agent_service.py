# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""
Agent service: agentic LLM calls with native tool/function calling.
Handles IMMEDIATE tools (read-only, execute directly) and CONFIRM tools (write, require user confirmation).
"""
import json
import logging
import re
import time
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # type: ignore

import httpx

from app.services.chat_service import (
    get_user_ai_settings,
    ensure_model_available,
    MODEL_UNAVAILABLE_PRECHECK,
    MODEL_UNAVAILABLE_RUNTIME,
    OPENAI_CHAT_URL,
    ANTHROPIC_MESSAGES_URL,
    GOOGLE_GENERATE_URL,
    YESBILL_SYSTEM_PROMPT,
    _build_openai_params,
    OPENAI_NO_TEMP_MODELS,
    OPENAI_REASONING_EFFORT_MODELS,
    GOOGLE_THINKING_BUDGET_MODELS,
    GOOGLE_THINKING_LEVEL_MODELS,
    _GOOGLE_EFFORT_TO_LEVEL,
    _GOOGLE_EFFORT_TO_BUDGET,
    _GOOGLE_EFFORT_TO_READ_TIMEOUT,
)
from app.services.pricing import calculate_cost
from app.services.supabase import supabase_service

logger = logging.getLogger("yesbill.agent")

AGENT_SYSTEM_PROMPT = (
    YESBILL_SYSTEM_PROMPT
    + "\n\nYou are in AGENT MODE with access to tools. "
    "Use tools to look up accurate data before answering. "
    "For write operations, use the appropriate tool - the user will see a confirmation card before any change is applied. "
    "For update_calendar_day: you can update any date within the LAST 30 DAYS (including today). "
    "Future dates are not allowed. Dates older than 30 days are not allowed. "
    "If the user requests a date outside this window, explain the 30-day limit and ask which valid date they want instead. "
    "For multiple dates, call update_calendar_day once per date in the same response. "
    "Accepted date input formats: today, yesterday, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY. "
    "If date parsing fails, explain the accepted formats. "
    "For generate_bill: call search_services first if you don't have service IDs. "
    "Always ask the user which month to generate the bill for, then ask if they want an email — then call generate_bill. "
    "For create_service: required fields are name, price, delivery_type. "
    "All other fields (type, schedule, icon, notes, billing_day, start_date, end_date) are optional — infer sensible defaults. "
    "Consumer role only — never set provider role via agent. "
    "For edit_service: use the service_name the user provides — do NOT call search_services first. "
    "Collect only the fields the user wants to change; any field not mentioned is left unchanged. "
    "At minimum one editable field must be provided (name, price, notes, billing_day, schedule, icon, type, delivery_type, start_date, end_date). "
    "Be concise and confirm what you did."
)

# Tool categories
IMMEDIATE_TOOLS = {"search_services", "get_service_details", "get_bills", "get_calendar_month", "search_docs"}
CONFIRM_TOOLS = {"update_service", "toggle_service_active", "mark_bill_paid", "update_calendar_day", "generate_bill", "create_service", "edit_service"}

# ──────────────────────────────────────────────
# Tool schema (provider-agnostic)
# ──────────────────────────────────────────────

_TOOL_SCHEMAS = [
    {
        "name": "search_services",
        "description": "List all of the user's active services with basic info.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_service_details",
        "description": "Get full details of a specific service by its UUID.",
        "parameters": {
            "type": "object",
            "properties": {"service_id": {"type": "string", "description": "Service UUID"}},
            "required": ["service_id"],
        },
    },
    {
        "name": "edit_service",
        "description": (
            "REQUIRES CONFIRMATION. Edit one or more fields of an existing user service by its name. "
            "Provide service_name and only the fields to change — unchanged fields are omitted. "
            "Use this instead of update_service when the user asks to edit/change/update a service "
            "by name or wants to change multiple fields at once."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_name": {
                    "type": "string",
                    "description": "Exact or close name of the service to edit",
                },
                "name": {"type": "string", "description": "New service name"},
                "price": {"type": "number", "description": "New price"},
                "notes": {"type": "string", "description": "New notes/description"},
                "billing_day": {
                    "type": "integer",
                    "description": "Day of month for billing (1-31)",
                },
                "schedule": {
                    "type": "string",
                    "enum": ["morning", "afternoon", "evening", "anytime"],
                    "description": "Delivery schedule",
                },
                "icon": {"type": "string", "description": "Icon identifier"},
                "type": {
                    "type": "string",
                    "enum": ["daily", "weekly", "monthly", "custom"],
                    "description": "Service frequency type",
                },
                "delivery_type": {
                    "type": "string",
                    "enum": [
                        "home_delivery",
                        "utility",
                        "subscription",
                        "payment",
                        "visit_based",
                    ],
                    "description": "Delivery/billing type",
                },
                "start_date": {
                    "type": "string",
                    "description": "Service start date (YYYY-MM-DD)",
                },
                "end_date": {
                    "type": "string",
                    "description": "Service end date (YYYY-MM-DD)",
                },
            },
            "required": ["service_name"],
        },
    },
    {
        "name": "update_service",
        "description": "REQUIRES CONFIRMATION. Update a field of a user service.",
        "parameters": {
            "type": "object",
            "properties": {
                "service_id": {"type": "string"},
                "field": {"type": "string", "enum": ["name", "price", "notes", "billing_day", "schedule"]},
                "new_value": {"type": "string", "description": "New value as string"},
            },
            "required": ["service_id", "field", "new_value"],
        },
    },
    {
        "name": "toggle_service_active",
        "description": "REQUIRES CONFIRMATION. Activate or deactivate a service.",
        "parameters": {
            "type": "object",
            "properties": {
                "service_id": {"type": "string"},
                "active": {"type": "boolean"},
            },
            "required": ["service_id", "active"],
        },
    },
    {
        "name": "get_bills",
        "description": "Get user's generated bills, optionally filtered by month (YYYY-MM).",
        "parameters": {
            "type": "object",
            "properties": {"month": {"type": "string", "description": "Optional YYYY-MM filter"}},
            "required": [],
        },
    },
    {
        "name": "mark_bill_paid",
        "description": "REQUIRES CONFIRMATION. Mark a generated bill as paid or unpaid.",
        "parameters": {
            "type": "object",
            "properties": {
                "bill_id": {"type": "string"},
                "is_paid": {"type": "boolean"},
                "payment_method": {"type": "string", "description": "Optional payment method"},
            },
            "required": ["bill_id", "is_paid"],
        },
    },
    {
        "name": "get_calendar_month",
        "description": "Get calendar confirmation data for a specific month (YYYY-MM).",
        "parameters": {
            "type": "object",
            "properties": {"year_month": {"type": "string", "description": "YYYY-MM format"}},
            "required": ["year_month"],
        },
    },
    {
        "name": "update_calendar_day",
        "description": (
            "REQUIRES CONFIRMATION. Update delivery/visit status for a service. "
            "Accepted date forms: today, yesterday, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY. "
            "Only local today or yesterday are allowed after normalization."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_id": {"type": "string"},
                "date": {
                    "type": "string",
                    "description": "Date text (today/yesterday or explicit date) to normalize into YYYY-MM-DD",
                },
                "status": {
                    "type": "string",
                    "enum": ["delivered", "skipped", "visited", "missed", "not_set"],
                },
            },
            "required": ["service_id", "date", "status"],
        },
    },
    {
        "name": "search_docs",
        "description": (
            "Search YesBill documentation for how-to guides and feature explanations. "
            "Use when user asks how to use a feature, what something means, "
            "or needs step-by-step instructions."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query describing what the user wants to know"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "generate_bill",
        "description": (
            "REQUIRES CONFIRMATION. Generate an AI bill for one or more services for a specific month. "
            "Call search_services first to discover service IDs if needed. "
            "Always ask the user which month and whether to send the bill by email before calling this tool."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_ids": {
                    "type": "string",
                    "description": "Comma-separated service UUID(s) to include in the bill",
                },
                "year_month": {
                    "type": "string",
                    "description": "Month to generate the bill for (YYYY-MM format, e.g. 2026-02)",
                },
                "send_email": {
                    "type": "boolean",
                    "description": "Whether to email the generated bill to the user",
                },
            },
            "required": ["service_ids", "year_month", "send_email"],
        },
    },
    {
        "name": "create_service",
        "description": (
            "REQUIRES CONFIRMATION. Create a new consumer-role service for the user. "
            "Required: name, price, delivery_type. "
            "Optional: type (billing frequency), schedule, icon, notes, billing_day, start_date, end_date. "
            "Do not use provider role — consumer only."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Service name (e.g. 'Morning Milk')"},
                "price": {"type": "number", "description": "Price amount (e.g. 50.0)"},
                "delivery_type": {
                    "type": "string",
                    "enum": ["home_delivery", "utility", "visit_based", "subscription", "payment"],
                    "description": "Billing model for this service",
                },
                "type": {
                    "type": "string",
                    "enum": ["daily", "weekly", "monthly", "yearly"],
                    "description": "Billing frequency (default: daily)",
                },
                "schedule": {
                    "type": "string",
                    "enum": ["morning", "evening", "custom"],
                    "description": "Delivery schedule (default: morning)",
                },
                "icon": {
                    "type": "string",
                    "description": (
                        "Icon key (default: package). Options: coffee, newspaper, car, utensils, package, "
                        "bike, home, dumbbell, wifi, shirt, droplets, zap, flame, tv, phone, "
                        "heart-pulse, wrench, music, book-open, bus, credit-card, banknote, building-2"
                    ),
                },
                "notes": {"type": "string", "description": "Optional notes about the service"},
                "billing_day": {
                    "type": "integer",
                    "description": "Day of month for billing (1–31, default: 1)",
                },
                "start_date": {"type": "string", "description": "Service start date (YYYY-MM-DD, optional)"},
                "end_date": {"type": "string", "description": "Service end date (YYYY-MM-DD, optional)"},
            },
            "required": ["name", "price", "delivery_type"],
        },
    },
]


def _accepted_calendar_date_help() -> str:
    return (
        "I can only update calendar entries within the last 30 days. "
        "Accepted date forms: today, yesterday, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY "
        "(for example: today, yesterday, 2026-02-19, 19/02/2026, 02/19/2026)."
    )


# Deprecated IANA timezone aliases still returned by some browsers/OS
_TZ_ALIASES: dict[str, str] = {
    "Asia/Calcutta": "Asia/Kolkata",
    "Asia/Ulaanbaatar": "Asia/Ulan_Bator",
    "America/Indiana/Indianapolis": "America/Indiana/Indianapolis",  # keep as-is (present in tzdata)
}


def _safe_zoneinfo(tz_key: str) -> "ZoneInfo":
    """Return ZoneInfo for tz_key, normalising deprecated aliases and falling back to UTC."""
    normalized = _TZ_ALIASES.get(tz_key, tz_key)
    try:
        return ZoneInfo(normalized)
    except Exception:
        return ZoneInfo("UTC")


def _normalize_calendar_date_input(date_input: str, user_tz: str) -> str | None:
    raw = (date_input or "").strip()
    if not raw:
        return None
    lowered = raw.lower()

    try:
        tz = _safe_zoneinfo(user_tz)
    except Exception:
        tz = ZoneInfo("Asia/Kolkata")

    today = datetime.now(tz).date()
    yesterday = today - timedelta(days=1)

    # Common natural language forms
    if lowered.startswith("today"):
        return today.isoformat()
    if lowered.startswith("yesterday"):
        return yesterday.isoformat()

    # Handle strings like "today 2/19/2026"
    cleaned = re.sub(r"\b(today|yesterday)\b", "", lowered).strip()
    candidate = cleaned if cleaned else raw

    parse_attempts = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
    ]
    for fmt in parse_attempts:
        try:
            return datetime.strptime(candidate, fmt).date().isoformat()
        except ValueError:
            continue

    return None


def _reasoning_metadata(model_info: dict | None) -> dict:
    supported = bool(model_info and model_info.get("reasoning_supported"))
    label = (
        model_info.get("reasoning_label")
        if model_info and model_info.get("reasoning_label")
        else "Reasoning support"
    )
    return {
        "supported": supported,
        "label": label,
        "status": "supported" if supported else "not_supported",
    }


def _openai_tools() -> list[dict]:
    return [{"type": "function", "function": s} for s in _TOOL_SCHEMAS]


def _anthropic_tools() -> list[dict]:
    return [
        {
            "name": s["name"],
            "description": s["description"],
            "input_schema": s["parameters"],
        }
        for s in _TOOL_SCHEMAS
    ]


def _google_function_declarations() -> list[dict]:
    return [
        {
            "name": s["name"],
            "description": s["description"],
            "parameters": s["parameters"],
        }
        for s in _TOOL_SCHEMAS
    ]


# ──────────────────────────────────────────────
# Non-streaming LLM calls with tool support
# ──────────────────────────────────────────────

async def _call_openai_with_tools(
    api_key: str, model: str, messages: list[dict], system_prompt: str = AGENT_SYSTEM_PROMPT
) -> dict:
    """Call OpenAI with tool definitions. Returns raw response dict."""
    all_messages = [{"role": "system", "content": system_prompt}] + messages
    params = _build_openai_params(model, all_messages, max_tokens=1500)
    params["tools"] = _openai_tools()
    params["tool_choice"] = "auto"
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            OPENAI_CHAT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=params,
        )
        r.raise_for_status()
        return r.json()


async def _call_anthropic_with_tools(
    api_key: str, model: str, messages: list[dict], system_prompt: str = AGENT_SYSTEM_PROMPT
) -> dict:
    """Call Anthropic with tool definitions. Returns raw response dict."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            ANTHROPIC_MESSAGES_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1500,
                "system": system_prompt,
                "messages": messages,
                "tools": _anthropic_tools(),
            },
        )
        r.raise_for_status()
        return r.json()


async def _call_google_with_tools(
    api_key: str, model: str, messages: list[dict], system_prompt: str = AGENT_SYSTEM_PROMPT
) -> dict:
    """Call Google with function declarations. Returns raw response dict."""
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        if isinstance(m.get("content"), list):
            contents.append({"role": role, "parts": m["content"]})
        else:
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
    generation_config: dict = {"maxOutputTokens": 1500}
    if model in GOOGLE_THINKING_BUDGET_MODELS:
        # 2.5.x: use a low thinking budget to keep tool-planning fast but accurate
        generation_config["thinkingConfig"] = {"includeThoughts": True, "thinkingBudget": 512}
    elif model in GOOGLE_THINKING_LEVEL_MODELS:
        # 3.x: LOW level — correct lowercase value as per API spec
        generation_config["thinkingConfig"] = {"thinkingLevel": "low"}
    url = GOOGLE_GENERATE_URL.format(model=model)
    # Thinking models need more time for tool-planning calls.
    # LOW level ~66s; use 300s to be safe, same as streaming path.
    _is_thinking_model = model in GOOGLE_THINKING_BUDGET_MODELS or model in GOOGLE_THINKING_LEVEL_MODELS
    _tool_timeout = 300.0 if _is_thinking_model else 60.0
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=_tool_timeout, write=10.0, pool=5.0)) as client:
        # Force ANY mode only for Gemini 3.x models — these sometimes respond with
        # plain text describing what they *would* call instead of emitting a functionCall.
        # For 2.5.x models keep AUTO so the model can freely respond with text when
        # clarification is needed (e.g. asking which month before calling generate_bill).
        _force_any = model in {"gemini-3.1-pro-preview", "gemini-3-pro-preview"}
        r = await client.post(
            f"{url}?key={api_key}",
            json={
                "contents": contents,
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "tools": [{"function_declarations": _google_function_declarations()}],
                "toolConfig": {
                    "functionCallingConfig": {"mode": "ANY" if _force_any else "AUTO"}
                },
                "generationConfig": generation_config,
            },
        )
        r.raise_for_status()
        return r.json()


def _normalize_tool_call(name: str | None, args: object, call_id: str | None, index: int) -> dict | None:
    normalized_name = (name or "").strip()
    if not normalized_name:
        return None

    normalized_args: dict = {}
    if isinstance(args, dict):
        normalized_args = args
    elif isinstance(args, str):
        try:
            parsed = json.loads(args)
            if isinstance(parsed, dict):
                normalized_args = parsed
        except json.JSONDecodeError:
            normalized_args = {}

    normalized_call_id = call_id or f"{normalized_name}_{index}"
    return {"call_id": normalized_call_id, "name": normalized_name, "args": normalized_args}


def _safe_exception_message(exc: Exception) -> str:
    text = str(exc).strip()
    return text or exc.__class__.__name__


# ──────────────────────────────────────────────
# Streaming final response (no tool calls, text only)
# ──────────────────────────────────────────────

async def _stream_openai_final(
    api_key: str, model: str, messages: list[dict], system_prompt: str = AGENT_SYSTEM_PROMPT,
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """Stream the final text response from OpenAI (no tools). Yields dicts {type, content}.
    Yields final {"type": "_usage", ...} with token counts."""
    all_messages = [{"role": "system", "content": system_prompt}] + messages
    params = _build_openai_params(model, all_messages, max_tokens=1500)
    params["stream"] = True
    params["stream_options"] = {"include_usage": True}
    # Emit a thinking spinner only when the model actually uses reasoning tokens.
    # If reasoning_effort is "none" the user has disabled thinking — skip the spinner.
    is_reasoning = model in OPENAI_NO_TEMP_MODELS or model in OPENAI_REASONING_EFFORT_MODELS
    if is_reasoning and reasoning_effort != "none":
        yield {"type": "thinking", "content": ""}
    _usage_data: dict = {"tokens_in": 0, "tokens_out": 0, "tokens_thinking": 0}
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=300.0, write=10.0, pool=5.0)) as client:
        async with client.stream(
            "POST",
            OPENAI_CHAT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=params,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    if "usage" in chunk and chunk.get("usage"):
                        u = chunk["usage"]
                        _usage_data["tokens_in"] = u.get("prompt_tokens", 0)
                        _usage_data["tokens_out"] = u.get("completion_tokens", 0)
                        _usage_data["tokens_thinking"] = (
                            u.get("completion_tokens_details", {}).get("reasoning_tokens", 0)
                        )
                    # OpenAI sends chunks where choices=[] (e.g. the final usage-only chunk).
                    # dict.get("choices", [{}]) only uses the fallback when the key is absent —
                    # not when it is present but empty — so [0] would raise IndexError.
                    # Using `or [{}]` handles both missing AND empty-list cases safely.
                    token = (chunk.get("choices") or [{}])[0].get("delta", {}).get("content") or ""
                    if token:
                        yield {"type": "chunk", "content": token}
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
    yield {"type": "_usage", **_usage_data}


async def _stream_anthropic_final(
    api_key: str, model: str, messages: list[dict], system_prompt: str = AGENT_SYSTEM_PROMPT
) -> AsyncGenerator[dict, None]:
    """Stream the final text response from Anthropic (no tools). Yields dicts {type, content}.
    Yields final {"type": "_usage", ...} with token counts."""
    _tokens_in = 0
    _tokens_out = 0
    _thinking_chars = 0
    # If messages contain tool_use blocks (from a prior tool-call iteration) Anthropic
    # requires the tools array to be present in the request, otherwise it returns 400.
    # Include tools here and let the model decide (tool_choice=auto); since the
    # non-streaming call already determined there are no new tool calls needed, the
    # model will respond with text.
    _has_tool_use = any(
        isinstance(m.get("content"), list) and any(
            isinstance(b, dict) and b.get("type") == "tool_use" for b in m["content"]
        )
        for m in messages
    )
    request_body: dict = {
        "model": model,
        "max_tokens": 16000,
        "thinking": {"type": "enabled", "budget_tokens": 5000},
        "system": system_prompt,
        "messages": messages,
        "stream": True,
    }
    if _has_tool_use:
        request_body["tools"] = _anthropic_tools()
        # tool_choice "auto" lets the model respond with text (which is its intent here).
        # "none" would be cleaner but requires a newer anthropic-version header.
        request_body["tool_choice"] = {"type": "auto"}
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=300.0, write=10.0, pool=5.0)) as client:
        async with client.stream(
            "POST",
            ANTHROPIC_MESSAGES_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "anthropic-beta": "interleaved-thinking-2025-05-14",
                "content-type": "application/json",
            },
            json=request_body,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                try:
                    event = json.loads(data)
                    event_type = event.get("type", "")
                    if event_type == "message_start":
                        _tokens_in = event.get("message", {}).get("usage", {}).get("input_tokens", 0)
                    elif event_type == "message_delta":
                        _tokens_out = event.get("usage", {}).get("output_tokens", 0)
                    elif event_type == "content_block_delta":
                        delta = event.get("delta", {})
                        if delta.get("type") == "thinking_delta":
                            thinking = delta.get("thinking", "")
                            if thinking:
                                _thinking_chars += len(thinking)
                                yield {"type": "thinking", "content": thinking}
                        elif delta.get("type") == "text_delta":
                            token = delta.get("text", "")
                            if token:
                                yield {"type": "chunk", "content": token}
                except (json.JSONDecodeError, KeyError):
                    continue
    yield {"type": "_usage", "tokens_in": _tokens_in, "tokens_out": _tokens_out,
           "tokens_thinking": _thinking_chars // 4 if _thinking_chars > 0 else 0}


async def _stream_google_final(
    api_key: str, model: str, messages: list[dict],
    system_prompt: str = AGENT_SYSTEM_PROMPT,
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """Stream the final text response from Google (no tools). Yields {type, content} dicts."""
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        if isinstance(m.get("content"), list):
            contents.append({"role": role, "parts": m["content"]})
        else:
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    generation_config: dict = {"maxOutputTokens": 1500}
    _agent_using_thinking = False
    if model in GOOGLE_THINKING_BUDGET_MODELS:
        budget = _GOOGLE_EFFORT_TO_BUDGET.get(reasoning_effort, 1024)
        # 2.5-pro cannot disable thinking — floor at 512
        if model == "gemini-2.5-pro" and budget == 0:
            budget = 512
        if budget > 0:
            generation_config["thinkingConfig"] = {"includeThoughts": True, "thinkingBudget": budget}
            generation_config["temperature"] = 1.0
            _agent_using_thinking = True
            yield {"type": "thinking", "content": ""}  # Budget models: thoughts stream live
    elif model in GOOGLE_THINKING_LEVEL_MODELS:
        _no_minimal = model in {"gemini-3.1-pro-preview", "gemini-3-pro-preview"}
        if reasoning_effort == "none" and _no_minimal:
            level = "low"  # these models can't fully disable thinking
        else:
            level = _GOOGLE_EFFORT_TO_LEVEL.get(reasoning_effort, "medium")
        generation_config["thinkingConfig"] = {"thinkingLevel": level}
        generation_config["temperature"] = 1.0
        _agent_using_thinking = True
        _wait_map = {"none": "~1 min", "low": "~1 min", "medium": "~2 min", "high": "~3 min", "xhigh": "~3 min"}
        _wait = _wait_map.get(reasoning_effort, "~1–3 min")
        _model_label = "Gemini 3" if "3" in model else "Gemini"
        yield {"type": "thinking_wait", "content":
               f"{_model_label} is thinking deeply ({reasoning_effort.capitalize()} level)"
               f" — response may take {_wait}. Please wait..."}

    stream_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        f":streamGenerateContent?key={api_key}&alt=sse"
    )
    _read_timeout = (
        _GOOGLE_EFFORT_TO_READ_TIMEOUT.get(reasoning_effort, 60.0)
        if _agent_using_thinking
        else 120.0
    )
    _last_usage: dict = {}
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=_read_timeout, write=10.0, pool=5.0)) as client:
        async with client.stream(
            "POST",
            stream_url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": generation_config,
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                try:
                    obj = json.loads(data)
                    if "usageMetadata" in obj:
                        _last_usage = obj["usageMetadata"]
                    parts = obj.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    for part in parts:
                        text = part.get("text", "")
                        if not text:
                            continue
                        if part.get("thought"):
                            yield {"type": "thinking", "content": text}
                        else:
                            yield {"type": "chunk", "content": text}
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
    yield {
        "type": "_usage",
        "tokens_in": _last_usage.get("promptTokenCount", 0),
        "tokens_out": _last_usage.get("candidatesTokenCount", 0),
        "tokens_thinking": _last_usage.get("thoughtsTokenCount", 0),
    }


# ──────────────────────────────────────────────
# Tool call parsing per provider
# ──────────────────────────────────────────────

def _parse_openai_response(resp: dict) -> tuple[str | None, list[dict], str | None]:
    """
    Returns (text_content, tool_calls, finish_reason).
    tool_calls = [{"call_id": ..., "name": ..., "args": {...}}, ...]
    """
    choice = (resp.get("choices") or [{}])[0]
    finish_reason = choice.get("finish_reason")
    message = choice.get("message", {})
    text = message.get("content")
    raw_tool_calls = message.get("tool_calls") or []
    tool_calls = []
    for idx, tc in enumerate(raw_tool_calls):
        fn = tc.get("function", {})
        normalized = _normalize_tool_call(
            name=fn.get("name"),
            args=fn.get("arguments", "{}"),
            call_id=tc.get("id"),
            index=idx,
        )
        if normalized:
            tool_calls.append(normalized)
    return text, tool_calls, finish_reason


def _parse_anthropic_response(resp: dict) -> tuple[str | None, list[dict], str | None]:
    stop_reason = resp.get("stop_reason")
    content_blocks = resp.get("content", [])
    text_parts = []
    tool_calls = []
    for idx, block in enumerate(content_blocks):
        if block.get("type") == "text":
            text_parts.append(block.get("text", ""))
        elif block.get("type") == "tool_use":
            normalized = _normalize_tool_call(
                name=block.get("name"),
                args=block.get("input", {}),
                call_id=block.get("id"),
                index=idx,
            )
            if normalized:
                tool_calls.append(normalized)
    text = "".join(text_parts) or None
    return text, tool_calls, stop_reason


def _parse_google_response(resp: dict) -> tuple[str | None, list[dict], str | None]:
    candidate = (resp.get("candidates") or [{}])[0]
    finish_reason = candidate.get("finishReason")
    parts = (candidate.get("content") or {}).get("parts", [])
    text_parts = []
    tool_calls = []
    for idx, p in enumerate(parts):
        if "text" in p and not p.get("thought"):
            text_parts.append(p["text"])
        elif "functionCall" in p:
            fc = p["functionCall"]
            normalized = _normalize_tool_call(
                name=fc.get("name"),
                args=fc.get("args", {}),
                call_id=fc.get("id") or fc.get("name"),  # Google may not provide call IDs
                index=idx,
            )
            if normalized:
                tool_calls.append(normalized)
    text = "".join(text_parts) or None
    return text, tool_calls, finish_reason


# ──────────────────────────────────────────────
# Tool execution (immediate tools)
# ──────────────────────────────────────────────

async def _execute_immediate_tool(user_id: str, name: str, args: dict) -> str:
    """Execute a read-only tool and return a string result."""
    try:
        if name == "search_services":
            services = await supabase_service.get_active_user_services(user_id)
            if not services:
                return "No active services found."
            lines = [
                f"• {s['name']} (₹{s['price']}/{s['type']}, {s['delivery_type']}, ID: {s['id']})"
                for s in services
            ]
            return f"Found {len(services)} service(s):\n" + "\n".join(lines)

        elif name == "get_service_details":
            svc_id = args.get("service_id", "")
            svc = await supabase_service.get_user_service(svc_id, user_id)
            if not svc:
                return f"Service {svc_id} not found."
            return (
                f"Service: {svc.get('name')}\n"
                f"Price: ₹{svc.get('price')} | Type: {svc.get('delivery_type')}\n"
                f"Frequency: {svc.get('type')} | Schedule: {svc.get('schedule')}\n"
                f"Billing day: {svc.get('billing_day')} | Active: {svc.get('active')}\n"
                f"Role: {svc.get('service_role', 'consumer')}\n"
                f"Notes: {svc.get('notes') or 'none'}"
            )

        elif name == "get_bills":
            month = args.get("month")
            if month:
                bills = await supabase_service.get_bills_for_month(user_id, month)
            else:
                bills = await supabase_service.list_generated_bills(user_id)
            if not bills:
                return "No bills found."
            lines = [
                f"• {b.get('year_month')} — ₹{b.get('total_amount')} "
                f"({'Paid' if b.get('is_paid') else 'Unpaid'}) ID: {b.get('id')}"
                for b in bills[:10]
            ]
            return f"Found {len(bills)} bill(s):\n" + "\n".join(lines)

        elif name == "get_calendar_month":
            ym = args.get("year_month", "")
            services = await supabase_service.get_active_user_services(user_id)
            svc_ids = [s["id"] for s in services]
            if not svc_ids:
                return "No active services."
            confs = await supabase_service.get_confirmations_for_month_services(user_id, ym, svc_ids)
            if not confs:
                return f"No calendar data for {ym}."
            lines = [
                f"• {c.get('date')} — {c.get('service', {}).get('name', '?')}: {c.get('status')}"
                for c in confs
            ]
            return f"Calendar for {ym}:\n" + "\n".join(lines)

        elif name == "search_docs":
            from app.core.docs_index import search_docs
            query_str = args.get("query", "")
            results = search_docs(query_str, max_results=3, snippet_len=500)
            if not results:
                return "No relevant documentation found for that query."
            lines = [
                f"**{r['title']}** ({r['section']}):\n{r['snippet']}"
                for r in results
            ]
            return "Documentation search results:\n\n" + "\n\n---\n\n".join(lines)

        else:
            return f"Unknown tool: {name}"
    except Exception as e:
        return f"Tool error: {str(e)}"


# ──────────────────────────────────────────────
# Build confirm action (write tools)
# ──────────────────────────────────────────────

async def _build_confirm_action(
    user_id: str, conv_id: str, name: str, args: dict, user_tz: str = "Asia/Kolkata"
) -> dict | None:
    """
    Validate a confirm tool call, look up old value, build diff, save to agent_actions table.
    Returns the agent_actions row dict (with action_id etc.) or None on error.
    """
    try:
        if name == "update_service":
            svc_id = args.get("service_id", "")
            field = args.get("field", "")
            new_val = str(args.get("new_value", ""))
            svc = await supabase_service.get_user_service(svc_id, user_id)
            if not svc:
                return None
            old_val = str(svc.get(field, ""))
            diff = {"label": field.replace("_", " ").title(), "old": old_val, "new": new_val}
            summary = f"Update '{svc.get('name')}' — {diff['label']}: {old_val} → {new_val}"
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="update_service",
                action_params=args,
                old_value={"field": field, "value": old_val},
                new_value={"field": field, "value": new_val},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "toggle_service_active":
            svc_id = args.get("service_id", "")
            active = bool(args.get("active", True))
            svc = await supabase_service.get_user_service(svc_id, user_id)
            if not svc:
                return None
            old_active = bool(svc.get("active", True))
            diff = {
                "label": "Status",
                "old": "Active" if old_active else "Inactive",
                "new": "Active" if active else "Inactive",
            }
            summary = f"{'Activate' if active else 'Deactivate'} '{svc.get('name')}'"
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="toggle_service_active",
                action_params=args,
                old_value={"is_active": old_active},
                new_value={"is_active": active},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "mark_bill_paid":
            bill_id = args.get("bill_id", "")
            is_paid = bool(args.get("is_paid", True))
            payment_method = args.get("payment_method")
            bill = await supabase_service.get_generated_bill(bill_id, user_id)
            if not bill:
                return None
            old_paid = bool(bill.get("is_paid", False))
            diff = {
                "label": "Payment Status",
                "old": "Paid" if old_paid else "Unpaid",
                "new": "Paid" if is_paid else "Unpaid",
            }
            summary = f"Mark bill ({bill.get('year_month')}, ₹{bill.get('total_amount')}) as {'Paid' if is_paid else 'Unpaid'}"
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="mark_bill_paid",
                action_params=args,
                old_value={"is_paid": old_paid},
                new_value={"is_paid": is_paid, "payment_method": payment_method},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "update_calendar_day":
            svc_id = args.get("service_id", "")
            raw_date_input = args.get("date", "")
            status = args.get("status", "")

            # Normalize date text into local ISO date
            date_str = _normalize_calendar_date_input(raw_date_input, user_tz)
            if not date_str:
                return None

            # Validate date is within the last 30 days (not future, not older than 30 days)
            try:
                tz = _safe_zoneinfo(user_tz)
            except Exception:
                tz = ZoneInfo("Asia/Kolkata")
            today = datetime.now(tz).date()
            thirty_days_ago = today - timedelta(days=30)
            req_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            if req_date > today or req_date < thirty_days_ago:
                return None  # reject: future date or older than 30 days

            svc = await supabase_service.get_user_service(svc_id, user_id)
            if not svc:
                return None

            # Look up existing confirmation for that date
            confs = await supabase_service.get_confirmations_for_month_services(
                user_id, date_str[:7], [svc_id]
            )
            existing = next((c for c in confs if c.get("date") == date_str), None)
            old_status = existing.get("status", "not set") if existing else "not set"

            # Skip if already set to the requested status
            if old_status == status:
                return {
                    "already_set": True,
                    "message": f"'{svc.get('name')}' on {date_str} is already marked as {status}. No change needed.",
                }

            diff = {"label": "Status", "old": old_status, "new": status}
            summary = f"Mark '{svc.get('name')}' on {date_str} as {status}"
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="update_calendar_day",
                action_params={**args, "date": date_str},
                old_value={"status": old_status},
                new_value={"status": status},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "generate_bill":
            service_ids_raw = args.get("service_ids", "")
            year_month = str(args.get("year_month", "")).strip()
            send_email = bool(args.get("send_email", False))

            # Accept comma-separated string OR a list from the LLM
            if isinstance(service_ids_raw, list):
                service_ids = [s.strip() for s in service_ids_raw if str(s).strip()]
            else:
                service_ids = [s.strip() for s in str(service_ids_raw).split(",") if s.strip()]

            if not service_ids or not re.match(r"^\d{4}-\d{2}$", year_month):
                return None

            services = await supabase_service.get_services_by_ids(user_id, service_ids)
            if not services:
                return None

            confirmations = await supabase_service.get_confirmations_for_month_services(
                user_id, year_month, service_ids
            )

            # Quick estimated total (no LLM) — same logic as bills router
            year_i, month_i = map(int, year_month.split("-"))
            month_name = datetime(year_i, month_i, 1).strftime("%B %Y")
            estimated_total = 0.0
            for svc in services:
                price = float(svc.get("price") or 0)
                delivery_type = svc.get("delivery_type", "home_delivery")
                svc_confs = [c for c in confirmations if c.get("service_id") == svc["id"]]
                delivered = [c for c in svc_confs if c.get("status") == "delivered"]
                if delivery_type in ("subscription", "payment", "visit_based"):
                    estimated_total += price
                elif delivery_type == "utility":
                    estimated_total += price if delivered else 0.0
                else:
                    estimated_total += sum(float(c.get("custom_amount") or price) for c in delivered)

            service_names = ", ".join(s.get("name", "") for s in services)
            email_note = " · Email: Yes" if send_email else ""
            diff = {
                "label": "Estimated Total",
                "old": "Not generated",
                "new": f"₹{estimated_total:.2f}",
            }
            summary = (
                f"Generate {month_name} bill for {service_names}"
                f" — Est. ₹{estimated_total:.2f}{email_note}"
            )
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="generate_bill",
                action_params={
                    "service_ids": service_ids,
                    "year_month": year_month,
                    "send_email": send_email,
                },
                old_value={"generated": False},
                new_value={"service_ids": service_ids, "year_month": year_month},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "create_service":
            svc_name = str(args.get("name", "")).strip()
            price_raw = args.get("price")
            delivery_type = str(args.get("delivery_type", "home_delivery"))

            if not svc_name or price_raw is None:
                return None
            try:
                price_f = float(price_raw)
            except (ValueError, TypeError):
                return None

            svc_type = args.get("type", "daily")
            schedule = args.get("schedule", "morning")
            icon = args.get("icon", "package")
            notes = str(args.get("notes") or "")
            billing_day = int(args.get("billing_day") or 1)
            start_date = args.get("start_date") or None
            end_date = args.get("end_date") or None

            # Multi-row diff for the confirmation card
            rows = [
                {"label": "Name", "old": "—", "new": svc_name},
                {"label": "Price", "old": "—", "new": f"₹{price_f:.2f}/{svc_type}"},
                {"label": "Type", "old": "—", "new": delivery_type.replace("_", " ").title()},
                {"label": "Schedule", "old": "—", "new": schedule.capitalize()},
            ]
            if notes:
                rows.append({"label": "Notes", "old": "—", "new": notes})
            if start_date:
                rows.append({"label": "Start Date", "old": "—", "new": start_date})

            diff = {"rows": rows}
            summary = (
                f"Create service '{svc_name}'"
                f" — ₹{price_f:.2f}/{svc_type}, {delivery_type.replace('_', ' ')}"
            )
            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="create_service",
                action_params={
                    "name": svc_name,
                    "price": price_f,
                    "delivery_type": delivery_type,
                    "type": svc_type,
                    "schedule": schedule,
                    "icon": icon,
                    "notes": notes,
                    "billing_day": billing_day,
                    "start_date": start_date,
                    "end_date": end_date,
                },
                old_value={},
                new_value={"name": svc_name, "price": price_f, "delivery_type": delivery_type},
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        elif name == "edit_service":
            service_name = str(args.get("service_name", "")).strip()
            if not service_name:
                return None

            # Editable fields the LLM may provide
            EDITABLE = ("name", "price", "notes", "billing_day", "schedule", "icon", "type", "delivery_type", "start_date", "end_date")
            changes = {k: args[k] for k in EDITABLE if k in args and args[k] is not None}
            if not changes:
                return None

            # Look up existing service
            existing = await supabase_service.get_service_by_name(user_id, service_name)
            if not existing:
                return None

            service_id = existing["id"]

            # Build rows — only changed fields
            LABELS = {
                "name": "Name", "price": "Price", "notes": "Notes",
                "billing_day": "Billing Day", "schedule": "Schedule",
                "icon": "Icon", "type": "Frequency", "delivery_type": "Delivery Type",
                "start_date": "Start Date", "end_date": "End Date",
            }
            rows = []
            clean_changes: dict = {}
            for field, new_raw in changes.items():
                old_raw = existing.get(field)
                if field == "price":
                    new_val = float(new_raw)
                    old_disp = f"₹{float(old_raw):.2f}" if old_raw is not None else "—"
                    new_disp = f"₹{new_val:.2f}"
                    clean_changes[field] = new_val
                elif field == "billing_day":
                    new_val = int(new_raw)
                    old_disp = str(old_raw) if old_raw is not None else "—"
                    new_disp = str(new_val)
                    clean_changes[field] = new_val
                else:
                    new_val = str(new_raw)
                    old_disp = str(old_raw) if old_raw is not None else "—"
                    new_disp = new_val.replace("_", " ").title() if field in ("delivery_type", "schedule", "type") else new_val
                    old_disp_pretty = old_disp.replace("_", " ").title() if field in ("delivery_type", "schedule", "type") else old_disp
                    clean_changes[field] = new_val
                    old_disp = old_disp_pretty
                rows.append({"label": LABELS.get(field, field.title()), "old": old_disp, "new": new_disp})

            if not rows:
                return None

            diff = {"rows": rows} if len(rows) > 1 else {"label": rows[0]["label"], "old": rows[0]["old"], "new": rows[0]["new"]}
            fields_summary = ", ".join(LABELS.get(f, f) for f in clean_changes)
            summary = f"Edit '{existing.get('name', service_name)}' — update: {fields_summary}"

            action = await supabase_service.create_agent_action(
                conv_id, user_id,
                action_type="edit_service",
                action_params={"service_id": service_id, "changes": clean_changes},
                old_value={f: existing.get(f) for f in clean_changes},
                new_value=clean_changes,
            )
            action["diff"] = diff
            action["summary_text"] = summary
            return action

        return None
    except Exception:
        return None


# ──────────────────────────────────────────────
# Execute a confirmed action
# ──────────────────────────────────────────────

async def execute_confirmed_action(action_id: str, user_id: str) -> dict:
    """Execute an agent_action that the user confirmed. Returns dict with message and message_id."""
    action = await supabase_service.get_agent_action(action_id, user_id)
    if not action:
        raise ValueError("Action not found")
    if action["status"] != "pending":
        raise ValueError(f"Action already {action['status']}")

    # Check 5-minute expiry
    created_at = datetime.fromisoformat(action["created_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created_at > timedelta(minutes=5):
        await supabase_service.update_agent_action_status(action_id, user_id, "failed")
        raise ValueError("Action expired (5 minute limit)")

    action_type = action["action_type"]
    params = action["action_params"]

    try:
        if action_type == "update_service":
            field = params["field"]
            new_val = params["new_value"]
            # Cast numeric fields
            cast_val: str | float | int = new_val
            if field == "price":
                cast_val = float(new_val)
            elif field == "billing_day":
                cast_val = int(new_val)
            await supabase_service.update_user_service_field(
                params["service_id"], user_id, {field: cast_val}
            )
            result = f"Updated service {field} to '{new_val}' successfully."
            await supabase_service.create_notification(
                user_id, "service_updated",
                "Service Updated",
                result,
                {"path": "/services"},
            )

        elif action_type == "toggle_service_active":
            await supabase_service.update_user_service_field(
                params["service_id"], user_id, {"active": bool(params["active"])}
            )
            state = "activated" if params["active"] else "deactivated"
            result = f"Service {state} successfully."
            await supabase_service.create_notification(
                user_id, "service_updated",
                f"Service {state.capitalize()}",
                f"Your service has been {state}",
                {"path": "/services"},
            )

        elif action_type == "mark_bill_paid":
            await supabase_service.mark_bill_paid(
                params["bill_id"], user_id,
                bool(params["is_paid"]),
                params.get("payment_method"),
            )
            state = "paid" if params["is_paid"] else "unpaid"
            result = f"Bill marked as {state} successfully."
            if params.get("is_paid"):
                await supabase_service.create_notification(
                    user_id, "payment_recorded",
                    "Payment Recorded",
                    result,
                    {"path": "/bills"},
                )

        elif action_type == "update_calendar_day":
            await supabase_service.upsert_service_confirmation(
                params["service_id"], user_id, params["date"], params["status"]
            )
            result = f"Calendar updated: {params['date']} → {params['status']}."

        elif action_type == "generate_bill":
            from app.routers.bills import _build_bill_payload, _send_bill_email_via_edge
            from app.services.llm_bill_service import generate_bill_insights

            service_ids = params["service_ids"]
            year_month = params["year_month"]
            send_email = bool(params.get("send_email", False))

            services = await supabase_service.get_services_by_ids(user_id, service_ids)
            if not services:
                raise ValueError("Services not found.")

            confirmations = await supabase_service.get_confirmations_for_month_services(
                user_id, year_month, service_ids
            )

            year_i, month_i = map(int, year_month.split("-"))
            month_name = datetime(year_i, month_i, 1).strftime("%B %Y")

            # Build items for LLM (same logic as /bills/generate route)
            items_for_llm = []
            for svc in services:
                sid = svc["id"]
                price = float(svc.get("price") or 0)
                delivery_type = svc.get("delivery_type", "home_delivery")
                confs = [c for c in confirmations if c.get("service_id") == sid]
                delivered = [c for c in confs if c.get("status") == "delivered"]
                skipped = [c for c in confs if c.get("status") == "skipped"]
                if delivery_type in ("subscription", "payment", "visit_based"):
                    service_total = price
                elif delivery_type == "utility":
                    service_total = price if delivered else 0.0
                else:
                    service_total = sum(float(c.get("custom_amount") or price) for c in delivered)
                items_for_llm.append({
                    "service": svc.get("name", ""),
                    "icon": svc.get("icon", "package"),
                    "schedule": svc.get("type", "daily"),
                    "delivery_type": delivery_type,
                    "days_delivered": len(delivered),
                    "days_skipped": len(skipped),
                    "total": service_total,
                })

            total_est = sum(i["total"] for i in items_for_llm)
            ai_summary, recommendation, ai_model_used, refined_note = await generate_bill_insights(
                user_id, month_name, items_for_llm, total_est, "INR", None
            )
            payload, total_amount, bill_title = _build_bill_payload(
                year_month, services, confirmations,
                ai_summary, recommendation, ai_model_used, refined_note
            )
            row = await supabase_service.insert_generated_bill(
                user_id=user_id,
                year_month=year_month,
                service_ids=service_ids,
                payload=payload,
                total_amount=total_amount,
                currency="INR",
                ai_model_used=ai_model_used,
                bill_title=bill_title,
                custom_note=refined_note,
            )

            if row:
                svc_label = ", ".join(s.get("name", "") for s in services[:2])
                if len(services) > 2:
                    svc_label += f" +{len(services) - 2} more"
                await supabase_service.create_notification(
                    user_id, "bill_added",
                    f"Bill generated: {bill_title}",
                    f"₹{total_amount:.2f} for {month_name}" + (f" — {svc_label}" if svc_label else ""),
                    {"path": "/bills"},
                )

            if send_email and row:
                try:
                    profile = await supabase_service.get_user_profile(user_id)
                    if profile:
                        to_email = profile.get("email") or ""
                        if to_email and profile.get("email_notifications", True):
                            await _send_bill_email_via_edge(
                                to_email=to_email,
                                to_name=profile.get("display_name") or profile.get("full_name") or "there",
                                user_name=profile.get("display_name") or profile.get("full_name") or "there",
                                month=month_name,
                                total=total_amount,
                                currency="INR",
                                bill_title=bill_title,
                                services_count=len(services),
                                ai_summary=ai_summary,
                                recommendation=recommendation,
                                services=[{"name": i["service"], "total": i["total"]} for i in items_for_llm],
                            )
                except Exception as email_err:
                    logger.warning("[AGENT] bill email failed: %s", email_err)

            result = f"Bill generated: {bill_title} — Total: ₹{total_amount:.2f}."

        elif action_type == "create_service":
            svc = await supabase_service.create_user_service(user_id, params)
            if not svc:
                raise ValueError("Service creation failed.")
            await supabase_service.create_notification(
                user_id, "service_created",
                "New Service Added",
                f"\"{params.get('name', 'Service')}\" has been set up in your account",
                {"path": "/services"},
            )
            result = f"Service '{params.get('name')}' created successfully."

        elif action_type == "edit_service":
            service_id = params["service_id"]
            changes: dict = params["changes"]
            if not changes:
                raise ValueError("No changes to apply.")
            updated = await supabase_service.update_user_service_field(service_id, user_id, changes)
            if not updated:
                raise ValueError("Service edit failed — service not found.")
            svc_name = updated.get("name") or service_id
            changed_fields = ", ".join(changes.keys())
            await supabase_service.create_notification(
                user_id, "service_updated",
                f"Service Updated: {svc_name}",
                f"Updated {changed_fields}",
                {"path": "/services"},
            )
            result = f"Service '{svc_name}' updated ({changed_fields}) successfully."

        else:
            raise ValueError(f"Unknown action type: {action_type}")

        await supabase_service.update_agent_action_status(
            action_id, user_id, "executed",
            executed_at=datetime.utcnow().isoformat()
        )
        # Persist the success message so it survives page refresh
        conv_id = action["conversation_id"]
        saved = await supabase_service.add_message(
            conv_id, user_id, "assistant", f"Done! {result}"
        )
        return {"message": result, "message_id": saved["id"]}

    except Exception as e:
        await supabase_service.update_agent_action_status(action_id, user_id, "failed")
        raise ValueError(f"Execution failed: {str(e)}")


# ──────────────────────────────────────────────
# Main agent stream generator
# ──────────────────────────────────────────────

async def stream_agent_response(
    user_id: str,
    conv_id: str,
    content: str,
    user_tz: str = "Asia/Kolkata",
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """
    SSE generator for POST /chat/agent/conversations/{id}/messages.
    Runs a tool-calling loop then streams the final text response.
    """
    ai = await get_user_ai_settings(user_id)
    if not ai:
        yield {"type": "error", "message": "No AI configured. Go to Settings -> AI Settings."}
        return

    provider = ai["provider"]
    model = ai["model"]
    api_key = ai["api_key"]
    model_info = await supabase_service.get_ai_model(provider, model, include_deprecated=True)
    reasoning = _reasoning_metadata(model_info)

    # Save user message
    await supabase_service.add_message(conv_id, user_id, "user", content)
    await supabase_service.touch_conversation(conv_id)

    # Pre-send model availability check
    precheck = await ensure_model_available(user_id, provider, model, api_key)
    if not precheck["available"]:
        error_text = (
            precheck.get("message")
            or f"Model '{model}' is unavailable. Please choose another model in Settings -> AI Settings."
        )
        err_msg = await supabase_service.add_message(
            conv_id, user_id, "assistant", error_text,
            metadata={"type": "error", "code": MODEL_UNAVAILABLE_PRECHECK},
        )
        yield {
            "type": "error",
            "code": MODEL_UNAVAILABLE_PRECHECK,
            "model": model,
            "availability_status": precheck.get("status", "unknown"),
            "message": error_text,
            "message_id": err_msg.get("id") if err_msg else None,
        }
        return

    # Build messages for LLM (last 20 messages)
    history = await supabase_service.get_messages(conv_id, user_id)
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-20:]]

    # Build dynamic system prompt (inject feedback summary if available)
    agent_system_prompt = AGENT_SYSTEM_PROMPT
    feedback_summary = await supabase_service.get_conv_feedback_summary(conv_id)
    if feedback_summary:
        pos = feedback_summary.get("positive", 0)
        neg = feedback_summary.get("negative", 0)
        agent_system_prompt += (
            f"\n\nUser feedback on previous responses in this conversation: "
            f"{pos} positive, {neg} negative. Adjust quality accordingly."
        )

    # Always inject today's date so the LLM can resolve "today"/"yesterday" correctly
    today_str = datetime.now(_safe_zoneinfo(user_tz)).strftime("%Y-%m-%d")
    agent_system_prompt += (
        f"\n\nToday's date is {today_str} (timezone: {user_tz}). "
        "Use this exact date when calling calendar tools for 'today'."
    )

    _q = content[:100] + "..." if len(content) > 100 else content
    logger.info("[AGENT] user=%s model=%s/%s query=%r", user_id[:8], provider, model, _q)
    _agent_start = time.monotonic()
    _tools_called = 0
    _ttft_ms: int | None = None
    _chunks_count = 0
    _usage_data: dict = {"tokens_in": 0, "tokens_out": 0, "tokens_thinking": 0}

    # Tool-calling loop (max 5 iterations to prevent runaway)
    full_text = ""
    for _iteration in range(5):
        google_model_parts: list = []  # full parts from Google response (preserves thoughtSignature)
        try:
            if provider == "openai":
                resp = await _call_openai_with_tools(api_key, model, messages, agent_system_prompt)
                text, tool_calls, finish_reason = _parse_openai_response(resp)
            elif provider == "anthropic":
                resp = await _call_anthropic_with_tools(api_key, model, messages, agent_system_prompt)
                text, tool_calls, finish_reason = _parse_anthropic_response(resp)
            elif provider == "google":
                resp = await _call_google_with_tools(api_key, model, messages, agent_system_prompt)
                text, tool_calls, finish_reason = _parse_google_response(resp)
                # Preserve full model parts (including thoughtSignature) for next-turn history
                google_model_parts = (resp.get("candidates") or [{}])[0].get("content") or {}
                google_model_parts = google_model_parts.get("parts", [])
            else:
                yield {"type": "error", "message": f"Unsupported provider: {provider}"}
                return
        except httpx.HTTPStatusError as e:
            code = e.response.status_code
            if code in (400, 404, 422):
                runtime_message = (
                    f"Model '{model}' is not available on your account or returned an error ({code}). "
                    "Please select a different model in Settings -> AI Settings."
                )
                await supabase_service.upsert_user_model_probe(
                    user_id=user_id,
                    provider_id=provider,
                    model_id=model,
                    status="unavailable",
                    message=runtime_message,
                    checked_at=datetime.now(timezone.utc).isoformat(),
                )
                err_msg = await supabase_service.add_message(
                    conv_id, user_id, "assistant", runtime_message,
                    metadata={"type": "error", "code": MODEL_UNAVAILABLE_RUNTIME},
                )
                yield {
                    "type": "error",
                    "code": MODEL_UNAVAILABLE_RUNTIME,
                    "model": model,
                    "availability_status": "unavailable",
                    "message": runtime_message,
                    "message_id": err_msg.get("id") if err_msg else None,
                }
            elif code == 401:
                error_text = "Invalid API key. Please check AI Settings."
                err_msg = await supabase_service.add_message(
                    conv_id, user_id, "assistant", error_text,
                    metadata={"type": "error", "code": "INVALID_API_KEY"},
                )
                yield {"type": "error", "message": error_text,
                       "message_id": err_msg.get("id") if err_msg else None}
            elif code == 429:
                error_text = "Rate limit reached. Please wait a moment and try again."
                err_msg = await supabase_service.add_message(
                    conv_id, user_id, "assistant", error_text,
                    metadata={"type": "error", "code": "RATE_LIMIT"},
                )
                yield {"type": "error", "message": error_text,
                       "message_id": err_msg.get("id") if err_msg else None}
            else:
                error_text = f"AI provider error ({code}). Please try again."
                err_msg = await supabase_service.add_message(
                    conv_id, user_id, "assistant", error_text,
                    metadata={"type": "error", "code": "PROVIDER_ERROR"},
                )
                yield {"type": "error", "message": error_text,
                       "message_id": err_msg.get("id") if err_msg else None}
            return
        except httpx.ReadTimeout:
            logger.warning("[AGENT] ReadTimeout during tool planning — model=%s/%s took=%.1fs",
                           provider, model, time.monotonic() - _agent_start)
            error_text = "The AI took too long during tool planning. Please try again."
            err_msg = await supabase_service.add_message(
                conv_id, user_id, "assistant", error_text,
                metadata={"type": "error", "code": "READ_TIMEOUT"},
            )
            yield {"type": "error", "message": error_text,
                   "message_id": err_msg.get("id") if err_msg else None}
            return
        except Exception as e:
            logger.error("[AGENT] Unhandled error — model=%s/%s error=%s took=%.1fs",
                         provider, model, type(e).__name__, time.monotonic() - _agent_start)
            error_text = f"Agent error: {_safe_exception_message(e)}"
            err_msg = await supabase_service.add_message(
                conv_id, user_id, "assistant", error_text,
                metadata={"type": "error", "code": "AGENT_ERROR"},
            )
            yield {"type": "error", "message": error_text,
                   "message_id": err_msg.get("id") if err_msg else None}
            return

        # Accumulate token usage from this non-streaming tool-call API response.
        # (For the action_required path no streaming response follows, so we must
        #  capture counts here; for the streaming final path we accumulate below.)
        if provider == "openai":
            _tc_usage = resp.get("usage") or {}
            _usage_data["tokens_in"] += _tc_usage.get("prompt_tokens", 0)
            _usage_data["tokens_out"] += _tc_usage.get("completion_tokens", 0)
        elif provider == "anthropic":
            _tc_usage = resp.get("usage") or {}
            _usage_data["tokens_in"] += _tc_usage.get("input_tokens", 0)
            _usage_data["tokens_out"] += _tc_usage.get("output_tokens", 0)
        elif provider == "google":
            _tc_usage = resp.get("usageMetadata") or {}
            _usage_data["tokens_in"] += _tc_usage.get("promptTokenCount", 0)
            _usage_data["tokens_out"] += _tc_usage.get("candidatesTokenCount", 0)
            _usage_data["tokens_thinking"] += _tc_usage.get("thoughtsTokenCount", 0)

        if not tool_calls:
            # Final text response: stream token by token
            full_text = ""
            try:
                if provider == "openai":
                    stream_fn = _stream_openai_final(api_key, model, messages, agent_system_prompt, reasoning_effort)
                elif provider == "anthropic":
                    stream_fn = _stream_anthropic_final(api_key, model, messages, agent_system_prompt)
                elif provider == "google":
                    stream_fn = _stream_google_final(api_key, model, messages, agent_system_prompt, reasoning_effort)
                else:
                    if text:
                        full_text = text
                        yield {"type": "chunk", "content": text}
                    break

                async for event in stream_fn:
                    if isinstance(event, dict):
                        if event["type"] == "_usage":
                            _usage_data["tokens_in"] += event.get("tokens_in", 0)
                            _usage_data["tokens_out"] += event.get("tokens_out", 0)
                            _usage_data["tokens_thinking"] += event.get("tokens_thinking", 0)
                            continue  # don't yield to client
                        if event["type"] == "chunk":
                            full_text += event["content"]
                            _chunks_count += 1
                            if _ttft_ms is None:
                                _ttft_ms = int((time.monotonic() - _agent_start) * 1000)
                        yield event  # pass thinking and chunk events as-is
                    else:
                        # Google yields plain strings
                        full_text += event
                        _chunks_count += 1
                        if _ttft_ms is None:
                            _ttft_ms = int((time.monotonic() - _agent_start) * 1000)
                        yield {"type": "chunk", "content": event}
            except httpx.HTTPStatusError as stream_err:
                stream_code = stream_err.response.status_code
                if stream_code in (400, 404, 422):
                    runtime_message = (
                        f"Model '{model}' is not available on your account or returned an error ({stream_code}). "
                        "Please select a different model in Settings -> AI Settings."
                    )
                    await supabase_service.upsert_user_model_probe(
                        user_id=user_id,
                        provider_id=provider,
                        model_id=model,
                        status="unavailable",
                        message=runtime_message,
                        checked_at=datetime.now(timezone.utc).isoformat(),
                    )
                    err_msg = await supabase_service.add_message(
                        conv_id, user_id, "assistant", runtime_message,
                        metadata={"type": "error", "code": MODEL_UNAVAILABLE_RUNTIME},
                    )
                    yield {
                        "type": "error",
                        "code": MODEL_UNAVAILABLE_RUNTIME,
                        "model": model,
                        "availability_status": "unavailable",
                        "message": runtime_message,
                        "message_id": err_msg.get("id") if err_msg else None,
                    }
                    return

                # If streaming fails for non-model reasons, fall back to already-received text
                if text and not full_text:
                    full_text = text
                    yield {"type": "chunk", "content": text}
                elif not full_text:
                    yield {"type": "error", "message": f"AI provider error ({stream_code}). Please try again."}
                    return
            except httpx.ReadTimeout:
                logger.warning("[AGENT] ReadTimeout during final streaming — model=%s/%s took=%.1fs",
                               provider, model, time.monotonic() - _agent_start)
                error_text = "The AI took too long to stream the response. Please try again."
                err_msg = await supabase_service.add_message(
                    conv_id, user_id, "assistant", error_text,
                    metadata={"type": "error", "code": "READ_TIMEOUT"},
                )
                yield {"type": "error", "message": error_text,
                       "message_id": err_msg.get("id") if err_msg else None}
                return
            break

        # Process tool calls one by one
        # Google: collect all functionResponses to append as a single batched user message
        google_fn_responses: list = []
        google_model_turn_appended = False
        # Collect CONFIRM tool results for batched confirmation card
        pending_confirms: list = []      # actions awaiting user confirmation
        already_set_msgs: list = []      # "already at requested status" messages
        failed_action_msgs: list = []    # validation failure messages
        has_immediate = False            # tracks whether any IMMEDIATE tool was processed
        for idx, tc in enumerate(tool_calls):
            tool_name = (tc.get("name") or "").strip()
            if not tool_name:
                continue
            tool_args = tc.get("args") if isinstance(tc.get("args"), dict) else {}
            call_id = tc.get("call_id") or f"{tool_name}_{idx}"

            if tool_name in IMMEDIATE_TOOLS:
                has_immediate = True
                _tools_called += 1
                # Execute and feed result back to LLM
                result_str = await _execute_immediate_tool(user_id, tool_name, tool_args)

                # Append tool call + result to messages (provider-specific format)
                if provider == "openai":
                    messages.append({
                        "role": "assistant",
                        "content": text,
                        "tool_calls": [
                            {
                                "id": call_id,
                                "type": "function",
                                "function": {"name": tool_name, "arguments": json.dumps(tool_args)},
                            }
                        ],
                    })
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call_id,
                        "content": result_str,
                    })
                elif provider == "anthropic":
                    messages.append({
                        "role": "assistant",
                        "content": [
                            *(
                                [{"type": "text", "text": text}] if text else []
                            ),
                            {"type": "tool_use", "id": call_id, "name": tool_name, "input": tool_args},
                        ],
                    })
                    messages.append({
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": call_id,
                                "content": result_str,
                            }
                        ],
                    })
                elif provider == "google":
                    # Append model turn once with full parts (preserves thoughtSignature for Gemini 3)
                    if not google_model_turn_appended:
                        model_parts = google_model_parts or [{"functionCall": {"name": tool_name, "args": tool_args}}]
                        messages.append({"role": "model", "content": model_parts})
                        google_model_turn_appended = True
                    # Collect functionResponse — will be batched into one user message after loop
                    google_fn_responses.append({
                        "functionResponse": {
                            "name": tool_name,
                            "response": {"content": result_str},
                        }
                    })

            elif tool_name in CONFIRM_TOOLS:
                # Build diff + save pending action — collect all before yielding
                action = await _build_confirm_action(user_id, conv_id, tool_name, tool_args, user_tz)
                if action and action.get("already_set"):
                    already_set_msgs.append(action["message"])
                elif action:
                    pending_confirms.append(action)
                else:
                    if tool_name == "update_calendar_day":
                        failed_action_msgs.append(_accepted_calendar_date_help())
                    else:
                        failed_action_msgs.append(
                            "I could not prepare that action. Please verify the selected record and try again."
                        )
            else:
                # Unknown tool: skip
                pass

        else:
            # All tool_calls processed without a break
            if provider == "google" and google_fn_responses:
                messages.append({"role": "user", "content": google_fn_responses})

            # Emit already-set / failed messages as a single chunk
            info_parts = already_set_msgs + failed_action_msgs
            if info_parts:
                info_text = "\n".join(info_parts)
                full_text = info_text
                yield {"type": "chunk", "content": info_text}

            # Batch yield all collected confirm actions as ONE card
            if pending_confirms:
                overall_summary = (
                    pending_confirms[0]["summary_text"]
                    if len(pending_confirms) == 1
                    else f"{len(pending_confirms)} changes pending confirmation"
                )
                # Auto-generate title for action_required path (first exchange only)
                try:
                    from app.services.chat_service import _generate_title
                    _ar_conv = await supabase_service.get_conversation(conv_id, user_id)
                    if _ar_conv and _ar_conv.get("title") in ("New Conversation", "YesBill Assistant"):
                        _ar_title = await _generate_title(provider, api_key, model, content, overall_summary)
                        if _ar_title:
                            await supabase_service.update_conversation_title(conv_id, user_id, _ar_title)
                            yield {"type": "title", "title": _ar_title}
                except Exception as _ate:
                    logger.warning("[AGENT] action_required auto-title failed: %s", _ate)
                # Compute analytics BEFORE yielding action_required so the frontend
                # can capture them from the action_required event (the done event is
                # never read by the frontend because it returns early on action_required).
                _action_latency_ms = int((time.monotonic() - _agent_start) * 1000)
                _action_analytics = None
                if _usage_data.get("tokens_in", 0) > 0 or _usage_data.get("tokens_out", 0) > 0:
                    _action_analytics = {
                        "tokens_in": _usage_data.get("tokens_in", 0),
                        "tokens_out": _usage_data.get("tokens_out", 0),
                        "tokens_thinking": _usage_data.get("tokens_thinking", 0),
                        "cost_usd": calculate_cost(
                            provider, model,
                            _usage_data.get("tokens_in", 0),
                            _usage_data.get("tokens_out", 0),
                            _usage_data.get("tokens_thinking", 0),
                        ),
                        "latency_ms": _action_latency_ms,
                        "ttft_ms": _ttft_ms,
                        "chunks_count": _chunks_count,
                        "model_used": f"{provider}/{model}",
                    }
                yield {
                    "type": "action_required",
                    "action_ids": [a["id"] for a in pending_confirms],
                    "actions": [
                        {
                            "action_id": a["id"],
                            "action_type": a["action_type"],
                            "summary_text": a.get("summary_text", "Confirm action"),
                            "diff": a.get("diff", {}),
                        }
                        for a in pending_confirms
                    ],
                    "summary_text": overall_summary,
                    "analytics": _action_analytics,
                }
                for a in pending_confirms:
                    await supabase_service.add_message(
                        conv_id,
                        user_id,
                        "assistant",
                        f"Action required: {a.get('summary_text', '')}",
                        model_used=f"{provider}/{model}",
                        metadata={"action_id": a["id"], "reasoning": reasoning},
                    )
                yield {
                    "type": "done",
                    "model": f"{provider}/{model}",
                    "message_id": None,
                    "reasoning": reasoning,
                    "analytics": _action_analytics,
                }
                return

            # If any immediate tools produced results, continue for next LLM turn.
            # Otherwise (only already_set/failed confirms) we're done — fall through to break.
            if has_immediate:
                continue

        # For loop completed without break but else clause didn't continue → end of outer loop
        break

    _latency_ms = int((time.monotonic() - _agent_start) * 1000)
    # Save final assistant message
    if full_text:
        msg = await supabase_service.add_message(
            conv_id,
            user_id,
            "assistant",
            full_text,
            model_used=f"{provider}/{model}",
            metadata={"reasoning": reasoning},
        )
        msg_id = msg.get("id")
        # Save analytics (best-effort)
        if msg_id:
            try:
                cost_usd = calculate_cost(
                    provider, model,
                    _usage_data.get("tokens_in", 0),
                    _usage_data.get("tokens_out", 0),
                    _usage_data.get("tokens_thinking", 0),
                )
                await supabase_service.save_message_analytics(
                    message_id=msg_id,
                    user_id=user_id,
                    tokens_in=_usage_data.get("tokens_in", 0),
                    tokens_out=_usage_data.get("tokens_out", 0),
                    tokens_thinking=_usage_data.get("tokens_thinking") or None,
                    cost_usd=cost_usd,
                    latency_ms=_latency_ms,
                    ttft_ms=_ttft_ms,
                    chunks_count=_chunks_count,
                    model_used=f"{provider}/{model}",
                )
            except Exception as _ae:
                logger.warning("[AGENT] analytics save failed: %s", _ae)
    else:
        msg_id = None

    logger.info("[AGENT] DONE — model=%s/%s tools_called=%d took=%.1fs",
                provider, model, _tools_called, time.monotonic() - _agent_start)

    # Auto-generate title on first exchange (only for default/untitled conversations)
    if full_text:
        try:
            from app.services.chat_service import _generate_title
            conv = await supabase_service.get_conversation(conv_id, user_id)
            if conv and conv.get("title") in ("New Conversation", "YesBill Assistant"):
                all_msgs = await supabase_service.get_messages(conv_id, user_id)
                ua_msgs = [m for m in all_msgs if m.get("role") in ("user", "assistant")]
                if len(ua_msgs) >= 2:
                    title = await _generate_title(provider, api_key, model, content, full_text)
                    if title:
                        await supabase_service.update_conversation_title(conv_id, user_id, title)
                        yield {"type": "title", "title": title}
        except Exception as _te:
            logger.warning("[AGENT] auto-title failed: %s", _te)

    _analytics_payload = None
    if _usage_data.get("tokens_in", 0) > 0 or _usage_data.get("tokens_out", 0) > 0:
        _analytics_payload = {
            "tokens_in": _usage_data.get("tokens_in", 0),
            "tokens_out": _usage_data.get("tokens_out", 0),
            "tokens_thinking": _usage_data.get("tokens_thinking", 0),
            "cost_usd": calculate_cost(
                provider, model,
                _usage_data.get("tokens_in", 0),
                _usage_data.get("tokens_out", 0),
                _usage_data.get("tokens_thinking", 0),
            ),
            "latency_ms": _latency_ms,
            "ttft_ms": _ttft_ms,
            "chunks_count": _chunks_count,
        }

    yield {
        "type": "done",
        "model": f"{provider}/{model}",
        "message_id": msg_id,
        "reasoning": reasoning,
        "analytics": _analytics_payload,
    }

