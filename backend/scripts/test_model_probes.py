"""
Model Probe Diagnostic Script
Run from backend/ directory:  python scripts/test_model_probes.py

The script auto-loads API keys from Supabase (via SUPABASE_URL +
SUPABASE_SERVICE_ROLE_KEY in backend/.env).  You can override or
supplement with explicit env vars:
  set TEST_OPENAI_KEY=sk-...
  set TEST_ANTHROPIC_KEY=sk-ant-...
  set TEST_GOOGLE_KEY=AIza...

Tests every model in _FALLBACK_MODELS using the same probe logic as
chat_service.py, then reports which are available / unavailable / broken.
"""
import asyncio
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

# ── Force UTF-8 output so Windows doesn't throw charmap errors ────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import httpx

# ── Load backend/.env ──────────────────────────────────────────────────────────
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

# ── Provider probe endpoints (mirrors chat_service.py) ────────────────────────
OPENAI_MODEL_GET_URL = "https://api.openai.com/v1/models/{model}"
ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models"
GOOGLE_MODEL_GET_URL  = "https://generativelanguage.googleapis.com/v1beta/models/{model}"

# ── Model list (mirrors _FALLBACK_MODELS in chat_service.py) ──────────────────
MODELS = {
    "openai": ["gpt-5.2", "gpt-5", "gpt-4.1", "gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "google": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3-flash-preview"],
}


# ── Supabase key loader ────────────────────────────────────────────────────────

async def fetch_keys_from_supabase() -> dict[str, str]:
    """
    Query user_ai_settings via Supabase REST API using service role key.
    Returns {provider: api_key} for the first valid key found per provider.
    """
    base_url  = os.environ.get("SUPABASE_URL", "").rstrip("/")
    svc_key   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not base_url or not svc_key:
        return {}

    url = f"{base_url}/rest/v1/user_ai_settings"
    headers = {
        "apikey": svc_key,
        "Authorization": f"Bearer {svc_key}",
        "Content-Type": "application/json",
    }
    params = {
        "select": "provider,api_key_encrypted",
        "order": "updated_at.desc",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)
        if resp.status_code != 200:
            return {}
        rows = resp.json() if isinstance(resp.json(), list) else []
    except Exception:
        return {}

    keys: dict[str, str] = {}
    for row in rows:
        provider = (row.get("provider") or "").lower().strip()
        key = (row.get("api_key_encrypted") or "").strip()
        if provider and key and provider not in keys:
            keys[provider] = key
    return keys


# ── Helper functions ───────────────────────────────────────────────────────────

def _safe_json(resp: httpx.Response) -> dict:
    try:
        return resp.json()
    except Exception:
        return {}


def _provider_error_msg(resp: httpx.Response, default: str) -> str:
    payload = _safe_json(resp)
    err = payload.get("error")
    if isinstance(err, dict):
        msg = err.get("message")
        if msg:
            return str(msg)
    if isinstance(err, str) and err:
        return err
    return default


# ── Individual probe functions (same logic as chat_service.py) ────────────────

async def probe_openai(api_key: str, model: str) -> Tuple[str, str]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            OPENAI_MODEL_GET_URL.format(model=model),
            headers={"Authorization": f"Bearer {api_key}"},
        )
    code = resp.status_code
    if code == 200:
        return "available", "Model is available."
    if code in (400, 404, 422):
        return "unavailable", _provider_error_msg(resp, f"HTTP {code} - model unavailable.")
    if code == 403:
        return "unavailable", _provider_error_msg(resp, "No access to this model (403).")
    if code == 401:
        return "error", "Invalid OpenAI API key (401)."
    if code == 429:
        return "error", "Rate limit hit (429)."
    return "error", f"Unexpected HTTP {code}: {resp.text[:150]}"


async def probe_anthropic(api_key: str, model: str) -> Tuple[str, str]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            ANTHROPIC_MODELS_URL,
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
        )
    if resp.status_code == 200:
        data = _safe_json(resp)
        ids = {row.get("id") for row in data.get("data", []) if row.get("id")}
        if model in ids:
            return "available", "Model is available."
        sample = sorted(ids)[:8]
        return "unavailable", f"Not in account model list. Sample: {sample}"
    if resp.status_code == 401:
        return "error", "Invalid Anthropic API key (401)."
    if resp.status_code == 429:
        return "error", "Rate limit hit (429)."
    return "error", f"HTTP {resp.status_code}: {resp.text[:150]}"


