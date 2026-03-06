'use client'
﻿import { assetUrl } from "../../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Plus, History, MessageSquare, ChevronDown, Copy, Check, Settings, AlertCircle, Sparkles, Trash2 } from "lucide-react";
import Link from 'next/link';
import ReactMarkdown from "react-markdown";
import MarkdownRenderer from "../chat/MarkdownRenderer";
import ActionConfirmCard from "./ActionConfirmCard";
import FeedbackButtons from "../chat/FeedbackButtons";
import AnalyticsPopover from "../chat/AnalyticsPopover";
import { chatService } from "../../services/chatService";
import { aiSettingsService } from "../../services/aiSettingsService";
import { WithTooltip } from "../ui/tooltip";
import { useUser } from "../../hooks/useUser";

const STREAMING_ID = "__streaming__";
const WELCOME = "Hi! I'm YesBill Assistant. I can help you manage your services, bills, and calendar. What would you like to do?";

function normalizeUiError(err, fallback = "Something went wrong. Please try again.") {
  const raw = typeof err === "string" ? err : err?.message || "";
  const cleaned = raw.replace(/^\s*\d{3}\s*:\s*/, "").trim();
  if (!cleaned) return fallback;
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed?.detail === "string" && parsed.detail.trim()) return parsed.detail.trim();
      if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message.trim();
    } catch {
      return cleaned;
    }
  }
  return cleaned;
}

