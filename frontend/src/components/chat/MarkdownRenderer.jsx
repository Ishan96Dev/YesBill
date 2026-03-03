// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

/** Fenced code block with language label + copy button */
function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const lang = /language-(\w+)/.exec(className || "")?.[1] || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inline) {
    return (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 break-words">
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-900 text-left">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{lang || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 m-0">
        <code className="text-sm text-gray-100 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/** Custom components for ReactMarkdown */
const markdownComponents = {
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-gray-700 align-top">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-3 my-2 italic text-gray-600">
      {children}
    </blockquote>
  ),
};

/**
 * Shared markdown renderer for both main chat and agent popup.
 * Supports GFM (tables, strikethrough, task lists), code with copy button, tables.
 *
 * @param {string} content - Markdown content to render
 * @param {string} [className] - Extra classes for the prose wrapper
 * @param {boolean} [compact] - Use compact prose sizes (for agent popup)
 * @param {boolean} [isStreaming] - Show streaming cursor at end
 */
export default function MarkdownRenderer({ content, className = "", compact = false, isStreaming = false }) {
  const navigate = useNavigate();

  const InternalLink = useCallback(({ href, children }) => {
    if (href?.startsWith("/")) {
      return (
        <a
          href={href}
          onClick={(e) => { e.preventDefault(); navigate(href); }}
          className="inline text-primary underline decoration-primary/50 underline-offset-2 transition-all duration-200 hover:text-primary/80 hover:decoration-primary/80 active:text-primary/60 cursor-pointer"
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline text-primary underline decoration-primary/50 underline-offset-2 transition-all duration-200 hover:text-primary/80 hover:decoration-primary/80"
      >
        {children}
      </a>
    );
  }, [navigate]);

  const proseClass = compact
    ? "prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 prose-headings:my-1 text-gray-800"
    : "prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2 text-gray-800";

  return (
    <div className={`${proseClass} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ ...markdownComponents, a: InternalLink }}
      >
        {content || ""}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}
