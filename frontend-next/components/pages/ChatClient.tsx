// @ts-nocheck
'use client'
import { assetUrl } from "@/lib/utils";
// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Brain, ChevronDown, Check } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import { useToast } from "@/components/ui/toaster-custom";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import ModelSelector from "@/components/chat/ModelSelector";
import { chatService } from "@/services/chatService";

const SUGGESTED_PROMPTS = [
  "What are my active services?",
  "Show me my latest bills",
  "How do I mark a delivery as done?",
  "What's my spending this month?",
];

const STREAM_PLACEHOLDER_ID = "__streaming__";

export default function ChatPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingConv, setCreatingConv] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modelBlockedReason, setModelBlockedReason] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState("none");
  const [modelSupportsReasoning, setModelSupportsReasoning] = useState(false);
  // Pre-fetched model data passed to ModelSelector so it skips its own redundant API call.
  const [preloadedModelsData, setPreloadedModelsData] = useState(null);
  // Per-model effort levels sourced from DB (supported_effort_levels column).
  // null = fall back to all options (when model has no DB metadata yet).
  const [availableEffortLevels, setAvailableEffortLevels] = useState(null);
  const [justRenamedId, setJustRenamedId] = useState(null);

  // Track whether messages have been loaded for the active conversation.
  // This allows re-fetching when activeConvId is preserved but messages were
  // cleared (e.g. after Vite HMR resets component state).
  const hasLoadedMessagesRef = useRef(false);
  useEffect(() => {
    hasLoadedMessagesRef.current = messages.length > 0;
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.listConversations("main");
      setConversations(data?.conversations || []);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setInitialLoading(true);
      try {
        const [convData, modelData] = await Promise.allSettled([
          chatService.listConversations("main"),
          chatService.getModels(),
        ]);

        if (!mounted) return;
        if (convData.status === "fulfilled") {
          setConversations(convData.value?.conversations || []);
        }
        if (modelData.status === "fulfilled") {
          setAiConfigured(modelData.value?.configured ?? false);
          // Store raw model data for ModelSelector so it doesn't need to re-fetch.
          setPreloadedModelsData(modelData.value);
          // Priority: user's saved setting first, then model DB default, then "none".
          // default_reasoning_effort = what the user explicitly saved in Settings.
          // default_effort_level     = model's own DB default (e.g. "low" for 3.1 Pro).
          // Previously these were reversed, causing Settings "Medium" to be ignored.
          const modelInfo = modelData.value?.selected_model_info;
          const defaultEffort =
            modelData.value?.default_reasoning_effort ||
            modelInfo?.default_effort_level ||
            "none";
          setReasoningEffort(defaultEffort);
          const supportsReasoning = !!modelInfo?.reasoning_supported;
          setModelSupportsReasoning(supportsReasoning);
          if (supportsReasoning) {
            const levels = modelInfo?.supported_effort_levels;
            setAvailableEffortLevels(Array.isArray(levels) && levels.length > 0 ? levels : null);
          }
        } else {
          setAiConfigured(false);
        }
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectConversation = useCallback(
    async (convId) => {
      if (convId === activeConvId && hasLoadedMessagesRef.current) return;
      setActiveConvId(convId);
      setLoadingMessages(true);
      try {
        const data = await chatService.getMessages(convId);
        const loaded = (data?.messages || []).map((m) => ({
          ...m,
          isError: m.metadata?.type === "error",
        }));
        setMessages(loaded);
      } catch (e) {
        console.error("Failed to load messages", e);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [activeConvId]
  );

  const handleNewChat = async () => {
    setCreatingConv(true);
    try {
      const conv = await chatService.createConversation("main", "New Conversation");
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      toast({ title: "New conversation started", type: "success" });
    } catch (e) {
      toast({ title: "Error", description: "Could not create conversation", type: "error" });
    } finally {
      setCreatingConv(false);
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await chatService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
      toast({ title: "Conversation deleted", type: "success" });
    } catch (e) {
      toast({ title: "Error", description: "Could not delete conversation", type: "error" });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await chatService.deleteAllConversations();
      setConversations([]);
      setActiveConvId(null);
      setMessages([]);
      toast({ title: "All conversations deleted", type: "success" });
    } catch (e) {
      toast({ title: "Error", description: "Could not delete conversations", type: "error" });
    }
  };

  const handleRenameConversation = async (convId, title) => {
    try {
      await chatService.renameConversation(convId, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title } : c))
      );
    } catch (e) {
      toast({ title: "Error", description: "Could not rename conversation", type: "error" });
    }
  };

  const handleSend = async (content, contextTags) => {
    if (streaming) return;
    if (modelBlockedReason) {
      toast({ title: "Model unavailable", description: modelBlockedReason, type: "error" });
      return;
    }

    let convId = activeConvId;
    if (!convId) {
      try {
        const conv = await chatService.createConversation("main", "New Conversation");
        setConversations((prev) => [conv, ...prev]);
        setActiveConvId(conv.id);
        setMessages([]);
        convId = conv.id;
      } catch {
        toast({ title: "Error", description: "Could not start conversation", type: "error" });
        return;
      }
    }

    const userMsg = { role: "user", content, created_at: new Date().toISOString() };
    const isThinking = reasoningEffort !== "none" && modelSupportsReasoning;
    const assistantMsg = {
      role: "assistant",
      content: "",
      id: STREAM_PLACEHOLDER_ID,
      created_at: null,
      ...(isThinking ? { thinkingActive: true } : {}),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    let fullContent = "";
    let fullThinking = "";
    let hadWaitMessage = false;
    let hadThinkingEvent = false;
    let thinkingStartTime = isThinking ? Date.now() : null;
    let pendingFlush = false;
    let flushFrame = null;
    const flushChunk = () => {
      pendingFlush = false;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAM_PLACEHOLDER_ID ? { ...m, content: fullContent } : m
        )
      );
    };
    const scheduleFlush = () => {
      if (pendingFlush) return;
      pendingFlush = true;
      flushFrame = requestAnimationFrame(flushChunk);
    };

    try {
      for await (const event of chatService.streamMessage(convId, content, contextTags, selectedModel, reasoningEffort)) {
        if (event.type === "thinking") {
          hadThinkingEvent = true;
          if (!thinkingStartTime) thinkingStartTime = Date.now();
          fullThinking += event.content || "";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAM_PLACEHOLDER_ID
                ? { ...m, thinkingContent: fullThinking, thinkingActive: true }
                : m
            )
          );
        } else if (event.type === "thinking_wait") {
          hadThinkingEvent = true;
          if (!thinkingStartTime) thinkingStartTime = Date.now();
          hadWaitMessage = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAM_PLACEHOLDER_ID
                ? { ...m, waitMessage: event.content, thinkingActive: true }
                : m
            )
          );
        } else if (event.type === "thinking_progress") {
          // Synthetic elapsed-time tick from the backend progress wrapper.
          // Updates the live counter in the thinking banner (e.g. "? Thinking... 9s").
          const elapsed = event.elapsed || 0;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAM_PLACEHOLDER_ID
                ? { ...m, progressElapsed: elapsed }
                : m
            )
          );
        } else if (event.type === "chunk") {
          if (fullThinking || hadWaitMessage || hadThinkingEvent) {
            // Thinking done — mark inactive and clear wait message when content starts arriving
            const thinkingDuration = thinkingStartTime
              ? Math.round((Date.now() - thinkingStartTime) / 100) / 10
              : undefined;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAM_PLACEHOLDER_ID && m.thinkingActive
                  ? { ...m, thinkingActive: false, waitMessage: undefined, thinkingDuration, progressElapsed: undefined }
                  : m
              )
            );
          }
          fullContent += event.content || "";
          scheduleFlush();
        } else if (event.type === "title") {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: event.title } : c))
          );
          setJustRenamedId(convId);
          setTimeout(() => setJustRenamedId(null), 2000);
        } else if (event.type === "done") {
          if (flushFrame) cancelAnimationFrame(flushFrame);
          if (pendingFlush) flushChunk();
          const thinkingDuration = thinkingStartTime
            ? Math.round((Date.now() - thinkingStartTime) / 100) / 10
            : undefined;
          const finalMessageId = event.message_id || Date.now().toString();
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== STREAM_PLACEHOLDER_ID);
            return [
              ...filtered,
              {
                role: "assistant",
                content: fullContent,
                id: finalMessageId,
                created_at: new Date().toISOString(),
                metadata: event.reasoning ? { reasoning: event.reasoning } : undefined,
                thinkingContent: fullThinking || undefined,
                thinkingDuration,
                model_used: event.model || undefined,
                message_analytics: event.analytics ? [event.analytics] : undefined,
              },
            ];
          });
          // Eagerly pre-fetch reasoning summary in background (no loading state on expand)
          if (event.reasoning?.supported && finalMessageId) {
            chatService.getReasoningSummary(finalMessageId, convId)
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
              .catch(() => {}); // silent fail — summary is optional
          }
        } else if (event.type === "error") {
          if (event.code === "MODEL_UNAVAILABLE_PRECHECK" || event.code === "MODEL_UNAVAILABLE_RUNTIME") {
            setModelBlockedReason(event.message || "Selected model is unavailable.");
          }
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== STREAM_PLACEHOLDER_ID),
            {
              role: "assistant",
              content: event.message,
              id: event.message_id || Date.now().toString(),
              created_at: new Date().toISOString(),
              isError: true,
            },
          ]);
          toast({ title: "AI Error", description: event.message, type: "error" });
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== STREAM_PLACEHOLDER_ID),
        {
          role: "assistant",
          content: "Connection error. Please try again.",
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
      toast({ title: "Connection Error", description: "Streaming failed. Please try again.", type: "error" });
    } finally {
      if (flushFrame) cancelAnimationFrame(flushFrame);
      setStreaming(false);
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    handleSend(prompt, []);
  };

  const handleModelStatusChange = useCallback((selectedInfo) => {
    if (!selectedInfo) {
      setModelBlockedReason("");
      setModelSupportsReasoning(false);
      setAvailableEffortLevels(null);
      return;
    }
    const blocked =
      selectedInfo.is_deprecated ||
      selectedInfo.availability_status === "unavailable";
    if (blocked) {
      setModelBlockedReason(
        selectedInfo.availability_message || "Selected model is unavailable. Please select another model."
      );
    } else {
      setModelBlockedReason("");
    }

    // reasoning_effort selector driven by DB capability fields
    const supportsEffort = !!selectedInfo.reasoning_supported;
    setModelSupportsReasoning(supportsEffort);

    if (!supportsEffort) {
      setReasoningEffort("none");
      setAvailableEffortLevels(null);
    } else {
      const levels = selectedInfo.supported_effort_levels;
      const hasLevels = Array.isArray(levels) && levels.length > 0;
      setAvailableEffortLevels(hasLevels ? levels : null);
      const modelDefault = selectedInfo.default_effort_level || "none";
      // Keep current effort if it's valid for the new model; otherwise reset to model default.
      // "none" is always a valid choice — user can always opt out of reasoning.
      setReasoningEffort((prev) => {
        if (!hasLevels || prev === "none" || levels.includes(prev)) return prev;
        return modelDefault;
      });
    }
  }, []);

  const activeConversationTitle = activeConvId
    ? conversations.find((c) => c.id === activeConvId)?.title || "Chat"
    : "YesBill Assistant";

  // No active conversation at all ? full landing EmptyState
  const showEmptyState = !activeConvId;
  // Active conv exists but no messages yet ? lighter "what would you like to ask?" state
  const showNewConvState =
    activeConvId && !loadingMessages && !streaming && messages.length === 0;

  return (
    <AppLayout fullHeight>
      <AnimatePresence>
        {initialLoading && <AppLoadingScreen key="loading" pageName="Ask AI" pageType="chat" />}
      </AnimatePresence>
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0 hidden md:block">
          {initialLoading ? (
            <SidebarSkeleton />
          ) : (
            <ConversationSidebar
              conversations={conversations}
              activeConvId={activeConvId}
              onSelect={selectConversation}
              onNew={handleNewChat}
              onDelete={handleDeleteConversation}
              onDeleteAll={handleDeleteAll}
              onRename={handleRenameConversation}
              creating={creatingConv}
              justRenamedId={justRenamedId}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
            <img
              src={assetUrl("/assets/branding/yesbill_logo_black.png")}
              alt="YesBill"
              className="h-8 w-auto object-contain"
            />
            <div className="w-px h-5 bg-gray-200" />
            <span className="font-semibold text-gray-800 text-sm">{activeConversationTitle}</span>
          </div>

          {initialLoading ? (
            <MessageListSkeleton />
          ) : showEmptyState ? (
            <EmptyState
              onNewChat={handleNewChat}
              onSuggestedPrompt={handleSuggestedPrompt}
              aiConfigured={aiConfigured}
            />
          ) : showNewConvState ? (
            <NewConversationState onSuggestedPrompt={handleSuggestedPrompt} />
          ) : loadingMessages ? (
            <MessageListSkeleton />
          ) : (
            <MessageList messages={messages} streaming={streaming} convId={activeConvId} />
          )}

          <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm flex-shrink-0">
            {modelBlockedReason && (
              <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {modelBlockedReason}
              </div>
            )}
            {initialLoading ? (
              <ToolbarSkeleton />
            ) : (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  onModelStatusChange={handleModelStatusChange}
                  initialData={preloadedModelsData}
                />
                {modelSupportsReasoning && (
                  <>
                    <div className="w-px h-4 bg-gray-200" />
                    <ReasoningEffortSelector
                      value={reasoningEffort}
                      onChange={setReasoningEffort}
                      availableLevels={availableEffortLevels}
                    />
                  </>
                )}
              </div>
            )}
            <ChatInput
              onSend={handleSend}
              streaming={streaming}
              disabled={!aiConfigured || !!modelBlockedReason}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function NewConversationState({ onSuggestedPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="flex flex-col items-center gap-4 text-center max-w-sm w-full"
      >
        <div className="flex flex-col items-center gap-2">
          <img
            src={assetUrl("/assets/branding/yesbill_logo_black.png")}
            alt="YesBill"
            className="h-12 w-auto object-contain"
          />
          <p className="text-gray-500 text-sm">What would you like to ask?</p>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-1 gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSuggestedPrompt(prompt)}
                className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5 text-sm text-gray-700 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EmptyState({ onNewChat, onSuggestedPrompt, aiConfigured }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-6">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <img
            src={assetUrl("/assets/branding/yesbill_logo_black.png")}
            alt="YesBill"
            className="h-14 w-auto object-contain"
          />
          <h2 className="text-xl font-bold text-gray-900">YesBill Assistant</h2>
          <p className="text-gray-500 text-sm">
            {aiConfigured
              ? "Ask me anything about your services, bills, and spending patterns."
              : "Configure your AI provider in Settings to start chatting."}
          </p>
        </div>

        {aiConfigured && (
          <>
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start a New Chat
            </button>

            <div className="w-full">
              <p className="text-xs text-gray-400 mb-3">Or try a suggested prompt:</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSuggestedPrompt(prompt)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5 text-sm text-gray-700 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {!aiConfigured && (
          <a
            href="/settings"
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors"
          >
            Go to Settings
          </a>
        )}
      </motion.div>
    </div>
  );
}

const EFFORT_OPTIONS = [
  { value: "none", label: "No Reasoning" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Max" },
];

function ReasoningEffortSelector({ value, onChange, availableLevels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // Filter to only levels supported by the current model; show all if no DB restriction.
  // Always include "none" (No Reasoning) as the first option regardless of model capabilities.
  const filteredOptions = availableLevels?.length
    ? [
        EFFORT_OPTIONS[0], // "none" — always available
        ...EFFORT_OPTIONS.filter((o) => o.value !== "none" && availableLevels.includes(o.value)),
      ]
    : EFFORT_OPTIONS;
  const current = filteredOptions.find((o) => o.value === value) || filteredOptions[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
      >
        <Brain className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[170px]">
          {filteredOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${o.value === value
                ? "bg-violet-50 text-violet-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Brain className={`w-3.5 h-3.5 flex-shrink-0 ${o.value === value ? "text-violet-500" : "text-gray-300"}`} />
              <span className="flex-1">{o.label}</span>
              {o.value === value && (
                <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="h-full border-r border-gray-200 bg-white p-4 space-y-3 animate-pulse">
      <div className="h-10 rounded-xl bg-gray-200" />
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-12 rounded-xl bg-gray-100" />
      <div className="h-12 rounded-xl bg-gray-100" />
      <div className="h-12 rounded-xl bg-gray-100" />
    </div>
  );
}

function MessageListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white animate-pulse">
      <div className="flex justify-end">
        <div className="h-14 w-[280px] rounded-2xl bg-gray-100" />
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="h-20 w-[360px] rounded-2xl bg-gray-100" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 w-[240px] rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1 animate-pulse">
      {/* Model selector skeleton */}
      <div className="flex items-center gap-2 h-8 w-[160px] rounded-xl bg-gray-100 px-3">
        <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0" />
        <div className="h-3 w-20 rounded bg-gray-200" />
        <div className="w-3 h-3 rounded bg-gray-200 ml-auto" />
      </div>
      {/* Divider */}
      <div className="w-px h-4 bg-gray-200" />
      {/* Reasoning effort skeleton */}
      <div className="flex items-center gap-1.5 h-8 w-[110px] rounded-xl bg-gray-100 px-3">
        <div className="w-3.5 h-3.5 rounded bg-gray-200 flex-shrink-0" />
        <div className="h-3 w-14 rounded bg-gray-200" />
      </div>
    </div>
  );
}
