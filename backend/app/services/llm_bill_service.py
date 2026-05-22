# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""
LLM service for bill generation.
Fetches user AI settings from Supabase and calls provider to generate
ai_summary and recommendation for a bill.
"""
import json
import logging
import re
import time

import httpx

from app.services.supabase import supabase_service

logger = logging.getLogger("yesbill.bill_llm")

# Provider API endpoints
OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
GOOGLE_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _build_bill_context(month_name: str, items: list[dict], total: float, currency: str) -> str:
    """Build a detailed context string for the LLM with service names and specific numbers."""
    lines = [f"Month: {month_name}. Grand Total: {currency} {total:.2f} across {len(items)} service(s)."]
    for it in items:
        service_name = it.get('service', 'Unknown Service')
        delivery_type = it.get('delivery_type', 'home_delivery')
        delivered = it.get('days_delivered', 0)
        skipped = it.get('days_skipped', 0)
        svc_total = it.get('total', 0)
        rate_per_day = it.get('rate_per_day') or it.get('price', 0)
        total_tracked = delivered + skipped

        if delivery_type in ('subscription', 'payment'):
            lines.append(
                f"- {service_name} [Fixed/Subscription]: fixed charge {currency} {svc_total:.2f}."
            )
        elif delivery_type == 'utility':
            lines.append(
                f"- {service_name} [Utility]: {'active' if delivered > 0 else 'not active'} this month, "
                f"charged {currency} {svc_total:.2f}."
            )
        elif delivery_type == 'visit_based':
            pct = round(delivered / total_tracked * 100) if total_tracked > 0 else 0
            lines.append(
                f"- {service_name} [Visit-based]: {delivered} visits out of {total_tracked} tracked days "
                f"({pct}% attendance), {skipped} missed, charged {currency} {svc_total:.2f}."
            )
        else:
            # home_delivery or default
            pct = round(delivered / total_tracked * 100) if total_tracked > 0 else 0
            rate_str = f" @ {currency} {rate_per_day:.2f}/day" if rate_per_day else ""
            lines.append(
                f"- {service_name} [Home Delivery]: {delivered} days delivered out of {total_tracked} "
                f"({pct}% delivery rate){rate_str}, {skipped} skipped, charged {currency} {svc_total:.2f}."
            )
    return "\n".join(lines)


def _parse_llm_response(text: str) -> tuple[str, str, str | None]:
    """Parse LLM response into ai_summary, recommendation, and refined_note. Prefer JSON."""
    text = (text or "").strip()
    # Try JSON block
    try:
        # Look for ```json ... ``` or raw {...}
        m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
        if m:
            obj = json.loads(m.group(1))
            return (
                obj.get("ai_summary", "") or obj.get("summary", "") or text,
                obj.get("recommendation", "") or "",
                obj.get("refined_note") or None,
            )
        brace = text.find("{")
        if brace != -1:
            obj = json.loads(text[brace : text.rfind("}") + 1])
            return (
                obj.get("ai_summary", "") or obj.get("summary", "") or text,
                obj.get("recommendation", "") or "",
                obj.get("refined_note") or None,
            )
    except (json.JSONDecodeError, KeyError):
        pass
    # Fallback: first paragraph = summary, second = recommendation
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(parts) >= 2:
        return parts[0], parts[1], None
    if parts:
        return parts[0], "", None
    return text, "", None


async def get_ai_settings_for_bill(user_id: str) -> dict | None:
    """
    Get the first AI settings row that has a selected model, API key,
    and enable_insights = True.
    Returns dict with provider, selected_model, api_key_encrypted.
    """
    all_settings = await supabase_service.get_all_ai_settings(user_id)
    for row in all_settings:
        # Respect the user's Enable AI Insights toggle
        if not row.get("enable_insights", True):
            continue
        key = (row.get("api_key_encrypted") or "").strip()
        model = (row.get("selected_model") or "").strip()
        if key and model:
            return {
                "provider": row.get("provider", "openai"),
                "selected_model": model,
                "api_key_encrypted": key,
            }
    return None


async def generate_bill_insights(
    user_id: str,
    month_name: str,
    items: list[dict],
    total: float,
    currency: str = "INR",
    custom_note: str | None = None,
) -> tuple[str, str, str | None, str | None]:
    """
    Call LLM to generate ai_summary, recommendation, and refined_note.
    Returns (ai_summary, recommendation, ai_model_used, refined_note).
    If no AI settings or call fails, returns empty strings and None.
    """
    settings = await get_ai_settings_for_bill(user_id)
    if not settings:
        return "", "", None, custom_note

    provider = (settings.get("provider") or "openai").lower()
    model = settings.get("selected_model", "")
    api_key = settings.get("api_key_encrypted", "")
    context = _build_bill_context(month_name, items, total, currency)

    # Build custom note instruction
    note_instruction = ""
    if custom_note and custom_note.strip():
        note_instruction = f"""

