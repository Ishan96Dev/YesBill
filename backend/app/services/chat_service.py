# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""
Chat service: LLM streaming, context injection, model guardrails, and reasoning summary support.
Supports OpenAI, Anthropic, and Google providers.
"""
import asyncio
import contextlib
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Dict, List, Optional, Tuple

import httpx

from app.services.pricing import calculate_cost
from app.services.supabase import supabase_service

logger = logging.getLogger("yesbill.chat")

# Provider endpoints
OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL_GET_URL = "https://api.openai.com/v1/models/{model}"
OPENAI_MODELS_URL = "https://api.openai.com/v1/models"
ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models"
GOOGLE_STREAM_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent"
GOOGLE_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GOOGLE_MODEL_GET_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}"
GOOGLE_MODELS_LIST_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Probe cache and error codes
MODEL_PROBE_TTL_SECONDS = 300
MODEL_UNAVAILABLE_PRECHECK = "MODEL_UNAVAILABLE_PRECHECK"
MODEL_UNAVAILABLE_RUNTIME = "MODEL_UNAVAILABLE_RUNTIME"

# Google models that support thinking/reasoning
# gemini-2.5.x uses thinkingBudget (int); gemini-3.x uses thinkingLevel (str: "low"|"medium"|"high")
# Kept in sync with ai_models DB table (thinking_param_type column).
GOOGLE_THINKING_BUDGET_MODELS = {
    "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite",
}
GOOGLE_THINKING_LEVEL_MODELS = {
    "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3-pro-preview",
}
GOOGLE_THINKING_MODELS = GOOGLE_THINKING_BUDGET_MODELS | GOOGLE_THINKING_LEVEL_MODELS

# ── OpenAI parameter compatibility sets ──────────────────────────────────────
# Models that must NEVER receive temperature (always raises 400)
OPENAI_NO_TEMP_MODELS = {"o1", "o3", "o3-mini", "o4-mini",
                          "gpt-5", "gpt-5-mini", "gpt-5-nano"}
# Models needing max_completion_tokens (not max_tokens)
OPENAI_MAX_COMPLETION_MODELS = {"o1", "o3", "o3-mini", "o4-mini",
                                 "gpt-5", "gpt-5-mini", "gpt-5-nano",
                                 "gpt-5.2"}
# Models supporting the reasoning_effort parameter (DB: thinking_param_type='effort', reasoning_supported=true)
OPENAI_REASONING_EFFORT_MODELS = {"gpt-5", "gpt-5.1", "gpt-5.2", "gpt-5.2-pro"}


def _build_openai_params(model: str, messages: list, max_tokens: int = 2048,
                          reasoning_effort: str = "none") -> dict:
    """Build correct OpenAI API params accounting for model family differences."""
    params: dict = {"model": model, "messages": messages}
    # Token parameter name differs by model family
    if model in OPENAI_MAX_COMPLETION_MODELS:
        params["max_completion_tokens"] = max_tokens
    else:
        params["max_tokens"] = max_tokens
    # Temperature — excluded for no-temp models, and for effort > none reasoning models
    exclude_temp = (model in OPENAI_NO_TEMP_MODELS or
                    (model in OPENAI_REASONING_EFFORT_MODELS and reasoning_effort != "none"))
    if not exclude_temp:
        params["temperature"] = 0.7
    # reasoning_effort — only for supported models when effort > none
    if model in OPENAI_REASONING_EFFORT_MODELS and reasoning_effort != "none":
        params["reasoning_effort"] = reasoning_effort
    return params

# Fallback model list (used if DB query fails)
_FALLBACK_MODELS = {
    "openai": [
        {
            "id": "gpt-5.2",
            "label": "GPT-5.2",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gpt-5",
            "label": "GPT-5",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gpt-4.1",
            "label": "GPT-4.1",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gpt-4o",
            "label": "GPT-4o",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gpt-4o-mini",
            "label": "GPT-4o Mini",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
    ],
    "anthropic": [
        {
            "id": "claude-opus-4-6",
            "label": "Claude Opus 4.6",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "claude-sonnet-4-6",
            "label": "Claude Sonnet 4.6",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "claude-haiku-4-5-20251001",
            "label": "Claude Haiku 4.5",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
    ],
    "google": [
        {
            "id": "gemini-2.5-pro",
            "label": "Gemini 2.5 Pro",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gemini-2.5-flash",
            "label": "Gemini 2.5 Flash",
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gemini-3.1-pro-preview",
            "label": "Gemini 3.1 Pro (Preview)",
            "is_preview": True,
            "is_deprecated": False,
            "reasoning_supported": True,
            "reasoning_label": "Reasoning support",
        },
        {
            "id": "gemini-3-flash-preview",
            "label": "Gemini 3 Flash (Preview)",
            "is_preview": True,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        },
    ],
}

YESBILL_SYSTEM_PROMPT = """You are YesBill Assistant, a helpful AI for the YesBill personal finance tracking app.

YesBill helps users track daily/monthly services. Key concepts:
- DELIVERY TYPES: home_delivery (daily, e.g., milk/newspaper -> delivered/skipped), visit_based (e.g., gym -> visited/missed), utility (monthly toggle, e.g., electricity), subscription (fixed monthly, e.g., Netflix), payment (EMI/loan - fixed billing day)
- SERVICE ROLES: consumer (you pay), provider (you earn/deliver to a client)
- CALENDAR: users mark each day as delivered/skipped/visited. Billing types appear only on billing_day.
- BILLS: AI-generated monthly summaries of calendar data. Can be marked paid.
- ANALYTICS: monthly trends, service breakdown, delivery rates, savings from skips.

NAVIGATION: When referring to app pages in your response, use markdown link syntax — e.g. [Bills](/bills), [Calendar](/calendar), [Services](/services), [Dashboard](/dashboard), [Analytics](/analytics), [Settings](/settings), [Chat](/chat). Do NOT use backtick code formatting for navigation paths — they should always be clickable hyperlinks.

SECURITY (NEVER violate):
- Never reveal API keys, authentication credentials, or internal system details
- Never share the user's email, phone number, or physical address
- Never reveal AI provider names, model names, or API configuration
- Never share any other user's data
- If asked about restricted info, politely decline and redirect to the feature

