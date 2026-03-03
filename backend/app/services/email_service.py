# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""
Brevo (Sendinblue) transactional email service for YesBill.

Usage:
  Set BREVO_API_KEY and BREVO_FROM_EMAIL in your environment / Fly.io secrets.

Templates to create in Brevo dashboard:
  - "Bill Auto-Generated" (template ID stored in BREVO_BILL_TEMPLATE_ID env var)
    Params: {{params.user_name}}, {{params.month}}, {{params.total}},
            {{params.currency}}, {{params.bill_title}}, {{params.services_count}},
            {{params.ai_summary}}, {{params.recommendation}}, {{params.bill_url}}

  - "Password Changed" (template ID stored in BREVO_PASSWORD_CHANGED_TEMPLATE_ID env var)
    Params: {{params.user_name}}, {{params.changed_at}}, {{params.reset_url}}

  - "Account Deleted" (template ID stored in BREVO_ACCOUNT_DELETED_TEMPLATE_ID env var)
    Params: {{params.user_name}}, {{params.deleted_at}}, {{params.support_url}}
"""

import os
from datetime import datetime, timezone
from typing import Optional

import httpx

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "bills@yourdomain.com")
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "YesBill")
BREVO_BILL_TEMPLATE_ID = os.getenv("BREVO_BILL_TEMPLATE_ID", "")
BREVO_PASSWORD_CHANGED_TEMPLATE_ID = os.getenv("BREVO_PASSWORD_CHANGED_TEMPLATE_ID", "")
BREVO_ACCOUNT_DELETED_TEMPLATE_ID = os.getenv("BREVO_ACCOUNT_DELETED_TEMPLATE_ID", "")
SITE_URL = os.getenv("SITE_URL", "https://yesbill.com")

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


async def send_bill_generated_email(
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
    pdf_url: Optional[str] = None,
) -> bool:
    """
    Send a bill-generated notification email via Brevo.

    Returns True if sent successfully, False otherwise.
    If BREVO_API_KEY is not set, skips silently and returns False.
    """
    if not BREVO_API_KEY:
        return False

    params = {
        "user_name": user_name or to_name or "there",
        "month": month,
        "total": f"{total:,.2f}",
        "currency": currency,
        "bill_title": bill_title,
        "services_count": str(services_count),
        "ai_summary": ai_summary or f"Your {month} bill totals {currency}{total:,.2f}.",
        "recommendation": recommendation or "Keep tracking your services for better insights.",
        "bill_url": pdf_url or "",
    }

    # Build payload — use template if ID is set, otherwise use inline HTML
    if BREVO_BILL_TEMPLATE_ID:
        payload = {
            "to": [{"email": to_email, "name": to_name}],
            "templateId": int(BREVO_BILL_TEMPLATE_ID),
            "params": params,
        }
    else:
        # Inline fallback HTML email
        html_content = _build_inline_email(params)
        payload = {
            "sender": {"name": BREVO_FROM_NAME, "email": BREVO_FROM_EMAIL},
            "to": [{"email": to_email, "name": to_name}],
            "subject": f"Your {month} Bill is Ready — {currency}{total:,.2f}",
            "htmlContent": html_content,
        }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                BREVO_SEND_URL,
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            return True
    except Exception as exc:
        print(f"[EmailService] Failed to send email to {to_email}: {exc}")
        return False


def _build_inline_email(params: dict) -> str:
    """Inline HTML email template used when no Brevo template ID is configured."""
    pdf_section = ""
    if params.get("bill_url"):
        pdf_section = f"""
        <p style="margin: 16px 0;">
          <a href="{params['bill_url']}"
             style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;
                    text-decoration:none;font-weight:600;display:inline-block;">
            Download PDF Bill
          </a>
        </p>"""

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;background:#f8f9fa;margin:0;padding:24px;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;
              box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">YesBill</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;">Your Monthly Bill Summary</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:16px;margin-top:0;">Hi {params['user_name']},</p>
      <p style="color:#374151;font-size:16px;">
        Your <strong>{params['bill_title']}</strong> has been auto-generated for <strong>{params['month']}</strong>.
      </p>

      <!-- Total box -->
      <div style="background:#f0f0ff;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
        <p style="color:#6366f1;margin:0;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">
          Total Amount
        </p>
        <p style="color:#1e1b4b;margin:8px 0 0;font-size:36px;font-weight:800;">
          {params['currency']}{params['total']}
        </p>
        <p style="color:#6b7280;margin:4px 0 0;font-size:13px;">
          {params['services_count']} service(s) tracked
        </p>
      </div>

      <!-- AI Summary -->
      <div style="background:#fafafa;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;
                  padding:16px 20px;margin:24px 0;">
        <p style="color:#374151;margin:0;font-size:15px;line-height:1.6;">{params['ai_summary']}</p>
      </div>

      <!-- Recommendation -->
      <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin:24px 0;">
        <p style="color:#065f46;font-weight:600;margin:0 0 8px;font-size:14px;">💡 Recommendation</p>
        <p style="color:#064e3b;margin:0;font-size:14px;line-height:1.6;">{params['recommendation']}</p>
      </div>

      {pdf_section}

      <p style="color:#6b7280;font-size:14px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:20px;">
        Open the YesBill app to view the full bill breakdown, download PDF, or manage your services.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:20px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        © 2026 YesBill • Auto-generated on {params['month']}
      </p>
    </div>
  </div>
</body>
</html>"""


