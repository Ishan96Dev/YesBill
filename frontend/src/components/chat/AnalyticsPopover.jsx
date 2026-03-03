// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart2 } from "lucide-react";
import { WithTooltip } from "../ui/tooltip";

const USD_TO_INR = 85;

/**
 * AnalyticsPopover — small chart icon that opens a floating card
 * showing per-message LLM usage metrics.
 *
 * Props:
 *   analyticsData  — single analytics object from message_analytics table
 *   model          — model_used string e.g. "google/gemini-2.5-flash"
 */
export default function AnalyticsPopover({ analyticsData, model }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [placeBelow, setPlaceBelow] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const positionPanel = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const MARGIN = 8;
    const GAP = 8;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const targetWidth = Math.max(
      260,
      Math.min(320, viewportWidth - MARGIN * 2)
    );
    const measuredWidth = panelRef.current?.offsetWidth || targetWidth;
    const measuredHeight = panelRef.current?.offsetHeight || 0;

    const spaceAbove = triggerRect.top - MARGIN;
    const spaceBelow = viewportHeight - triggerRect.bottom - MARGIN;
    const shouldPlaceBelow =
      measuredHeight > 0
        ? spaceBelow >= measuredHeight || spaceBelow > spaceAbove
        : spaceBelow > spaceAbove;

    const maxLeft = Math.max(MARGIN, viewportWidth - measuredWidth - MARGIN);
    const left = Math.min(Math.max(triggerRect.left, MARGIN), maxLeft);

    const belowTop = Math.max(
      MARGIN,
      Math.min(triggerRect.bottom + GAP, viewportHeight - measuredHeight - MARGIN)
    );
    const aboveTop = Math.max(MARGIN, triggerRect.top - measuredHeight - GAP);
    const top = shouldPlaceBelow ? belowTop : aboveTop;

    setPlaceBelow(shouldPlaceBelow);
    setPanelStyle({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${Math.round(targetWidth)}px`,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Keep popover inside viewport
  useEffect(() => {
    if (!open) return;
    positionPanel();
    const raf = requestAnimationFrame(positionPanel);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, positionPanel]);

  if (!analyticsData) return null;

  const {
    tokens_in = 0,
    tokens_out = 0,
    tokens_thinking,
    cost_usd = 0,
    latency_ms = 0,
    ttft_ms,
    chunks_count = 0,
  } = analyticsData;

  const costUsd = parseFloat(cost_usd) || 0;
  const costInr = costUsd * USD_TO_INR;

  // Format model label: "google/gemini-2.5-flash" → "gemini-2.5-flash"
  const modelLabel = model ? model.split("/").pop() : "—";

  // Format latency
  const fmtMs = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div className="relative inline-block" ref={triggerRef}>
      {/* Icon button — matches FeedbackButtons style */}
      <WithTooltip tip={open ? "" : "Response analytics"} side="top">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`!h-7 !min-h-7 !w-7 !px-0 !py-0 !rounded-lg flex items-center justify-center transition-all ${
            open
              ? "text-primary bg-primary/10"
              : "text-gray-300 hover:text-primary hover:bg-primary/10"
          }`}
          aria-label="View response analytics"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </WithTooltip>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle || { top: "-9999px", left: "-9999px", width: "320px" }}
            className="fixed z-[80] rounded-xl bg-white shadow-xl shadow-black/10 border border-gray-200/70 max-h-[70vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3 text-primary" />
                Analytics
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[155px]">
                {modelLabel}
              </span>
            </div>

            <div className="px-3 py-2 space-y-2.5">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Tokens
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <MetricBox label="Input" value={tokens_in.toLocaleString()} />
                  <MetricBox label="Output" value={tokens_out.toLocaleString()} />
                  {tokens_thinking > 0 && (
                    <div className="col-span-2">
                      <MetricBox
                        label="Thinking"
                        value={tokens_thinking.toLocaleString()}
                        accent
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Cost
                </p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{costInr.toFixed(4)}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">
                    ${costUsd.toFixed(6)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Performance
                </p>
                <div className="space-y-1">
                  <PerfRow label="Total latency" value={fmtMs(latency_ms)} />
                  {ttft_ms != null && (
                    <PerfRow label="First token" value={fmtMs(ttft_ms)} />
                  )}
                  {chunks_count > 0 && (
                    <PerfRow label="Chunks" value={chunks_count} />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`absolute left-3 w-2.5 h-2.5 bg-white border-gray-200/70 rotate-45 ${
                placeBelow
                  ? "-top-1.5 border-l border-t"
                  : "-bottom-1.5 border-r border-b"
              }`}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

function MetricBox({ label, value, accent = false }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${accent ? "bg-primary/8 border border-primary/15" : "bg-gray-50"}`}>
      <p className={`text-[10px] font-medium mb-0.5 ${accent ? "text-primary" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-sm font-semibold ${accent ? "text-primary" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}

function PerfRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}