_SAMPLE_TOOL = {
    "name": "get_services",
    "description": "List all services for the user",
    "parameters": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}


async def test_google_generation(api_key: str, model: str) -> Tuple[str, str]:
    """Minimal generation call (no tools) — mirrors _stream_google in chat_service.py."""
    # Test 1: non-streaming generateContent
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Say hi in one word"}]}],
        "system_instruction": {"parts": [{"text": "You are a helpful assistant."}]},
        "generationConfig": {"maxOutputTokens": 10},
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
        code = resp.status_code
        if code != 200:
            msg = _provider_error_msg(resp, f"HTTP {code}: {resp.text[:300]}")
            return "error", f"Plain generation failed ({code}): {msg}"
    except httpx.TimeoutException:
        return "error", "Generation timed out."
    except Exception as exc:
        return "error", f"{type(exc).__name__}: {exc}"

    # Test 2: streaming streamGenerateContent with alt=sse (exact backend format)
    stream_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={api_key}&alt=sse"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", stream_url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"role": "user", "parts": [{"text": "Say hi"}]}],
                    "system_instruction": {"parts": [{"text": "You are a helpful assistant."}]},
                    "generationConfig": {"maxOutputTokens": 10},
                },
            ) as resp:
                first_bytes = await resp.aread()
                code = resp.status_code
                if code != 200:
                    raw = first_bytes.decode("utf-8", errors="replace")[:300]
                    return "error", f"Streaming (alt=sse) failed ({code}): {raw}"
        return "available", "Plain generation + streaming (alt=sse) OK."
    except httpx.TimeoutException:
        return "error", "Streaming request timed out."
    except Exception as exc:
        return "error", f"{type(exc).__name__}: {exc}"


