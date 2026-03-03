# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Authentication routes using Supabase."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.email_service import send_account_deleted_email, send_password_changed_email
from app.services.supabase import supabase_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest) -> TokenResponse:
    """
    Register a new user with Supabase Auth.
    
    Supabase will handle:
    - Email validation
    - Password complexity requirements
    - Email confirmation (if enabled)
    - Duplicate email prevention
    """
    # Validate password match
    if request.password != request.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    # Sanitize inputs
    email = request.email.strip().lower()

    try:
        # Create user in Supabase
        result = await supabase_service.sign_up(email, request.password)
        
        if not result["user"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed"
            )
        
        # Get access token from Supabase session
        access_token = result["session"].access_token if result["session"] else None
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account created but verification required. Please check your email."
            )
        
        return TokenResponse(
            access_token=access_token,
            user_id=result["user"].id
        )
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Handle common Supabase errors
        if "already registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        elif "invalid email" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        elif "password" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password does not meet requirements (min 6 characters)"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {str(e)}"
            )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    """
    Login user with Supabase Auth.
    
    Returns a JWT token that can be used to access protected endpoints.
    """
    # Sanitize inputs
    email = request.email.strip().lower()

    try:
        # Authenticate with Supabase
        result = await supabase_service.sign_in(email, request.password)
        
        if not result["session"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return TokenResponse(
            access_token=result["access_token"],
            user_id=result["user"].id
        )
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Handle common Supabase errors
        if "invalid" in error_msg or "credentials" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        elif "email not confirmed" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please confirm your email before logging in"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {str(e)}"
            )


@router.post("/notify-password-change", status_code=status.HTTP_200_OK)
async def notify_password_change(user_id: str = Depends(get_current_user_id)):
    """
    Send a 'password changed' security notification email to the current user.

    Called by the frontend after a successful password update (Settings > Security
    or /auth/reset-password page).
    """
    try:
        profile = await supabase_service.get_user_profile(user_id)
        to_email = profile.get("email") if profile else None
        if not to_email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User email not found",
            )
        to_name = (
            profile.get("full_name") or profile.get("display_name") or "there"
        )
        await send_password_changed_email(
            to_email=to_email,
            to_name=to_name,
            changed_at=datetime.now(timezone.utc),
        )
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        # Non-fatal: email failure should not block the password change
        print(f"[Auth] notify-password-change error for {user_id}: {exc}")
        return {"ok": False, "detail": "Email notification failed"}


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(user_id: str = Depends(get_current_user_id)):
    """
    Permanently delete the current user's account.

    Steps:
    1. Fetch profile to get email + name for farewell email.
    2. Send account-deleted confirmation email.
    3. Hard-delete user from Supabase Auth (cascades DB rows via FK / RLS).
    """
    try:
        profile = await supabase_service.get_user_profile(user_id)
        to_email = profile.get("email") if profile else None
        to_name = (
            profile.get("full_name") or profile.get("display_name") or "there"
        )

        # Send farewell email before deletion (so we still have the user record)
        if to_email:
            await send_account_deleted_email(
                to_email=to_email,
                to_name=to_name,
                deleted_at=datetime.now(timezone.utc),
            )

        # Hard-delete via Supabase Admin API (service role client)
        supabase_service.client.auth.admin.delete_user(user_id)

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Auth] delete-account error for {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(exc)}",
        )