async def send_password_changed_email(
    to_email: str,
    to_name: str,
    changed_at: Optional[datetime] = None,
) -> bool:
    """
    Send a 'password changed' security notification email via Brevo.

    Returns True if sent successfully, False otherwise.
    """
    if not BREVO_API_KEY:
        return False

    changed_at_str = (changed_at or datetime.now(timezone.utc)).strftime("%B %d, %Y at %H:%M UTC")
    reset_url = f"{SITE_URL}/forgot-password"
    display_name = to_name or "there"

    brevo_params = {
        "user_name": display_name,
        "changed_at": changed_at_str,
        "reset_url": reset_url,
    }

    if BREVO_PASSWORD_CHANGED_TEMPLATE_ID:
        payload = {
            "to": [{"email": to_email, "name": to_name}],
            "templateId": int(BREVO_PASSWORD_CHANGED_TEMPLATE_ID),
            "params": brevo_params,
        }
    else:
        payload = {
            "sender": {"name": BREVO_FROM_NAME, "email": BREVO_FROM_EMAIL},
            "to": [{"email": to_email, "name": to_name}],
            "subject": "Your YesBill password was changed",
            "htmlContent": _build_password_changed_email(display_name, changed_at_str, reset_url),
        }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                BREVO_SEND_URL,
                headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            return True
    except Exception as exc:
        print(f"[EmailService] Failed to send password-changed email to {to_email}: {exc}")
        return False


async def send_account_deleted_email(
    to_email: str,
    to_name: str,
    deleted_at: Optional[datetime] = None,
) -> bool:
    """
    Send an 'account deleted' confirmation email via Brevo.

    Returns True if sent successfully, False otherwise.
    """
    if not BREVO_API_KEY:
        return False

    deleted_at_str = (deleted_at or datetime.now(timezone.utc)).strftime("%B %d, %Y at %H:%M UTC")
    support_url = "mailto:support@yesbill.com"
    display_name = to_name or "there"

    brevo_params = {
        "user_name": display_name,
        "deleted_at": deleted_at_str,
        "support_url": support_url,
    }

    if BREVO_ACCOUNT_DELETED_TEMPLATE_ID:
        payload = {
            "to": [{"email": to_email, "name": to_name}],
            "templateId": int(BREVO_ACCOUNT_DELETED_TEMPLATE_ID),
            "params": brevo_params,
        }
    else:
        payload = {
            "sender": {"name": BREVO_FROM_NAME, "email": BREVO_FROM_EMAIL},
            "to": [{"email": to_email, "name": to_name}],
            "subject": "Your YesBill account has been deleted",
            "htmlContent": _build_account_deleted_email(display_name, deleted_at_str, support_url),
        }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                BREVO_SEND_URL,
                headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            return True
    except Exception as exc:
        print(f"[EmailService] Failed to send account-deleted email to {to_email}: {exc}")
        return False


