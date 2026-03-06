'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import { chatService } from "../../services/chatService";

export default function ModelSelector({ selectedModel, onModelChange, onModelStatusChange, onLoadingChange, initialData }) {
  const [models, setModels] = useState(() =>
    initialData?.models ? initialData.models.filter((m) => !m.is_deprecated) : []
  );
  const [configured, setConfigured] = useState(() => initialData ? (initialData.configured ?? true) : true);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(() => !initialData);

  // Notify parent whenever our loading state changes (e.g. to sync ToolbarSkeleton)
  useEffect(() => {
    if (onLoadingChange) onLoadingChange(loading);
  }, [loading, onLoadingChange]);
  const [serverSelectedModel, setServerSelectedModel] = useState(() => initialData?.selected_model || null);
  const [serverSelectedInfo, setServerSelectedInfo] = useState(() => initialData?.selected_model_info || null);

  // Auto-select on mount when initialData is provided (no fetch needed)
  useEffect(() => {
    if (!initialData || selectedModel) return;
    const sid = initialData.selected_model;
    const modelList = initialData.models ? initialData.models.filter((m) => !m.is_deprecated) : [];
    if (sid && modelList.find((m) => m.id === sid)) {
      onModelChange(sid);
    } else {
      const preferred = modelList.find((m) => m.availability_status === "available") || modelList[0];
      if (preferred) onModelChange(preferred.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchModels = useCallback(() => {
    let mounted = true;
    chatService
      .getModels()
      .then((data) => {
        if (!mounted) return;
        const modelList = (data?.models || []).filter((m) => !m.is_deprecated);
        setModels(modelList);
        setConfigured(data?.configured ?? false);
        setServerSelectedModel(data?.selected_model || null);
        setServerSelectedInfo(data?.selected_model_info || null);

        // Only auto-select when there's no user-chosen model yet
        if (!selectedModel) {
          const selectedInfo = data?.selected_model_info || null;
          const serverSelectedId = data?.selected_model || null;
          const serverSelectedBlocked =
            !!selectedInfo &&
            (selectedInfo.is_deprecated || selectedInfo.availability_status === "unavailable");

          if (serverSelectedBlocked && serverSelectedId) {
            onModelChange(serverSelectedId);
          } else if (serverSelectedId && modelList.find((m) => m.id === serverSelectedId)) {
            onModelChange(serverSelectedId);
          } else {
            const preferred = modelList.find((m) => m.availability_status === "available") || modelList[0];
            if (preferred) {
              onModelChange(preferred.id);
            }
          }
        }
      })
      .catch(() => {
        if (!mounted) return;
        setConfigured(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Skip initial fetch if caller already provided data; still re-fetch on visibility change
    // so user picks up model changes made in Settings→AI without a full page reload.
    let didInitialFetch = !!initialData;
    const cleanup = didInitialFetch ? undefined : fetchModels();

    // Re-fetch when the user navigates back to this page (e.g., after changing Settings).
    // Silent refresh: don't reset selectedModel or show a skeleton — the user can keep
    // chatting while models update quietly in the background.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchModels();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (cleanup) cleanup();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const selectedInfo = useMemo(() => {
    const fromList = models.find((m) => m.id === selectedModel);
    if (fromList) return fromList;
    if (selectedModel && selectedModel === serverSelectedModel) return serverSelectedInfo;
    return null;
  }, [models, selectedModel, serverSelectedModel, serverSelectedInfo]);

  useEffect(() => {
    if (!onModelStatusChange) return;
    onModelStatusChange(selectedInfo, models, {
      selected_model: serverSelectedModel,
      selected_model_info: serverSelectedInfo,
    });
  }, [selectedInfo, models, serverSelectedModel, serverSelectedInfo, onModelStatusChange]);

  if (loading) return (
    <div className="flex items-center gap-2 h-8 w-[160px] rounded-xl bg-gray-100 px-3 animate-pulse">
      <div className="w-3.5 h-3.5 rounded bg-gray-200 flex-shrink-0" />
      <div className="h-3 w-20 rounded bg-gray-200" />
      <div className="w-3 h-3 rounded bg-gray-200 ml-auto" />
    </div>
  );

  if (!configured) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <Cpu className="w-3.5 h-3.5" />
        <span>
          Configure AI in{" "}
          <a href="/settings" className="underline font-semibold">
            Settings
          </a>{" "}
          to use chat
        </span>
      </div>
    );
  }

  // User IS configured but backend couldn't provide a model list yet (e.g. cold-start
  // timeout fell back to Supabase which returns models:[]). Show current model as a
  // non-interactive label so the page doesn't falsely claim AI is unconfigured.
  if (models.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-500">
        <Cpu className="w-3.5 h-3.5 text-gray-400" />
        <span>{serverSelectedModel || "AI Model"}</span>
      </div>
    );
  }

  const current =
    models.find((m) => m.id === selectedModel) ||
    models.find((m) => m.id === serverSelectedModel) ||
    models[0];

  const selectedUnavailable =
    !!selectedInfo &&
    (selectedInfo.is_deprecated ||
      selectedInfo.availability_status === "unavailable");

  return (
    <div className="relative">
      {selectedUnavailable && (
        <div className="mb-2 max-w-[360px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {selectedInfo?.availability_message || "Selected model is unavailable. Please choose another model."}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        <Cpu className="w-3.5 h-3.5 text-gray-400" />
        <span>{current?.label || "Model"}</span>
        {current?.is_preview && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            Preview
          </span>
        )}
        {current?.reasoning_supported && (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
            Reasoning
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 left-0 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[240px]">
            {models.map((m) => {
              const disabled = m.is_deprecated || m.availability_status === "unavailable";
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (disabled) return;
                    onModelChange(m.id);
                    setOpen(false);
                  }}
                  title={disabled ? m.availability_message || "Model unavailable" : ""}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${disabled
                    ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                    : m.id === selectedModel
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <span className="truncate">{m.label}</span>
                  {m.is_preview && (
                    <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      Preview
                    </span>
                  )}
                  {!m.is_preview && m.reasoning_supported && (
                    <span className="ml-auto rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                      Reasoning
                    </span>
                  )}
                  {m.id === selectedModel && !disabled && <span className="text-primary text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
