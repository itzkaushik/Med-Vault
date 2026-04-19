"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useStore, type Note } from "@/lib/store";

interface WikiLinkPopoverProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (note: Note) => void;
  onClose: () => void;
  excludeNoteId?: string;
}

export default function WikiLinkPopover({ query, position, onSelect, onClose, excludeNoteId }: WikiLinkPopoverProps) {
  const { notes } = useStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Filter notes matching the query
  const filtered = notes
    .filter((n) => n.id !== excludeNoteId)
    .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (filtered.length === 0 && query.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 max-h-60 overflow-y-auto rounded-[var(--radius-lg)] animate-scaleIn"
      style={{
        top: position.top + 24,
        left: position.left,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-lg), 0 0 20px rgba(108, 92, 231, 0.1)",
      }}
    >
      <div className="p-1.5">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1">
          Link to note
        </p>
        {filtered.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">No matching notes found</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Create a note with this title first</p>
          </div>
        ) : (
          filtered.map((note, i) => (
            <button
              key={note.id}
              onClick={() => onSelect(note)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-[var(--radius-md)] text-left transition-all duration-100"
              style={{
                background: i === selectedIndex ? "var(--accent-glow)" : "transparent",
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[var(--text-tertiary)]">
                <path d="M3 2H11C11.5 2 12 2.5 12 3V11C12 11.5 11.5 12 11 12H3C2.5 12 2 11.5 2 11V3C2 2.5 2.5 2 3 2Z" stroke="currentColor" strokeWidth="1.2" />
                <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1" />
                <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1" />
                <line x1="4.5" y1="9" x2="7.5" y2="9" stroke="currentColor" strokeWidth="1" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{note.title}</p>
                {note.excerpt && (
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{note.excerpt}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