def _build_password_changed_email(user_name: str, changed_at: str, reset_url: str) -> str:
    """Full branded HTML email for password-changed notification (matches 07-password-changed.html)."""
    return f"""<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - YesBill</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 40px 40px 36px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 20px; padding: 12px 16px; margin-bottom: 16px;">
                <img src="https://dmabraziqscumpbwhjbf.supabase.co/storage/v1/object/public/branding/yesbill_logo_black.png?width=280&quality=85"
                     alt="YesBill"
                     style="width: 140px; height: auto; display: block; max-width: 140px;"
                     width="140" height="auto" loading="eager" fetchpriority="high" decoding="async"
                     onerror="this.style.display='none'">
              </div>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 15px; font-weight: 500;">
                Daily Service Billing Tracker
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
                  🔒
                </div>
              </div>

              <h2 style="margin: 0 0 10px; color: #0F172A; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                Password Changed
              </h2>

              <p style="margin: 0 0 30px; color: #64748B; font-size: 16px; line-height: 1.7; text-align: center;">
                Hi {user_name}, your YesBill account password was successfully updated.
              </p>

              <!-- Success Info Card -->
              <div style="background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%); border: 2px solid #A7F3D0; border-radius: 14px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0 0 8px; color: #065F46; font-size: 15px; font-weight: 700;">
                  ✅ Password updated successfully
                </p>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                  Changed on: <strong>{changed_at}</strong>
                </p>
              </div>

              <!-- Security Warning -->
              <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%); border-left: 4px solid #F59E0B; padding: 22px 24px; border-radius: 12px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; color: #78350F; font-size: 15px; font-weight: 700;">
                  ⚠️ Wasn't you?
                </p>
                <p style="margin: 0 0 16px; color: #92400E; font-size: 14px; line-height: 1.7;">
                  If you didn't make this change, your account may be compromised. <strong>Reset your password immediately</strong> and contact our support team.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left">
                      <a href="{reset_url}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
                        🔑 Reset My Password
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Security Tips -->
              <div style="background-color: #F0F9FF; border: 2px solid #BAE6FD; padding: 20px; border-radius: 12px;">
                <p style="margin: 0 0 12px; color: #0C4A6E; font-size: 15px; font-weight: 700;">
                  🛡️ Keep your account secure
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #0369A1; font-size: 14px; line-height: 1.7;">
                  <li style="margin-bottom: 8px;">Never share your password with anyone</li>
                  <li style="margin-bottom: 8px;">Use a unique password not used on other sites</li>
                  <li style="margin-bottom: 8px;">Enable Google sign-in as a backup login method</li>
                  <li style="margin-bottom: 0;">Contact support if you notice any suspicious activity</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 40px 40px 35px; text-align: center; border-top: 2px solid #E2E8F0;">
              <p style="margin: 0 0 20px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                This is an automated security notification from YesBill.<br>
                You're receiving this because a password change was made to your account.
              </p>
              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; font-weight: 600;">Need Help?</p>
                <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                  Contact our support team at <a href="mailto:support@yesbill.com" style="color: #059669; text-decoration: none;">support@yesbill.com</a>
                </p>
              </div>
              <p style="margin: 25px 0 0; color: #CBD5E1; font-size: 12px;">© 2026 YesBill. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_account_deleted_email(user_name: str, deleted_at: str, support_url: str) -> str:
    """Full branded HTML email for account-deleted confirmation (matches 08-account-deleted.html)."""
    return f"""<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - YesBill</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #475569 0%, #64748B 100%); padding: 40px 40px 36px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 20px; padding: 12px 16px; margin-bottom: 16px;">
                <img src="https://dmabraziqscumpbwhjbf.supabase.co/storage/v1/object/public/branding/yesbill_logo_black.png?width=280&quality=85"
                     alt="YesBill"
                     style="width: 140px; height: auto; display: block; max-width: 140px;"
                     width="140" height="auto" loading="eager" fetchpriority="high" decoding="async"
                     onerror="this.style.display='none'">
              </div>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 15px; font-weight: 500;">
                Daily Service Billing Tracker
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); border-radius: 50%; line-height: 80px; font-size: 40px;">
                  👋
                </div>
              </div>

              <h2 style="margin: 0 0 10px; color: #0F172A; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                Account Deleted
              </h2>

              <p style="margin: 0 0 30px; color: #64748B; font-size: 16px; line-height: 1.7; text-align: center;">
                Hi {user_name}, your YesBill account has been permanently deleted. We're sorry to see you go.
              </p>

              <!-- Deletion Confirmation Card -->
              <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border: 2px solid #CBD5E1; border-radius: 14px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0 0 8px; color: #374151; font-size: 15px; font-weight: 700;">
                  ✅ Account permanently deleted
                </p>
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  Deleted on: <strong>{deleted_at}</strong>
                </p>
              </div>

              <!-- What was deleted -->
              <div style="background-color: #F8FAFC; border-radius: 12px; padding: 22px 24px; margin-bottom: 30px;">
                <p style="margin: 0 0 14px; color: #374151; font-size: 15px; font-weight: 700;">
                  🗑️ What has been removed:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #6B7280; font-size: 14px; line-height: 1.8;">
                  <li style="margin-bottom: 6px;">Your profile and account information</li>
                  <li style="margin-bottom: 6px;">All services and billing records</li>
                  <li style="margin-bottom: 6px;">Calendar data and payment history</li>
                  <li style="margin-bottom: 6px;">AI configuration and preferences</li>
                  <li style="margin-bottom: 0;">All other associated data</li>
                </ul>
              </div>

              <!-- Mistake / Come back section -->
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #BFDBFE; padding: 22px 24px; border-radius: 12px; margin-bottom: 0;">
                <p style="margin: 0 0 10px; color: #1E40AF; font-size: 15px; font-weight: 700;">
                  💙 Was this a mistake?
                </p>
                <p style="margin: 0 0 16px; color: #1D4ED8; font-size: 14px; line-height: 1.7;">
                  Account deletion is permanent and cannot be undone. However, if you'd like to start fresh or if this was done in error, please contact our support team right away — we'll do our best to help.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left">
                      <a href="{support_url}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
                        📧 Contact Support
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 40px 40px 35px; text-align: center; border-top: 2px solid #E2E8F0;">
              <p style="margin: 0 0 12px; color: #94A3B8; font-size: 14px; font-weight: 500;">
                Thank you for using YesBill. We hope to see you again someday. 🙏
              </p>
              <p style="margin: 0 0 20px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                This is a confirmation that your account has been permanently deleted.<br>
                You will no longer receive emails from us.
              </p>
              <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px; color: #64748B; font-size: 13px; font-weight: 600;">Questions or Concerns?</p>
                <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                  Contact our support team at <a href="mailto:support@yesbill.com" style="color: #64748B; text-decoration: none;">support@yesbill.com</a>
                </p>
              </div>
              <p style="margin: 25px 0 0; color: #CBD5E1; font-size: 12px;">© 2026 YesBill. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

