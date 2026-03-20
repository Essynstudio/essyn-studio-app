"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// ═══════════════════════════════════════════════
// Iris Markdown Renderer
// Renders Claude's responses with styled components
// ═══════════════════════════════════════════════

const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h3 className="text-[20px] font-semibold text-[var(--fg)] mt-4 mb-2 tracking-[-0.02em]">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="text-[18px] font-semibold text-[var(--fg)] mt-3.5 mb-1.5 tracking-[-0.01em]">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="text-[16px] font-semibold text-[var(--fg)] mt-3 mb-1.5">{children}</h5>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-[15px] leading-[1.7] text-[var(--fg)] tracking-[-0.006em] mb-2 last:mb-0">{children}</p>
  ),

  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--fg)]">{children}</strong>
  ),

  // Italic
  em: ({ children }) => (
    <em className="text-[var(--fg-secondary)]">{children}</em>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="space-y-1 my-2 ml-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 my-2 ml-0.5 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-[1.65] text-[var(--fg)] flex gap-2">
      <span className="text-[var(--fg-muted)] shrink-0 mt-[3px]">•</span>
      <span>{children}</span>
    </li>
  ),

  // Tables
  table: ({ children }) => (
    <div className="my-2 rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--bg-subtle)]">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="divide-x divide-[var(--border)]">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 text-[14px] text-[var(--fg)] tabular-nums">{children}</td>
  ),

  // Code
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-[var(--bg-subtle)] rounded-lg p-3.5 my-2.5 text-[13px] font-mono text-[var(--fg-secondary)] overflow-x-auto leading-relaxed">
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-[13.5px] font-mono text-[var(--fg-secondary)]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2">{children}</pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--border)] pl-3 my-2 text-[var(--fg-secondary)]">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-3 border-[var(--border)]" />
  ),

  // Links
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--info)] underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  ),
};

export function IrisMarkdown({ content }: { content: string }) {
  return (
    <div className="iris-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
