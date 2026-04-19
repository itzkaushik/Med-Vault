"use client";

import React from "react";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isActive?: boolean;
  divider?: boolean;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const buttons: ToolbarButton[] = [
    {
      label: "Bold",
      icon: <span className="font-bold text-xs">B</span>,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: <span className="italic text-xs">I</span>,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Underline",
      icon: <span className="underline text-xs">U</span>,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      label: "Strikethrough",
      icon: <span className="line-through text-xs">S</span>,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
      divider: true,
    },
    {
      label: "Heading 1",
      icon: <span className="text-[10px] font-bold">H1</span>,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Heading 2",
      icon: <span className="text-[10px] font-bold">H2</span>,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Heading 3",
      icon: <span className="text-[10px] font-bold">H3</span>,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      divider: true,
    },
    {
      label: "Bullet List",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="4" r="1.2" fill="currentColor" />
          <circle cx="3" cy="7" r="1.2" fill="currentColor" />
          <circle cx="3" cy="10" r="1.2" fill="currentColor" />
          <line x1="6" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2" />
          <line x1="6" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Ordered List",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <text x="1.5" y="5.5" fill="currentColor" fontSize="5" fontWeight="bold">1</text>
          <text x="1.5" y="8.5" fill="currentColor" fontSize="5" fontWeight="bold">2</text>
          <text x="1.5" y="11.5" fill="currentColor" fontSize="5" fontWeight="bold">3</text>
          <line x1="6" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2" />
          <line x1="6" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Task List",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
          <path d="M2.5 4.5L3.5 5.5L5 3.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="7.5" y1="4.5" x2="12.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1.5" y="7.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
          <line x1="7.5" y1="9.5" x2="12.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editor.isActive("taskList"),
      divider: true,
    },
    {
      label: "Code Block",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 3L1 7L4 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 3L13 7L10 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="8.5" y1="2" x2="5.5" y2="12" stroke="currentColor" strokeWidth="1" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
    },
    {
      label: "Blockquote",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: "Highlight",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="9" width="10" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <text x="3" y="8" fill="currentColor" fontSize="8" fontWeight="bold">A</text>
        </svg>
      ),
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
      divider: true,
    },
    {
      label: "Horizontal Rule",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      ),
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-subtle)] overflow-x-auto"
      style={{ background: "var(--bg-tertiary)" }}
    >
      {buttons.map((btn, i) => (
        <React.Fragment key={btn.label}>
          <button
            type="button"
            onClick={btn.action}
            title={btn.label}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-all duration-100 shrink-0"
            style={{
              background: btn.isActive ? "var(--accent-glow)" : "transparent",
              color: btn.isActive ? "var(--accent-secondary)" : "var(--text-tertiary)",
            }}
            onMouseEnter={(e) => {
              if (!btn.isActive) (e.target as HTMLElement).style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!btn.isActive) (e.target as HTMLElement).style.background = "transparent";
            }}
          >
            {btn.icon}
          </button>
          {btn.divider && (
            <div key={`div-${i}`} className="w-px h-4 bg-[var(--border-subtle)] mx-1 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
