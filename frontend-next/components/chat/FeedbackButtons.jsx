'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { chatService } from "../../services/chatService";
import { WithTooltip } from "../ui/tooltip";

/**
 * Thumbs up / down feedback buttons shown below completed assistant messages.
 * Props:
 *   messageId  — message ID (string, must be a real DB ID, not "__streaming__")
 *   convId     — conversation UUID
 */
export default function FeedbackButtons({ messageId, convId }) {
  const [selected, setSelected] = useState(null); // 'positive' | 'negative' | null
  const [saving, setSaving] = useState(false);

  if (!messageId || !convId) return null;

  const handleFeedback = async (feedback) => {
    if (saving) return;
    // Toggle off if same feedback clicked again
    const newFeedback = selected === feedback ? null : feedback;
    setSelected(newFeedback);
    if (!newFeedback) return; // no API call for de-select (just visual)
    setSaving(true);
    try {
      await chatService.saveFeedback(messageId, convId, newFeedback);
    } catch (e) {
      console.error("Failed to save feedback", e);
      setSelected(null); // revert on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <WithTooltip tip="Good response">
        <button
          onClick={() => handleFeedback("positive")}
          disabled={saving}
          className={`p-1 rounded-lg transition-all ${selected === "positive"
              ? "text-green-600 bg-green-50"
              : "text-gray-300 hover:text-green-500 hover:bg-green-50/60"
            }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
      </WithTooltip>
      <WithTooltip tip="Bad response">
        <button
          onClick={() => handleFeedback("negative")}
          disabled={saving}
          className={`p-1 rounded-lg transition-all ${selected === "negative"
              ? "text-red-500 bg-red-50"
              : "text-gray-300 hover:text-red-400 hover:bg-red-50/60"
            }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </WithTooltip>
    </div>
  );
}