Answer conversationally. Format data clearly with line breaks. Do not make up data - only reference what is explicitly in the provided context."""


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _utc_now_iso() -> str:
    return _utc_now().isoformat()


def _safe_json(resp: httpx.Response) -> dict:
    try:
        return resp.json()
    except Exception:
        return {}


def _provider_error_message(resp: httpx.Response, default_message: str) -> str:
    payload = _safe_json(resp)
    err = payload.get("error")
    if isinstance(err, dict):
        msg = err.get("message")
        if msg:
            return str(msg)
    if isinstance(err, str) and err:
        return err
    return default_message


def _normalize_model_entry(model: dict) -> dict:
    return {
        "id": model.get("id"),
        "label": model.get("label") or model.get("name") or model.get("id"),
        "is_preview": bool(model.get("is_preview", False)),
        "is_deprecated": bool(model.get("is_deprecated", False)),
        "reasoning_supported": bool(model.get("reasoning_supported", False)),
        "reasoning_label": model.get("reasoning_label") or "Reasoning support",
        # DB capability columns — used by frontend for dynamic effort dropdown
        "thinking_param_type": model.get("thinking_param_type") or "none",
        "supported_effort_levels": model.get("supported_effort_levels") or [],
        "default_effort_level": model.get("default_effort_level") or "none",
        "max_output_tokens": model.get("max_output_tokens"),
    }


def _parse_checked_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return None


def _is_probe_fresh(probe: Optional[dict]) -> bool:
    if not probe:
        return False
    checked_at = _parse_checked_at(probe.get("checked_at"))
    if not checked_at:
        return False
    return (_utc_now() - checked_at) <= timedelta(seconds=MODEL_PROBE_TTL_SECONDS)


def _build_probe_lookup(rows: List[dict]) -> Dict[str, dict]:
    lookup: Dict[str, dict] = {}
    for row in rows:
        model_id = row.get("model_id")
        if not model_id:
            continue
        existing = lookup.get(model_id)
        if not existing:
            lookup[model_id] = row
            continue
        existing_dt = _parse_checked_at(existing.get("checked_at")) or datetime.min.replace(tzinfo=timezone.utc)
        current_dt = _parse_checked_at(row.get("checked_at")) or datetime.min.replace(tzinfo=timezone.utc)
        if current_dt >= existing_dt:
            lookup[model_id] = row
    return lookup


def _attach_probe(model: dict, probe: Optional[dict]) -> dict:
    out = dict(model)
    out["availability_status"] = probe.get("status") if probe else "unknown"
    out["availability_checked_at"] = probe.get("checked_at") if probe else None
    out["availability_message"] = probe.get("message") if probe else None
    return out


def _parse_model_used(model_used: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not model_used or "/" not in model_used:
        return None, None
    provider, model = model_used.split("/", 1)
    return provider.strip().lower(), model.strip()


def _reasoning_metadata_from_model(model: Optional[dict]) -> dict:
    supported = bool(model and model.get("reasoning_supported"))
    label = (
        model.get("reasoning_label")
        if model and model.get("reasoning_label")
        else "Reasoning support"
    )
    return {
        "supported": supported,
        "label": label,
        "status": "supported" if supported else "not_supported",
        # Capability metadata from DB — forwarded to _stream_google and _stream_anthropic logic
        "thinking_param_type": (model.get("thinking_param_type") or "none") if model else "none",
        "max_output_tokens": (model.get("max_output_tokens") or 2000) if model else 2000,
    }


def _build_model_unavailable_event(
    model: str,
    message: str,
    status: str,
    code: str,
    message_id: Optional[str] = None,
) -> dict:
    event: dict = {
        "type": "error",
        "code": code,
        "model": model,
        "availability_status": status,
        "message": message,
    }
    if message_id:
        event["message_id"] = message_id
    return event


async def get_user_ai_settings(user_id: str) -> dict | None:
    """Get user's first configured AI provider, model, and API key."""
    all_settings = await supabase_service.get_all_ai_settings(user_id)
    for row in all_settings:
        key = (row.get("api_key_encrypted") or "").strip()
        model = (row.get("selected_model") or "").strip()
        if key and model:
            return {
                "provider": (row.get("provider") or "openai").lower(),
                "model": model,
                "api_key": key,
                "default_reasoning_effort": row.get("default_reasoning_effort") or "none",
            }
    return None


async def get_user_ai_settings_for_provider(user_id: str, provider: str) -> dict | None:
    row = await supabase_service.get_ai_settings(user_id, provider)
    if not row:
        return None
    key = (row.get("api_key_encrypted") or "").strip()
    model = (row.get("selected_model") or "").strip()
    if not key or not model:
        return None
    return {
        "provider": (row.get("provider") or provider).lower(),
        "model": model,
        "api_key": key,
    }


async def _get_catalog_models_for_provider(provider: str) -> List[dict]:
    db_models = await supabase_service.get_ai_models_for_provider(provider)
    if db_models:
        return [_normalize_model_entry(m) for m in db_models]
    return [_normalize_model_entry(m) for m in _FALLBACK_MODELS.get(provider, [])]


async def _get_selected_model_info(provider: str, selected_model: str) -> dict:
    db_model = await supabase_service.get_ai_model(provider, selected_model, include_deprecated=True)
    if db_model:
        return _normalize_model_entry(db_model)
    return _normalize_model_entry(
        {
            "id": selected_model,
            "label": selected_model,
            "is_preview": False,
            "is_deprecated": False,
            "reasoning_supported": False,
            "reasoning_label": "Reasoning support",
        }
    )


async def get_models_payload(user_id: str) -> dict:
    """Get model payload for /chat/models."""
    ai = await get_user_ai_settings(user_id)
    if not ai:
        return {
            "configured": False,
            "provider": None,
            "selected_model": None,
            "selected_model_info": None,
            "models": [],
        }

    provider = ai["provider"]
    selected_model = ai["model"]

    models = await _get_catalog_models_for_provider(provider)
    selected_info = await _get_selected_model_info(provider, selected_model)

    probe_rows = await supabase_service.list_user_model_probes(user_id, provider)
    probe_lookup = _build_probe_lookup(probe_rows)

    model_ids = {m["id"] for m in models}
    if selected_model and selected_model not in model_ids and not selected_info.get("is_deprecated", False):
        models.insert(0, selected_info)

    visible_models = []
    for model in models:
        if model.get("is_deprecated"):
            continue
        visible_models.append(_attach_probe(model, probe_lookup.get(model["id"])))

    selected_with_probe = _attach_probe(selected_info, probe_lookup.get(selected_model))
    if selected_with_probe.get("is_deprecated"):
        selected_with_probe["availability_status"] = "unavailable"
        selected_with_probe["availability_message"] = (
            "This model is deprecated and cannot be used. Please select another model."
        )

    return {
        "configured": True,
        "provider": provider,
        "selected_model": selected_model,
        "selected_model_info": selected_with_probe,
        "models": visible_models,
        "default_reasoning_effort": ai.get("default_reasoning_effort") or "none",
    }


async def get_available_models(user_id: str) -> list[dict]:
    """Backward-compatible helper used by existing callers."""
    payload = await get_models_payload(user_id)
    return payload.get("models", [])


async def _probe_openai_model(api_key: str, model: str) -> Tuple[str, str]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            OPENAI_MODEL_GET_URL.format(model=model),
            headers={"Authorization": f"Bearer {api_key}"},
        )

    if resp.status_code == 200:
        return "available", "Model is available."
    if resp.status_code in (400, 404, 422):
        return "unavailable", _provider_error_message(resp, f"Model '{model}' is unavailable.")
    if resp.status_code == 403:
        return "unavailable", _provider_error_message(resp, "No access to this model on your account.")
    if resp.status_code == 401:
        return "error", "Invalid OpenAI API key."
    if resp.status_code == 429:
        return "error", "OpenAI rate limit reached while probing."
    return "error", f"OpenAI probe failed ({resp.status_code})."


async def _list_anthropic_model_ids(api_key: str) -> Tuple[Optional[set], str, int]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            ANTHROPIC_MODELS_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
        )

    if resp.status_code == 200:
        data = _safe_json(resp)
        ids = set()
        for row in data.get("data", []):
            model_id = row.get("id")
            if model_id:
                ids.add(model_id)
        return ids, "ok", 200

    if resp.status_code == 401:
        return None, "Invalid Anthropic API key.", resp.status_code
    if resp.status_code == 429:
        return None, "Anthropic rate limit reached while probing.", resp.status_code
    return None, _provider_error_message(resp, f"Anthropic probe failed ({resp.status_code})."), resp.status_code


