"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";

interface SearchResult {
  type: "subject" | "topic" | "note";
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  navigateTo: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const { subjects, topics, notes } = useStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animation
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Search results
  const results: SearchResult[] = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    // Quick actions (no query)
    if (!q) {
      items.push(
        { type: "subject", id: "action-home", title: "Go Home", subtitle: "Dashboard", icon: "🏠", color: "#6c5ce7", navigateTo: "home" },
        { type: "subject", id: "action-graph", title: "Knowledge Graph", subtitle: "Visualize connections", icon: "🧬", color: "#00b894", navigateTo: "graph" },
        { type: "subject", id: "action-textbooks", title: "Textbooks", subtitle: "PDF library", icon: "📚", color: "#fdcb6e", navigateTo: "textbooks" },
        { type: "subject", id: "action-ai", title: "AI Co-pilot", subtitle: "Smart study assistant", icon: "🧠", color: "#e84393", navigateTo: "ai" }
      );
    }

    // Search subjects
    subjects.forEach((s) => {
      if (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
        items.push({
          type: "subject",
          id: s.id,
          title: s.name,
          subtitle: s.description,
          icon: s.icon,
          color: s.color,
          navigateTo: `subject-${s.id}`,
        });
      }
    });

    // Search topics
    topics.forEach((t) => {
      if (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        const subject = subjects.find((s) => s.id === t.subjectId);
        items.push({
          type: "topic",
          id: t.id,
          title: t.name,
          subtitle: subject ? `${subject.icon} ${subject.name}` : "Topic",
          icon: "📂",
          color: subject?.color || "#636e72",
          navigateTo: `topic-${t.id}`,
        });
      }
    });

    // Search notes
    notes.forEach((n) => {
      if (!q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)) {
        const subject = n.subjectId ? subjects.find((s) => s.id === n.subjectId) : null;
        const topic = n.topicId ? topics.find((t) => t.id === n.topicId) : null;
        items.push({
          type: "note",
          id: n.id,
          title: n.title,
          subtitle: topic ? `${topic.name}` : subject ? `${subject.name}` : "Unassigned",
          icon: "📝",
          color: subject?.color || "#a29bfe",
          navigateTo: `note-${n.id}`,
        });
      }
    });

    return items.slice(0, 15);
  }, [query, subjects, topics, notes]);

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        const result = results[selectedIndex];
        onNavigate(result.navigateTo);
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, selectedIndex, onNavigate, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        // Parent should handle opening
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeLabel = (type: string) => {
    switch (type) {
      case "subject": return "SUBJECT";
      case "topic": return "TOPIC";
      case "note": return "NOTE";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl rounded-[var(--radius-xl)] overflow-hidden transition-all duration-200"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg), 0 0 60px rgba(108, 92, 231, 0.15)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(-8px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <path
              d="M12.5 12.5L16 16M7.5 13C10.5 13 13 10.5 13 7.5S10.5 2 7.5 2 2 4.5 2 7.5 4.5 13 7.5 13z"
              stroke="var(--accent-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search subjects, topics, notes..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No results found</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Try a different search term</p>
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  onNavigate(result.navigateTo);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-75"
                style={{
                  background: i === selectedIndex ? "var(--accent-glow)" : "transparent",
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-base shrink-0"
                  style={{ background: `${result.color}20` }}
                >
                  {result.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{result.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{result.subtitle}</p>
                </div>

                {/* Type Badge */}
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: `${result.color}15`, color: result.color }}
                >
                  {typeLabel(result.type)}
                </span>

                {/* Enter hint for selected */}
                {i === selectedIndex && (
                  <kbd className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)] px-1 py-0.5 shrink-0">
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">Esc</kbd>
              Close
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
