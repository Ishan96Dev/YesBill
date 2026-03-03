# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Bill configuration and daily records schemas."""
from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class DailyStatus(str, Enum):
    """Daily status enum."""

    YES = "YES"
    NO = "NO"


class BillConfigCreate(BaseModel):
    """Create bill configuration schema."""

    daily_amount: Decimal = Field(gt=0, lt=1_000_000, decimal_places=2)
    currency: str = Field(min_length=3, max_length=3)
    start_date: date

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency code."""
        return v.upper().strip()

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, v: date) -> date:
        """Ensure start date is not in future."""
        if v > date.today():
            raise ValueError("Start date cannot be in the future")
        return v


class BillConfigUpdate(BaseModel):
    """Update bill configuration schema."""

    daily_amount: Decimal | None = Field(None, gt=0, lt=1_000_000, decimal_places=2)
    currency: str | None = Field(None, min_length=3, max_length=3)
    active: bool | None = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str | None) -> str | None:
        """Validate currency code."""
        return v.upper().strip() if v else None


class BillConfigResponse(BaseModel):
    """Bill configuration response schema."""

    id: str
    user: str
    daily_amount: float
    currency: str
    start_date: date
    active: bool
    created: str
    updated: str


class DailyRecordCreate(BaseModel):
    """Create daily record schema."""

    date: date
    status: DailyStatus

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        """Ensure date is not in future."""
        if v > date.today():
            raise ValueError("Date cannot be in the future")
        return v


class DailyRecordResponse(BaseModel):
    """Daily record response schema."""

    id: str
    user: str
    date: date
    status: DailyStatus
    amount: float
    created: str


class MonthlyQuery(BaseModel):
    """Monthly query validation schema."""

    year_month: str = Field(pattern=r"^\d{4}-\d{2}$")

    @field_validator("year_month")
    @classmethod
    def validate_year_month(cls, v: str) -> str:
        """Validate YYYY-MM format."""
        try:
            year, month = map(int, v.split("-"))
            if not (1 <= month <= 12):
                raise ValueError("Month must be between 01 and 12")
            if year < 2000 or year > 2100:
                raise ValueError("Year must be between 2000 and 2100")
        except (ValueError, AttributeError):
            raise ValueError("Invalid year-month format. Use YYYY-MM")
        return v


class MonthlySummaryResponse(BaseModel):
    """Monthly summary response schema."""

    year_month: str
    total_yes_days: int
    total_amount: float
    currency: str
    daily_rate: float


# ─── Generated bill (AI) schemas ─────────────────────────────────────


class GenerateBillRequest(BaseModel):
    """Request to generate a bill for a month and selected services."""

    year_month: str = Field(pattern=r"^\d{4}-\d{2}$", description="YYYY-MM")
    service_ids: list[str] = Field(min_length=1, description="At least one service UUID")
    custom_note: str | None = Field(None, max_length=500, description="Optional custom note for the bill")

    @field_validator("year_month")
    @classmethod
    def validate_year_month(cls, v: str) -> str:
        year, month = map(int, v.split("-"))
        if not (1 <= month <= 12):
            raise ValueError("Month must be 01-12")
        if year < 2000 or year > 2100:
            raise ValueError("Year must be 2000-2100")
        return v


class BillItemSchema(BaseModel):
    """One line item in a generated bill (per service)."""

    service: str
    service_id: str
    rate_per_day: float
    days_delivered: int
    days_skipped: int
    total: float
    notes: str
    dates_delivered: list[str] = Field(default_factory=list)
    dates_skipped: list[str] = Field(default_factory=list)


class BillInsightsSchema(BaseModel):
    """Insights block in generated bill."""

    delivery_rate: float
    total_days: int
    services_tracked: int
    savings: float
    recommendation: str


class GenerateBillResponse(BaseModel):
    """Full generated bill (API response and stored payload)."""

    id: str | None = None
    month: str
    year_month: str
    generated_at: str
    total: float
    currency: str
    items: list[BillItemSchema]
    insights: BillInsightsSchema
    ai_summary: str
    ai_model_used: str | None = None
    custom_note: str | None = None


class GeneratedBillListItem(BaseModel):
    """Summary for Previous Bills list."""

    id: str
    year_month: str
    service_ids: list[str]
    total_amount: float
    currency: str
    ai_model_used: str | None
    created_at: str
    payload: dict | None = None
    is_paid: bool = False
    paid_at: str | None = None
    payment_method: str | None = None
    payment_note: str | None = None


class MarkBillPaidRequest(BaseModel):
    """Request body for marking a bill as paid/unpaid."""

    is_paid: bool
    payment_method: str | None = None
    payment_note: str | None = Field(None, max_length=300)