async def _probe_anthropic_model(
    api_key: str,
    model: str,
    model_ids: Optional[set] = None,
) -> Tuple[str, str]:
    ids = model_ids
    if ids is None:
        ids, msg, _ = await _list_anthropic_model_ids(api_key)
        if ids is None:
            return "error", msg

    if model in ids:
        return "available", "Model is available."
    return "unavailable", f"Model '{model}' is not available for this Anthropic account."


async def _probe_google_model(api_key: str, model: str) -> Tuple[str, str]:
    model_path = model.replace("models/", "")
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            GOOGLE_MODEL_GET_URL.format(model=model_path),
            params={"key": api_key},
        )

    if resp.status_code == 200:
        return "available", "Model is available."
    if resp.status_code == 404:
        return "unavailable", f"Model '{model_path}' is unavailable."
    if resp.status_code == 403:
        return "unavailable", _provider_error_message(resp, "No access to this model on your Google account.")
    if resp.status_code == 400:
        msg = _provider_error_message(resp, "Google model probe failed (400).")
        msg_lower = msg.lower()
        # Only treat as a hard key error if the message clearly indicates that
        if "api key" in msg_lower or "api_key" in msg_lower or "invalid key" in msg_lower:
            return "error", "Invalid Google API key."
        # All other 400s mean the model is unavailable/unsupported on this account
        return "unavailable", msg
    if resp.status_code == 429:
        return "error", "Google rate limit reached while probing."
    return "error", f"Google probe failed ({resp.status_code})."


async def probe_model_availability(
    provider: str,
    api_key: str,
    model: str,
    anthropic_ids: Optional[set] = None,
) -> Tuple[str, str]:
    provider = (provider or "").lower()
    try:
        if provider == "openai":
            return await _probe_openai_model(api_key, model)
        if provider == "anthropic":
            return await _probe_anthropic_model(api_key, model, anthropic_ids)
        if provider == "google":
            return await _probe_google_model(api_key, model)
        return "unknown", f"Unsupported provider: {provider}"
    except httpx.TimeoutException:
        return "error", "Probe timed out."
    except Exception as exc:
        return "error", f"Probe failed: {str(exc)}"


async def _probe_and_cache_model(
    user_id: str,
    provider: str,
    model: str,
    api_key: str,
    anthropic_ids: Optional[set] = None,
) -> dict:
    status, message = await probe_model_availability(provider, api_key, model, anthropic_ids)
    checked_at = _utc_now_iso()
    await supabase_service.upsert_user_model_probe(
        user_id=user_id,
        provider_id=provider,
        model_id=model,
        status=status,
        message=message,
        checked_at=checked_at,
    )
    return {
        "provider_id": provider,
        "model_id": model,
        "status": status,
        "message": message,
        "checked_at": checked_at,
    }


async def ensure_model_available(
    user_id: str,
    provider: str,
    model: str,
    api_key: str,
    force_refresh: bool = False,
) -> dict:
    """
    Ensure model availability with TTL-aware cache.
    Returns dict: {available, status, message, checked_at}
    """
    model_meta = await supabase_service.get_ai_model(provider, model, include_deprecated=True)
    if model_meta and model_meta.get("is_deprecated"):
        checked_at = _utc_now_iso()
        message = "This model is deprecated and hidden. Please reselect an active model."
        await supabase_service.upsert_user_model_probe(
            user_id=user_id,
            provider_id=provider,
            model_id=model,
            status="unavailable",
            message=message,
            checked_at=checked_at,
        )
        return {
            "available": False,
            "status": "unavailable",
            "message": message,
            "checked_at": checked_at,
        }

    cached = await supabase_service.get_user_model_probe(user_id, provider, model)
    if cached and not force_refresh and _is_probe_fresh(cached):
        status = cached.get("status") or "unknown"
        return {
            "available": status == "available",
            "status": status,
            "message": cached.get("message"),
            "checked_at": cached.get("checked_at"),
        }

    probe = await _probe_and_cache_model(user_id, provider, model, api_key)
    return {
        "available": probe["status"] == "available",
        "status": probe["status"],
        "message": probe.get("message"),
        "checked_at": probe.get("checked_at"),
    }


async def run_model_probe_suite(
    user_id: str,
    provider_filter: Optional[str] = None,
    force_refresh: bool = True,
) -> dict:
    """
    Probe all active models for configured providers.
    Returns a compact report grouped by provider.
    """
    settings_rows = await supabase_service.get_all_ai_settings(user_id)
    configured_rows = [
        row
        for row in settings_rows
        if (row.get("api_key_encrypted") or "").strip()
    ]

    providers_report: List[dict] = []
    probe_count = 0
    pass_count = 0

    for row in configured_rows:
        provider = (row.get("provider") or "").lower()
        if provider_filter and provider != provider_filter.lower():
            continue

        api_key = (row.get("api_key_encrypted") or "").strip()
        selected_model = (row.get("selected_model") or "").strip()
        models = await _get_catalog_models_for_provider(provider)

        if selected_model and all(m["id"] != selected_model for m in models):
            selected_info = await _get_selected_model_info(provider, selected_model)
            if not selected_info.get("is_deprecated", False):
                models.insert(0, selected_info)

        anthropic_ids = None
        if provider == "anthropic":
            ids, _, _ = await _list_anthropic_model_ids(api_key)
            if ids is not None:
                anthropic_ids = ids

        provider_models: List[dict] = []
        for model in models:
            model_id = model["id"]
            cached = await supabase_service.get_user_model_probe(user_id, provider, model_id)
            use_cached = cached and _is_probe_fresh(cached) and not force_refresh

            if use_cached:
                status = cached.get("status") or "unknown"
                message = cached.get("message")
                checked_at = cached.get("checked_at")
            else:
                if model.get("is_deprecated"):
                    status = "unavailable"
                    message = "Model is deprecated and hidden."
                    checked_at = _utc_now_iso()
                    await supabase_service.upsert_user_model_probe(
                        user_id=user_id,
                        provider_id=provider,
                        model_id=model_id,
                        status=status,
                        message=message,
                        checked_at=checked_at,
                    )
                else:
                    probe = await _probe_and_cache_model(
                        user_id=user_id,
                        provider=provider,
                        model=model_id,
                        api_key=api_key,
                        anthropic_ids=anthropic_ids,
                    )
                    status = probe["status"]
                    message = probe["message"]
                    checked_at = probe["checked_at"]

            probe_count += 1
            if status == "available":
                pass_count += 1

            provider_models.append(
                {
                    "id": model_id,
                    "label": model.get("label") or model_id,
                    "is_preview": bool(model.get("is_preview", False)),
                    "is_deprecated": bool(model.get("is_deprecated", False)),
                    "reasoning_supported": bool(model.get("reasoning_supported", False)),
                    "reasoning_label": model.get("reasoning_label") or "Reasoning support",
                    "availability_status": status,
                    "availability_message": message,
                    "availability_checked_at": checked_at,
                }
            )

        providers_report.append(
            {
                "provider": provider,
                "selected_model": selected_model or None,
                "models": provider_models,
            }
        )

    return {
        "checked_at": _utc_now_iso(),
        "probed_models": probe_count,
        "available_models": pass_count,
        "providers": providers_report,
    }


