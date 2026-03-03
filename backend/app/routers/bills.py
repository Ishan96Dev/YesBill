# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Bill configuration, daily records, and AI-generated bill routes using Supabase."""
import os
from calendar import monthrange
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.core.config import settings
from app.core.security import get_current_user_id
from app.schemas.bills import (
    BillConfigCreate,
    BillConfigResponse,
    BillConfigUpdate,
    DailyRecordCreate,
    DailyRecordResponse,
    MonthlySummaryResponse,
    MonthlyQuery,
    GenerateBillRequest,
    MarkBillPaidRequest,
)
from app.services.supabase import supabase_service
from app.services.llm_bill_service import generate_bill_insights

router = APIRouter(prefix="/bills", tags=["bills"])


@router.post("/config", response_model=BillConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_bill_config(
    config: BillConfigCreate, user_id: str = Depends(get_current_user_id)
) -> dict:
    """
    Create bill configuration.
    
    Only one active config is allowed per user. The database constraint
    will automatically enforce this.
    """
    try:
        # Check if user already has an active config
        existing = await supabase_service.get_active_bill_config(user_id)
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active bill configuration already exists. Deactivate it first.",
            )

        # Create config
        result = await supabase_service.create_bill_config(
            user_id=user_id,
            daily_amount=float(config.daily_amount),
            currency=config.currency,
            start_date=config.start_date.isoformat()
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create config: {str(e)}"
        )


@router.get("/config", response_model=BillConfigResponse)
async def get_bill_config(user_id: str = Depends(get_current_user_id)) -> dict:
    """Get active bill configuration."""
    config = await supabase_service.get_active_bill_config(user_id)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active bill configuration found",
        )
    
    return config


@router.patch("/config/{config_id}", response_model=BillConfigResponse)
async def update_bill_config(
    config_id: str,
    config: BillConfigUpdate,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """
    Update bill configuration.
    
    Row Level Security ensures users can only update their own configs.
    """
    try:
        # Prepare update data (only include non-None fields)
        update_data = {}
        
        if config.daily_amount is not None:
            update_data["daily_amount"] = float(config.daily_amount)
        
        if config.currency is not None:
            update_data["currency"] = config.currency
        
        if config.active is not None:
            update_data["active"] = config.active
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = await supabase_service.update_bill_config(
            config_id=config_id,
            user_id=user_id,
            updates=update_data
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update config: {str(e)}"
        )


@router.post("/records", response_model=DailyRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_record(
    record: DailyRecordCreate, user_id: str = Depends(get_current_user_id)
) -> dict:
    """
    Mark a day as YES or NO.
    
    The amount is automatically calculated based on the status and bill config.
    Database trigger handles the calculation.
    """
    try:
        # Get active bill config
        config = await supabase_service.get_active_bill_config(user_id)
        
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active bill configuration found",
            )
        
        start_date = datetime.fromisoformat(config["start_date"]).date()

        # Validate date is not before start_date
        if record.date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Date cannot be before start date ({start_date})",
            )
        
        # Create daily record (Supabase will handle duplicate date check via UNIQUE constraint)
        result = await supabase_service.create_daily_record(
            user_id=user_id,
            bill_config_id=config["id"],
            date=record.date.isoformat(),
            status=record.status.value
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "already exists" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Record for this date already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create record: {str(e)}"
        )


@router.get("/records", response_model=list[DailyRecordResponse])
async def get_daily_records(
    year_month: str | None = None, user_id: str = Depends(get_current_user_id)
) -> list[dict]:
    """
    Get daily records, optionally filtered by month.
    
    If year_month is provided, returns records for that month only.
    Format: YYYY-MM (e.g., 2026-02)
    """
    if year_month:
        # Validate format
        query = MonthlyQuery(year_month=year_month)
        return await supabase_service.get_records_by_month(user_id, query.year_month)
    
    # If no filter, return all records (could be expensive for large datasets)
    # TODO: Add pagination for all records endpoint
    return await supabase_service.get_records_by_month(
        user_id,
        datetime.now().strftime("%Y-%m")  # Default to current month
    )


