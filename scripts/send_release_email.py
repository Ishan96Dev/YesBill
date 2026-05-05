#!/usr/bin/env python3
"""
send_release_email.py
─────────────────────
Sends the YesBill release notification email via Brevo's transactional API.
Called from .github/workflows/release.yml after the GitHub Release is created.

Required env vars:
  BREVO_API_KEY   — Brevo API key (same one used in Supabase send-bill-email)
  NOTIFY_EMAIL    — recipient address (from GitHub Secrets)
  VERSION         — git tag, e.g. v1.2.0
  APK_PATH        — path to the signed APK file
  EMAIL_TEMPLATE  — path to the rendered HTML email file
"""

import os, sys, json, base64, urllib.request, urllib.error

def main():
    api_key  = os.environ.get("BREVO_API_KEY", "").strip()
    notify   = os.environ.get("NOTIFY_EMAIL", "").strip()
    version  = os.environ.get("VERSION", "").strip()
    apk_path = os.environ.get("APK_PATH", "").strip()
    tmpl     = os.environ.get("EMAIL_TEMPLATE", "/tmp/release-email.html").strip()

    # ── Validate ──────────────────────────────────────────────────────────────
    missing = [k for k, v in {
        "BREVO_API_KEY": api_key,
        "NOTIFY_EMAIL":  notify,
        "VERSION":       version,
        "APK_PATH":      apk_path,
    }.items() if not v]
    if missing:
        print(f"ERROR: missing env vars: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    # ── Read HTML ─────────────────────────────────────────────────────────────
    try:
        with open(tmpl, "r", encoding="utf-8") as fh:
            html = fh.read()
    except FileNotFoundError:
        print(f"ERROR: email template not found: {tmpl}", file=sys.stderr)
        sys.exit(1)

    # ── Encode APK ────────────────────────────────────────────────────────────
    try:
        with open(apk_path, "rb") as fh:
            apk_b64 = base64.b64encode(fh.read()).decode("utf-8")
    except FileNotFoundError:
        print(f"ERROR: APK not found: {apk_path}", file=sys.stderr)
        sys.exit(1)

    apk_name = os.path.basename(apk_path)

    # ── Build Brevo payload ───────────────────────────────────────────────────
    payload = {
        "sender":      {"name": "YesBill CI", "email": "bills@yesbill.app"},
        "to":          [{"email": notify}],
        "subject":     f"\U0001f680 YesBill {version} \u2014 Android APK Released",
        "htmlContent": html,
        "attachment":  [{"content": apk_b64, "name": apk_name}],
    }

    # ── POST to Brevo ─────────────────────────────────────────────────────────
    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key":      api_key,
            "Content-Type": "application/json",
            "Accept":       "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            print(f"[Brevo] HTTP {resp.status} OK: {body[:200]}")
    except urllib.error.HTTPError as exc:
        err = exc.read().decode()
        print(f"[Brevo] HTTP {exc.code} error: {err}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