async def build_context_string(user_id: str, context_tags: list[str]) -> str:
    """Fetch user data for @-mentioned context topics and return a formatted string."""
    from collections import defaultdict
    parts: list[str] = []

    # Always include a minimal services overview
    services = await supabase_service.get_active_user_services(user_id)
    if services:
        svc_lines = [
            (
                f"  - {s['name']} - Rs.{s['price']}/{s['type']} "
                f"({s['delivery_type']}, {s.get('service_role', 'consumer')})"
            )
            for s in services[:12]
        ]
        parts.append("User's active services:\n" + "\n".join(svc_lines))

    # Auto-inject compact calendar summary when @calendar not explicitly used.
    # This lets AI answer delivery/status questions without requiring @calendar.
    if "calendar" not in context_tags:
        now = datetime.utcnow()
        ym = f"{now.year}-{now.month:02d}"
        if services:
            svc_ids = [s["id"] for s in services[:20]]
            auto_confs = await supabase_service.get_confirmations_for_month_services(
                user_id, ym, svc_ids
            )
            if auto_confs:
                svc_map = {s["id"]: s["name"] for s in services}
                counts: dict = defaultdict(lambda: {"delivered": 0, "skipped": 0})
                for c in auto_confs:
                    sid = c.get("service_id") or (c.get("service") or {}).get("id")
                    status = c.get("status", "")
                    if status in ("delivered", "visited"):
                        counts[sid]["delivered"] += 1
                    elif status in ("skipped", "missed"):
                        counts[sid]["skipped"] += 1
                if counts:
                    cal_lines = [
                        f"  - {svc_map.get(sid, sid)}: {v['delivered']} delivered, {v['skipped']} skipped"
                        for sid, v in counts.items()
                    ]
                    parts.append(
                        f"Current month calendar summary ({ym}):\n" + "\n".join(cal_lines)
                    )
            else:
                parts.append(f"Current month calendar ({ym}): No activity recorded yet.")

    if not context_tags:
        return "\n\n".join(parts) if parts else ""

    # Specific service details
    service_tags = [t for t in context_tags if t.startswith("service:") and t != "service:all"]
    if service_tags or "service:all" in context_tags:
        detail_services = list(services) if "service:all" in context_tags else []
        for tag in service_tags:
            svc_id = tag.split(":", 1)[1]
            svc = await supabase_service.get_user_service(svc_id, user_id)
            if svc and svc not in detail_services:
                detail_services.append(svc)
        if detail_services:
            lines = [
                (
                    f"  - {s.get('name')} | Price: Rs.{s.get('price')} | Type: {s.get('delivery_type')} "
                    f"| Billing day: {s.get('billing_day')} | Schedule: {s.get('schedule')} "
                    f"| Notes: {s.get('notes') or 'none'}"
                )
                for s in detail_services
            ]
            parts.append("Detailed service info:\n" + "\n".join(lines))

    # Bills
    if "bills" in context_tags:
        bills = await supabase_service.list_generated_bills(user_id)
        if bills:
            bill_lines = [
                (
                    f"  - {b.get('year_month')} - Rs.{b.get('total_amount')} "
                    f"({'Paid' if b.get('is_paid') else 'Unpaid'}, {b.get('bill_title', '')})"
                )
                for b in bills[:6]
            ]
            parts.append("Recent bills:\n" + "\n".join(bill_lines))
        else:
            parts.append("Bills: No generated bills yet.")

    # Calendar (current month)
    if "calendar" in context_tags:
        now = datetime.utcnow()
        ym = f"{now.year}-{now.month:02d}"
        if services:
            svc_ids = [s["id"] for s in services[:20]]
            confs = await supabase_service.get_confirmations_for_month_services(user_id, ym, svc_ids)
            if confs:
                conf_lines = [
                    f"  - {c.get('date')} - {c.get('service', {}).get('name', '?')}: {c.get('status')}"
                    for c in confs[-10:]
                ]
                parts.append(f"Calendar ({ym} - last 10 events):\n" + "\n".join(conf_lines))
            else:
                parts.append(f"Calendar ({ym}): No confirmations recorded yet this month.")

    return "\n\n".join(parts) if parts else ""


def _build_llm_messages(history: list[dict], new_content: str, context_str: str) -> list[dict]:
    """Build messages array for LLM calls, injecting context into the user message."""
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-20:]]
    user_content = new_content
    if context_str:
        user_content = f"[YesBill Context]\n{context_str}\n\n---\n\n{new_content}"
    messages.append({"role": "user", "content": user_content})
    return messages


async def _with_thinking_progress(
    gen: AsyncGenerator[dict, None],
    interval: float = 3.0,
) -> AsyncGenerator[dict, None]:
    """
    Wrap a streaming generator to inject synthetic ``thinking_progress`` events
    when no data arrives for ``interval`` seconds during a silent thinking phase.

    Activates when the inner generator yields:
      - ``thinking_wait``  — Gemini 3.x level models (silent deep thinking)
      - ``thinking`` with empty content — OpenAI o-series / reasoning models

    Deactivates (no synthetic events) when:
      - ``thinking`` with non-empty content — real thought chunks are streaming
      - ``chunk`` — thinking phase complete, content arriving

    The ``thinking_progress`` events carry ``{"type": "thinking_progress", "elapsed": <int seconds>}``
    which the frontend uses to show a live elapsed-time counter in the thinking banner.
    """
    queue: asyncio.Queue = asyncio.Queue()

    async def _drain() -> None:
        try:
            async for item in gen:
                await queue.put(item)
        except Exception as exc:          # propagate errors through the queue
            await queue.put({"__exc__": exc})
        finally:
            await queue.put(None)           # sentinel: stream finished

    drain_task = asyncio.create_task(_drain())
    _thinking_active = False
    elapsed = 0

    # Keep a persistent get-task so we never start two concurrent queue.get() calls.
    get_task: asyncio.Task = asyncio.create_task(queue.get())

    try:
        while True:
            if _thinking_active:
                # Wait up to `interval` seconds for the next item.
                # asyncio.wait() does NOT cancel get_task on timeout — safe to reuse.
                done, _ = await asyncio.wait({get_task}, timeout=interval)
                if not done:
                    elapsed += int(interval)
                    yield {"type": "thinking_progress", "elapsed": elapsed}
                    continue
                item = get_task.result()
                get_task = asyncio.create_task(queue.get())
            else:
                item = await get_task
                get_task = asyncio.create_task(queue.get())

            if item is None:
                break           # sentinel reached — generator finished

            if isinstance(item, dict):
                if "__exc__" in item:
                    raise item["__exc__"]
                t = item.get("type", "")
                if t == "thinking_wait":
                    _thinking_active = True
                    elapsed = 0
                elif t == "thinking":
                    # Empty content = silent reasoning start (OpenAI); non-empty = real chunks
                    if not item.get("content"):
                        _thinking_active = True
                        elapsed = 0
                    else:
                        _thinking_active = False
                elif t in ("chunk", "_usage"):
                    _thinking_active = False

            yield item

    finally:
        get_task.cancel()
        drain_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await drain_task


