#!/usr/bin/env python3
"""
send_build_email.py — Send a CI build-success notification via Brevo.

Called by .github/workflows/build-apk.yml after a successful APK build.
No APK attachment (CI artifacts require GitHub auth); links to the run URL.

Required environment variables:
  BREVO_API_KEY   — Brevo transactional email API key (from GitHub Secrets)
  NOTIFY_EMAIL    — Recipient email address
  BRANCH          — Git branch name (e.g. main)
  COMMIT_SHA      — Short commit SHA
  RUN_URL         — GitHub Actions run URL
  EMAIL_TEMPLATE  — Path to the rendered HTML email file
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ── Environment ────────────────────────────────────────────────────────────────
api_key        = os.environ.get("BREVO_API_KEY", "").strip()
notify_email   = os.environ.get("NOTIFY_EMAIL", "").strip()
branch         = os.environ.get("BRANCH", "main").strip()
commit_sha     = os.environ.get("COMMIT_SHA", "unknown").strip()
run_url        = os.environ.get("RUN_URL", "").strip()
template_path  = os.environ.get("EMAIL_TEMPLATE", "/tmp/build-email.html").strip()

if not api_key:
    print("ERROR: BREVO_API_KEY is not set", file=sys.stderr)
    sys.exit(1)
if not notify_email:
    print("ERROR: NOTIFY_EMAIL is not set", file=sys.stderr)
    sys.exit(1)

# ── Read rendered template ─────────────────────────────────────────────────────
try:
    with open(template_path, "r", encoding="utf-8") as f:
        html_body = f.read()
except FileNotFoundError:
    print(f"ERROR: Email template not found at {template_path}", file=sys.stderr)
    sys.exit(1)

# ── Send via Brevo ─────────────────────────────────────────────────────────────
payload = {
    "sender": {"name": "YesBill CI", "email": "bills@yesbill.app"},
    "to": [{"email": notify_email}],
    "subject": f"✅ YesBill Build Succeeded — {branch} @ {commit_sha}",
    "htmlContent": html_body,
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    "https://api.brevo.com/v3/smtp/email",
    data=data,
    headers={
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        print(f"Email sent successfully: {resp.status} {body}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode("utf-8")
    print(f"ERROR: Brevo API returned {e.code}: {error_body}", file=sys.stderr)
    sys.exit(1)
except urllib.error.URLError as e:
    print(f"ERROR: Network error — {e.reason}", file=sys.stderr)
    sys.exit(1)