@router.get("/summary/{year_month}", response_model=MonthlySummaryResponse)
async def get_monthly_summary(
    year_month: str, user_id: str = Depends(get_current_user_id)
) -> MonthlySummaryResponse:
    """
    Calculate monthly summary for YES days.
    
    Uses the database function for efficient aggregation.
    Returns: total YES days, total amount, currency, and daily rate.
    """
    # Validate year_month format
    query = MonthlyQuery(year_month=year_month)
    
    # Get summary from database function
    summary = await supabase_service.get_monthly_summary(user_id, query.year_month)
    
    if not summary:
        # No records for this month - return zeros
        config = await supabase_service.get_active_bill_config(user_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active bill configuration found",
            )
        
        return MonthlySummaryResponse(
            year_month=year_month,
            total_yes_days=0,
            total_amount=0.00,
            currency=config["currency"],
            daily_rate=float(config["daily_amount"]),
        )
    
    return MonthlySummaryResponse(**summary)


# ─── Generated bills (AI) ─────────────────────────────────────────


def _build_bill_payload(
    year_month: str,
    services: list[dict],
    confirmations: list[dict],
    ai_summary: str,
    recommendation: str,
    ai_model_used: str | None,
    custom_note: str | None = None,
) -> tuple[dict, float, str]:
    """
    Build the full bill payload (for response and DB).
    Returns (payload, total_amount, bill_title).
    """
    year, month = map(int, year_month.split("-"))
    month_name = datetime(year, month, 1).strftime("%B %Y")
    _, days_in_month = monthrange(year, month)

    items = []
    total = 0.0
    for svc in services:
        sid = svc["id"]
        price = float(svc.get("price") or 0)
        delivery_type = svc.get("delivery_type", "home_delivery")
        confs = [c for c in confirmations if c.get("service_id") == sid]
        delivered = [c for c in confs if c.get("status") == "delivered"]
        skipped = [c for c in confs if c.get("status") == "skipped"]

        if delivery_type in ("subscription", "payment"):
            # Fixed charge regardless of tracking — always full price
            service_total = price
            total += service_total
            items.append({
                "service": svc.get("name", ""),
                "service_id": sid,
                "ratePerDay": price,
                "daysDelivered": 1,
                "daysSkipped": 0,
                "total": round(service_total, 2),
                "notes": "Fixed subscription charge" if delivery_type == "subscription" else "Fixed payment (EMI/Loan/Rent)",
                "datesDelivered": [],
                "datesSkipped": [],
                "deliveryType": delivery_type,
            })
        elif delivery_type == "utility":
            # Utility: full charge if any "delivered" confirmation exists this month
            any_confirmed = len(delivered) > 0
            service_total = price if any_confirmed else 0.0
            total += service_total
            items.append({
                "service": svc.get("name", ""),
                "service_id": sid,
                "ratePerDay": price,
                "daysDelivered": 1 if any_confirmed else 0,
                "daysSkipped": 0,
                "total": round(service_total, 2),
                "notes": "Monthly utility service" if any_confirmed else "Not marked as active this month",
                "datesDelivered": [],
                "datesSkipped": [],
                "deliveryType": delivery_type,
            })
        elif delivery_type == "visit_based":
            # Fixed monthly membership — attendance tracking is informational only
            dates_visited = sorted([c["date"] for c in delivered])
            dates_missed = sorted([c["date"] for c in skipped])
            service_total = price  # Always fixed monthly price
            total += service_total
            items.append({
                "service": svc.get("name", ""),
                "service_id": sid,
                "ratePerDay": price,
                "daysDelivered": len(delivered),
                "daysSkipped": len(skipped),
                "total": round(service_total, 2),
                "notes": (
                    f"{len(delivered)} visit(s) this month — fixed monthly membership"
                    if delivered else "No visits tracked — fixed monthly membership"
                ),
                "datesDelivered": dates_visited,
                "datesSkipped": dates_missed,
                "deliveryType": delivery_type,
            })
        else:
            # home_delivery: per-day billing
            dates_delivered = sorted([c["date"] for c in delivered])
            dates_skipped = sorted([c["date"] for c in skipped])
            service_total = sum(
                float(c.get("custom_amount") or c.get("service", {}).get("price") or price)
                for c in delivered
            )
            total += service_total
            items.append({
                "service": svc.get("name", ""),
                "service_id": sid,
                "ratePerDay": price,
                "daysDelivered": len(delivered),
                "daysSkipped": len(skipped),
                "total": round(service_total, 2),
                "notes": f"Skipped on {len(skipped)} day(s)" if skipped else "Delivered consistently",
                "datesDelivered": dates_delivered,
                "datesSkipped": dates_skipped,
                "deliveryType": delivery_type,
            })

    total_delivered = sum(i["daysDelivered"] for i in items)
    total_tracked = total_delivered + sum(i["daysSkipped"] for i in items)
    delivery_rate = round((total_delivered / total_tracked * 100), 1) if total_tracked else 0
    # Savings: e.g. skipped days * rate (simplified)
    savings = sum(
        (item["daysSkipped"] * item["ratePerDay"]) for item in items
    )

    # Determine service_role (provider if ALL services are provider, else consumer)
    service_roles = [svc.get("service_role", "consumer") for svc in services]
    bill_service_role = "provider" if all(r == "provider" for r in service_roles) else "consumer"

    # Client info — only for single-service provider bills
    client_info = None
    if bill_service_role == "provider" and len(services) == 1:
        svc = services[0]
        if svc.get("client_name"):
            client_info = {
                "name":    svc.get("client_name"),
                "phone":   svc.get("client_phone"),
                "email":   svc.get("client_email"),
                "address": svc.get("client_address"),
            }

    if len(services) == 1:
        bill_title = f"{services[0]['name']} ({month_name})"
    else:
        names = " & ".join(s["name"] for s in services)
        bill_title = f"{names} ({month_name})"

    payload = {
        "billTitle": bill_title,
        "month": month_name,
        "year_month": year_month,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "total": round(total, 2),
        "currency": "INR",
        "items": sorted(items, key=lambda x: -x["total"]),
        "insights": {
            "deliveryRate": delivery_rate,
            "totalDays": days_in_month,
            "servicesTracked": len(services),
            "savings": round(savings, 2),
            "recommendation": recommendation or "Keep tracking for better insights.",
        },
        "aiSummary": ai_summary or f"Your {month_name} bill totals ₹{total:.2f} across {len(services)} service(s).",
        "ai_model_used": ai_model_used,
        "customNote": custom_note,
        "service_role": bill_service_role,
        "client": client_info,
    }
    return payload, round(total, 2), bill_title