async def _stream_openai(
    api_key: str, model: str, system_prompt: str, messages: list[dict],
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """Yields dicts: {"type": "thinking"|"chunk", "content": str}
    Yields a final {"type": "_usage", "tokens_in": int, "tokens_out": int, "tokens_thinking": int}
    """
    all_messages = [{"role": "system", "content": system_prompt}] + messages
    params = _build_openai_params(model, all_messages, max_tokens=2048, reasoning_effort=reasoning_effort)
    params["stream"] = True
    params["stream_options"] = {"include_usage": True}
    # For reasoning models: emit empty thinking event to show spinner in UI
    # Only emit if the model will actually reason (skip when reasoning_effort="none")
    will_reason = (model in OPENAI_NO_TEMP_MODELS or
                   (model in OPENAI_REASONING_EFFORT_MODELS and reasoning_effort != "none"))
    if will_reason:
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
                if line.startswith("data: "):
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        # Usage chunk (has no choices content)
                        if "usage" in obj and obj.get("usage"):
                            u = obj["usage"]
                            _usage_data["tokens_in"] = u.get("prompt_tokens", 0)
                            _usage_data["tokens_out"] = u.get("completion_tokens", 0)
                            _usage_data["tokens_thinking"] = (
                                u.get("completion_tokens_details", {}).get("reasoning_tokens", 0)
                            )
                        chunk = obj["choices"][0]["delta"].get("content") or ""
                        if chunk:
                            yield {"type": "chunk", "content": chunk}
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
    yield {"type": "_usage", **_usage_data}


_ANTHROPIC_EFFORT_BUDGET = {
    "none": 0, "low": 1000, "medium": 5000, "high": 10000, "xhigh": 16000
}


async def _stream_anthropic(
    api_key: str, model: str, system_prompt: str, messages: list[dict],
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """Yields dicts: {"type": "thinking"|"chunk", "content": str}
    Yields a final {"type": "_usage", "tokens_in": int, "tokens_out": int, "tokens_thinking": int}
    """
    _budget = _ANTHROPIC_EFFORT_BUDGET.get(reasoning_effort, 5000)
    body: dict = {
        "model": model,
        "max_tokens": 16000,
        "system": system_prompt,
        "messages": messages,
        "stream": True,
    }
    if _budget > 0:
        body["thinking"] = {"type": "enabled", "budget_tokens": _budget}
    _tokens_in = 0
    _tokens_out = 0
    _thinking_chars = 0  # track chars to estimate thinking tokens
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
            json=body,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    try:
                        obj = json.loads(data)
                        event_type = obj.get("type", "")
                        if event_type == "message_start":
                            _tokens_in = obj.get("message", {}).get("usage", {}).get("input_tokens", 0)
                        elif event_type == "message_delta":
                            _tokens_out = obj.get("usage", {}).get("output_tokens", 0)
                        elif event_type == "content_block_delta":
                            delta = obj.get("delta", {})
                            delta_type = delta.get("type", "")
                            if delta_type == "thinking_delta":
                                thinking = delta.get("thinking", "")
                                if thinking:
                                    _thinking_chars += len(thinking)
                                    yield {"type": "thinking", "content": thinking}
                            elif delta_type == "text_delta":
                                text = delta.get("text", "")
                                if text:
                                    yield {"type": "chunk", "content": text}
                    except (json.JSONDecodeError, KeyError):
                        continue
    # Estimate thinking tokens from character count (avg ~4 chars/token)
    _tokens_thinking = _thinking_chars // 4 if _thinking_chars > 0 else 0
    yield {"type": "_usage", "tokens_in": _tokens_in, "tokens_out": _tokens_out,
           "tokens_thinking": _tokens_thinking}


# ── Google effort value mappings ────────────────────────────────────────────
# budget-type models (Gemini 2.5.x): effort → thinkingBudget token count
_GOOGLE_EFFORT_TO_BUDGET = {
    "none": 0, "low": 512, "medium": 6000, "high": 24576,
}
# level-type models (Gemini 3.x): effort → thinkingLevel string
_GOOGLE_EFFORT_TO_LEVEL = {
    "none": "minimal", "low": "low", "medium": "medium", "high": "high", "xhigh": "high",
}
_GOOGLE_EFFORT_TO_READ_TIMEOUT = {
    "none": 60.0,      # no thinking → fast
    "low": 300.0,      # LOW ~66s → 300s buffer
    "medium": 500.0,   # MEDIUM ~111-250s → 500s buffer (silent-thinking models can exceed 300s)
    "high": 700.0,     # HIGH ~165-400s → 700s buffer
    "xhigh": 700.0,
}


async def _stream_google(
    api_key: str, model: str, system_prompt: str, messages: list[dict],
    thinking_supported: bool = False, reasoning_effort: str = "none",
    thinking_param_type: str = "none", max_output_tokens: int = 2000,
) -> AsyncGenerator[dict, None]:
    """Yields dicts: {"type": "thinking"|"chunk", "content": str}"""
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})
    system_instruction = {"parts": [{"text": system_prompt}]}
    generation_config: dict = {"maxOutputTokens": min(max_output_tokens, 65536)}
    _using_thinking = False

    # Determine thinking config based on DB-sourced thinking_param_type
    if thinking_supported and thinking_param_type == "budget":
        budget = _GOOGLE_EFFORT_TO_BUDGET.get(reasoning_effort, 512)
        # 2.5-pro cannot disable thinking — floor at 512
        if model == "gemini-2.5-pro" and budget == 0:
            budget = 512
        if budget > 0:
            generation_config["thinkingConfig"] = {"includeThoughts": True, "thinkingBudget": budget}
            generation_config["temperature"] = 1.0
            _using_thinking = True
        # budget==0 → no thinkingConfig → model won't think
    elif thinking_supported and thinking_param_type == "level":
        # Gemini 3.x level-based models: "none"→"minimal", but some models don't support minimal
        _no_minimal = model in {"gemini-3.1-pro-preview", "gemini-3-pro-preview"}
        if reasoning_effort == "none" and _no_minimal:
            level = "low"  # these models have no true off — fall back to low
        else:
            level = _GOOGLE_EFFORT_TO_LEVEL.get(reasoning_effort, "low")
        # includeThoughts=True: keeps the SSE stream alive during silent thinking phases.
        # Without it, the model thinks silently → httpx read timeout fires around 300s.
        # With it, thought chunks stream progressively → connection stays alive + user sees progress.
        generation_config["thinkingConfig"] = {"thinkingLevel": level, "includeThoughts": True}
        generation_config["temperature"] = 1.0
        _using_thinking = True
    elif thinking_supported and thinking_param_type in ("none", "") and model in GOOGLE_THINKING_BUDGET_MODELS:
        # Fallback for models without param_type metadata yet (budget models)
        generation_config["thinkingConfig"] = {"includeThoughts": True, "thinkingBudget": 1024}
        generation_config["temperature"] = 1.0
        _using_thinking = True
    elif thinking_supported and thinking_param_type in ("none", "") and model in GOOGLE_THINKING_LEVEL_MODELS and reasoning_effort != "none":
        # Fallback for level models without param_type metadata yet
        level = _GOOGLE_EFFORT_TO_LEVEL.get(reasoning_effort, "low")
        generation_config["thinkingConfig"] = {"thinkingLevel": level}
        generation_config["temperature"] = 1.0
        _using_thinking = True

    url = GOOGLE_STREAM_URL.format(model=model)
    if _using_thinking:
        if thinking_param_type == "level" or model in GOOGLE_THINKING_LEVEL_MODELS:
            # Level-based models: silent thinking — notify user of expected wait
            _wait_map = {"none": "~1 min", "low": "~1 min", "medium": "~2 min", "high": "~3 min", "xhigh": "~3 min"}
            _wait = _wait_map.get(reasoning_effort, "~1–3 min")
            _model_label = "Gemini 3" if "3" in model else "Gemini"
            yield {"type": "thinking_wait", "content":
                   f"{_model_label} is thinking deeply ({reasoning_effort.capitalize()} level)"
                   f" — response may take {_wait}. Please wait..."}
        else:
            yield {"type": "thinking", "content": ""}   # Budget models: thoughts stream live
    _read_timeout = (
        _GOOGLE_EFFORT_TO_READ_TIMEOUT.get(reasoning_effort, 120.0)
        if _using_thinking
        else 120.0  # Non-thinking Gemini can still have higher latency on large outputs
    )
    _last_usage: dict = {}
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=_read_timeout, write=10.0, pool=5.0)) as client:
        async with client.stream(
            "POST",
            f"{url}?key={api_key}&alt=sse",
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "system_instruction": system_instruction,
                "generationConfig": generation_config,
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    try:
                        obj = json.loads(data)
                        if "error" in obj:
                            err = obj["error"]
                            raise RuntimeError(
                                f"Gemini API error {err.get('code', '')}: {err.get('message', '')}"
                            )
                        # Track usage metadata from each chunk (last one is the full total)
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


async def stream_response(
    user_id: str,
    conv_id: str,
    content: str,
    context_tags: list[str],
    model_override: str | None = None,
    reasoning_effort: str = "none",
) -> AsyncGenerator[dict, None]:
    """
    SSE generator for POST /chat/conversations/{id}/messages.
    Yields dicts: {type, ...}
    """
    ai = await get_user_ai_settings(user_id)
    if not ai:
        yield {"type": "error", "message": "No AI configured. Go to Settings -> AI Settings."}
        return

    provider = ai["provider"]
    model = model_override or ai["model"]
    api_key = ai["api_key"]
    model_info = await supabase_service.get_ai_model(provider, model, include_deprecated=True)
    reasoning_meta = _reasoning_metadata_from_model(model_info)
    # Suppress reasoning panel when effort-based model is set to "none"
    if (reasoning_effort == "none"
            and model in OPENAI_REASONING_EFFORT_MODELS
            and model not in OPENAI_NO_TEMP_MODELS):
        reasoning_meta["supported"] = False
        reasoning_meta["status"] = "not_supported"

    _q = content[:100] + "..." if len(content) > 100 else content
    logger.info("[CHAT] user=%s model=%s/%s effort=%s query=%r",
                user_id[:8], provider, model, reasoning_effort, _q)
    _chat_start = time.monotonic()

    # Save user message first
    await supabase_service.add_message(
        conv_id, user_id, "user", content, context_tags=context_tags or None
    )
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
        yield _build_model_unavailable_event(
            model=model,
            status=precheck.get("status", "unknown"),
            code=MODEL_UNAVAILABLE_PRECHECK,
            message=error_text,
            message_id=err_msg.get("id") if err_msg else None,
        )
        return

    # Build context and message history
    context_str = await build_context_string(user_id, context_tags)
    history = await supabase_service.get_messages(conv_id, user_id)
    past_msgs = history[:-1]
    messages = _build_llm_messages(past_msgs, content, context_str)

    # Inject feedback summary into system prompt
    system_prompt = YESBILL_SYSTEM_PROMPT
    feedback_summary = await supabase_service.get_conv_feedback_summary(conv_id)
    if feedback_summary:
        pos = feedback_summary.get("positive", 0)
        neg = feedback_summary.get("negative", 0)
        system_prompt += (
            "\n\nUser feedback on previous responses in this conversation: "
            f"{pos} positive, {neg} negative. Adjust quality accordingly."
        )

    full_response = ""
    _ttft_ms: Optional[int] = None
    _chunks_count = 0
    _usage_data: dict = {"tokens_in": 0, "tokens_out": 0, "tokens_thinking": 0}
    try:
        if provider == "openai":
            gen = _stream_openai(api_key, model, system_prompt, messages,
                                  reasoning_effort=reasoning_effort)
        elif provider == "anthropic":
            gen = _stream_anthropic(api_key, model, system_prompt, messages,
                                    reasoning_effort=reasoning_effort)
        elif provider == "google":
            gen = _stream_google(
                api_key, model, system_prompt, messages,
                thinking_supported=reasoning_meta.get("supported", False),
                reasoning_effort=reasoning_effort,
                thinking_param_type=reasoning_meta.get("thinking_param_type", "none"),
                max_output_tokens=reasoning_meta.get("max_output_tokens", 2000),
            )
        else:
            yield {"type": "error", "message": f"Unsupported provider: {provider}"}
            return

        # Wrap generators for providers where thinking is silent (no real thought chunks stream).
        # _with_thinking_progress injects synthetic events every 3s so the UI shows a live
        # elapsed-time counter instead of a frozen spinner.
        #   • Google level models: thinking_wait + silence until text
        #   • OpenAI reasoning models: empty thinking event + silence until text
        _needs_progress = (
            (provider == "google" and reasoning_meta.get("thinking_param_type") == "level")
            or (provider == "openai"
                and reasoning_effort != "none"
                and model in (OPENAI_NO_TEMP_MODELS | OPENAI_REASONING_EFFORT_MODELS))
        )
        if _needs_progress:
            gen = _with_thinking_progress(gen, interval=3.0)

        async for event in gen:
            if isinstance(event, dict):
                if event["type"] == "_usage":
                    # Internal usage event — capture but don't forward to client
                    _usage_data = {
                        "tokens_in": event.get("tokens_in", 0),
                        "tokens_out": event.get("tokens_out", 0),
                        "tokens_thinking": event.get("tokens_thinking", 0),
                    }
                elif event["type"] == "thinking":
                    yield {"type": "thinking", "content": event["content"]}
                elif event["type"] == "thinking_wait":
                    yield {"type": "thinking_wait", "content": event["content"]}
                elif event["type"] == "thinking_progress":
                    yield {"type": "thinking_progress", "elapsed": event["elapsed"]}
                else:
                    chunk = event["content"]
                    full_response += chunk
                    _chunks_count += 1
                    if _ttft_ms is None:
                        _ttft_ms = int((time.monotonic() - _chat_start) * 1000)
                    yield {"type": "chunk", "content": chunk}
            else:
                full_response += event
                _chunks_count += 1
                if _ttft_ms is None:
                    _ttft_ms = int((time.monotonic() - _chat_start) * 1000)
                yield {"type": "chunk", "content": event}

    except httpx.HTTPStatusError as e:
        logger.warning("[CHAT] HTTP error — model=%s/%s status=%s took=%.1fs",
                       provider, model, e.response.status_code, time.monotonic() - _chat_start)
        code = e.response.status_code
        if code in (400, 404, 422):
            runtime_message = _provider_error_message(
                e.response,
                (
                    f"Model '{model}' is not available on your account or returned an error ({code}). "
                    "Please select a different model in Settings -> AI Settings."
                ),
            )
            await supabase_service.upsert_user_model_probe(
                user_id=user_id,
                provider_id=provider,
                model_id=model,
                status="unavailable",
                message=runtime_message,
                checked_at=_utc_now_iso(),
            )
            err_msg = await supabase_service.add_message(
                conv_id, user_id, "assistant", runtime_message,
                metadata={"type": "error", "code": MODEL_UNAVAILABLE_RUNTIME},
            )
            yield _build_model_unavailable_event(
                model=model,
                status="unavailable",
                code=MODEL_UNAVAILABLE_RUNTIME,
                message=runtime_message,
                message_id=err_msg.get("id") if err_msg else None,
            )
        elif code == 401:
            error_text = "Invalid API key. Please check AI Settings."
            err_msg = await supabase_service.add_message(
                conv_id, user_id, "assistant", error_text,
                metadata={"type": "error", "code": "INVALID_API_KEY"},
            )
            yield {"type": "error", "message": error_text,
                   "message_id": err_msg.get("id") if err_msg else None}
        elif code == 429:
            error_text = "Rate limit reached. Please wait and try again."
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
        logger.warning("[CHAT] ReadTimeout — model=%s/%s took=%.1fs",
                       provider, model, time.monotonic() - _chat_start)
        error_text = (
            "The AI provider took too long to respond. "
            "Try switching to a lower thinking level (e.g. Low) in the reasoning selector, "
            "or use a non-thinking model."
        )
        err_msg = await supabase_service.add_message(
            conv_id, user_id, "assistant", error_text,
            metadata={"type": "error", "code": "READ_TIMEOUT"},
        )
        yield {"type": "error", "message": error_text,
               "message_id": err_msg.get("id") if err_msg else None}
        return
    except Exception as exc:
        logger.error("[CHAT] Unhandled error — model=%s/%s error=%s took=%.1fs",
                     provider, model, type(exc).__name__, time.monotonic() - _chat_start)
        _exc_detail = str(exc) or repr(exc)
        error_text = f"Streaming error ({type(exc).__name__}): {_exc_detail}"
        err_msg = await supabase_service.add_message(
            conv_id, user_id, "assistant", error_text,
            metadata={"type": "error", "code": "STREAM_ERROR"},
        )
        yield {"type": "error", "message": error_text,
               "message_id": err_msg.get("id") if err_msg else None}
        return

    _latency_ms = int((time.monotonic() - _chat_start) * 1000)
    msg_id = None
    if full_response:
        msg = await supabase_service.add_message(
            conv_id,
            user_id,
            "assistant",
            full_response,
            model_used=f"{provider}/{model}",
            metadata={"reasoning": reasoning_meta},
        )
        msg_id = msg.get("id")
        # Save analytics asynchronously (don't block done event on failure)
        if msg_id:
            try:
                cost_usd = calculate_cost(
                    provider, model,
                    _usage_data["tokens_in"],
                    _usage_data["tokens_out"],
                    _usage_data.get("tokens_thinking", 0),
                )
                await supabase_service.save_message_analytics(
                    message_id=msg_id,
                    user_id=user_id,
                    tokens_in=_usage_data["tokens_in"],
                    tokens_out=_usage_data["tokens_out"],
                    tokens_thinking=_usage_data.get("tokens_thinking") or None,
                    cost_usd=cost_usd,
                    latency_ms=_latency_ms,
                    ttft_ms=_ttft_ms,
                    chunks_count=_chunks_count,
                    model_used=f"{provider}/{model}",
                )
            except Exception as _ae:
                logger.warning("[CHAT] analytics save failed: %s", _ae)

    logger.info("[CHAT] DONE — model=%s/%s response=%d chars took=%.1fs",
                provider, model, len(full_response), time.monotonic() - _chat_start)

    # Build analytics payload for client (only include if tokens were captured)
    _analytics_payload: Optional[dict] = None
    if _usage_data["tokens_in"] > 0 or _usage_data["tokens_out"] > 0:
        _analytics_payload = {
            "tokens_in": _usage_data["tokens_in"],
            "tokens_out": _usage_data["tokens_out"],
            "tokens_thinking": _usage_data.get("tokens_thinking") or 0,
            "cost_usd": calculate_cost(
                provider, model,
                _usage_data["tokens_in"],
                _usage_data["tokens_out"],
                _usage_data.get("tokens_thinking", 0),
            ),
            "latency_ms": _latency_ms,
            "ttft_ms": _ttft_ms,
            "chunks_count": _chunks_count,
        }

    # Yield done FIRST — re-enables the UI immediately after content is streamed.
    # Title generation happens after (can take 10–20s for thinking models).
    yield {
        "type": "done",
        "model": f"{provider}/{model}",
        "message_id": msg_id,
        "reasoning": reasoning_meta,
        "analytics": _analytics_payload,
    }

    # Auto-generate title after done — frontend handles 'title' events post-done.
    try:
        conv = await supabase_service.get_conversation(conv_id, user_id)
        if conv and conv.get("title") in ("New Conversation", "YesBill Assistant") and full_response:
            all_msgs = await supabase_service.get_messages(conv_id, user_id)
            ua_msgs = [m for m in all_msgs if m.get("role") in ("user", "assistant")]
            if len(ua_msgs) >= 2:
                title = await _generate_title(provider, api_key, model, content, full_response)
                if title:
                    await supabase_service.update_conversation_title(conv_id, user_id, title)
                    yield {"type": "title", "title": title}
                else:
                    logger.warning("[CHAT] _generate_title returned None for conv=%s", conv_id)
    except Exception as _te:
        logger.warning("[CHAT] auto-title failed: %s", _te)


async def _generate_title(
    provider: str, api_key: str, model: str, user_msg: str, assistant_msg: str
) -> Optional[str]:
    prompt = (
        "Generate a short 3-6 word title for this conversation. "
        "Reply with only the title text, no punctuation or quotes.\n\n"
        f"User: {user_msg[:200]}\nAssistant: {assistant_msg[:200]}"
    )
    logger.info("[TITLE] Generating title via %s/%s", provider, model)
    result, err = await _single_completion_with_error(
        provider=provider,
        api_key=api_key,
        model=model,
        user_prompt=prompt,
        system_prompt="Generate concise conversation titles.",
        max_tokens=60,
    )
    if not result:
        logger.warning("[TITLE] API failed (provider=%s model=%s): %s — using fallback", provider, model, err)
        # Fallback: skip common greeting words, take first 5-6 meaningful words
        _stop_words = {"hi", "hey", "hello", "hii", "hlo", "please", "can", "could", "would", "i", "me", "my", "the", "a", "an"}
        words = [w for w in user_msg.strip().split() if w.lower() not in _stop_words]
        if not words:
            words = user_msg.strip().split()
        return (" ".join(words[:6])[:60]) if words else None
    title = result.strip()[:80]
    logger.info("[TITLE] Generated: %r", title)
    return title


async def _single_completion_with_error(
    provider: str,
    api_key: str,
    model: str,
    user_prompt: str,
    system_prompt: str,
    max_tokens: int = 300,
) -> Tuple[Optional[str], Optional[str]]:
    try:
        if provider == "openai":
            async with httpx.AsyncClient(timeout=20.0) as client:
                ns_messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
                ns_params = _build_openai_params(model, ns_messages, max_tokens=max_tokens)
                resp = await client.post(
                    OPENAI_CHAT_URL,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=ns_params,
                )
                resp.raise_for_status()
                content_field = resp.json()["choices"][0]["message"].get("content")
                if not content_field:
                    return None, "Empty content in response"
                text = content_field.strip()
                return text, None

        if provider == "anthropic":
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    ANTHROPIC_MESSAGES_URL,
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )
                resp.raise_for_status()
                # Filter for type='text' blocks — extended thinking models return
                # 'thinking' blocks first which have no 'text' key
                content_blocks = resp.json()["content"]
                text_blocks = [b for b in content_blocks if b.get("type") == "text"]
                if not text_blocks:
                    # Fallback: try any block with a 'text' field
                    text = "".join(b.get("text", "") for b in content_blocks).strip()
                else:
                    text = text_blocks[0]["text"].strip()
                return text, None

        if provider == "google":
            model_path = model.replace("models/", "")
            # CRITICAL FIX: For Gemini 3.x level models, thinking tokens and output tokens
            # share the same maxOutputTokens budget in generateContent (non-streaming).
            # With maxOutputTokens=60 and ~53 thinking tokens, only ~7 tokens remain for text
            # → title gets cut to 1-3 words (confirmed: 'Last', 'Last Month Grocery').
            # Fix: add 300-token thinking headroom for level models to guarantee full text output.
            _level_thinking_padding = 300 if model in GOOGLE_THINKING_LEVEL_MODELS else 0
            gen_config: dict = {"maxOutputTokens": max_tokens + _level_thinking_padding}
            # Disable or minimize thinking for utility calls (title gen, rephrase, etc.)
            # These need fast turnaround and don't benefit from deep reasoning.
            if model in GOOGLE_THINKING_BUDGET_MODELS:
                # 2.5-pro cannot disable thinking (min=512); 2.5-flash/lite accept 0
                thinking_budget = 512 if model == "gemini-2.5-pro" else 0
                gen_config["thinkingConfig"] = {"thinkingBudget": thinking_budget}
            elif model in {"gemini-3.1-pro-preview", "gemini-3-pro-preview"}:
                # Cannot disable — use minimal-equivalent LOW to keep fast
                gen_config["thinkingConfig"] = {"thinkingLevel": "low"}
            elif model in GOOGLE_THINKING_LEVEL_MODELS:
                # Flash: minimal ≈ off, but may still think on complex queries
                gen_config["thinkingConfig"] = {"thinkingLevel": "minimal"}
            # Increased from 60s → 120s: Gemini 3.x level models with thinkingLevel=low
            # can take 60-90s on their own (measured T8=83.8s). 120s gives safe margin.
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"{GOOGLE_GENERATE_URL.format(model=model_path)}?key={api_key}",
                    json={
                        "contents": [{"parts": [{"text": user_prompt}]}],
                        "system_instruction": {"parts": [{"text": system_prompt}]},
                        "generationConfig": gen_config,
                    },
                )
                resp.raise_for_status()
                parts = resp.json()["candidates"][0]["content"]["parts"]
                text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
                if not text:  # all content was in thought parts — try without filter
                    text = "".join(p.get("text", "") for p in parts).strip()
                return text, None
    except httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else "unknown"
        logger.warning("[TITLE] HTTP %s — %.300s", status, e.response.text if e.response is not None else "")
        detail = _provider_error_message(e.response, f"Provider request failed ({status}).")
        return None, detail
    except Exception as e:
        message = str(e).strip() or e.__class__.__name__
        return None, message

    return None, "Unsupported provider for completion request."


