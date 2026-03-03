#!/usr/bin/env python3
"""
Unified model probe suite for YesBill.

Calls POST /chat/models/probe and prints a compact provider/model availability report.

Usage:
  python scripts/model_probe_suite.py --base-url http://localhost:8000/api --token <JWT>
  python scripts/model_probe_suite.py --provider openai --output probe_report.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class ProbeRow:
    provider: str
    model_id: str
    status: str
    checked_at: str
    reason: str
    is_preview: bool
    is_deprecated: bool
    reasoning_supported: bool
    reasoning_label: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run YesBill model availability probe suite.")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("YESBILL_API_URL", "http://localhost:8000/api"),
        help="Backend API base URL (default: %(default)s)",
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("YESBILL_TOKEN"),
        help="Bearer JWT token (or set YESBILL_TOKEN env var)",
    )
    parser.add_argument(
        "--provider",
        default=None,
        help="Optional provider filter (openai|anthropic|google)",
    )
    parser.add_argument(
        "--no-force-refresh",
        action="store_true",
        help="Use cached probe values if still fresh",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path to save raw JSON response",
    )
    return parser.parse_args()


def post_probe(base_url: str, token: str, provider: str | None, force_refresh: bool) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/chat/models/probe"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "provider": provider,
        "force_refresh": force_refresh,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=90)
    if resp.status_code >= 400:
        raise RuntimeError(f"Probe request failed ({resp.status_code}): {resp.text}")
    return resp.json()


def flatten_rows(report: dict[str, Any]) -> list[ProbeRow]:
    rows: list[ProbeRow] = []
    for provider_block in report.get("providers", []):
        provider_id = provider_block.get("provider", "")
        for model in provider_block.get("models", []):
            rows.append(
                ProbeRow(
                    provider=provider_id,
                    model_id=model.get("id", ""),
                    status=model.get("availability_status", "unknown"),
                    checked_at=model.get("availability_checked_at", "") or "",
                    reason=model.get("availability_message", "") or "",
                    is_preview=bool(model.get("is_preview", False)),
                    is_deprecated=bool(model.get("is_deprecated", False)),
                    reasoning_supported=bool(model.get("reasoning_supported", False)),
                    reasoning_label=model.get("reasoning_label", "") or "Reasoning support",
                )
            )
    return rows


def print_report(report: dict[str, Any]) -> None:
    rows = flatten_rows(report)
    if not rows:
        print("No probe rows returned. Check provider settings and API keys.")
        return

    print(f"Checked at: {report.get('checked_at')}")
    print(f"Models probed: {report.get('probed_models', len(rows))}")
    print(f"Models available: {report.get('available_models', 0)}")
    print("")

    header = (
        f"{'Provider':<10}  {'Model':<34}  {'Status':<12}  {'Preview':<7}  "
        f"{'Deprecated':<10}  {'Reasoning':<9}  {'Checked At'}"
    )
    print(header)
    print("-" * len(header))

    for row in rows:
        print(
            f"{row.provider:<10}  {row.model_id:<34}  {row.status:<12}  "
            f"{str(row.is_preview):<7}  {str(row.is_deprecated):<10}  "
            f"{str(row.reasoning_supported):<9}  {row.checked_at}"
        )
        if row.reason:
            print(f"    reason: {row.reason}")
        if row.reasoning_supported:
            print(f"    reasoning_label: {row.reasoning_label}")


def main() -> int:
    args = parse_args()
    if not args.token:
        print("Missing token. Provide --token or set YESBILL_TOKEN.", file=sys.stderr)
        return 1

    try:
        report = post_probe(
            base_url=args.base_url,
            token=args.token,
            provider=args.provider,
            force_refresh=not args.no_force_refresh,
        )
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2

    print_report(report)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fp:
            json.dump(report, fp, indent=2)
        print(f"\nSaved raw report to: {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
