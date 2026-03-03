"""
End-to-end test for reasoning summary quality.

Usage:
    python backend/tests/test_reasoning_summary.py

Requires:
    - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in environment (or .env)
    - A valid user_id and conv_id with at least one assistant message that has
      metadata.reasoning.supported = true (i.e. a Gemini 3.1 Pro or thinking model message)

Environment variables (override defaults):
    TEST_USER_ID     — Supabase user ID
    TEST_CONV_ID     — conversation ID
    TEST_MESSAGE_ID  — specific message ID to test (optional; uses most recent if omitted)
"""
import asyncio
import os
import sys

# Allow running from repo root: python backend/tests/test_reasoning_summary.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from backend.app.services.chat_service import get_or_generate_reasoning_summary
from backend.app.services import supabase_service


async def find_test_message(user_id: str, conv_id: str) -> str | None:
    """Find the most recent assistant message with reasoning support."""
    messages = await supabase_service.get_messages(conv_id, user_id)
    for msg in reversed(messages):
        if msg.get("role") != "assistant":
            continue
        metadata = msg.get("metadata") or {}
        reasoning = metadata.get("reasoning") or {}
        if reasoning.get("supported"):
            return msg["id"]
    return None


async def run_test():
    user_id = os.environ.get("TEST_USER_ID")
    conv_id = os.environ.get("TEST_CONV_ID")
    message_id = os.environ.get("TEST_MESSAGE_ID")

    if not user_id or not conv_id:
        print("ERROR: Set TEST_USER_ID and TEST_CONV_ID environment variables.")
        sys.exit(1)

    if not message_id:
        print(f"Searching for a reasoning-supported message in conv {conv_id}...")
        message_id = await find_test_message(user_id, conv_id)
        if not message_id:
            print("ERROR: No assistant message with reasoning.supported=true found in this conversation.")
            sys.exit(1)
        print(f"Found message: {message_id}")

    # ── Test 1: Generate summary ──────────────────────────────────────────────
    print("\n[Test 1] Generating reasoning summary...")
    result = await get_or_generate_reasoning_summary(user_id, conv_id, message_id)
    print(f"  ok={result.get('ok')}  cached={result.get('cached')}")

    assert result.get("ok"), f"Summary generation failed: {result.get('error')}"
    summary = result.get("summary", "")
    print(f"  Summary ({len(summary)} chars):\n---\n{summary}\n---")

    # ── Quality checks ────────────────────────────────────────────────────────
    bullet_count = sum(1 for line in summary.splitlines() if line.strip().startswith("-"))
    print(f"  Bullet points detected: {bullet_count}")
    assert bullet_count >= 3, f"Expected at least 3 bullets, got {bullet_count}"
    assert len(summary) >= 100, f"Summary too short ({len(summary)} chars)"
    vague_phrases = ["the AI considered", "Here is a summary", "In summary"]
    for phrase in vague_phrases:
        assert phrase.lower() not in summary.lower(), f"Vague phrase found: '{phrase}'"
    print("  Quality checks passed.")

    # ── Test 2: Cache hit ─────────────────────────────────────────────────────
    print("\n[Test 2] Verifying cache (second call should return cached=True)...")
    result2 = await get_or_generate_reasoning_summary(user_id, conv_id, message_id)
    assert result2.get("ok"), f"Cache call failed: {result2.get('error')}"
    assert result2.get("cached"), "Expected cached=True on second call"
    assert result2.get("summary") == summary, "Cached summary differs from original"
    print("  Cache hit confirmed.")

    print("\nAll tests passed.")


if __name__ == "__main__":
    asyncio.run(run_test())