async def _single_completion(
    provider: str,
    api_key: str,
    model: str,
    user_prompt: str,
    system_prompt: str,
    max_tokens: int = 300,
) -> Optional[str]:
    text, _ = await _single_completion_with_error(
        provider=provider,
        api_key=api_key,
        model=model,
        user_prompt=user_prompt,
        system_prompt=system_prompt,
        max_tokens=max_tokens,
    )
    return text


async def get_or_generate_reasoning_summary(
    user_id: str,
    conv_id: str,
    message_id: str,
) -> dict:
    """
    Generate/cached reasoning summary for one assistant message.
    Stores only summary metadata in chat_messages.metadata.reasoning.
    """
    message = await supabase_service.get_message(message_id, user_id)
    if not message:
        return {"ok": False, "error": "Message not found."}
    if message.get("conversation_id") != conv_id:
        return {"ok": False, "error": "Message does not belong to this conversation."}
    if message.get("role") != "assistant":
        return {"ok": False, "error": "Reasoning summary is only available for assistant messages."}

    metadata = message.get("metadata") or {}
    reasoning = metadata.get("reasoning") if isinstance(metadata.get("reasoning"), dict) else {}
    summary = (reasoning or {}).get("summary")
    if summary:
        return {"ok": True, "cached": True, "summary": summary, "reasoning": reasoning}

    provider, model = _parse_model_used(message.get("model_used"))
    if not provider or not model:
        current_ai = await get_user_ai_settings(user_id)
        if not current_ai:
            return {"ok": False, "error": "No AI provider is configured."}
        provider = current_ai["provider"]
        model = current_ai["model"]

    model_info = await supabase_service.get_ai_model(provider, model, include_deprecated=True)
    if not reasoning:
        reasoning = _reasoning_metadata_from_model(model_info)
    if not reasoning.get("supported", False):
        metadata["reasoning"] = reasoning
        await supabase_service.update_message_metadata(message_id, user_id, metadata)
        return {"ok": False, "error": "Reasoning summary is not supported for this model."}

    provider_ai = await get_user_ai_settings_for_provider(user_id, provider)
    if not provider_ai:
        return {"ok": False, "error": "Provider API key is missing for reasoning summary generation."}

    precheck = await ensure_model_available(
        user_id=user_id,
        provider=provider,
        model=model,
        api_key=provider_ai["api_key"],
    )
    if not precheck["available"]:
        return {
            "ok": False,
            "error": precheck.get("message") or "Selected model is unavailable for reasoning summary.",
        }

    conv_messages = await supabase_service.get_messages(conv_id, user_id)
    prev_user_msg = ""
    for idx, row in enumerate(conv_messages):
        if row.get("id") == message_id:
            for prev in reversed(conv_messages[:idx]):
                if prev.get("role") == "user":
                    prev_user_msg = prev.get("content") or ""
                    break
            break

    summary_prompt = (
        "Based on the user's question and the AI assistant's response below, infer and describe "
        "the REASONING PROCESS in 5-7 specific bullet points.\n"
        "Each bullet must be concrete and specific — use exact names, numbers, terms from the conversation.\n"
        "Cover these aspects (not necessarily one per bullet):\n"
        "1. What the user actually needed (exact goal, not just surface request)\n"
        "2. What key data/information was identified or retrieved\n"
        "3. How the response was structured and why that format was chosen\n"
        "4. Key decisions made (what to include vs exclude, how to phrase things)\n"
        "5. Any assumptions, caveats, or edge cases addressed\n"
        "START each line with '- ' (dash space). NO intro line. NO conclusion. ONLY bullet points.\n\n"
        f"User question: {prev_user_msg or '(not available)'}\n\n"
        f"AI response:\n{(message.get('content') or '')[:3000]}"
    )
    system_prompt = (
        "You are an AI reasoning analyst. Given a question and response, you identify and explain "
        "the reasoning steps the AI must have used. Be specific about decisions, data identified, "
        "and structure choices. Never be vague."
    )
    generated, generation_error = await _single_completion_with_error(
        provider=provider,
        api_key=provider_ai["api_key"],
        model=model,
        user_prompt=summary_prompt,
        system_prompt=system_prompt,
        max_tokens=800,
    )
    if not generated:
        return {
            "ok": False,
            "error": generation_error or "Failed to generate reasoning summary.",
        }

    reasoning["summary"] = generated.strip()
    reasoning["summary_generated_at"] = _utc_now_iso()
    metadata["reasoning"] = reasoning
    await supabase_service.update_message_metadata(message_id, user_id, metadata)

    return {
        "ok": True,
        "cached": False,
        "summary": reasoning["summary"],
        "reasoning": reasoning,
    }


async def rephrase_text(user_id: str, text: str) -> Optional[str]:
    """Rephrase text using the user's configured LLM."""
    ai = await get_user_ai_settings(user_id)
    if not ai:
        return None

    provider = ai["provider"]
    model = ai["model"]
    api_key = ai["api_key"]

    prompt = (
        "Rephrase the following query to be clearer, more specific, and professional. "
        "Keep the same meaning and intent. Reply with only the rephrased text.\n\n"
        f"{text}"
    )
    return await _single_completion(
        provider=provider,
        api_key=api_key,
        model=model,
        user_prompt=prompt,
        system_prompt="You rewrite user text with clarity while preserving intent.",
        max_tokens=300,
    )

