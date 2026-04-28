# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""AI Settings routes for managing AI provider configurations."""
from datetime import datetime, timezone

from typing import Optional

import httpx
import asyncio
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.core.security import get_current_user_id
from app.schemas.ai_settings import (
    AISettingsCreate,
    AISettingsUpdate,
    AISettingsResponse,
    AIKeyValidationRequest,
    AIKeyValidationResponse,
    AIProviderInfo,
)
from app.services.supabase import supabase_service
from app.services.chat_service import run_model_probe_suite

router = APIRouter(prefix="/ai", tags=["ai-settings"])

# ── Provider & Model Registry ─────────────────────────────────────
AI_PROVIDERS = {
    "openai": {
        "id": "openai",
        "name": "OpenAI",
        "description": "GPT models for text generation, analysis, and insights",
        "logo_url": "/assets/icons/openai.png",
        "docs_url": "https://platform.openai.com/api-keys",
        "key_prefix": "sk-",
        "requires_key": True,
        "models": [
            {
                "id": "gpt-5.5",
                "name": "GPT-5.5",
                "description": "Flagship model, April 2026",
                "recommended": True,
            },
            {
                "id": "gpt-5.4",
                "name": "GPT-5.4",
                "description": "Advanced reasoning, March 2026",
                "recommended": False,
            },
            {
                "id": "gpt-5.2",
                "name": "GPT-5.2",
                "description": "Context: 400,000",
                "recommended": False,
            },
            {
                "id": "gpt-5.1",
                "name": "GPT-5.1",
                "description": "Context: 400,000",
                "recommended": False,
            },
            {
                "id": "gpt-5",
                "name": "GPT-5",
                "description": "Context: 400,000",
                "recommended": False,
            },
            {
                "id": "gpt-5.4-mini",
                "name": "GPT-5.4 Mini",
                "description": "Context: 128,000",
                "recommended": False,
            },
            {
                "id": "gpt-5.4-nano",
                "name": "GPT-5.4 Nano",
                "description": "Context: 64,000",
                "recommended": False,
            },
            {
                "id": "gpt-5-mini",
                "name": "GPT-5 Mini",
                "description": "Context: 128,000",
                "recommended": False,
            },
            {
                "id": "gpt-5-nano",
                "name": "GPT-5 Nano",
                "description": "Context: 64,000",
                "recommended": False,
            },
            {
                "id": "o1",
                "name": "o1",
                "description": "Advanced reasoning",
                "recommended": False,
            },
        ],
    },
    "anthropic": {
        "id": "anthropic",
        "name": "Anthropic",
        "description": "Claude models for safe, helpful AI assistance",
        "logo_url": "/assets/icons/anthropic.png",
        "docs_url": "https://console.anthropic.com/settings/keys",
        "key_prefix": "sk-ant-",
        "requires_key": True,
        "models": [
            {
                "id": "claude-sonnet-4-20250514",
                "name": "Claude Sonnet 4",
                "description": "Best balance of speed and intelligence",
                "recommended": True,
            },
            {
                "id": "claude-3-5-haiku-20241022",
                "name": "Claude 3.5 Haiku",
                "description": "Fastest and most compact",
                "recommended": False,
            },
        ],
    },
    "google": {
        "id": "google",
        "name": "Google AI",
        "description": "Gemini models for multimodal AI capabilities",
        "logo_url": "/assets/icons/google-ai.png",
        "docs_url": "https://aistudio.google.com/apikey",
        "key_prefix": "AI",
        "requires_key": True,
        "models": [
            {
                "id": "gemini-2.0-flash",
                "name": "Gemini 2.0 Flash",
                "description": "Fast multimodal model",
                "recommended": True,
            },
            {
                "id": "gemini-1.5-pro",
                "name": "Gemini 1.5 Pro",
                "description": "Best for complex tasks",
                "recommended": False,
            },
        ],
    },
    "ollama": {
        "id": "ollama",
        "name": "Ollama",
        "description": "Run local AI models on your own machine — no API key required",
        "logo_url": "/assets/icons/ollama.png",
        "docs_url": "https://ollama.com",
        "key_prefix": None,
        "requires_key": False,
        "models": [],  # Populated dynamically from the user's Ollama instance
    },
}