Custom Note from User:
"{custom_note}"

Please refine and rephrase this note professionally for inclusion in the bill. Make it concise and business-appropriate."""

    prompt = f"""You are YesBill, a smart billing assistant for Indian households. Analyse the monthly service data below and produce personalised, specific bill insights.

RULES:
- ALWAYS use the exact service name(s) given in the data — never say "your service" or "the service"
- ALWAYS include the specific numbers (days, percentages, amounts) in the summary
- Use vocabulary appropriate to the service type:
  • Home Delivery (tiffin, milk, newspaper, laundry, water cans): "delivered", "deliveries", "skipped days", "delivery rate"
  • Visit-Based (gym, clinic, yoga, classes): "visits", "attended", "missed", "attendance rate"
  • Utility (electricity, internet, gas, water board): "bill", "usage charge", "active billing"
  • Subscription/EMI/Rent: "subscription", "payment due", "monthly charge"
- ai_summary must be 1-2 sentences, factual, and mention specific numbers from the data
- recommendation must be 1 sentence, actionable, and reference the specific service(s) by name
- refined_note: if a custom note was provided, clean it up professionally; otherwise null

Billing Data:
{context}{note_instruction}

Example good output:
{{"ai_summary": "Your Morning Milk delivery had a 93% delivery rate in {month_name} — 28 out of 30 days delivered at ₹20/day, totalling ₹560. Dainik Bhaskar newspaper was delivered all 30 days (₹6/day = ₹180).", "recommendation": "Consider pre-scheduling your 2 Morning Milk skips online to avoid last-minute cancellations and ensure seamless billing.", "refined_note": null}}

