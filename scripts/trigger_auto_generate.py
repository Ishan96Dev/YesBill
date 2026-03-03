#!/usr/bin/env python3
"""
Local testing script for YesBill auto-bill generation.

Usage:
    python scripts/trigger_auto_generate.py

Environment variables (or edit defaults below):
    BACKEND_URL       → local or remote backend URL
    SCHEDULER_SECRET  → must match SCHEDULER_SECRET in backend .env

Example:
    BACKEND_URL=http://localhost:8000 SCHEDULER_SECRET=dev-secret python scripts/trigger_auto_generate.py
"""
import asyncio
import json
import os
import sys

try:
    import httpx
except ImportError:
    print("ERROR: httpx is not installed. Run: pip install httpx")
    sys.exit(1)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SCHEDULER_SECRET = os.getenv("SCHEDULER_SECRET", "")


async def main() -> None:
    url = f"{BACKEND_URL}/bills/auto-generate"
    headers = {
        "X-Scheduler-Secret": SCHEDULER_SECRET,
        "Content-Type": "application/json",
    }

    print(f"Triggering auto-generate at: {url}")
    print(f"Secret set: {'yes' if SCHEDULER_SECRET else 'NO (leave blank for dev)'}\n")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(url, headers=headers, json={})
            print(f"HTTP {resp.status_code}")
            try:
                data = resp.json()
                print(json.dumps(data, indent=2))
            except Exception:
                print(resp.text)

            if resp.status_code >= 400:
                sys.exit(1)

        except httpx.ConnectError:
            print(f"ERROR: Could not connect to {BACKEND_URL}")
            print("Make sure the backend is running (uvicorn app.main:app --reload)")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