def _mask_api_key(key: str) -> str:
    """Mask an API key, showing only the last 4 characters."""
    if not key or len(key) < 8:
        return "****"
    return f"{'*' * (len(key) - 4)}{key[-4:]}"


def _format_settings_response(record: dict) -> dict:
    """Format a DB record into an AISettingsResponse-compatible dict."""
    return {
        "id": record["id"],
        "user_id": record["user_id"],
        "provider": record["provider"],
        "selected_model": record.get("selected_model", "gpt-4o"),
        "enable_insights": record.get("enable_insights", True),
        "default_reasoning_effort": record.get("default_reasoning_effort", "none"),
        "api_key_masked": _mask_api_key(record.get("api_key_encrypted", "")),
        "is_key_valid": record.get("is_key_valid", False),
        "key_validated_at": record.get("key_validated_at"),
        "ollama_base_url": record.get("ollama_base_url"),
        "created_at": record["created_at"],
        "updated_at": record["updated_at"],
    }


# ── Endpoints ──────────────────────────────────────────────────────


@router.get("/providers", response_model=list[AIProviderInfo])
async def get_providers():
    """Get all available AI providers and their models, read from the ai_models DB table."""
    db_models = await supabase_service.get_ai_models(include_deprecated=False)

    models_by_provider: dict[str, list] = {}
    for m in db_models:
        pid = m["provider_id"]
        models_by_provider.setdefault(pid, []).append(
            {
                "id": m["id"],
                "name": m["label"],
                "description": (
                    f"Context: {m['context_window']:,}"
                    if m.get("context_window")
                    else ("Preview model" if m.get("is_preview") else "")
                ),
                "recommended": m.get("sort_order", 99) <= 10,
                "is_preview": bool(m.get("is_preview", False)),
                "is_deprecated": bool(m.get("is_deprecated", False)),
                "reasoning_supported": bool(m.get("reasoning_supported", False)),
                "reasoning_label": m.get("reasoning_label") or "Reasoning support",
            }
        )

    result = []
    for pid, static in AI_PROVIDERS.items():
        provider = dict(static)
        if pid in models_by_provider:
            provider["models"] = models_by_provider[pid]
        else:
            provider["models"] = [
                {
                    **m,
                    "is_preview": bool(m.get("is_preview", False)),
                    "is_deprecated": False,
                    "reasoning_supported": bool(m.get("reasoning_supported", False)),
                    "reasoning_label": m.get("reasoning_label") or "Reasoning support",
                }
                for m in provider.get("models", [])
            ]
        provider["models"] = [m for m in provider.get("models", []) if not m.get("is_deprecated", False)]
        result.append(provider)

    return result


@router.get("/ollama/models")
async def get_ollama_models(
    base_url: str = Query(default="http://localhost:11434"),
    user_id: str = Depends(get_current_user_id),
):
    """Proxy request to the user's local Ollama instance to list available models.
    SSRF-safe: only http/https schemes are allowed.
    """
    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base URL scheme — only http and https are allowed",
        )
    tags_url = f"{base_url.rstrip('/')}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(tags_url)
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail=f"Cannot connect to Ollama at {base_url}. Is it running?")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama connection timed out")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Ollama returned {resp.status_code}")
    data = resp.json()
    models = [m["name"] for m in data.get("models", []) if m.get("name")]
    return {"models": models}


@router.get("/settings", response_model=list[AISettingsResponse])
async def get_all_settings(user_id: str = Depends(get_current_user_id)):
    """Get all AI settings for the current user."""
    records = await supabase_service.get_all_ai_settings(user_id)
    return [_format_settings_response(r) for r in records]