/** Small copy-to-clipboard button — compact size for agent popup. */
function CopyButton({ text, tip = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <WithTooltip tip={copied ? "Copied!" : tip}>
      <button
        type="button"
        onClick={handleCopy}
        className={`p-0.5 rounded transition-colors ${className}`}
      >
        {copied
          ? <Check className="w-2.5 h-2.5 text-emerald-500" />
          : <Copy className="w-2.5 h-2.5 text-gray-400 hover:text-gray-600" />}
      </button>
    </WithTooltip>
  );
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Compact unified ThoughtBlock for agent popup — same logic as main chat, smaller sizing. */
function AgentThoughtBlock({ thinkingContent, thinkingActive, waitMessage, reasoningSummary, thinkingDuration }) {
  const [expanded, setExpanded] = useState(false);

  // State 1: Gemini 3.1 Pro wait banner
  if (waitMessage && thinkingActive) {
    return (
      <motion.div
        className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-[10px] text-violet-600 overflow-hidden"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-xs">⏳</span>
        <span className="font-medium">{waitMessage}</span>
      </motion.div>
    );
  }

  // State 2: Active thinking — staggered dots
  if (thinkingActive) {
    return (
      <div className="flex items-center gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-violet-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
        <span className="text-[10px] text-gray-400 ml-0.5">Thinking...</span>
      </div>
    );
  }

  if (!thinkingContent && !reasoningSummary && !thinkingDuration) return null;

  // State 3: Complete — collapsible chip
  const hasContent = !!(thinkingContent || reasoningSummary);
  const isLoadingSummary = !!(thinkingDuration && !hasContent);
  const durationLabel = thinkingDuration
    ? ` · ${thinkingDuration >= 60 ? `${Math.round(thinkingDuration / 6) / 10}m` : `${thinkingDuration}s`}`
    : "";

  return (
    <div className="mb-1.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[10px] text-violet-700 hover:bg-violet-100 hover:border-violet-300 cursor-pointer transition-colors"
      >
        <Sparkles className="w-2.5 h-2.5" />
        <span>Thought{durationLabel}</span>
        {isLoadingSummary ? (
          <motion.span
            className="text-violet-400 text-[9px] leading-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >•••</motion.span>
        ) : (
          <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="agent-thought-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 rounded-lg border border-violet-100 bg-violet-50/60 overflow-hidden">
              {!hasContent && (
                <div className="p-2 text-center">
                  <motion.span
                    className="text-[10px] text-violet-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >Loading reasoning summary...</motion.span>
                </div>
              )}
              {thinkingContent && (
                <div className="p-1.5 max-h-36 overflow-y-auto text-[10px] font-mono text-violet-800 whitespace-pre-wrap leading-relaxed">
                  {thinkingContent}
                </div>
              )}
              {reasoningSummary && (
                <div className={`px-1.5 pb-1.5 ${thinkingContent ? "pt-0" : "pt-1.5"}`}>
                  {thinkingContent && (
                    <div className="flex items-center gap-1.5 mb-1 pt-1.5 border-t border-violet-100">
                      <span className="text-[9px] font-semibold text-violet-500 uppercase tracking-wide">Reasoning Summary</span>
                    </div>
                  )}
                  <div className="prose prose-xs max-w-none text-[10px] text-violet-900 [&_*]:text-violet-900 prose-p:my-0.5 prose-ul:my-0 prose-li:my-0">
                    <ReactMarkdown>{reasoningSummary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** User avatar: image or initials fallback */
function UserAvatar({ avatarUrl, name }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "You"}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0">
      {(name || "U")[0].toUpperCase()}
    </div>
  );
}

const AgentMessage = memo(function AgentMessage({ msg, onConfirmed, onCancelled, convId, userName, userAvatarUrl }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end group">
        <div className="flex items-end gap-1">
          {/* Copy button — appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1">
            <CopyButton text={msg.content} tip="Copy query" />
          </div>
          <div className="max-w-[85%]">
            {/* Name + avatar row */}
            <div className="flex items-center justify-end gap-1 mb-1">
              {userName && (
                <span className="text-[10px] text-gray-400 font-medium">{userName}</span>
              )}
              <UserAvatar avatarUrl={userAvatarUrl} name={userName} />
            </div>
            <div className="bg-gradient-to-br from-primary to-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "action_required") {
    return (
      <ActionConfirmCard
        actions={msg.actions}
        onConfirmed={onConfirmed}
        onCancelled={onCancelled}
      />
    );
  }

  const isCompleted = !msg.streaming && msg.id && msg.id !== STREAMING_ID && msg.content;

  return (
    <div className="flex gap-2 items-start group">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
        <img
          src={assetUrl("/assets/branding/yesbill_logo_black.png")}
          alt="YB"
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        {/* Assistant name label */}
        <p className="text-[10px] text-gray-400 font-medium mb-1">YesBill Assistant</p>

        {/* Early loading indicator — violet dots before thinking tokens arrive */}
        {msg.streaming && !msg.thinkingActive && !msg.waitMessage && !msg.thinkingContent && !msg.content && !msg.isError && (
          <div className="flex items-center gap-1.5 py-2 px-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Unified ThoughtBlock — covers all thinking states */}
        {(msg.thinkingContent !== undefined || msg.thinkingActive || msg.waitMessage || msg.metadata?.reasoning?.summary || msg.thinkingDuration) && !msg.isError && (
          <AgentThoughtBlock
            thinkingContent={msg.thinkingContent || ""}
            thinkingActive={!!msg.thinkingActive}
            waitMessage={msg.waitMessage}
            reasoningSummary={msg.metadata?.reasoning?.summary}
            thinkingDuration={msg.thinkingDuration}
          />
        )}

        {/* Message bubble */}
        {msg.isError ? (
          <div className="max-w-[85%] bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[85%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
            {msg.content ? (
              <MarkdownRenderer content={msg.content} compact isStreaming={!!msg.streaming} />
            ) : (
              <div className="flex items-center gap-1 py-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}

        {isCompleted && convId && (
          <div className="flex items-center gap-1 mt-0.5">
            {msg.message_analytics && (
              <AnalyticsPopover
                analyticsData={
                  Array.isArray(msg.message_analytics)
                    ? msg.message_analytics[0] || null
                    : msg.message_analytics
                }
                model={msg.model_used}
              />
            )}
            <FeedbackButtons messageId={msg.id} convId={convId} />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={msg.content} tip="Copy response" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default function AgentPopup({ onClose, convId, setConvId, onTitleUpdate }) {
  const [messages, setMessages] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true); // true until first load attempt completes
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [waitingForConfirm, setWaitingForConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true); // default true to avoid flash
  const [defaultReasoningEffort, setDefaultReasoningEffort] = useState("none");
  const bottomRef = useRef(null);
  const skipConvFetchRef = useRef(false); // prevents useEffect overwriting in-progress messages when handleSend creates a new conv
  const lastAnalyticsRef = useRef(null); // stores analytics from last done event (for action_required flow)
  const isSubmittingRef = useRef(false); // blocks re-entry during the async gap before setStreaming(true)
  const { displayName, avatarUrl } = useUser();

  // Check if AI is configured and capture the user's default reasoning effort preference
  useEffect(() => {
    chatService.getModels()
      .then((data) => {
        setAiConfigured(data?.configured ?? false);
        // Respect the user's global default — e.g. "none" means no thinking tokens
        setDefaultReasoningEffort(data?.default_reasoning_effort || "none");
      })
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content, streaming]);

  // Resolve initial state: if no convId, we're on a fresh session — show WELCOME
  useEffect(() => {
    if (!convId) {
      setIsInitializing(false);
      return;
    }
    // convId was set by handleSend (new conv just created) — skip fetch to preserve in-progress messages
    if (skipConvFetchRef.current) {
      skipConvFetchRef.current = false;
      return;
    }
    setLoadingConversation(true);
    chatService
      .getMessages(convId)
      .then((data) => {
        const msgs = (data?.messages || []).map((m) => ({
          ...m,
          isError: m.metadata?.type === "error",
        }));
        setMessages(msgs.length > 0 ? msgs : []);
        setWaitingForConfirm(false);
        setStreaming(false);
      })
      .catch(() => { })
      .finally(() => {
        setLoadingConversation(false);
        setIsInitializing(false);
      });
  }, [convId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await chatService.listConversations("agent");
      setHistory(data?.conversations || []);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
  };

  const handleSelectHistory = (id) => {
    setConvId(id);
    setShowHistory(false);
  };

  const handleReset = () => {
    setConvId(null);
    setMessages([]);
    setIsInitializing(false); // fresh session — immediately show WELCOME
    setWaitingForConfirm(false);
    setStreaming(false);
    setShowHistory(false);
  };

  const handleDeleteConv = async (id) => {
    try {
      await chatService.deleteConversation(id);
      setHistory((prev) => prev.filter((c) => c.id !== id));
      // If we just deleted the active conversation, reset to fresh session
      if (id === convId) handleReset();
    } catch {
      // silently ignore
    }
  };

  const handleClearAll = async () => {
    try {
      await chatService.deleteAllAgentConversations();
      setHistory([]);
      handleReset();
    } catch {
      // silently ignore
    }
  };

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming || waitingForConfirm || isSubmittingRef.current) return;

    isSubmittingRef.current = true;

    let activeConvId = convId;
    if (!activeConvId) {
      try {
        const conv = await chatService.createConversation("agent", "YesBill Assistant");
        activeConvId = conv.id;
        skipConvFetchRef.current = true; // prevent useEffect from overwriting streaming messages
        setConvId(conv.id);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Failed to start session. Please try again.", id: Date.now() },
        ]);
        isSubmittingRef.current = false;
        return;
      }
    }

    const userMsg = { role: "user", content: trimmed, id: Date.now() };
    const assistantMsg = { role: "assistant", content: "", id: STREAMING_ID, streaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    let fullContent = "";
    let fullThinking = "";
    let hadWaitMessage = false;
    let hadThinkingEvent = false;
    let thinkingStartTime = null;
    let pendingFlush = false;
    let flushFrame = null;
    const flushChunk = () => {
      pendingFlush = false;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAMING_ID ? { ...m, content: fullContent, streaming: true } : m
        )
      );
    };
    const scheduleFlush = () => {
      if (pendingFlush) return;
      pendingFlush = true;
      flushFrame = requestAnimationFrame(flushChunk);
    };

    try {
      for await (const event of chatService.streamAgentMessage(activeConvId, trimmed, defaultReasoningEffort)) {
        if (event.type === "thinking") {
          hadThinkingEvent = true;
          if (!thinkingStartTime) thinkingStartTime = Date.now();
          fullThinking += event.content || "";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID
                ? { ...m, thinkingContent: fullThinking, thinkingActive: true, streaming: true }
                : m
            )
          );
        } else if (event.type === "thinking_wait") {
          hadThinkingEvent = true;
          if (!thinkingStartTime) thinkingStartTime = Date.now();
          hadWaitMessage = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID
                ? { ...m, waitMessage: event.content, thinkingActive: true, streaming: true }
                : m
            )
          );
        } else if (event.type === "chunk") {
          if (fullThinking || hadWaitMessage || hadThinkingEvent) {
            const thinkingDuration = thinkingStartTime
              ? Math.round((Date.now() - thinkingStartTime) / 100) / 10
              : undefined;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID && m.thinkingActive
                  ? { ...m, thinkingActive: false, waitMessage: undefined, thinkingDuration }
                  : m
              )
            );
          }
          fullContent += event.content || "";
          scheduleFlush();
        } else if (event.type === "action_required") {
          if (flushFrame) cancelAnimationFrame(flushFrame);
          // Capture analytics NOW — the frontend returns early here so the done
          // event after action_required is never read; analytics come via this event.
          if (event.analytics) lastAnalyticsRef.current = event.analytics;
          // Normalize to always use actions list (supports both single and batch)
          const actions = event.actions || [{
            action_id: event.action_id,
            action_type: event.action_type,
            summary_text: event.summary_text,
            diff: event.diff,
          }];
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== STREAMING_ID),
            {
              type: "action_required",
              id: actions[0]?.action_id || Date.now(),
              actions,
              summaryText: event.summary_text,
            },
          ]);
          setWaitingForConfirm(true);
          setStreaming(false);
          return;
        } else if (event.type === "done") {
          if (flushFrame) cancelAnimationFrame(flushFrame);
          if (pendingFlush) flushChunk();
          // Capture analytics for use in handleConfirmed (action_required path)
          if (event.analytics) lastAnalyticsRef.current = event.analytics;
          const thinkingDuration = thinkingStartTime
            ? Math.round((Date.now() - thinkingStartTime) / 100) / 10
            : undefined;
          const finalMessageId = event.message_id || Date.now();
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== STREAMING_ID),
            {
              role: "assistant",
              content: fullContent,
              id: finalMessageId,
              streaming: false,
              metadata: event.reasoning ? { reasoning: event.reasoning } : undefined,
              // Only attach thinkingContent when we actually received thinking tokens.
              // Using hadThinkingEvent as guard prevents storing undefined on non-thinking responses.
              thinkingContent: hadThinkingEvent ? fullThinking : undefined,
              thinkingDuration,
              model_used: event.model || undefined,
              message_analytics: event.analytics ? [event.analytics] : undefined,
            },
          ]);
          // Eagerly pre-fetch reasoning summary in background
          if (event.reasoning?.supported && finalMessageId && activeConvId) {
            chatService.getReasoningSummary(String(finalMessageId), activeConvId)
              .then((result) => {
                if (result?.summary) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === finalMessageId
                        ? {
                          ...m,
                          metadata: {
                            ...m.metadata,
                            reasoning: { ...m.metadata?.reasoning, summary: result.summary },
                          },
                        }
                        : m
                    )
                  );
                }
              })
              .catch(() => { });
          }
        } else if (event.type === "title") {
          onTitleUpdate?.(activeConvId, event.title);
          // Also update local history state so the title shows immediately in the history panel
          setHistory((prev) =>
            prev.map((c) => c.id === activeConvId ? { ...c, title: event.title } : c)
          );
        } else if (event.type === "error") {
          const safeError = normalizeUiError(event.message, "Agent request failed. Please try again.");
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== STREAMING_ID),
            {
              role: "assistant",
              content: safeError,
              id: event.message_id || Date.now(),
              isError: true,
            },
          ]);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== STREAMING_ID),
        {
          role: "assistant",
          content: normalizeUiError(err, "Connection error. Please try again."),
          id: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      if (flushFrame) cancelAnimationFrame(flushFrame);
      isSubmittingRef.current = false;
      setStreaming(false);
    }
  }, [input, streaming, waitingForConfirm, convId]);

  const handleConfirmed = (message, messageId) => {
    setWaitingForConfirm(false);
    const analytics = lastAnalyticsRef.current;
    lastAnalyticsRef.current = null;
    setMessages((prev) => [
      ...prev.filter((m) => m.type !== "action_required"),
      {
        role: "assistant",
        content: `Done! ${message}`,
        id: messageId || Date.now(),
        model_used: analytics?.model_used || undefined,
        message_analytics: analytics ? [analytics] : undefined,
      },
    ]);
  };

  const handleCancelled = () => {
    setWaitingForConfirm(false);
    setMessages((prev) => [
      ...prev.filter((m) => m.type !== "action_required"),
      { role: "assistant", content: "Action cancelled. Is there anything else I can help with?", id: Date.now() },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
      className="w-[min(92vw,380px)] h-[min(78vh,520px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
            <img
              src={assetUrl("/assets/branding/yesbill_logo_icon_only.png")}
              alt="YesBill"
              className="w-6 h-6 object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">YesBill Assistant</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-xs text-white/70">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <WithTooltip tip="Conversation history">
            <button
              onClick={handleToggleHistory}
              className={`p-1.5 rounded-lg transition-colors ${showHistory ? "bg-white/30" : "hover:bg-white/20"}`}
            >
              <History className="w-4 h-4" />
            </button>
          </WithTooltip>
          <WithTooltip tip="New session">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </WithTooltip>
          <WithTooltip tip="Close">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </WithTooltip>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto bg-gray-50"
          >
            <div className="px-3 py-2 border-b border-gray-100 bg-white flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Past Conversations</p>
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400">No past conversations</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {history.map((conv) => (
                  <div key={conv.id} className="flex items-center group">
                    <button
                      onClick={() => handleSelectHistory(conv.id)}
                      className={`flex-1 text-left px-3 py-2.5 rounded-xl transition-colors text-sm ${conv.id === convId
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700 hover:bg-white hover:shadow-sm"
                        }`}
                    >
                      <p className="truncate font-medium">{conv.title || "Untitled Session"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{relativeTime(conv.updated_at)}</p>
                    </button>
                    <button
                      onClick={() => handleDeleteConv(conv.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50"
          >
            {isInitializing || loadingConversation ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 rounded-xl bg-gray-200" />
                <div className="h-16 rounded-xl bg-gray-100" />
                <div className="h-12 rounded-xl bg-gray-100" />
              </div>
            ) : messages.length === 0 ? (
              <AgentMessage
                msg={{ role: "assistant", content: WELCOME, id: "welcome" }}
                onConfirmed={handleConfirmed}
                onCancelled={handleCancelled}
                convId={convId}
                userName={displayName}
                userAvatarUrl={avatarUrl}
              />
            ) : (
              messages.map((msg) => (
                <AgentMessage
                  key={msg.id}
                  msg={msg}
                  onConfirmed={handleConfirmed}
                  onCancelled={handleCancelled}
                  convId={convId}
                  userName={displayName}
                  userAvatarUrl={avatarUrl}
                />
              ))
            )}
            <div ref={bottomRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {!showHistory && (
        <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          {!aiConfigured && (
            <Link href="/settings/ai"
              onClick={onClose}
              className="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Configure AI in <strong>Settings -&gt; AI Configuration</strong> to chat</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                !aiConfigured
                  ? "Configure AI in Settings to chat..."
                  : waitingForConfirm
                    ? "Confirm or cancel the action above..."
                    : streaming
                      ? "Thinking..."
                      : "Ask me anything..."
              }
              disabled={streaming || waitingForConfirm || !aiConfigured}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || waitingForConfirm || !aiConfigured}
              className="p-2 rounded-xl bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
