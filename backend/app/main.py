# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Main FastAPI application."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.routers import auth, bills, ai_settings, chat

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ── Silence noisy third-party loggers ─────────────────────────────────────────
# httpx logs every Supabase/LLM HTTP request at INFO — suppress to WARNING
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
# uvicorn.access logs every inbound HTTP request — suppress to WARNING
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
# Keep yesbill.chat and yesbill.agent at INFO (LLM calls, tool calls, responses)
logging.getLogger("yesbill.chat").setLevel(logging.INFO)
logging.getLogger("yesbill.agent").setLevel(logging.INFO)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    print("\n" + "=" * 52)
    print("  YesBill API is running!")
    print("  API:     http://127.0.0.1:8000")
    print("  Docs:    http://127.0.0.1:8000/docs")
    print("  ReDoc:   http://127.0.0.1:8000/redoc")
    print("  OpenAPI: http://127.0.0.1:8000/openapi.json")
    print("=" * 52 + "\n")
    yield


# FastAPI app
app = FastAPI(
    title="YesBill API",
    description="Binary billing tracker with daily YES/NO marking",
    version="0.1.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "type": "validation_error",
            "title": "Validation Failed",
            "status": 400,
            "detail": str(exc),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "internal_error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected error occurred",
        },
    )


# Routers
app.include_router(auth.router)
app.include_router(bills.router)
app.include_router(ai_settings.router)
app.include_router(chat.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
    )