@router.get("/settings/{provider}", response_model=AISettingsResponse)
async def get_settings(provider: str, user_id: str = Depends(get_current_user_id)):
    """Get AI settings for a specific provider."""
    if provider not in AI_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}. Available: {list(AI_PROVIDERS.keys())}",
        )

    record = await supabase_service.get_ai_settings(user_id, provider)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI settings found for provider: {provider}",
        )
    return _format_settings_response(record)


@router.post("/settings", response_model=AISettingsResponse, status_code=status.HTTP_201_CREATED)
async def save_settings(
    settings: AISettingsCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create or update AI settings for a provider (upsert)."""
    provider = settings.provider.lower()
    if provider not in AI_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}",
        )

    # ── Ollama: no API key, dynamic models, store base_url ─────────────────────
    if provider == "ollama":
        if not settings.selected_model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="selected_model is required for Ollama",
            )
        ollama_base_url = (settings.ollama_base_url or "http://localhost:11434").rstrip("/")
        try:
            record = await supabase_service.upsert_ai_settings(
                user_id=user_id,
                provider=provider,
                api_key_encrypted="",  # no key for local provider
                selected_model=settings.selected_model,
                enable_insights=settings.enable_insights,
                default_reasoning_effort=settings.default_reasoning_effort or "none",
                is_key_valid=True,  # no key to validate
                ollama_base_url=ollama_base_url,
            )
            return _format_settings_response(record)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save AI settings: {str(e)}",
            )

    # ── Cloud providers: API key required ──────────────────────────────────────
    if not settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"api_key is required for provider: {provider}",
        )

    provider_info = AI_PROVIDERS[provider]
    provider_models = await supabase_service.get_ai_models_for_provider(provider, include_deprecated=True)
    active_model_ids = {m["id"] for m in provider_models if not m.get("is_deprecated", False)}
    deprecated_model_ids = {m["id"] for m in provider_models if m.get("is_deprecated", False)}

    if settings.selected_model in deprecated_model_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model '{settings.selected_model}' is deprecated and cannot be selected.",
        )

    if settings.selected_model and active_model_ids and settings.selected_model not in active_model_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model '{settings.selected_model}' for provider '{provider}'.",
        )

    # Use first active DB model as default if none specified
    default_model = settings.selected_model
    if not default_model:
        active_models = [m for m in provider_models if not m.get("is_deprecated", False)]
        default_model = active_models[0]["id"] if active_models else provider_info["models"][0]["id"]

    try:
        record = await supabase_service.upsert_ai_settings(
            user_id=user_id,
            provider=provider,
            api_key_encrypted=settings.api_key,
            selected_model=default_model,
            enable_insights=settings.enable_insights,
            default_reasoning_effort=settings.default_reasoning_effort or "none",
        )
        # Fire-and-forget probe so save response is instant
        asyncio.create_task(
            run_model_probe_suite(user_id=user_id, provider_filter=provider, force_refresh=True)
        )

        return _format_settings_response(record)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save AI settings: {str(e)}",
        )


@router.patch("/settings/{provider}", response_model=AISettingsResponse)
async def update_settings(
    provider: str,
    updates: AISettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Partially update AI settings for a provider."""
    if provider not in AI_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}",
        )

    existing = await supabase_service.get_ai_settings(user_id, provider)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI settings found for provider: {provider}. Create them first.",
        )

    # Build update data from non-None fields
    selected_model = updates.selected_model if updates.selected_model is not None else existing.get("selected_model", "")
    enable_insights = updates.enable_insights if updates.enable_insights is not None else existing.get("enable_insights", True)
    default_reasoning_effort = updates.default_reasoning_effort if updates.default_reasoning_effort is not None else existing.get("default_reasoning_effort", "none")

    # ── Ollama PATCH: update base_url and/or model only ────────────────────────
    if provider == "ollama":
        ollama_base_url = (updates.ollama_base_url or existing.get("ollama_base_url") or "http://localhost:11434").rstrip("/")
        try:
            record = await supabase_service.upsert_ai_settings(
                user_id=user_id,
                provider=provider,
                api_key_encrypted="",
                selected_model=selected_model,
                enable_insights=enable_insights,
                default_reasoning_effort=default_reasoning_effort,
                is_key_valid=True,
                ollama_base_url=ollama_base_url,
            )
            return _format_settings_response(record)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update AI settings: {str(e)}",
            )

    # ── Cloud providers PATCH ──────────────────────────────────────────────────
    api_key = updates.api_key if updates.api_key is not None else existing.get("api_key_encrypted", "")
    is_key_valid = existing.get("is_key_valid", False)

    provider_models = await supabase_service.get_ai_models_for_provider(provider, include_deprecated=True)
    active_model_ids = {m["id"] for m in provider_models if not m.get("is_deprecated", False)}
    deprecated_model_ids = {m["id"] for m in provider_models if m.get("is_deprecated", False)}

    if selected_model in deprecated_model_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model '{selected_model}' is deprecated and cannot be selected.",
        )

    if selected_model and active_model_ids and selected_model not in active_model_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model '{selected_model}' for provider '{provider}'.",
        )

    # If api_key changed, reset validation
    if updates.api_key is not None and updates.api_key != existing.get("api_key_encrypted"):
        is_key_valid = False

    try:
        record = await supabase_service.upsert_ai_settings(
            user_id=user_id,
            provider=provider,
            api_key_encrypted=api_key,
            selected_model=selected_model,
            enable_insights=enable_insights,
            default_reasoning_effort=default_reasoning_effort,
            is_key_valid=is_key_valid,
        )

        # Fire-and-forget probe so update response is instant
        asyncio.create_task(
            run_model_probe_suite(user_id=user_id, provider_filter=provider, force_refresh=True)
        )

        return _format_settings_response(record)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update AI settings: {str(e)}",
        )


