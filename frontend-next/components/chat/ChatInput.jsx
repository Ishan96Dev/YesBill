'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AtSign, Wand2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AtMentionPicker from "./AtMentionPicker";
import { chatService } from "../../services/chatService";
import { WithTooltip } from "../ui/tooltip";

const MAX_CHARS = 2000;

/** Animated @ context tag pill */
function ContextTagPill({ tag, label, onRemove }) {
  return (
    <motion.span
      layout
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-medium"
    >
      <AtSign className="w-3 h-3 flex-shrink-0 opacity-70" />
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onRemove(tag)}
        className="flex-shrink-0 p-0.5 rounded-full hover:bg-primary/20 hover:text-red-500 transition-colors ml-0.5"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </motion.span>
  );
}

export default function ChatInput({ onSend, streaming, disabled }) {
  const [text, setText] = useState("");
  const [contextTags, setContextTags] = useState([]); // [{tag, label}]
  const [showAtPicker, setShowAtPicker] = useState(false);
  const [atQuery, setAtQuery] = useState("");
  const [rephrasing, setRephrasing] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px"; // max ~6 rows
  }, [text]);

  // Alt+L rephrase shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key === "l" && text.trim() && !streaming && !disabled) {
        e.preventDefault();
        handleRephrase();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [text, streaming, disabled]);

  const handleRephrase = useCallback(async () => {
    if (!text.trim() || rephrasing) return;
    setRephrasing(true);
    try {
      const result = await chatService.rephrase(text.trim());
      if (result?.rephrased) setText(result.rephrased);
    } catch (e) {
      console.error("Rephrase failed", e);
    } finally {
      setRephrasing(false);
    }
  }, [text, rephrasing]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "@") {
      setShowAtPicker(true);
      setAtQuery("");
    }
    if (e.key === "Escape") setShowAtPicker(false);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && showAtPicker) {
      setAtQuery(val.slice(lastAt + 1));
    }
  };

  const handleAtSelect = ({ tag, label }) => {
    const lastAt = text.lastIndexOf("@");
    if (lastAt !== -1) setText(text.slice(0, lastAt));
    if (!contextTags.find((t) => t.tag === tag)) {
      setContextTags((prev) => [...prev, { tag, label }]);
    }
    setShowAtPicker(false);
  };

  const removeTag = (tag) => setContextTags((prev) => prev.filter((t) => t.tag !== tag));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || streaming || disabled) return;
    onSend(trimmed, contextTags.map((t) => t.tag));
    setText("");
    setContextTags([]);
    setShowAtPicker(false);
  };

  const canSend = text.trim().length > 0 && !streaming && !disabled;

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Unified input card */}
      <div className={`rounded-2xl border bg-white transition-all shadow-sm ${
        disabled
          ? "border-gray-200 opacity-60"
          : "border-gray-200 focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5"
      }`}>
        {/* Context tag pills — inside card, separated by border */}
        <AnimatePresence>
          {contextTags.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2 border-b border-gray-100"
            >
              {contextTags.map(({ tag, label }) => (
                <ContextTagPill key={tag} tag={tag} label={label} onRemove={removeTag} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="relative flex items-end gap-1 px-3 py-2">
          {/* @ mention picker */}
          <div className="relative flex-1">
            <AtMentionPicker
              open={showAtPicker}
              onSelect={handleAtSelect}
              onClose={() => setShowAtPicker(false)}
              query={atQuery}
            />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Configure AI in Settings to chat…" : "Ask YesBill Assistant… (@ for context, Alt+L to rephrase)"}
              disabled={disabled || streaming}
              rows={1}
              maxLength={MAX_CHARS}
              className="w-full resize-none bg-transparent py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
            />
            {/* Character count */}
            {text.length > MAX_CHARS * 0.8 && (
              <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                {text.length}/{MAX_CHARS}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 pb-0.5 flex-shrink-0">
            <WithTooltip content="Add context (@)">
              <button
                type="button"
                onClick={() => setShowAtPicker((v) => !v)}
                disabled={disabled}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              >
                <AtSign className="w-4 h-4" />
              </button>
            </WithTooltip>

            <WithTooltip content="Rephrase (Alt+L)">
              <button
                type="button"
                onClick={handleRephrase}
                disabled={disabled || streaming || !text.trim() || rephrasing}
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
              >
                {rephrasing ? (
                  <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin block" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </button>
            </WithTooltip>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`p-2 rounded-xl transition-all ${
                canSend
                  ? "bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {streaming ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-gray-400 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line · @ to add context
      </p>
    </div>
  );
}
