// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { chatService } from "../../services/chatService";

/**
 * Renders an action confirmation card inline in the agent chat.
 * Props:
 *   actions      — list of { action_id, action_type, summary_text, diff }
 *   onConfirmed  — callback(message: string, messageId?: string) after success
 *   onCancelled  — callback() after cancel
 */
export default function ActionConfirmCard({ actions = [], onConfirmed, onCancelled }) {
  const [status, setStatus] = useState("pending"); // 'pending' | 'confirming' | 'confirmed' | 'cancelled'
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setStatus("confirming");
    setError(null);
    try {
      let lastMessageId = null;
      const results = [];
      for (const action of actions) {
        const result = await chatService.executeAction(action.action_id, true);
        results.push(result?.message || "Done.");
        if (result?.message_id) lastMessageId = result.message_id;
      }
      setStatus("confirmed");
      onConfirmed?.(results.join(" "), lastMessageId);
    } catch (e) {
      // Parse error: message format is "STATUS: {json}" or plain string
      let msg = e.message || "Failed to execute action.";
      const colonIdx = msg.indexOf(": ");
      if (colonIdx !== -1) {
        try {
          const parsed = JSON.parse(msg.slice(colonIdx + 2));
          msg = parsed.detail || parsed.message || msg;
        } catch {
          msg = msg.slice(colonIdx + 2) || msg;
        }
      }
      setError(msg);
      setStatus("pending");
    }
  };

  const handleCancel = async () => {
    setStatus("confirming");
    try {
      for (const action of actions) {
        await chatService.executeAction(action.action_id, false);
      }
    } catch {
      // ignore cancel errors
    }
    setStatus("cancelled");
    onCancelled?.();
  };

  if (status === "confirmed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        Done! Changes applied.
      </motion.div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
        <XCircle className="w-4 h-4 flex-shrink-0" />
        Action cancelled.
      </div>
    );
  }

  const summaryText =
    actions.length === 1
      ? actions[0].summary_text
      : `${actions.length} changes pending confirmation`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-100/60 border-b border-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-amber-800">Action Required</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-gray-700">{summaryText}</p>

        {/* Diff table — one row per action */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 text-sm">
          {actions.map((action) => (
            <div key={action.action_id} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0 truncate">
                {action.diff?.label || action.action_type}
              </span>
              {actions.length > 1 && (
                <span className="text-xs text-gray-400 w-24 flex-shrink-0 truncate">
                  {action.summary_text}
                </span>
              )}
              <span className="text-gray-500 line-through text-xs">{action.diff?.old}</span>
              <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-emerald-700 font-semibold text-xs">{action.diff?.new}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 border-t border-amber-200">
        <button
          onClick={handleCancel}
          disabled={status === "confirming"}
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={status === "confirming"}
          className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {status === "confirming" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Confirming…
            </span>
          ) : actions.length > 1 ? (
            `Confirm All (${actions.length})`
          ) : (
            "Confirm Changes"
          )}
        </button>
      </div>
    </motion.div>
  );
}
