'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  FileText,
  FolderDown,
  Check,
  X,
  ChevronRight,
  Trash,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { useUser } from "../../hooks/useUser";
import { chatService } from "../../services/chatService";
import { WithTooltip } from "../ui/tooltip";

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Convert markdown-formatted text to safe inline HTML for PDF rendering. */
function markdownToHtml(text) {
  if (!text) return '';
  // 1. Escape HTML characters
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // 2. Fenced code blocks (``` ... ```)
  html = html.replace(/```(?:\w*)\n?([\s\S]*?)```/g, (_m, code) =>
    `<pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;font-size:11px;font-family:Menlo,Consolas,monospace;white-space:pre-wrap;margin:8px 0;overflow-x:auto;">${code.trim()}</pre>`
  );
  // 3. Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:3px;padding:1px 5px;font-size:11px;font-family:Menlo,Consolas,monospace;">$1</code>');
  // 4. Line-by-line block processing
  const lines = html.split('\n');
  const result = [];
  let ulOpen = false, olOpen = false;
  for (const line of lines) {
    if (/^### /.test(line)) {
      if (ulOpen) { result.push('</ul>'); ulOpen = false; }
      if (olOpen) { result.push('</ol>'); olOpen = false; }
      result.push(`<h4 style="font-size:13px;font-weight:700;color:#374151;margin:10px 0 4px 0;">${line.slice(4)}</h4>`);
    } else if (/^## /.test(line)) {
      if (ulOpen) { result.push('</ul>'); ulOpen = false; }
      if (olOpen) { result.push('</ol>'); olOpen = false; }
      result.push(`<h3 style="font-size:15px;font-weight:700;color:#1f2937;margin:12px 0 6px 0;">${line.slice(3)}</h3>`);
    } else if (/^# /.test(line)) {
      if (ulOpen) { result.push('</ul>'); ulOpen = false; }
      if (olOpen) { result.push('</ol>'); olOpen = false; }
      result.push(`<h2 style="font-size:17px;font-weight:700;color:#111827;margin:14px 0 6px 0;">${line.slice(2)}</h2>`);
    } else if (/^[*\-] /.test(line)) {
      if (olOpen) { result.push('</ol>'); olOpen = false; }
      if (!ulOpen) { result.push('<ul style="padding-left:18px;margin:6px 0;">'); ulOpen = true; }
      result.push(`<li style="margin-bottom:3px;">${line.slice(2)}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (ulOpen) { result.push('</ul>'); ulOpen = false; }
      if (!olOpen) { result.push('<ol style="padding-left:18px;margin:6px 0;">'); olOpen = true; }
      result.push(`<li style="margin-bottom:3px;">${line.replace(/^\d+\. /, '')}</li>`);
    } else {
      if (ulOpen) { result.push('</ul>'); ulOpen = false; }
      if (olOpen) { result.push('</ol>'); olOpen = false; }
      if (/^---+$/.test(line.trim())) {
        result.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0;">');
      } else if (line.trim() === '') {
        result.push('<div style="height:6px;"></div>');
      } else {
        result.push(line + '<br>');
      }
    }
  }
  if (ulOpen) result.push('</ul>');
  if (olOpen) result.push('</ol>');
  html = result.join('');
  // 5. Bold **text**
  html = html.replace(/\*\*([^*<\n]+)\*\*/g, '<strong>$1</strong>');
  // 6. Italic *text*
  html = html.replace(/(?<!\*)\*([^*<\n]+)\*(?!\*)/g, '<em>$1</em>');
  // 7. Links [text](url) → styled text only
  html = html.replace(/\[([^\]]+)\]\([^)]+\)/g, '<span style="color:#4f46e5;text-decoration:underline;">$1</span>');
  return html;
}

function buildPdfHtml(title, messages, username, dateStr) {
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : new Date().toLocaleDateString();
  const safeTitle = (title || "Conversation").replace(/</g, "&lt;");

  const rows = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const isUser = m.role === "user";
      const time = m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";
      const content = isUser
        ? (m.content || "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>")
        : markdownToHtml(m.content || "");

      if (isUser) {
        return `
          <div style="margin-bottom:20px;page-break-inside:avoid;break-inside:avoid;">
            <div style="text-align:right;">
              <div style="font-size:11px;color:#6b7280;margin-bottom:5px;font-weight:600;">${username || "You"}</div>
              <span style="display:inline-block;max-width:68%;background:#4f46e5;color:#ffffff;border-radius:18px 18px 4px 18px;padding:10px 16px;font-size:13px;line-height:1.6;text-align:left;">${content}</span>
              ${time ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px;">${time}</div>` : ""}
            </div>
          </div>`;
      } else {
        return `
          <div style="margin-bottom:20px;page-break-inside:avoid;break-inside:avoid;">
            <div style="font-size:11px;color:#6b7280;margin-bottom:5px;font-weight:600;">
              <span style="display:inline-block;width:18px;height:18px;background:#4f46e5;border-radius:50%;text-align:center;line-height:18px;font-size:8px;font-weight:800;color:#fff;margin-right:6px;vertical-align:middle;">YB</span>YesBill Assistant
            </div>
            <div style="background:#f8f7ff;border:1px solid #e0dcff;border-radius:4px 16px 16px 16px;padding:12px 16px;font-size:13px;line-height:1.7;color:#1f2937;margin-left:24px;">${content}</div>
            ${time ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px;margin-left:24px;">${time}</div>` : ""}
          </div>`;
      }
    })
    .join("");

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0effe;margin:0;padding:0;color:#1f2937;">

    <!-- Header -->
    <div style="background:#ffffff;border-bottom:2px solid #ede9fe;padding:16px 28px;margin-bottom:0;">
      <div style="overflow:hidden;">
        <div style="float:left;">
          <span style="display:inline-block;width:30px;height:30px;background:#4f46e5;border-radius:8px;text-align:center;line-height:30px;font-size:11px;font-weight:800;color:#fff;vertical-align:middle;margin-right:10px;">YB</span>
          <span style="vertical-align:middle;">
            <span style="display:block;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;line-height:1.2;">YESBILL</span>
            <span style="display:block;font-size:16px;font-weight:700;color:#111827;line-height:1.3;">${safeTitle}</span>
          </span>
        </div>
        <div style="float:right;text-align:right;padding-top:2px;">
          <div style="font-size:13px;font-weight:600;color:#374151;">${username || "User"}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${formattedDate}</div>
        </div>
        <div style="clear:both;"></div>
      </div>
    </div>

    <!-- Messages card -->
    <div style="margin:20px 16px;background:#ffffff;border-radius:14px;border:1px solid #ddd6fe;padding:24px 24px 16px 24px;">
      ${rows}
    </div>

    <!-- Footer -->
    <div style="padding:0 16px 16px 16px;overflow:hidden;">
      <span style="float:left;font-size:10px;color:#9ca3af;">
        <span style="display:inline-block;width:14px;height:14px;background:#4f46e5;border-radius:3px;text-align:center;line-height:14px;font-size:6px;font-weight:800;color:#fff;vertical-align:middle;margin-right:4px;">YB</span>
        Exported from YesBill &bull; AI Chat Export
      </span>
      <span style="float:right;font-size:10px;color:#c4b5fd;">${formattedDate}</span>
      <div style="clear:both;"></div>
    </div>

  </div>`;
}

export default function ConversationSidebar({
  conversations,
  activeConvId,
  onSelect,
  onNew,
  onDelete,
  onDeleteAll,
  onRename,
  creating = false,
  justRenamedId = null,
}) {
  const { displayName } = useUser();
  const [menuConfig, setMenuConfig] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const menuRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuConfig(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuConfig(null);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingId) return;
    await onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleExportMd = async (conv) => {
    setMenuConfig(null);
    try {
      const dateStr = new Date(conv.updated_at).toLocaleDateString().replace(/\//g, "-");
      const fileName = `${conv.title} - ${dateStr} - ${displayName || 'User'}.md`;
      await chatService.exportConversation(conv.id, "markdown", fileName);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleExportPdf = async (conv) => {
    setMenuConfig(null);
    try {
      const data = await chatService.getMessages(conv.id);
      const messages = data?.messages || [];
      const htmlString = buildPdfHtml(conv.title, messages, displayName, conv.updated_at);

      const fileName = `${conv.title} - ${new Date(conv.updated_at).toLocaleDateString().replace(/\//g, "-")} - ${displayName || 'User'}.pdf`;

      // Pass the raw HTML string directly to html2pdf.
      // html2pdf internally creates its own off-screen element at
      // position:fixed;left:-150% which html2canvas reliably captures.
      // Managing our own DOM insertion causes blank output due to scroll offsets.
      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['div[style*="page-break-inside:avoid"]'] },
      };

      html2pdf().set(opt).from(htmlString, 'string').save()
        .catch((e) => console.error("PDF export failed", e));
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      await chatService.exportAllConversations(displayName);
    } catch (e) {
      console.error("Export all failed", e);
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Chats
        </h2>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={onNew}
            disabled={creating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-70"
          >
            {creating ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            New Chat
          </motion.button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 pb-24" onScroll={() => setMenuConfig(null)}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Click "New Chat" to start</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const isEditing = editingId === conv.id;
              const isHovered = hoveredId === conv.id;
              const isJustRenamed = conv.id === justRenamedId;

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative mb-0.5"
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Buttery Smooth Background Hover Indicator */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="sidebarHover"
                      className="absolute inset-0 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <motion.div
                    onClick={() => !isEditing && onSelect(conv.id)}
                    className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors overflow-hidden ${isActive
                      ? "bg-primary/8 text-primary shadow-sm"
                      : "text-gray-700"
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}

                    {isEditing ? (
                      <div
                        className="flex-1 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 text-sm bg-white border border-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate leading-tight transition-colors duration-700 ${
                              isJustRenamed
                                ? "text-indigo-600"
                                : isActive
                                ? "text-primary"
                                : "text-gray-700"
                            }`}
                          >
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {timeAgo(conv.updated_at)}
                          </p>
                        </div>

                        <AnimatePresence>
                          {(isHovered || isActive || menuConfig?.id === conv.id) && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.12 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (menuConfig?.id === conv.id) {
                                  setMenuConfig(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const openUpwards = rect.bottom + 160 > window.innerHeight;
                                setMenuConfig({
                                  id: conv.id,
                                  top: openUpwards ? rect.top - 150 : rect.bottom + 4,
                                  left: rect.left + 24, // Place dropdown aligned left to button, shifted right slightly
                                  openUpwards,
                                });
                              }}
                              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </motion.div>

                  {/* Dropdown menu */}
                  <AnimatePresence>

                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      {/* Footer controls */}
      <div className="border-t border-gray-100 p-3 flex items-center gap-2">
        <button
          onClick={handleExportAll}
          disabled={exportingAll || conversations.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          {exportingAll ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <FolderDown className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold">Download All</span>
        </button>
        <button
          onClick={onDeleteAll}
          disabled={conversations.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:border-gray-100 disabled:text-gray-400"
        >
          <Trash className="w-4 h-4" />
          <span className="text-xs font-semibold">Delete All</span>
        </button>
      </div>

      {/* Global Dropdown Menu Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {menuConfig && (
            <motion.div
              ref={menuRef}
              key="sidebar-menu"
              initial={{ opacity: 0, scale: 0.95, y: menuConfig.openUpwards ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: menuConfig.openUpwards ? 4 : -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                position: "fixed",
                zIndex: 9999,
                top: menuConfig.top,
                left: menuConfig.left,
                width: "192px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
                border: "1px solid #f3f4f6",
                paddingTop: "4px",
                paddingBottom: "4px",
                overflow: "hidden",
                fontFamily: "inherit",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {(() => {
                const conv = conversations.find((c) => c.id === menuConfig.id);
                if (!conv) return null;
                return (
                  <>
                    <button
                      onClick={() => startEdit(conv)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '13px', color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Pencil style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
                      Rename
                    </button>
                    <button
                      onClick={() => handleExportMd(conv)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '13px', color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Download style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
                      Download Markdown
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af' }}>.md</span>
                    </button>
                    <button
                      onClick={() => handleExportPdf(conv)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '13px', color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <FileText style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
                      Download PDF
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af' }}>.pdf</span>
                    </button>
                    <div style={{ margin: '4px 8px', borderTop: '1px solid #f3f4f6' }} />
                    <button
                      onClick={() => {
                        setMenuConfig(null);
                        onDelete(conv.id);
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '13px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: '#ef4444', flexShrink: 0 }} />
                      Delete
                    </button>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