Now produce output for the data above. Reply in JSON only — no markdown, no extra text:
{{"ai_summary": "...", "recommendation": "...", "refined_note": "... or null"}}"""

    ai_model_used = f"{provider}/{model}"
    logger.info("[BILL-LLM] provider=%s model=%s prompt=%d chars", provider, model, len(prompt))
    _t0 = time.monotonic()
    try:
        if provider == "openai":
            summary, rec, refined_note, _tok_in, _tok_out = await _call_openai(api_key, model, prompt)
        elif provider == "anthropic":
            summary, rec, refined_note, _tok_in, _tok_out = await _call_anthropic(api_key, model, prompt)
        elif provider == "google":
            summary, rec, refined_note, _tok_in, _tok_out = await _call_google(api_key, model, prompt)
        else:
            return "", "", None, custom_note
        _latency_ms = int((time.monotonic() - _t0) * 1000)
        _preview = summary[:80] + "..." if len(summary) > 80 else summary
        logger.info("[BILL-LLM] DONE — summary=%r took=%.1fs", _preview, time.monotonic() - _t0)
        # Save analytics for bill generation (best-effort, non-blocking)
        try:
            from app.services.pricing import calculate_cost
            _cost = calculate_cost(provider, model, _tok_in, _tok_out)
            import asyncio
            asyncio.ensure_future(
                supabase_service.save_message_analytics(
                    message_id=None,
                    user_id=user_id,
                    tokens_in=_tok_in,
                    tokens_out=_tok_out,
                    tokens_thinking=None,
                    cost_usd=_cost,
                    latency_ms=_latency_ms,
                    ttft_ms=None,
                    chunks_count=0,
                    model_used=ai_model_used,
                    feature="bill_gen",
                )
            )
        except Exception as _ae:
            logger.debug("[BILL-LLM] analytics save deferred: %s", _ae)
        return summary, rec, ai_model_used, refined_note
    except Exception as exc:
        logger.warning("[BILL-LLM] FAILED — provider=%s model=%s error=%s took=%.1fs",
                       provider, model, type(exc).__name__, time.monotonic() - _t0)
        return "", "", ai_model_used, custom_note


async def _call_openai(api_key: str, model: str, prompt: str) -> tuple[str, str, str | None, int, int]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            OPENAI_CHAT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 400,
            },
        )
        r.raise_for_status()
        data = r.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        usage = data.get("usage") or {}
        tokens_in = usage.get("prompt_tokens", 0)
        tokens_out = usage.get("completion_tokens", 0)
        summary, rec, refined_note = _parse_llm_response(content)
        return summary, rec, refined_note, tokens_in, tokens_out


async def _call_anthropic(api_key: str, model: str, prompt: str) -> tuple[str, str, str | None, int, int]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            ANTHROPIC_MESSAGES_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 400,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        r.raise_for_status()
        data = r.json()
        content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                content += block.get("text", "")
        usage = data.get("usage") or {}
        tokens_in = usage.get("input_tokens", 0)
        tokens_out = usage.get("output_tokens", 0)
        summary, rec, refined_note = _parse_llm_response(content)
        return summary, rec, refined_note, tokens_in, tokens_out


# Models using thinkingLevel (Gemini 3.x family)
_GOOGLE_THINKING_LEVEL_MODELS_BILL = {
    "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3-pro-preview"
}
# Models that cannot disable thinking (floor = "low")
_GOOGLE_NO_MINIMAL_MODELS_BILL = {"gemini-3.1-pro-preview", "gemini-3-pro-preview"}

async def _call_google(api_key: str, model: str, prompt: str) -> tuple[str, str, str | None, int, int]:
    url = GOOGLE_GENERATE_URL.format(model=model)
    # CRITICAL FIX: For Gemini 3.x level models, thinking tokens consume maxOutputTokens.
    # With maxOutputTokens=400 and ~200 thinking tokens → only ~200 remaining for JSON output.
    # For complex bills with many items the JSON can exceed 200 tokens → truncation.
    # Fix: 800 for level models (thinking ~50-300 + JSON ~200-400 = safe margin).
    _base_tokens = 800 if model in _GOOGLE_THINKING_LEVEL_MODELS_BILL else 400
    gen_config: dict = {"maxOutputTokens": _base_tokens}
    # Minimize thinking for bill insight generation — utility call, fast turnaround needed.
    # Gemini 2.5-flash: thinkingBudget=0 disables thinking entirely.
    # Gemini 2.5-pro: cannot disable thinking (min=512) — "Budget 0 is invalid" HTTP 400.
    # Gemini 3.x: must send explicit thinkingLevel — without it model defaults to HIGH thinking
    # (measured: 83.8s with no config vs ~5s with thinkingLevel='low').
    if "gemini-2.5" in model or "gemini-2-5" in model:
        # 2.5-pro requires min budget of 512; 2.5-flash/lite can disable with 0
        thinking_budget = 512 if "pro" in model else 0
        gen_config["thinkingConfig"] = {"thinkingBudget": thinking_budget}
    elif model in _GOOGLE_NO_MINIMAL_MODELS_BILL:
        # Cannot use 'minimal' — floor is 'low'
        gen_config["thinkingConfig"] = {"thinkingLevel": "low"}
    elif model in _GOOGLE_THINKING_LEVEL_MODELS_BILL:
        # gemini-3-flash-preview supports 'minimal' ≈ near-off
        gen_config["thinkingConfig"] = {"thinkingLevel": "minimal"}
    # Increased from 90s → 120s: Gemini 3.x with explicit thinkingLevel can still take 60-90s.
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{url}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": gen_config,
            },
        )
        r.raise_for_status()
        data = r.json()
        parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        # Filter out thought parts (thought=True) — only use actual response text.
        # Thought parts contaminate JSON parsing when included.
        content = "".join(p.get("text", "") for p in parts if not p.get("thought"))
        if not content:
            # Fallback: include all parts if only thought parts were returned
            content = "".join(p.get("text", "") for p in parts)
        usage = data.get("usageMetadata") or {}
        tokens_in = usage.get("promptTokenCount", 0)
        tokens_out = usage.get("candidatesTokenCount", 0)
        summary, rec, refined_note = _parse_llm_response(content)
        return summary, rec, refined_note, tokens_in, tokens_out

