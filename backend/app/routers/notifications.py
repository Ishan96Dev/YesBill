# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Push-notification device-token management."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator

from app.core.security import get_current_user_id
from app.services.supabase import supabase_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class DeviceTokenRegisterRequest(BaseModel):
    token: str
    platform: str = "android"

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        allowed = {"android", "ios", "web"}
        if v not in allowed:
            raise ValueError(f"platform must be one of {allowed}")
        return v

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("token must not be empty")
        return v.strip()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post(
    "/register-token",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Register a device push token for the current user",
)
async def register_device_token(
    body: DeviceTokenRegisterRequest,
    user_id: str = Depends(get_current_user_id),
) -> None:
    """
    Upsert an FCM or Web-Push token for the authenticated user.

    Called by:
    - Flutter app on startup (android/ios)
    - Next.js web app after push-permission is granted (web)

    The (user_id, token) unique constraint handles idempotent re-registration.
    """
    try:
        supabase_service.client.table("device_tokens").upsert(
            {
                "user_id": user_id,
                "token": body.token,
                "platform": body.platform,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="user_id,token",
        ).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register token: {exc}",
        ) from exc


@router.delete(
    "/unregister-token",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a device push token (e.g. on sign-out)",
)
async def unregister_device_token(
    token: str,
    user_id: str = Depends(get_current_user_id),
) -> None:
    """Delete a specific token for the current user."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="token query param is required",
        )
    try:
        supabase_service.client.table("device_tokens").delete().eq(
            "user_id", user_id
        ).eq("token", token.strip()).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unregister token: {exc}",
        ) from exc