@router.delete("/settings/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_settings(
    provider: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete AI settings for a provider."""
    deleted = await supabase_service.delete_ai_settings(user_id, provider)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI settings found for provider: {provider}",
        )


async def _get_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Try to extract user_id from JWT but don't fail if missing."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        from jose import jwt
        from app.core.config import settings
        token = authorization.split(" ", 1)[1]
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload.get("sub")
    except Exception:
        return None


@router.post("/validate-key", response_model=AIKeyValidationResponse)
async def validate_api_key(
    request: AIKeyValidationRequest,
    user_id: Optional[str] = Depends(_get_optional_user_id),
):
    """
    Validate an AI provider API key.

    Performs:
    1. Format validation (correct prefix, length)
    2. Live API call to verify the key works
    3. Updates validation status in DB
    """
    provider = request.provider.lower()
    api_key = request.api_key.strip()

    if provider not in AI_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}",
        )

    # ── 1. Format validation ──
    if not api_key:
        return AIKeyValidationResponse(
            valid=False,
            provider=provider,
            message="API key cannot be empty",
        )

    if provider == "openai":
        if not api_key.startswith("sk-"):
            return AIKeyValidationResponse(
                valid=False,
                provider=provider,
                message="Invalid OpenAI key format. OpenAI keys start with 'sk-'",
            )
        if len(api_key) < 20:
            return AIKeyValidationResponse(
                valid=False,
                provider=provider,
                message="API key is too short. Please check your key.",
            )

    elif provider == "anthropic":
        if not api_key.startswith("sk-ant-"):
            return AIKeyValidationResponse(
                valid=False,
                provider=provider,
                message="Invalid Anthropic key format. Anthropic keys start with 'sk-ant-'",
            )

    elif provider == "google":
        if len(api_key) < 10:
            return AIKeyValidationResponse(
                valid=False,
                provider=provider,
                message="API key is too short. Please check your key.",
            )

    # ── 2. Live API validation ──
    try:
        is_valid = False
        models_available = []
        message = ""

        if provider == "openai":
            is_valid, message, models_available = await _validate_openai_key(api_key)
        elif provider == "anthropic":
            is_valid, message, models_available = await _validate_anthropic_key(api_key)
        elif provider == "google":
            is_valid, message, models_available = await _validate_google_key(api_key)
        else:
            message = f"Live validation not yet supported for {provider}"
            is_valid = True  # Allow by default for unknown providers

        # ── 3. Update DB validation status (best-effort, requires auth) ──
        if user_id:
            try:
                now = datetime.now(timezone.utc).isoformat()
                await supabase_service.update_ai_key_validation(
                    user_id=user_id,
                    provider=provider,
                    is_valid=is_valid,
                    validated_at=now,
                )
            except Exception:
                pass  # DB update is optional

        return AIKeyValidationResponse(
            valid=is_valid,
            provider=provider,
            message=message,
            models_available=models_available if models_available else None,
        )

    except Exception as e:
        return AIKeyValidationResponse(
            valid=False,
            provider=provider,
            message=f"Validation failed: {str(e)}",
        )


# ── Provider-specific validation helpers ───────────────────────────


async def _validate_openai_key(api_key: str) -> tuple[bool, str, list]:
    """Validate an OpenAI API key by calling the models endpoint."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )

        if response.status_code == 200:
            data = response.json()
            model_ids = [m["id"] for m in data.get("data", [])]
            # Return broad model discovery (new + old), not only legacy gpt-4 / gpt-3.5 IDs.
            relevant = [
                m for m in model_ids
                if any(token in m.lower() for token in ["gpt", "o1", "o3", "omni"])
            ] or model_ids
            return True, "API key is valid and active", relevant[:25]

        elif response.status_code == 401:
            return False, "Invalid API key. Please check your key and try again.", []

        elif response.status_code == 429:
            return False, "API key is valid but rate limited. Try again later.", []

        elif response.status_code == 403:
            return False, "API key is valid but does not have access. Check your OpenAI plan.", []

        else:
            return False, f"Unexpected response from OpenAI (status {response.status_code})", []

    except httpx.TimeoutException:
        return False, "Connection to OpenAI timed out. Please try again.", []
    except Exception as e:
        return False, f"Failed to connect to OpenAI: {str(e)}", []


async def _validate_anthropic_key(api_key: str) -> tuple[bool, str, list]:
    """Validate an Anthropic API key."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://api.anthropic.com/v1/models",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
            )

        if response.status_code in (200, 201):
            data = response.json()
            models = [m.get("id") for m in data.get("data", []) if m.get("id")]
            return True, "API key is valid and active", models[:25]
        elif response.status_code == 401:
            return False, "Invalid Anthropic API key.", []
        elif response.status_code == 429:
            # Rate limited but key is valid
            return True, "API key is valid (rate limited, try again later)", []
        else:
            return False, f"Unexpected response from Anthropic (status {response.status_code})", []

    except httpx.TimeoutException:
        return False, "Connection to Anthropic timed out. Please try again.", []
    except Exception as e:
        return False, f"Failed to connect to Anthropic: {str(e)}", []


async def _validate_google_key(api_key: str) -> tuple[bool, str, list]:
    """Validate a Google AI API key."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            )

        if response.status_code == 200:
            data = response.json()
            model_ids = [
                m.get("name", "").replace("models/", "")
                for m in data.get("models", [])
                if "gemini" in m.get("name", "").lower()
            ]
            return True, "API key is valid and active", model_ids[:10]
        elif response.status_code == 400:
            return False, "Invalid Google AI API key.", []
        elif response.status_code == 403:
            return False, "API key does not have permission. Check your Google AI Studio settings.", []
        else:
            return False, f"Unexpected response from Google AI (status {response.status_code})", []

    except httpx.TimeoutException:
        return False, "Connection to Google AI timed out. Please try again.", []
    except Exception as e:
        return False, f"Failed to connect to Google AI: {str(e)}", []

