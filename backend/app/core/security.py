# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Security utilities for JWT and authentication."""
from datetime import datetime, timedelta
from typing import Optional
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.services.supabase import supabase_service

security = HTTPBearer()
logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token (for custom backend tokens if needed).
    
    Note: Supabase handles its own JWT tokens. This is only for additional backend tokens.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token and extract user data.
    
    This verifies the token using Supabase's JWT secret and extracts the user_id.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials

    # 1) Primary path (authoritative): ask Supabase Auth to validate the token.
    # This avoids false 401s caused by local JWT decoding assumptions
    # (audience format, signing mode changes, etc.).
    try:
        user_id = await supabase_service.verify_token(token)
        if user_id:
            # Optional lightweight claims decode for convenience fields only.
            claims = jwt.get_unverified_claims(token)
            return {
                "user_id": user_id,
                "email": claims.get("email"),
                "role": claims.get("role", "authenticated"),
                "payload": claims,
            }
    except Exception as e:
        logger.warning("Supabase token introspection failed: %s", str(e))

    # 2) Fallback path: local JWT verification with tolerant audience handling.
    # Some tokens encode aud as array/string depending on issuer configuration.
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception

        role: str = payload.get("role") or "authenticated"
        if role not in ["authenticated", "anon"]:
            raise credentials_exception

        aud = payload.get("aud")
        if isinstance(aud, str):
            valid_aud = aud in ["authenticated", settings.SUPABASE_PROJECT_ID]
        elif isinstance(aud, list):
            valid_aud = (
                "authenticated" in aud or settings.SUPABASE_PROJECT_ID in aud
            )
        else:
            valid_aud = True

        if not valid_aud:
            raise credentials_exception

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": role,
            "payload": payload,
        }

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    token_data: dict = Depends(verify_supabase_token)
) -> str:
    """Extract current user ID from Supabase token."""
    return token_data["user_id"]


async def get_current_user(
    token_data: dict = Depends(verify_supabase_token)
) -> dict:
    """Get complete current user data from token."""
    return token_data

