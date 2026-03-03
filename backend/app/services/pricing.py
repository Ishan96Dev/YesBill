# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""
LLM pricing tables and cost calculation for YesBill.

Prices are in USD per million tokens (as of early 2026).
Update the MODEL_PRICING dict when providers change their pricing.
Estimated values are marked with comments.
"""

# ---------------------------------------------------------------------------
# Pricing per million tokens (USD)
# Format: "provider/model_id": {"in": float, "out": float, "thinking": float}
# ---------------------------------------------------------------------------
MODEL_PRICING: dict[str, dict[str, float]] = {
    # ── OpenAI ──────────────────────────────────────────────────────────────
    "openai/gpt-4o-mini":   {"in": 0.15,  "out": 0.60,  "thinking": 0.0},
    "openai/gpt-4o":        {"in": 2.50,  "out": 10.00, "thinking": 0.0},
    "openai/gpt-4.1":       {"in": 2.00,  "out": 8.00,  "thinking": 0.0},
    "openai/gpt-5":         {"in": 5.00,  "out": 20.00, "thinking": 0.0},   # estimated
    "openai/gpt-5.2":       {"in": 5.00,  "out": 20.00, "thinking": 0.0},   # estimated

    # ── Anthropic ───────────────────────────────────────────────────────────
    "anthropic/claude-haiku-4-5-20251001": {"in": 0.80,  "out": 4.00,  "thinking": 4.00},
    "anthropic/claude-sonnet-4-6":         {"in": 3.00,  "out": 15.00, "thinking": 15.00},
    "anthropic/claude-opus-4-6":           {"in": 15.00, "out": 75.00, "thinking": 75.00},

    # ── Google ──────────────────────────────────────────────────────────────
    "google/gemini-2.5-flash":       {"in": 0.075, "out": 0.30,  "thinking": 0.10},
    "google/gemini-2.5-pro":         {"in": 1.25,  "out": 10.00, "thinking": 3.50},
    "google/gemini-3.1-pro-preview": {"in": 2.00,  "out": 12.00, "thinking": 4.00},  # estimated
    "google/gemini-3-flash-preview": {"in": 0.10,  "out": 0.40,  "thinking": 0.10},  # estimated
}

# Fallback for unknown models — conservative mid-tier estimate
_DEFAULT_PRICING: dict[str, float] = {"in": 1.00, "out": 4.00, "thinking": 4.00}


def calculate_cost(
    provider: str,
    model: str,
    tokens_in: int,
    tokens_out: int,
    tokens_thinking: int = 0,
) -> float:
    """
    Calculate estimated cost in USD for an LLM response.

    Args:
        provider: LLM provider id (e.g. "openai", "anthropic", "google")
        model: Model id (e.g. "gpt-4o-mini")
        tokens_in: Input / prompt token count
        tokens_out: Output / completion token count (excluding thinking)
        tokens_thinking: Reasoning / thinking token count (default 0)

    Returns:
        Estimated cost in USD, rounded to 8 decimal places.
    """
    key = f"{provider}/{model}"
    pricing = MODEL_PRICING.get(key, _DEFAULT_PRICING)

    cost = (
        (tokens_in       * pricing["in"])                      / 1_000_000
        + (tokens_out    * pricing["out"])                     / 1_000_000
        + (tokens_thinking * pricing.get("thinking", pricing["out"])) / 1_000_000
    )
    return round(cost, 8)