@router.post("/generate")
async def generate_bill(
    body: GenerateBillRequest,
    send_email: bool = Query(False, description="If true, email the bill after generation"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate a bill for the given month and services.
    Fetches services and calendar data from Supabase, calls LLM for insights,
    saves to generated_bills, and returns the full bill.
    Pass ?send_email=true to also dispatch an email notification (e.g. Generate Now flow).
    """
    services = await supabase_service.get_services_by_ids(user_id, body.service_ids)
    if len(services) != len(body.service_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more service IDs are invalid or not yours",
        )

    confirmations = await supabase_service.get_confirmations_for_month_services(
        user_id, body.year_month, body.service_ids
    )

    # Build item list for LLM
    year, month = map(int, body.year_month.split("-"))
    month_name = datetime(year, month, 1).strftime("%B %Y")
    items_for_llm = []
    total = 0.0
    for svc in services:
        sid = svc["id"]
        price = float(svc.get("price") or 0)
        delivery_type = svc.get("delivery_type", "home_delivery")
        confs = [c for c in confirmations if c.get("service_id") == sid]
        delivered = [c for c in confs if c.get("status") == "delivered"]
        skipped = [c for c in confs if c.get("status") == "skipped"]
        if delivery_type in ("subscription", "payment", "visit_based"):
            service_total = price  # Fixed monthly charge
        elif delivery_type == "utility":
            service_total = price if delivered else 0.0
        else:
            service_total = sum(
                float(c.get("custom_amount") or c.get("service", {}).get("price") or price)
                for c in delivered
            )
        total += service_total
        items_for_llm.append({
            "service": svc.get("name", ""),
            "icon": svc.get("icon", "package"),
            "schedule": svc.get("type", "daily"),
            "delivery_type": delivery_type,
            "days_delivered": len(delivered),
            "days_skipped": len(skipped),
            "total": service_total,
        })

    ai_summary, recommendation, ai_model_used, refined_note = await generate_bill_insights(
        user_id, month_name, items_for_llm, total, "INR", body.custom_note
    )

    payload, total_amount, bill_title = _build_bill_payload(
        body.year_month,
        services,
        confirmations,
        ai_summary,
        recommendation,
        ai_model_used,
        refined_note,
    )

    row = await supabase_service.insert_generated_bill(
        user_id=user_id,
        year_month=body.year_month,
        service_ids=body.service_ids,
        payload=payload,
        total_amount=total_amount,
        currency=payload.get("currency", "INR"),
        ai_model_used=ai_model_used,
        bill_title=bill_title,
        custom_note=refined_note,
    )

    payload["id"] = row["id"]

    # Notify user that bill was created
    if row:
        service_names = ", ".join(s.get("name", "") for s in services[:2])
        if len(services) > 2:
            service_names += f" +{len(services) - 2} more"
        await supabase_service.create_notification(
            user_id, "bill_added",
            f"Bill created: {bill_title}",
            f"₹{total_amount:.2f} for {month_name}" + (f" — {service_names}" if service_names else ""),
            {"path": "/bills"},
        )

    # Optional: send email immediately (used by the "Generate Now" modal)
    if send_email:
        try:
            profile = await supabase_service.get_user_profile(user_id)
            if profile:
                to_email = profile.get("email") or ""
                if to_email and profile.get("email_notifications", True):
                    email_sent = await _send_bill_email_via_edge(
                        to_email=to_email,
                        to_name=profile.get("display_name") or profile.get("full_name") or "there",
                        user_name=profile.get("display_name") or profile.get("full_name") or "there",
                        month=month_name,
                        total=total_amount,
                        currency=payload.get("currency", "INR"),
                        bill_title=bill_title,
                        services_count=len(services),
                        ai_summary=ai_summary,
                        recommendation=recommendation,
                        services=[{"name": i["service"], "total": i["total"]} for i in items_for_llm],
                    )
                    if email_sent and row:
                        await supabase_service.update_bill_email_sent(row["id"])
        except Exception as exc:
            # Email failure must not block bill response
            print(f"[BillsRouter] send_email failed: {exc}")

    return payload


@router.get("/generated")
async def list_generated_bills(user_id: str = Depends(get_current_user_id)):
    """List all generated bills for the current user (newest first)."""
    rows = await supabase_service.list_generated_bills(user_id)
    return [
        {
            "id": r["id"],
            "year_month": r["year_month"],
            "service_ids": r.get("service_ids") or [],
            "total_amount": float(r.get("total_amount") or 0),
            "currency": r.get("currency") or "INR",
            "ai_model_used": r.get("ai_model_used"),
            "created_at": r["created_at"],
            "bill_title": r.get("bill_title"),
            "custom_note": r.get("custom_note"),
            "payload": r.get("payload"),
            "auto_generated": r.get("auto_generated", False),
            "trigger_type": r.get("trigger_type", "manual"),
            "email_sent": r.get("email_sent", False),
            "pdf_url": r.get("pdf_url"),
            "is_paid": r.get("is_paid", False),
            "paid_at": r.get("paid_at"),
            "payment_method": r.get("payment_method"),
            "payment_note": r.get("payment_note"),
        }
        for r in rows
    ]


@router.get("/generated/month/{year_month}")
async def get_bills_for_month(
    year_month: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get all generated bills for a specific month (used by calendar for paid status)."""
    MonthlyQuery(year_month=year_month)
    bills = await supabase_service.get_bills_for_month(user_id, year_month)
    return [
        {
            "id": b["id"],
            "year_month": b["year_month"],
            "service_ids": b.get("service_ids") or [],
            "total_amount": float(b.get("total_amount") or 0),
            "currency": b.get("currency") or "INR",
            "bill_title": b.get("bill_title"),
            "is_paid": b.get("is_paid", False),
            "paid_at": b.get("paid_at"),
            "payment_method": b.get("payment_method"),
            "payment_note": b.get("payment_note"),
        }
        for b in bills
    ]


@router.get("/generated/{bill_id}")
async def get_generated_bill(
    bill_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a single generated bill by ID."""
    row = await supabase_service.get_generated_bill(bill_id, user_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found",
        )
    payload = row.get("payload") or {}
    payload["id"] = row["id"]
    return payload


@router.delete("/generated/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_generated_bill(
    bill_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a generated bill (with confirmation on frontend)."""
    deleted = await supabase_service.delete_generated_bill(bill_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found",
        )


@router.patch("/generated/{bill_id}/paid")
async def mark_bill_paid(
    bill_id: str,
    body: MarkBillPaidRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Mark or unmark a generated bill as paid."""
    result = await supabase_service.mark_bill_paid(
        bill_id, user_id, body.is_paid, body.payment_method, body.payment_note
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    # Notify on payment (not on un-marking)
    if body.is_paid:
        try:
            bill_title = result.get("bill_title") or result.get("year_month") or "Bill"
            amount = result.get("total_amount")
            amount_str = f" — ₹{amount:.2f}" if amount else ""
            await supabase_service.create_notification(
                user_id, "payment_recorded",
                "Payment Recorded",
                f"{bill_title}{amount_str} marked as paid",
                {"path": "/bills", "bill_id": bill_id},
            )
        except Exception:
            pass  # Notification failure must not block response

    return result


# ─── Auto Bill Generation (AI Agent) ─────────────────────────────────────────

def _user_today(tz_name: str) -> date:
    """Return the current date in the user's local timezone. Falls back to UTC."""
    try:
        return datetime.now(ZoneInfo(tz_name or "UTC")).date()
    except (ZoneInfoNotFoundError, KeyError):
        return date.today()

_SCHEDULER_SECRET = os.getenv("SCHEDULER_SECRET", "")

# Supabase project URL — used to call send-bill-email Edge Function
_SUPABASE_URL = settings.SUPABASE_URL
_SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY


async def _send_bill_email_via_edge(
    to_email: str,
    to_name: str,
    user_name: str,
    month: str,
    total: float,
    currency: str,
    bill_title: str,
    services_count: int,
    ai_summary: str,
    recommendation: str,
    services: list | None = None,
    pdf_url: str = "",
) -> bool:
    """
    Call the send-bill-email Supabase Edge Function to send a bill notification
    via Brevo SMTP. Returns True on success, False on failure.
    """
    if not _SUPABASE_URL:
        return False
    edge_url = f"{_SUPABASE_URL}/functions/v1/send-bill-email"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                edge_url,
                headers={
                    "Authorization": f"Bearer {_SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "to_email": to_email,
                    "to_name": to_name,
                    "user_name": user_name,
                    "month": month,
                    "total": total,
                    "currency": currency,
                    "bill_title": bill_title,
                    "services_count": services_count,
                    "ai_summary": ai_summary,
                    "recommendation": recommendation,
                    "pdf_url": pdf_url,
                    "services": services or [],
                },
            )
            print(f"[BillsRouter] Edge Function HTTP {resp.status_code} for {to_email}: {resp.text[:300]}")
            result = resp.json()
            return result.get("success", False)
    except Exception as exc:
        print(f"[BillsRouter] Edge Function email error for {to_email}: {exc}")
        return False


@router.post("/auto-generate")
async def auto_generate_bills(
    x_scheduler_secret: str = Header(default="", alias="X-Scheduler-Secret"),
):
    """
    AI Agent endpoint — auto-generates bills for all services whose billing date
    matches today in the user's local timezone.

    Runs every hour via cron (pg_cron / GitHub Actions / Render).
    Per-user timezone support: each user's 'today' is computed from their
    user_profiles.timezone, so the trigger fires at the correct local date.
    A duplicate-generation guard ensures only one auto-bill per user per month.

    Secured by X-Scheduler-Secret header (set SCHEDULER_SECRET in env).
    """
    if _SCHEDULER_SECRET and x_scheduler_secret != _SCHEDULER_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid scheduler secret")

    results = []

    try:
        # Get all active services across all users (no global date filter —
        # each user's date is computed individually below)
        all_services = await supabase_service.get_all_active_services_for_scheduler()

        # Group ALL services by user_id first
        user_service_map: dict[str, list] = {}
        for svc in all_services:
            uid = svc.get("user_id")
            if uid:
                user_service_map.setdefault(uid, []).append(svc)

        for user_id, all_user_services in user_service_map.items():
            try:
                # ── 1. Fetch profile (needed for timezone + email) ──────────────
                profile = await supabase_service.get_user_profile(user_id)
                user_tz = (profile or {}).get("timezone") or "UTC"

                # ── 2. Compute "today" in this user's local timezone ───────────
                user_today = _user_today(user_tz)
                today_day = user_today.day
                today_month = user_today.month
                year_month = user_today.strftime("%Y-%m")

                # ── 3. Filter this user's services that are due today ──────────
                services = []
                for svc in all_user_services:
                    svc_type = svc.get("type", "daily")
                    billing_day = svc.get("billing_day") or 1
                    billing_month_svc = svc.get("billing_month") or 1

                    if svc_type == "yearly":
                        if billing_month_svc == today_month and billing_day == today_day:
                            services.append(svc)
                    elif svc_type in ("monthly", "daily", "weekly"):
                        if billing_day == today_day:
                            services.append(svc)

                if not services:
                    continue  # No services due today for this user

                # ── 4. Duplicate guard — skip if already auto-generated ────────
                existing = await supabase_service.get_auto_bill_for_month(user_id, year_month)
                if existing:
                    results.append({
                        "user_id": user_id,
                        "skipped": True,
                        "reason": f"already auto-generated for {year_month}",
                    })
                    continue

                # ── 5. Build bill ──────────────────────────────────────────────
                service_ids = [s["id"] for s in services]
                month_name = datetime(user_today.year, today_month, 1).strftime("%B %Y")

                confirmations = await supabase_service.get_confirmations_for_month_services(
                    user_id, year_month, service_ids
                )

                items_for_llm = []
                for svc in services:
                    sid = svc["id"]
                    price = float(svc.get("price") or 0)
                    delivery_type = svc.get("delivery_type", "home_delivery")
                    confs = [c for c in confirmations if c.get("service_id") == sid]
                    delivered = [c for c in confs if c.get("status") == "delivered"]
                    skipped = [c for c in confs if c.get("status") == "skipped"]
                    if delivery_type in ("subscription", "payment", "visit_based"):
                        service_total = price  # Fixed monthly charge
                    elif delivery_type == "utility":
                        service_total = price if delivered else 0.0
                    else:
                        service_total = sum(
                            float(c.get("custom_amount") or price) for c in delivered
                        )
                    items_for_llm.append({
                        "service": svc.get("name", ""),
                        "icon": svc.get("icon", "package"),
                        "schedule": svc.get("type", "daily"),
                        "delivery_type": delivery_type,
                        "days_delivered": len(delivered),
                        "days_skipped": len(skipped),
                        "total": service_total,
                    })

                ai_summary, recommendation, ai_model_used, _ = await generate_bill_insights(
                    user_id, month_name, items_for_llm,
                    sum(i["total"] for i in items_for_llm), "INR"
                )

                payload, total_amount, bill_title = _build_bill_payload(
                    year_month, services, confirmations,
                    ai_summary, recommendation, ai_model_used
                )

                # ── 6. Save to DB ──────────────────────────────────────────────
                row = await supabase_service.insert_generated_bill(
                    user_id=user_id,
                    year_month=year_month,
                    service_ids=service_ids,
                    payload=payload,
                    total_amount=total_amount,
                    currency="INR",
                    ai_model_used=ai_model_used,
                    bill_title=bill_title,
                    auto_generated=True,
                    trigger_type="auto",
                )

                # ── 7. Notify user ─────────────────────────────────────────────
                if row:
                    await supabase_service.create_notification(
                        user_id, "bill_auto_generated",
                        f"Bill auto-generated: {bill_title}",
                        f"₹{total_amount:.2f} for {month_name}",
                        {"path": "/bills"},
                    )

                # ── 8. Send email ──────────────────────────────────────────────
                email_sent = False
                if profile:
                    to_email = profile.get("email") or ""
                    to_name = profile.get("display_name") or profile.get("full_name") or "there"
                    print(f"[AutoGenerate] user={user_id} tz={user_tz} today={user_today} to_email={to_email!r}")
                    if to_email and profile.get("email_notifications", True):
                        email_sent = await _send_bill_email_via_edge(
                            to_email=to_email,
                            to_name=to_name,
                            user_name=to_name,
                            month=month_name,
                            total=total_amount,
                            currency="₹",
                            bill_title=bill_title,
                            services_count=len(services),
                            ai_summary=ai_summary,
                            recommendation=recommendation,
                            services=[
                                {"name": item["service"], "total": item["total"]}
                                for item in items_for_llm
                            ],
                        )
                        if email_sent and row:
                            await supabase_service.update_bill_email_sent(row["id"])

                results.append({
                    "user_id": user_id,
                    "timezone": user_tz,
                    "user_today": user_today.isoformat(),
                    "bill_id": row["id"] if row else None,
                    "bill_title": bill_title,
                    "total_amount": total_amount,
                    "email_sent": email_sent,
                    "services": [s["name"] for s in services],
                })

                # ── Day-before warnings for services due tomorrow ──────────────
                tomorrow = user_today + timedelta(days=1)
                tomorrow_day = tomorrow.day
                tomorrow_month = tomorrow.month
                for svc in all_user_services:
                    svc_type = svc.get("type", "daily")
                    billing_day = svc.get("billing_day") or 1
                    billing_month_svc = svc.get("billing_month") or 1
                    due_tomorrow = (
                        (svc_type == "yearly" and billing_month_svc == tomorrow_month and billing_day == tomorrow_day)
                        or (svc_type in ("monthly", "daily", "weekly") and billing_day == tomorrow_day)
                    )
                    if due_tomorrow and svc.get("auto_generate_bill"):
                        await supabase_service.create_notification(
                            user_id, "bill_auto_warning",
                            f"Bill due tomorrow: {svc.get('name', 'Service')}",
                            f"₹{float(svc.get('price') or 0):.2f} will be auto-generated tomorrow",
                            {"path": "/bills"},
                        )

            except Exception as err:
                results.append({"user_id": user_id, "error": str(err)})

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scheduler error: {exc}")

    return {
        "triggered_at_utc": datetime.utcnow().isoformat(),
        "bills_generated": len([r for r in results if "bill_id" in r and r.get("bill_id")]),
        "skipped": len([r for r in results if r.get("skipped")]),
        "results": results,
    }

