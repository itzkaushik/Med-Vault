"use client";

import React from "react";

interface TopBarProps {
  onToggleSidebar: () => void;
  onNewNote?: () => void;
  onSearch?: () => void;
}

export default function TopBar({ onToggleSidebar, onNewNote, onSearch }: TopBarProps) {
  return (
    <header
      className="h-[var(--topbar-height)] flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border-subtle)] shrink-0"
      style={{ background: "rgba(12, 14, 20, 0.6)", backdropFilter: "blur(12px)" }}
    >
      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2.5 4.5H15.5M2.5 9H15.5M2.5 13.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-[var(--text-tertiary)]">MedVault</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium">Dashboard</span>
        </div>
      </div>

      {/* Center: Search (clickable — opens Command Palette) */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onSearch}
          className="w-full relative flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-200 hover:border-[var(--border-strong)]"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
            <path
              d="M10.5 10.5L13.5 13.5M6.5 11C9 11 11 9 11 6.5S9 2 6.5 2 2 4 2 6.5 4 11 6.5 11z"
              stroke="var(--text-tertiary)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm text-[var(--text-muted)] flex-1 text-left">
            Search notes, subjects, topics...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] rounded border border-[var(--border-subtle)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* New Note Button */}
        <button
          onClick={onNewNote}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">New Note</span>
        </button>

        {/* Profile Placeholder */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer hover:ring-2 hover:ring-[var(--accent-primary)] transition-all"
          style={{
            background: "linear-gradient(135deg, var(--subject-anatomy), var(--subject-pharmacology))",
          }}
        >
          U
        </div>
      </div>
    </header>
  );
}
