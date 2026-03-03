import { assetUrl } from "../../lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Check, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import MarkdownRenderer from "./MarkdownRenderer";
import FeedbackButtons from "./FeedbackButtons";
import AnalyticsPopover from "./AnalyticsPopover";
import { useUser } from "../../hooks/useUser";
import { WithTooltip } from "../ui/tooltip";


/** Small copy-to-clipboard button. Shows Check for 2s after click. */
function CopyButton({ text, tip = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <WithTooltip tip={copied ? "Copied!" : tip} side="top">
      <button
        type="button"
        onClick={handleCopy}
        className={`p-1 flex items-center justify-center rounded transition-colors ${className}`}
      >
        {copied
          ? <Check className="w-3.5 h-3.5 text-emerald-500" />
          : <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />}
      </button>
    </WithTooltip>
  );
}

/** User avatar: image or initials fallback */
function UserAvatar({ avatarUrl, name }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "You"}
        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
      {(name || "U")[0].toUpperCase()}
    </div>
  );
}

const UserMessage = memo(function UserMessage({ content, timestamp, userName, userAvatarUrl }) {
  return (
    <div className="flex justify-end group">
      <div className="max-w-[75%]">
        {/* Name + avatar row */}
        <div className="flex items-center justify-end gap-1.5 mb-1">
          {userName && (
            <span className="text-xs text-gray-500 font-medium">{userName}</span>
          )}
          <UserAvatar avatarUrl={userAvatarUrl} name={userName} />
        </div>
        <div className="bg-gradient-to-br from-primary to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={content} tip="Copy query" />
          </div>
          {timestamp && (
            <p className="text-xs text-gray-400">
              {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

/** Format thinking duration: 130s → "2.2m", 45s → "45s" */
function formatDuration(seconds) {
  if (seconds >= 60) return `${Math.round(seconds / 6) / 10}m`;
  return `${seconds}s`;
}

/**
 * Unified ThoughtBlock — replaces old ThinkingBlock + ReasoningPanel.
 *
 * States:
 *  1. thinkingActive + waitMessage → inline shimmer banner (Gemini 3.1 Pro silent wait)
 *  2. thinkingActive (no waitMessage) → 3 pulsing dots "Thinking..."
 *  3. complete → collapsible chip "💡 Thought · Xs" with thinking tokens + summary inside
 */
function ThoughtBlock({ thinkingContent, thinkingActive, waitMessage, reasoningSummary, thinkingDuration, progressElapsed = 0 }) {
  const [expanded, setExpanded] = useState(false);

  // State 1: Gemini 3.1 Pro wait banner — shimmer while silent thinking
  if (waitMessage && thinkingActive) {
    return (
      <motion.div
        className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100 text-xs text-violet-600 overflow-hidden relative"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-sm">⏳</span>
        <span className="font-medium flex-1">{waitMessage}</span>
        {progressElapsed > 0 && (
          <span className="pl-2 text-violet-400 font-mono tabular-nums shrink-0">{progressElapsed}s</span>
        )}
      </motion.div>
    );
  }

  // State 2: Active thinking — 3 staggered pulsing dots
  if (thinkingActive) {
    return (
      <div className="flex items-center gap-1.5 mb-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
        <span className="text-xs text-gray-400 ml-0.5">
          Thinking...{progressElapsed > 0 ? ` (${progressElapsed}s)` : ""}
        </span>
      </div>
    );
  }

  // Nothing to show
  if (!thinkingContent && !reasoningSummary && !thinkingDuration) return null;

  // State 3: Complete — collapsible chip
  const hasContent = !!(thinkingContent || reasoningSummary);
  const isLoadingSummary = !!(thinkingDuration && !hasContent);
  const durationLabel = thinkingDuration ? ` · ${formatDuration(thinkingDuration)}` : "";

  return (
    <div className="mb-2 w-full min-w-0 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs text-violet-700 hover:bg-violet-100 hover:border-violet-300 cursor-pointer transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        <span>Thought{durationLabel}</span>
        {isLoadingSummary ? (
          <motion.span
            className="text-violet-400 text-[10px] leading-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >•••</motion.span>
        ) : (
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="thought-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full min-w-0 overflow-hidden"
          >
            <div className="mt-1.5 rounded-lg border border-violet-100 bg-violet-50/60 w-full min-w-0 overflow-hidden">
              {/* Loading state — summary not yet fetched */}
              {!hasContent && (
                <div className="p-3 text-center">
                  <motion.span
                    className="text-xs text-violet-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >Loading reasoning summary...</motion.span>
                </div>
              )}

              {/* Reasoning summary — shown when available; supersedes raw tokens */}
              {reasoningSummary && (
                <div className="p-3 w-full min-w-0">
                  <div className="prose prose-xs max-w-full min-w-0 text-xs text-violet-900
                    [&_*]:text-violet-900 [&_*]:break-words [&_*]:max-w-full
                    [&_a]:break-all [&_a]:text-violet-700
                    [&_p]:my-0.5 [&_ul]:my-0.5 [&_li]:my-0 [&_strong]:font-semibold">
                    <ReactMarkdown>{reasoningSummary}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Raw thinking tokens — only shown when no summary available yet */}
              {thinkingContent && !reasoningSummary && (
                <div className="p-3 w-full min-w-0 max-h-56 overflow-y-auto">
                  <div className="prose prose-xs max-w-full min-w-0 text-xs text-violet-800
                    [&_*]:text-violet-800 [&_*]:break-words [&_*]:max-w-full
                    [&_a]:break-all [&_p]:my-0.5 [&_ul]:my-0.5 [&_li]:my-0
                    [&_strong]:font-semibold [&_em]:italic">
                    <ReactMarkdown>{thinkingContent}</ReactMarkdown>
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

const AssistantMessage = memo(function AssistantMessage({
  content,
  isStreaming,
  timestamp,
  messageId,
  convId,
  metadata,
  thinkingContent,
  thinkingActive,
  waitMessage,
  thinkingDuration,
  progressElapsed,
  isError,
  analyticsData,
  modelUsed,
}) {
  const isErrorMsg = isError || metadata?.type === "error";
  const reasoningSummary = metadata?.reasoning?.summary;

  // Show ThoughtBlock if any thinking state is active or complete
  const hasThought = thinkingContent !== undefined || thinkingActive || waitMessage || reasoningSummary || thinkingDuration;

  return (
    <div className="flex gap-3 items-start group">
      {/* YesBill logo avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
        <img
          src={assetUrl("/assets/branding/yesbill_logo_black.png")}
          alt="YesBill"
          className="w-6 h-6 object-contain"
        />
      </div>
      <div className="max-w-[80%] min-w-0 overflow-hidden">
        {/* Assistant name label */}
        <p className="text-xs text-gray-500 font-medium mb-1">YesBill Assistant</p>

        {/* Unified ThoughtBlock — covers all thinking states */}
        {hasThought && !isErrorMsg && (
          <ThoughtBlock
            thinkingContent={thinkingContent || ""}
            thinkingActive={!!thinkingActive}
            waitMessage={waitMessage}
            reasoningSummary={reasoningSummary}
            thinkingDuration={thinkingDuration}
            progressElapsed={progressElapsed || 0}
          />
        )}

        {/* Message bubble */}
        {isErrorMsg ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 leading-relaxed">{content}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            {content ? (
              <MarkdownRenderer content={content} isStreaming={isStreaming} />
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}

        {/* Timestamp + analytics + feedback + copy below bubble */}
        {!isStreaming && content && (
          <div className="flex items-center gap-2 mt-1">
            {timestamp && (
              <p className="text-xs text-gray-400">
                {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {analyticsData && (
              <AnalyticsPopover analyticsData={analyticsData} model={modelUsed} />
            )}
            {messageId && convId && (
              <FeedbackButtons messageId={messageId} convId={convId} />
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={content} tip="Copy response" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const MessageRow = memo(function MessageRow({ msg, idx, total, streaming, convId, userName, userAvatarUrl }) {
  const isLast = idx === total - 1;
  if (msg.role === "user") {
    return (
      <UserMessage
        content={msg.content}
        timestamp={msg.created_at}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
      />
    );
  }
  if (msg.role === "assistant") {
    const isStreamingMsg = isLast && streaming;
    const messageId = !isStreamingMsg && msg.id !== "__streaming__" ? msg.id : null;
    // message_analytics is returned as an array (Supabase join), take first element
    const analyticsData = Array.isArray(msg.message_analytics)
      ? msg.message_analytics[0] || null
      : msg.message_analytics || null;
    return (
      <AssistantMessage
        content={msg.content}
        isStreaming={isStreamingMsg}
        timestamp={msg.created_at}
        messageId={messageId}
        convId={convId}
        metadata={msg.metadata}
        thinkingContent={msg.thinkingContent}
        thinkingActive={msg.thinkingActive}
        waitMessage={msg.waitMessage}
        thinkingDuration={msg.thinkingDuration}
        progressElapsed={msg.progressElapsed}
        isError={msg.isError}
        analyticsData={analyticsData}
        modelUsed={msg.model_used || analyticsData?.model_used}
      />
    );
  }
  return null;
});

export default function MessageList({ messages, streaming, convId }) {
  const bottomRef = useRef(null);
  const { displayName, avatarUrl } = useUser();

  const streamText = useMemo(() => {
    if (!streaming || messages.length === 0) return "";
    return messages[messages.length - 1]?.content || "";
  }, [messages, streaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [messages.length, streamText, streaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg, idx) => (
        <MessageRow
          key={msg.id || idx}
          msg={msg}
          idx={idx}
          total={messages.length}
          streaming={streaming}
          convId={convId}
          userName={displayName}
          userAvatarUrl={avatarUrl}
        />
      ))}

      {streaming && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
        <AssistantMessage content="" isStreaming timestamp={null} messageId={null} convId={convId} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
