# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Supabase client service for YesBill backend."""
import logging
from calendar import monthrange
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from postgrest.exceptions import APIError
from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


def _next_month(year_month: str) -> str:
    """Return the ISO date string for the first day of the month after 'YYYY-MM'."""
    year, month = int(year_month[:4]), int(year_month[5:7])
    if month == 12:
        return f"{year + 1}-01-01"
    return f"{year}-{month + 1:02d}-01"


class SupabaseService:
    """Supabase service for database operations."""

    def __init__(self):
        """Initialize Supabase client."""
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY  # Use service role for backend operations
        )

    # ============================================================
    # Authentication Methods
    # ============================================================

    async def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        """
        Register a new user.

        Args:
            email: User's email address
            password: User's password

        Returns:
            Dict containing user data and session

        Raises:
            Exception: If signup fails
        """
        try:
            response = self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if not response.user:
                raise Exception("User creation failed")
            
            return {
                "user": response.user,
                "session": response.session
            }
        except Exception as e:
            raise Exception(f"Signup failed: {str(e)}")

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in an existing user.

        Args:
            email: User's email address
            password: User's password

        Returns:
            Dict containing user data and session

        Raises:
            Exception: If signin fails
        """
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not response.user or not response.session:
                raise Exception("Invalid credentials")
            
            return {
                "user": response.user,
                "session": response.session,
                "access_token": response.session.access_token
            }
        except Exception as e:
            raise Exception(f"Signin failed: {str(e)}")

    async def verify_token(self, token: str) -> Optional[str]:
        """
        Verify JWT token and extract user_id.

        Args:
            token: JWT access token

        Returns:
            User ID if valid, None otherwise
        """
        try:
            response = self.client.auth.get_user(token)
            if response.user:
                return response.user.id
            return None
        except Exception:
            return None

    # ============================================================
    # Bill Configuration Methods
    # ============================================================

    async def create_bill_config(
        self, 
        user_id: str, 
        daily_amount: float, 
        currency: str, 
        start_date: str
    ) -> Dict[str, Any]:
        """
        Create a new bill configuration.

        Args:
            user_id: User's UUID
            daily_amount: Daily billing amount
            currency: ISO currency code (e.g., USD, EUR)
            start_date: Start date in ISO format (YYYY-MM-DD)

        Returns:
            Created bill config record

        Raises:
            Exception: If creation fails
        """
        try:
            data = {
                "user_id": user_id,
                "daily_amount": daily_amount,
                "currency": currency.upper(),
                "start_date": start_date,
                "active": True
            }
            
            response = self.client.table("bill_configs").insert(data).execute()
            
            if not response.data:
                raise Exception("Failed to create bill config")
            
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def get_active_bill_config(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the active bill configuration for a user.

        Args:
            user_id: User's UUID

        Returns:
            Active bill config or None
        """
        try:
            response = self.client.rpc(
                "get_active_bill_config",
                {"p_user_id": user_id}
            ).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except APIError:
            return None

    async def update_bill_config(
        self, 
        config_id: str, 
        user_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a bill configuration.

        Args:
            config_id: Bill config UUID
            user_id: User's UUID (for RLS verification)
            updates: Dictionary of fields to update

        Returns:
            Updated bill config record

        Raises:
            Exception: If update fails
        """
        try:
            # RLS will automatically ensure user owns this config
            response = (
                self.client.table("bill_configs")
                .update(updates)
                .eq("id", config_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            if not response.data:
                raise Exception("Bill config not found or unauthorized")
            
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    # ============================================================
    # Daily Records Methods
    # ============================================================

    async def create_daily_record(
        self,
        user_id: str,
        bill_config_id: str,
        date: str,
        status: str
    ) -> Dict[str, Any]:
        """
        Create a new daily record.

        Args:
            user_id: User's UUID
            bill_config_id: Bill config UUID
            date: Date in ISO format (YYYY-MM-DD)
            status: 'YES' or 'NO'

        Returns:
            Created daily record

        Raises:
            Exception: If creation fails
        """
        try:
            data = {
                "user_id": user_id,
                "bill_config_id": bill_config_id,
                "date": date,
                "status": status,
                "amount": 0.00  # Will be auto-calculated by trigger
            }
            
            response = self.client.table("daily_records").insert(data).execute()
            
            if not response.data:
                raise Exception("Failed to create daily record")
            
            return response.data[0]
        except APIError as e:
            if "unique_user_date" in str(e):
                raise Exception("Record for this date already exists")
            raise Exception(f"Database error: {str(e)}")

    async def get_records_by_month(
        self, 
        user_id: str, 
        year_month: str
    ) -> List[Dict[str, Any]]:
        """
        Get all daily records for a specific month.

        Args:
            user_id: User's UUID
            year_month: Year-month in format YYYY-MM

        Returns:
            List of daily records
        """
        try:
            response = self.client.rpc(
                "get_records_by_month",
                {"p_user_id": user_id, "p_year_month": year_month}
            ).execute()
            
            return response.data if response.data else []
        except APIError:
            return []

    async def get_monthly_summary(
        self, 
        user_id: str, 
        year_month: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get monthly summary for a user.

        Args:
            user_id: User's UUID
            year_month: Year-month in format YYYY-MM

        Returns:
            Monthly summary or None
        """
        try:
            response = self.client.rpc(
                "get_monthly_summary",
                {"p_user_id": user_id, "p_year_month": year_month}
            ).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except APIError:
            return None

    async def update_daily_record(
        self,
        record_id: str,
        user_id: str,
        status: str
    ) -> Dict[str, Any]:
        """
        Update a daily record's status.

        Args:
            record_id: Daily record UUID
            user_id: User's UUID (for RLS verification)
            status: New status ('YES' or 'NO')

        Returns:
            Updated daily record

        Raises:
            Exception: If update fails
        """
        try:
            response = (
                self.client.table("daily_records")
                .update({"status": status})
                .eq("id", record_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            if not response.data:
                raise Exception("Record not found or unauthorized")
            
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def delete_daily_record(
        self,
        record_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a daily record.

        Args:
            record_id: Daily record UUID
            user_id: User's UUID (for RLS verification)

        Returns:
            True if deleted successfully

        Raises:
            Exception: If deletion fails
        """
        try:
            response = (
                self.client.table("daily_records")
                .delete()
                .eq("id", record_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            return len(response.data) > 0
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    # ============================================================
    # Statistics Methods
    # ============================================================

    async def get_user_statistics(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get overall statistics for a user.

        Args:
            user_id: User's UUID

        Returns:
            User statistics or None
        """
        try:
            response = self.client.rpc(
                "get_user_statistics",
                {"p_user_id": user_id}
            ).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except APIError:
            return None

    # ============================================================
    # AI Settings Methods
    # ============================================================

    async def get_ai_settings(self, user_id: str, provider: str = "openai") -> Optional[Dict[str, Any]]:
        """
        Get AI settings for a user and provider.

        Args:
            user_id: User's UUID
            provider: AI provider name

        Returns:
            AI settings dict or None
        """
        try:
            response = (
                self.client.table("user_ai_settings")
                .select("*")
                .eq("user_id", user_id)
                .eq("provider", provider)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def get_ai_models(self, include_deprecated: bool = False) -> List[Dict[str, Any]]:
        """Get all active AI models from ai_models ordered by provider and sort_order."""
        try:
            query = (
                self.client.table("ai_models")
                .select(
                    "id, provider_id, label, context_window, "
                    "is_preview, is_deprecated, reasoning_supported, reasoning_label, sort_order"
                )
                .eq("is_active", True)
            )
            if not include_deprecated:
                query = query.eq("is_deprecated", False)
            response = query.order("provider_id").order("sort_order").execute()
            return response.data or []
        except APIError:
            return []

    async def get_all_ai_settings(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all AI settings for a user (all providers).

        Args:
            user_id: User's UUID

        Returns:
            List of AI settings dicts
        """
        try:
            response = (
                self.client.table("user_ai_settings")
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def upsert_ai_settings(
        self,
        user_id: str,
        provider: str,
        api_key_encrypted: str,
        selected_model: str,
        enable_insights: bool,
        is_key_valid: bool = False,
        key_validated_at: Optional[str] = None,
        default_reasoning_effort: str = "none",
    ) -> Dict[str, Any]:
        """
        Create or update AI settings (upsert on user_id + provider).

        Args:
            user_id: User's UUID
            provider: AI provider name
            api_key_encrypted: Encrypted API key
            selected_model: Selected model ID
            enable_insights: Whether AI insights are enabled
            is_key_valid: Whether the key has been validated
            key_validated_at: Timestamp of last validation

        Returns:
            Upserted AI settings record

        Raises:
            Exception: If upsert fails
        """
        try:
            data = {
                "user_id": user_id,
                "provider": provider,
                "api_key_encrypted": api_key_encrypted,
                "selected_model": selected_model,
                "enable_insights": enable_insights,
                "is_key_valid": is_key_valid,
                "default_reasoning_effort": default_reasoning_effort,
            }
            if key_validated_at:
                data["key_validated_at"] = key_validated_at

            response = (
                self.client.table("user_ai_settings")
                .upsert(data, on_conflict="user_id,provider")
                .execute()
            )

            if not response.data:
                raise Exception("Failed to save AI settings")

            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def update_ai_key_validation(
        self,
        user_id: str,
        provider: str,
        is_valid: bool,
        validated_at: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Update the key validation status for AI settings.

        Args:
            user_id: User's UUID
            provider: AI provider name
            is_valid: Whether the key is valid
            validated_at: Timestamp of validation

        Returns:
            Updated record or None
        """
        try:
            response = (
                self.client.table("user_ai_settings")
                .update({
                    "is_key_valid": is_valid,
                    "key_validated_at": validated_at,
                })
                .eq("user_id", user_id)
                .eq("provider", provider)
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except APIError:
            return None

    async def delete_ai_settings(self, user_id: str, provider: str) -> bool:
        """
        Delete AI settings for a user and provider.

        Args:
            user_id: User's UUID
            provider: AI provider name

        Returns:
            True if deleted successfully
        """
        try:
            self.client.table("user_ai_settings").delete().eq(
                "user_id", user_id
            ).eq("provider", provider).execute()
            return True
        except APIError:
            return False

    # ============================================================
    # User Services (for bill generation)
    # ============================================================

    async def get_services_by_ids(
        self, user_id: str, service_ids: list[str]
    ) -> List[Dict[str, Any]]:
        """
        Get user_services by IDs for the given user.
        """
        if not service_ids:
            return []
        try:
            response = (
                self.client.table("user_services")
                .select("*")
                .eq("user_id", user_id)
                .in_("id", service_ids)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def get_confirmations_for_month_services(
        self,
        user_id: str,
        year_month: str,
        service_ids: list[str],
    ) -> List[Dict[str, Any]]:
        """
        Get service_confirmations for the given user, month (YYYY-MM), and service IDs.
        """
        if not service_ids:
            return []
        year, month = map(int, year_month.split("-"))
        start_date = f"{year_month}-01"
        _, last_day = monthrange(year, month)
        end_date = f"{year_month}-{last_day:02d}"
        try:
            response = (
                self.client.table("service_confirmations")
                .select("*, service:user_services(id, name, price, icon, type, schedule, delivery_type)")
                .eq("user_id", user_id)
                .in_("service_id", service_ids)
                .gte("date", start_date)
                .lte("date", end_date)
                .order("date")
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    # ============================================================
    # Generated Bills
    # ============================================================

    async def insert_generated_bill(
        self,
        user_id: str,
        year_month: str,
        service_ids: list[str],
        payload: dict,
        total_amount: float,
        currency: str = "INR",
        ai_model_used: str | None = None,
        bill_title: str | None = None,
        custom_note: str | None = None,
        auto_generated: bool = False,
        trigger_type: str = "manual",
        pdf_url: str | None = None,
    ) -> Dict[str, Any]:
        """Insert a generated bill row."""
        try:
            data = {
                "user_id": user_id,
                "year_month": year_month,
                "service_ids": service_ids,
                "payload": payload,
                "total_amount": float(total_amount),
                "currency": currency,
                "ai_model_used": ai_model_used,
                "bill_title": bill_title,
                "custom_note": custom_note,
                "auto_generated": auto_generated,
                "trigger_type": trigger_type,
                "pdf_url": pdf_url,
            }
            response = self.client.table("generated_bills").insert(data).execute()
            if not response.data:
                raise Exception("Failed to insert generated bill")
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def list_generated_bills(self, user_id: str) -> List[Dict[str, Any]]:
        """List generated bills for user, newest first."""
        try:
            response = (
                self.client.table("generated_bills")
                .select("id, year_month, service_ids, total_amount, currency, ai_model_used, created_at, bill_title, custom_note, payload, auto_generated, trigger_type, email_sent, pdf_url, is_paid, paid_at, payment_method, payment_note")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def get_bills_for_month(self, user_id: str, year_month: str) -> List[Dict[str, Any]]:
        """List all generated bills for a specific month (for calendar paid status)."""
        try:
            response = (
                self.client.table("generated_bills")
                .select("id, year_month, service_ids, total_amount, currency, bill_title, is_paid, paid_at, payment_method, payment_note")
                .eq("user_id", user_id)
                .eq("year_month", year_month)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def mark_bill_paid(
        self,
        bill_id: str,
        user_id: str,
        is_paid: bool,
        payment_method: str | None = None,
        payment_note: str | None = None,
    ) -> Dict[str, Any] | None:
        """Mark a generated bill as paid or unpaid."""
        from datetime import datetime as dt
        try:
            data: dict = {"is_paid": is_paid}
            if is_paid:
                data["paid_at"] = dt.utcnow().isoformat()
                if payment_method:
                    data["payment_method"] = payment_method
                if payment_note:
                    data["payment_note"] = payment_note
            else:
                data.update({"paid_at": None, "payment_method": None, "payment_note": None})
            response = (
                self.client.table("generated_bills")
                .update(data)
                .eq("id", bill_id)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    async def get_generated_bill(
        self, bill_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a single generated bill by id (and user)."""
        try:
            response = (
                self.client.table("generated_bills")
                .select("*")
                .eq("id", bill_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def delete_generated_bill(self, bill_id: str, user_id: str) -> bool:
        """Delete a generated bill."""
        try:
            response = (
                self.client.table("generated_bills")
                .delete()
                .eq("id", bill_id)
                .eq("user_id", user_id)
                .execute()
            )
            return len(response.data or []) > 0
        except APIError:
            return False

    async def update_bill_email_sent(self, bill_id: str) -> None:
        """Mark a bill's email_sent flag as True."""
        try:
            self.client.table("generated_bills").update(
                {"email_sent": True}
            ).eq("id", bill_id).execute()
        except APIError:
            pass

    async def get_all_active_services_for_scheduler(self) -> List[Dict[str, Any]]:
        """
        Return all active user services across ALL users.
        Used by the auto-generate scheduler (uses service role key — bypasses RLS).
        """
        try:
            response = (
                self.client.table("user_services")
                .select("id, user_id, name, type, price, icon, delivery_type, billing_day, billing_month, schedule, auto_generate_bill")
                .eq("active", True)
                .eq("auto_generate_bill", True)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the user's profile + email from auth.users.
        Returns a dict with email, display_name, full_name, email_notifications, timezone.
        """
        try:
            # Get profile (includes timezone for scheduler date computation)
            profile_resp = (
                self.client.table("user_profiles")
                .select("display_name, full_name, email_notifications, timezone")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
            profile = profile_resp.data or {}

            # Get email from auth.users via admin API
            try:
                user_resp = self.client.auth.admin.get_user_by_id(user_id)
                email = user_resp.user.email if user_resp and user_resp.user else None
            except Exception:
                email = None

            return {
                "email": email,
                "display_name": profile.get("display_name"),
                "full_name": profile.get("full_name"),
                "email_notifications": profile.get("email_notifications", True),
                "timezone": profile.get("timezone") or "UTC",
            }
        except Exception:
            return None

    async def get_auto_bill_for_month(self, user_id: str, year_month: str) -> Optional[Dict[str, Any]]:
        """
        Return the first auto-generated bill for this user+month, or None.
        Used to prevent duplicate auto-generation when the cron runs hourly.
        """
        try:
            response = (
                self.client.table("generated_bills")
                .select("id")
                .eq("user_id", user_id)
                .eq("year_month", year_month)
                .eq("auto_generated", True)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    # ============================================================
    # User Services helpers (for AI agent context)
    # ============================================================

    async def get_user_profile_for_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return context-safe profile fields (no email, phone, or IDs)."""
        try:
            resp = (
                self.client.table("user_profiles")
                .select("display_name, full_name, country, currency, currency_code, timezone")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
            return resp.data or {}
        except Exception:
            return {}

    async def get_inactive_services_count(self, user_id: str) -> int:
        """Return the count of inactive services for a user."""
        try:
            resp = (
                self.client.table("user_services")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("active", False)
                .execute()
            )
            return resp.count or 0
        except Exception:
            return 0

    async def get_active_user_services(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active user services for context injection."""
        try:
            response = (
                self.client.table("user_services")
                .select("id, name, price, icon, type, schedule, delivery_type, billing_day, service_role, notes, active")
                .eq("user_id", user_id)
                .eq("active", True)
                .order("created_at")
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def get_user_service(self, service_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a single user service by ID."""
        try:
            response = (
                self.client.table("user_services")
                .select("*")
                .eq("id", service_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def get_service_by_name(self, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        """Find a user service by name (case-insensitive, first match)."""
        try:
            response = (
                self.client.table("user_services")
                .select("*")
                .eq("user_id", user_id)
                .ilike("name", name)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    async def update_user_service_field(
        self, service_id: str, user_id: str, fields: dict
    ) -> Optional[Dict[str, Any]]:
        """Update specific fields of a user service."""
        try:
            response = (
                self.client.table("user_services")
                .update(fields)
                .eq("id", service_id)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    async def create_user_service(
        self, user_id: str, fields: dict
    ) -> Optional[Dict[str, Any]]:
        """Create a new consumer-role user service and return the created row."""
        try:
            response = (
                self.client.table("user_services")
                .insert({
                    "user_id": user_id,
                    "name": fields["name"],
                    "type": fields.get("type", "daily"),
                    "price": round(float(fields.get("price", 0)), 2),
                    "schedule": fields.get("schedule", "morning"),
                    "icon": fields.get("icon", "package"),
                    "notes": fields.get("notes") or "",
                    "delivery_type": fields.get("delivery_type", "home_delivery"),
                    "billing_day": int(fields.get("billing_day") or 1),
                    "billing_month": int(fields.get("billing_month") or 1),
                    "auto_generate_bill": fields.get("auto_generate_bill", True),
                    "active": True,
                    "service_role": "consumer",
                    "start_date": fields.get("start_date") or None,
                    "end_date": fields.get("end_date") or None,
                })
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def upsert_service_confirmation(
        self, service_id: str, user_id: str, date_str: str, conf_status: str
    ) -> Optional[Dict[str, Any]]:
        """Upsert a service confirmation. status='not_set' deletes the record."""
        try:
            if conf_status == "not_set":
                self.client.table("service_confirmations").delete().eq(
                    "service_id", service_id
                ).eq("user_id", user_id).eq("date", date_str).execute()
                return {"status": "deleted"}
            # Map visit-based labels to DB-accepted values (DB only allows delivered/skipped/pending)
            db_status = {"visited": "delivered", "missed": "skipped"}.get(conf_status, conf_status)
            data = {"service_id": service_id, "user_id": user_id, "date": date_str, "status": db_status}
            response = (
                self.client.table("service_confirmations")
                .upsert(data, on_conflict="user_id,service_id,date")
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    # ============================================================
    # Chat Conversations
    # ============================================================

    async def create_conversation(
        self, user_id: str, title: str = "New Conversation", conv_type: str = "main"
    ) -> Dict[str, Any]:
        """Create a new chat conversation."""
        try:
            data = {"user_id": user_id, "title": title, "conv_type": conv_type}
            response = self.client.table("chat_conversations").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create conversation")
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def list_conversations(
        self, user_id: str, conv_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List chat conversations for user, newest updated first."""
        try:
            q = (
                self.client.table("chat_conversations")
                .select("id, title, conv_type, created_at, updated_at")
                .eq("user_id", user_id)
            )
            if conv_type:
                q = q.eq("conv_type", conv_type)
            response = q.order("updated_at", desc=True).limit(100).execute()
            return response.data or []
        except APIError:
            return []

    async def list_agent_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """List agent conversations for user that have at least 1 message, newest first (max 20)."""
        try:
            # Step 1: get conversation_ids that have at least one message from this user
            msg_resp = (
                self.client.table("chat_messages")
                .select("conversation_id")
                .eq("user_id", user_id)
                .execute()
            )
            conv_ids = list({m["conversation_id"] for m in (msg_resp.data or []) if m.get("conversation_id")})
            if not conv_ids:
                return []
            # Step 2: return agent conversations restricted to those IDs
            response = (
                self.client.table("chat_conversations")
                .select("id, title, created_at, updated_at")
                .eq("user_id", user_id)
                .eq("conv_type", "agent")
                .in_("id", conv_ids)
                .order("updated_at", desc=True)
                .limit(20)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def get_conversation(self, conv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a single conversation by ID."""
        try:
            response = (
                self.client.table("chat_conversations")
                .select("*")
                .eq("id", conv_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def update_conversation_title(
        self, conv_id: str, user_id: str, title: str
    ) -> Optional[Dict[str, Any]]:
        """Rename a conversation."""
        try:
            response = (
                self.client.table("chat_conversations")
                .update({"title": title, "updated_at": datetime.utcnow().isoformat()})
                .eq("id", conv_id)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    async def create_notification(
        self,
        user_id: str,
        notif_type: str,
        title: str,
        message: str = "",
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Insert a notification row for a user."""
        try:
            res = (
                self.client.table("notifications")
                .insert({
                    "user_id": user_id,
                    "type": notif_type,
                    "title": title,
                    "message": message,
                    "data": data or {},
                    "read": False,
                })
                .execute()
            )
            return res.data[0] if res.data else None
        except Exception as e:
            logger.warning("[NOTIF] create_notification failed: %s", e)
            return None

    async def delete_conversation(self, conv_id: str, user_id: str) -> bool:
        """Delete a conversation and cascade to messages + agent_actions."""
        try:
            response = (
                self.client.table("chat_conversations")
                .delete()
                .eq("id", conv_id)
                .eq("user_id", user_id)
                .execute()
            )
            return len(response.data or []) > 0
        except APIError:
            return False

    async def delete_all_conversations(self, user_id: str, conv_type: Optional[str] = None) -> None:
        """Delete all conversations for a user (cascades to messages + agent_actions via FK).

        If conv_type is provided, only conversations of that type are deleted.
        """
        try:
            query = self.client.table("chat_conversations").delete().eq("user_id", user_id)
            if conv_type:
                query = query.eq("conv_type", conv_type)
            query.execute()
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def touch_conversation(self, conv_id: str) -> None:
        """Update updated_at on a conversation."""
        try:
            self.client.table("chat_conversations").update(
                {"updated_at": datetime.utcnow().isoformat()}
            ).eq("id", conv_id).execute()
        except APIError:
            pass

    # ============================================================
    # Chat Messages
    # ============================================================

    async def add_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        model_used: Optional[str] = None,
        context_tags: Optional[list] = None,
        metadata: Optional[dict] = None,
    ) -> Dict[str, Any]:
        """Save a chat message to the database."""
        try:
            data: dict = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": role,
                "content": content,
            }
            if model_used:
                data["model_used"] = model_used
            if context_tags:
                data["context_tags"] = context_tags
            if metadata:
                data["metadata"] = metadata
            response = self.client.table("chat_messages").insert(data).execute()
            if not response.data:
                raise Exception("Failed to save message")
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def get_messages(
        self, conversation_id: str, user_id: str
    ) -> List[Dict[str, Any]]:
        """Get all messages in a conversation, oldest first. Includes analytics if available."""
        try:
            response = (
                self.client.table("chat_messages")
                .select(
                    "id, role, content, model_used, context_tags, metadata, created_at, "
                    "message_analytics(tokens_in, tokens_out, tokens_thinking, cost_usd, "
                    "latency_ms, ttft_ms, chunks_count, model_used)"
                )
                .eq("conversation_id", conversation_id)
                .eq("user_id", user_id)
                .order("created_at", desc=False)
                .execute()
            )
            return response.data or []
        except APIError:
            return []

    async def save_message_analytics(
        self,
        message_id: str,
        user_id: str,
        tokens_in: int,
        tokens_out: int,
        tokens_thinking: Optional[int],
        cost_usd: float,
        latency_ms: int,
        ttft_ms: Optional[int],
        chunks_count: int,
        model_used: Optional[str] = None,
    ) -> None:
        """Save analytics for an assistant message. Silently ignores duplicates."""
        try:
            data: dict = {
                "message_id": message_id,
                "user_id": user_id,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_usd": float(cost_usd),
                "latency_ms": latency_ms,
                "chunks_count": chunks_count,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            if tokens_thinking is not None:
                data["tokens_thinking"] = tokens_thinking
            if ttft_ms is not None:
                data["ttft_ms"] = ttft_ms
            if model_used is not None:
                data["model_used"] = model_used
            result = (
                self.client.table("message_analytics")
                .upsert(data, on_conflict="message_id")
                .execute()
            )
            if not result.data:
                logger.warning("[ANALYTICS] save_message_analytics returned no data")
        except Exception as e:
            logger.warning("[ANALYTICS] save_message_analytics failed: %s", e)

    async def get_analytics_summary(
        self,
        user_id: str,
        year_month: Optional[str] = None,
        days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Aggregate AI usage analytics for a user.

        Args:
            user_id: The user's ID.
            year_month: Filter to a specific month in 'YYYY-MM' format.
            days: Filter to last N days (overrides year_month if both provided).

        Returns dict with:
            total_tokens_in, total_tokens_out, total_tokens_thinking,
            total_cost_usd, message_count, avg_latency_ms,
            daily_breakdown: [{date, tokens_in, tokens_out, tokens_thinking, cost_usd, count}],
            model_breakdown: [{model, tokens_in, tokens_out, cost_usd, count}]
        """
        try:
            query = (
                self.client.table("message_analytics")
                .select(
                    "tokens_in, tokens_out, tokens_thinking, cost_usd, "
                    "latency_ms, created_at, model_used"
                )
                .eq("user_id", user_id)
            )
            if days:
                from datetime import datetime, timedelta, timezone
                cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
                query = query.gte("created_at", cutoff)
            elif year_month:
                # Filter by YYYY-MM prefix
                query = query.gte("created_at", f"{year_month}-01") \
                             .lt("created_at", _next_month(year_month))

            response = query.order("created_at", desc=False).execute()
            rows = response.data or []

            total_tokens_in = sum(r.get("tokens_in", 0) or 0 for r in rows)
            total_tokens_out = sum(r.get("tokens_out", 0) or 0 for r in rows)
            total_tokens_thinking = sum(r.get("tokens_thinking", 0) or 0 for r in rows)
            total_cost_usd = sum(float(r.get("cost_usd", 0) or 0) for r in rows)
            message_count = len(rows)
            avg_latency_ms = (
                int(sum(r.get("latency_ms", 0) or 0 for r in rows) / message_count)
                if message_count > 0 else 0
            )

            # Daily breakdown
            daily: Dict[str, dict] = {}
            for r in rows:
                date_str = (r.get("created_at") or "")[:10]
                if date_str not in daily:
                    daily[date_str] = {
                        "date": date_str, "tokens_in": 0, "tokens_out": 0,
                        "tokens_thinking": 0, "cost_usd": 0.0, "count": 0,
                        "latency_sum": 0,
                    }
                d = daily[date_str]
                d["tokens_in"] += r.get("tokens_in", 0) or 0
                d["tokens_out"] += r.get("tokens_out", 0) or 0
                d["tokens_thinking"] += r.get("tokens_thinking", 0) or 0
                d["cost_usd"] = round(d["cost_usd"] + float(r.get("cost_usd", 0) or 0), 8)
                d["count"] += 1
                d["latency_sum"] += r.get("latency_ms", 0) or 0

            # Compute avg_latency_ms per day and remove helper field
            for d in daily.values():
                d["avg_latency_ms"] = int(d["latency_sum"] / d["count"]) if d["count"] > 0 else 0
                del d["latency_sum"]

            # Model breakdown (field names match frontend: total_cost_usd, message_count)
            model_map: Dict[str, dict] = {}
            for r in rows:
                model_key = r.get("model_used") or "unknown"
                if model_key not in model_map:
                    model_map[model_key] = {
                        "model": model_key, "tokens_in": 0, "tokens_out": 0,
                        "tokens_thinking": 0, "total_cost_usd": 0.0, "message_count": 0,
                    }
                m = model_map[model_key]
                m["tokens_in"] += r.get("tokens_in", 0) or 0
                m["tokens_out"] += r.get("tokens_out", 0) or 0
                m["tokens_thinking"] += r.get("tokens_thinking", 0) or 0
                m["total_cost_usd"] = round(m["total_cost_usd"] + float(r.get("cost_usd", 0) or 0), 8)
                m["message_count"] += 1

            return {
                "total_tokens_in": total_tokens_in,
                "total_tokens_out": total_tokens_out,
                "total_tokens_thinking": total_tokens_thinking,
                "total_cost_usd": round(total_cost_usd, 8),
                "message_count": message_count,
                "avg_latency_ms": avg_latency_ms,
                "daily_breakdown": sorted(daily.values(), key=lambda x: x["date"]),
                "model_breakdown": sorted(
                    model_map.values(), key=lambda x: x["total_cost_usd"], reverse=True
                ),
            }
        except Exception as e:
            logger.error("[ANALYTICS] get_analytics_summary failed: %s", e)
            return {
                "total_tokens_in": 0, "total_tokens_out": 0, "total_tokens_thinking": 0,
                "total_cost_usd": 0.0, "message_count": 0, "avg_latency_ms": 0,
                "daily_breakdown": [], "model_breakdown": [],
            }

    async def get_message(
        self,
        message_id: str,
        user_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get a single message by id for the user."""
        try:
            response = (
                self.client.table("chat_messages")
                .select("id, conversation_id, user_id, role, content, model_used, metadata, created_at")
                .eq("id", message_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def update_message_metadata(
        self,
        message_id: str,
        user_id: str,
        metadata: dict,
    ) -> Optional[Dict[str, Any]]:
        """Replace metadata JSON for a message."""
        try:
            response = (
                self.client.table("chat_messages")
                .update({"metadata": metadata})
                .eq("id", message_id)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None

    # ============================================================
    # Agent Actions
    # ============================================================

    async def create_agent_action(
        self,
        conversation_id: str,
        user_id: str,
        action_type: str,
        action_params: dict,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
    ) -> Dict[str, Any]:
        """Create a pending agent action for user confirmation."""
        try:
            data = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "action_type": action_type,
                "action_params": action_params,
                "old_value": old_value,
                "new_value": new_value,
                "status": "pending",
            }
            response = self.client.table("agent_actions").insert(data).execute()
            if not response.data:
                raise Exception("Failed to create agent action")
            return response.data[0]
        except APIError as e:
            raise Exception(f"Database error: {str(e)}")

    async def get_agent_action(
        self, action_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a single agent action."""
        try:
            response = (
                self.client.table("agent_actions")
                .select("*")
                .eq("id", action_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except APIError:
            return None

    async def update_agent_action_status(
        self,
        action_id: str,
        user_id: str,
        status: str,
        executed_at: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update agent action status."""
        try:
            data: dict = {"status": status}
            if executed_at:
                data["executed_at"] = executed_at
            response = (
                self.client.table("agent_actions")
                .update(data)
                .eq("id", action_id)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except APIError:
            return None


    # ============================================================
    # AI Providers & Models (global registry)
    # ============================================================

    async def get_ai_providers(self) -> List[Dict[str, Any]]:
        """Get all AI providers from the global registry."""
        try:
            response = (
                self.client.table("ai_providers")
                .select("*")
                .execute()
            )
            return response.data or []
        except Exception:
            return []

    async def get_ai_models_for_provider(
        self,
        provider_id: str,
        include_deprecated: bool = False,
    ) -> List[Dict[str, Any]]:
        """Get active AI models for a provider ordered by sort_order."""
        try:
            query = (
                self.client.table("ai_models")
                .select("*")
                .eq("provider_id", provider_id)
                .eq("is_active", True)
            )
            if not include_deprecated:
                query = query.eq("is_deprecated", False)
            response = query.order("sort_order", desc=False).execute()
            return response.data or []
        except Exception:
            return []

    async def get_ai_model(
        self,
        provider_id: str,
        model_id: str,
        include_deprecated: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Get a single AI model by provider+id."""
        try:
            query = (
                self.client.table("ai_models")
                .select("*")
                .eq("provider_id", provider_id)
                .eq("id", model_id)
                .eq("is_active", True)
            )
            if not include_deprecated:
                query = query.eq("is_deprecated", False)
            response = query.maybe_single().execute()
            return response.data
        except Exception:
            return None

    async def get_user_model_probe(
        self,
        user_id: str,
        provider_id: str,
        model_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get one cached probe row for a user/provider/model."""
        try:
            response = (
                self.client.table("user_model_probes")
                .select("*")
                .eq("user_id", user_id)
                .eq("provider_id", provider_id)
                .eq("model_id", model_id)
                .maybe_single()
                .execute()
            )
            return response.data
        except Exception:
            return None

    async def list_user_model_probes(
        self,
        user_id: str,
        provider_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List cached probe rows for a user (optionally per provider)."""
        try:
            query = (
                self.client.table("user_model_probes")
                .select("*")
                .eq("user_id", user_id)
            )
            if provider_id:
                query = query.eq("provider_id", provider_id)
            response = query.order("checked_at", desc=True).execute()
            return response.data or []
        except Exception:
            return []

    async def upsert_user_model_probe(
        self,
        user_id: str,
        provider_id: str,
        model_id: str,
        status: str,
        message: Optional[str] = None,
        checked_at: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Upsert probe cache by (user_id, provider_id, model_id)."""
        try:
            payload: Dict[str, Any] = {
                "user_id": user_id,
                "provider_id": provider_id,
                "model_id": model_id,
                "status": status,
                "message": message,
            }
            if checked_at:
                payload["checked_at"] = checked_at
            response = (
                self.client.table("user_model_probes")
                .upsert(payload, on_conflict="user_id,provider_id,model_id")
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception:
            return None

    # ============================================================
    # Message Feedback
    # ============================================================

    async def save_message_feedback(
        self,
        user_id: str,
        conv_id: str,
        message_id: str,
        feedback: str,  # 'positive' or 'negative'
    ) -> Optional[Dict[str, Any]]:
        """Upsert per-message feedback. Returns saved record."""
        try:
            response = (
                self.client.table("message_feedback")
                .upsert(
                    {
                        "user_id": user_id,
                        "conv_id": conv_id,
                        "message_id": message_id,
                        "feedback": feedback,
                    },
                    on_conflict="conv_id,message_id,user_id",
                )
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception:
            return None

    async def get_conv_feedback_summary(self, conv_id: str) -> Optional[Dict[str, int]]:
        """Return {'positive': N, 'negative': M} for the conversation, or None if no feedback."""
        try:
            response = (
                self.client.table("message_feedback")
                .select("feedback")
                .eq("conv_id", conv_id)
                .execute()
            )
            rows = response.data or []
            if not rows:
                return None
            positive = sum(1 for r in rows if r.get("feedback") == "positive")
            negative = sum(1 for r in rows if r.get("feedback") == "negative")
            return {"positive": positive, "negative": negative}
        except Exception:
            return None


# Global service instance
supabase_service = SupabaseService()

