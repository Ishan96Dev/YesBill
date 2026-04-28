# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""AI Settings schemas for request/response validation."""
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AISettingsBase(BaseModel):
    """Base AI settings schema."""
    provider: str = Field(default="openai", description="AI provider name (openai, anthropic, google, etc.)")
    selected_model: Optional[str] = Field(default="gpt-4o", description="Selected model ID")
    enable_insights: bool = Field(default=True, description="Whether AI insights are enabled")
    default_reasoning_effort: str = Field(default="none", description="Default reasoning effort for reasoning-capable models")


class AISettingsCreate(AISettingsBase):
    """Schema for creating/updating AI settings."""
    api_key: Optional[str] = Field(None, description="API key for the provider (not required for Ollama)")
    ollama_base_url: Optional[str] = Field(None, description="Base URL for local Ollama instance (e.g. http://localhost:11434)")


class AISettingsUpdate(BaseModel):
    """Schema for partial updates to AI settings."""
    api_key: Optional[str] = Field(None, min_length=1, description="API key for the provider")
    selected_model: Optional[str] = Field(None, description="Selected model ID")
    enable_insights: Optional[bool] = Field(None, description="Whether AI insights are enabled")
    default_reasoning_effort: Optional[str] = Field(None, description="Default reasoning effort for reasoning-capable models")
    ollama_base_url: Optional[str] = Field(None, description="Base URL for local Ollama instance")


class AISettingsResponse(AISettingsBase):
    """Response schema for AI settings."""
    id: str
    user_id: str
    api_key_masked: str = Field(description="Masked API key (only last 4 chars visible)")
    is_key_valid: bool = Field(default=False, description="Whether the API key has been validated")
    key_validated_at: Optional[datetime] = None
    ollama_base_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIKeyValidationRequest(BaseModel):
    """Request schema for validating an AI API key."""
    provider: str = Field(default="openai", description="AI provider to validate against")
    api_key: str = Field(..., min_length=1, description="API key to validate")


class AIKeyValidationResponse(BaseModel):
    """Response schema for key validation."""
    valid: bool
    provider: str
    message: str
    models_available: Optional[list] = None


class AIProviderInfo(BaseModel):
    """Info about an AI provider."""
    id: str
    name: str
    description: str
    logo_url: str
    models: list
    docs_url: str
    key_prefix: Optional[str] = Field(None, description="Expected key prefix for format validation")
    requires_key: bool = Field(default=True, description="Whether this provider requires an API key")