async def test_google_with_tools(api_key: str, model: str) -> Tuple[str, str]:
    """Generation call WITH function declarations — mirrors _call_google_with_tools in agent_service.py."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "List my services"}]}],
        "system_instruction": {"parts": [{"text": "You are a helpful assistant."}]},
        "tools": [{"function_declarations": [_SAMPLE_TOOL]}],
        "generationConfig": {"maxOutputTokens": 100},
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
        code = resp.status_code
        raw = resp.text[:400]
        if code == 200:
            return "available", "Tool-calling generation OK (200)."
        msg = _provider_error_msg(resp, f"HTTP {code}: {raw}")
        return "error", f"Tool-calling generation failed ({code}): {msg}"
    except httpx.TimeoutException:
        return "error", "Tool-calling generation timed out."
    except Exception as exc:
        return "error", f"{type(exc).__name__}: {exc}"


async def probe_google(api_key: str, model: str) -> Tuple[str, str]:
    model_path = model.replace("models/", "")
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            GOOGLE_MODEL_GET_URL.format(model=model_path),
            params={"key": api_key},
        )
    code = resp.status_code
    raw = resp.text[:300]

    if code == 200:
        return "available", "Model is available."
    if code == 404:
        return "unavailable", f"Model '{model_path}' not found (404)."
    if code == 403:
        return "unavailable", _provider_error_msg(resp, f"No access (403): {raw[:100]}")
    if code == 400:
        msg = _provider_error_msg(resp, f"HTTP 400: {raw}")
        msg_lower = msg.lower()
        # Google returns 400 INVALID_ARGUMENT for unknown/non-existent models
        if ("not found" in msg_lower or "does not exist" in msg_lower
                or "invalid argument" in msg_lower or "invalid_argument" in msg_lower):
            return "unavailable", f"Model not found (400 INVALID_ARGUMENT): {msg}"
        if "api key" in msg_lower or "api_key" in msg_lower or "invalid key" in msg_lower:
            return "error", f"API key issue (400): {msg}"
        return "error", f"Google 400 error: {msg}"
    if code == 401:
        return "error", "Invalid Google API key (401)."
    if code == 429:
        return "error", "Rate limit hit (429)."
    return "error", f"Unexpected HTTP {code}: {raw[:200]}"


# ── Main runner ────────────────────────────────────────────────────────────────

async def run():
    SEP = "=" * 65
    print(f"\n{SEP}")
    print("  YesBill Model Probe Diagnostic")
    print(SEP)

    # Priority: explicit TEST_* env vars > Supabase DB fetch
    explicit_keys = {
        "openai":    os.environ.get("TEST_OPENAI_KEY", "").strip(),
        "anthropic": os.environ.get("TEST_ANTHROPIC_KEY", "").strip(),
        "google":    os.environ.get("TEST_GOOGLE_KEY", "").strip(),
    }

    db_keys: dict[str, str] = {}
    if not all(explicit_keys.values()):
        print("\n  Fetching API keys from Supabase...")
        db_keys = await fetch_keys_from_supabase()
        if db_keys:
            print(f"  Found keys in DB for: {', '.join(sorted(db_keys.keys()))}")
        else:
            print("  Could not fetch from Supabase (check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)")

    # Merge: explicit overrides DB
    keys = {
        provider: explicit_keys.get(provider) or db_keys.get(provider) or ""
        for provider in ("openai", "anthropic", "google")
    }

    print()
    print("  API keys resolved:")
    for provider, key in keys.items():
        source = "explicit" if explicit_keys.get(provider) else ("supabase" if db_keys.get(provider) else "none")
        masked = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("(empty)" if not key else key)
        status = "[OK]" if key else "[--]"
        print(f"    {provider:12s}  {status}  {masked:30s}  (source: {source})")

    if not any(keys.values()):
        print()
        print("  ERROR: No API keys available. Either:")
        print("    1. Set TEST_* env vars:")
        print("       set TEST_OPENAI_KEY=sk-...")
        print("       set TEST_ANTHROPIC_KEY=sk-ant-...")
        print("       set TEST_GOOGLE_KEY=AIza...")
        print("    2. Or ensure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are in backend/.env")
        print()
        sys.exit(1)

    print()

    results = {"pass": 0, "fail": 0, "skip": 0}

    for provider, model_list in MODELS.items():
        api_key = keys[provider]
        print(f"-- {provider.upper()} " + "-" * (55 - len(provider)))

        if not api_key:
            for model in model_list:
                print(f"  SKIP     {model}")
                results["skip"] += 1
            print()
            continue

        for model in model_list:
            try:
                if provider == "openai":
                    status, message = await probe_openai(api_key, model)
                elif provider == "anthropic":
                    status, message = await probe_anthropic(api_key, model)
                else:
                    # For Google: probe + plain generation + tool-calling generation
                    status, message = await probe_google(api_key, model)
                    if status == "available":
                        gen_status, gen_msg = await test_google_generation(api_key, model)
                        if gen_status != "available":
                            status, message = gen_status, f"[probe OK] [plain FAIL] {gen_msg}"
                        else:
                            tool_status, tool_msg = await test_google_with_tools(api_key, model)
                            if tool_status != "available":
                                status, message = tool_status, f"[probe OK] [plain OK] [tools FAIL] {tool_msg}"
                            else:
                                message = "Probe + plain + tool-calling all OK."

                label = {
                    "available":   "PASS    ",
                    "unavailable": "NO_AVAIL",
                }.get(status, "ERROR   ")

                if status != "available":
                    results["fail"] += 1
                else:
                    results["pass"] += 1

                print(f"  {label} {model:<38s} {message[:100]}")

            except httpx.TimeoutException:
                print(f"  TIMEOUT  {model}  (20s timeout)")
                results["fail"] += 1
            except Exception as exc:
                print(f"  EXCEPT   {model}  {type(exc).__name__}: {exc}")
                results["fail"] += 1

        print()

    print(SEP)
    print(f"  Results: {results['pass']} passed | "
          f"{results['fail']} failed/unavailable | "
          f"{results['skip']} skipped (no key) | "
          f"{results['pass'] + results['fail'] + results['skip']} total")
    print(SEP)
    print()

    sys.exit(1 if results["fail"] > 0 else 0)


if __name__ == "__main__":
    asyncio.run(run())
