"use client";

import React from "react";
import { useStore } from "@/lib/store";

interface TopicViewProps {
  topicId: string;
  onNavigate: (view: string) => void;
}

export default function TopicView({ topicId, onNavigate }: TopicViewProps) {
  const { subjects, topics, getNotesForTopic, addNote } = useStore();

  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return null;

  const subject = subjects.find((s) => s.id === topic.subjectId);
  const notes = getNotesForTopic(topicId);

  const handleCreateNote = () => {
    const note = addNote({
      title: "Untitled Note",
      content: "",
      excerpt: "",
      isPinned: false,
      subjectId: topic.subjectId,
      topicId: topic.id,
      tags: [],
    });
    onNavigate(`note-${note.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors"
        >
          Home
        </button>
        <span className="text-[var(--text-muted)]">/</span>
        {subject && (
          <>
            <button
              onClick={() => onNavigate(`subject-${subject.id}`)}
              className="text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors"
            >
              {subject.name}
            </button>
            <span className="text-[var(--text-muted)]">/</span>
          </>
        )}
        <span className="text-[var(--text-primary)] font-medium">{topic.name}</span>
      </div>

      {/* Topic Header */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] p-6 lg:p-8 mb-6"
        style={{
          background: subject
            ? `linear-gradient(135deg, ${subject.color}15, ${subject.color}05, transparent)`
            : "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {subject && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: `${subject.color}25`, color: subject.color }}
                >
                  {subject.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{topic.name}</h1>
            {topic.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{topic.description}</p>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-2">{notes.length} notes</p>
          </div>

          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)]"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">No notes yet</p>
          <p className="text-sm text-[var(--text-tertiary)] mb-4 text-center max-w-sm">
            Start taking notes for &quot;{topic.name}&quot;. Notes will appear here and can be linked with [[wiki-links]].
          </p>
          <button
            onClick={handleCreateNote}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 cursor-pointer hover-lift"
              style={{ background: "var(--bg-secondary)" }}
              onClick={() => onNavigate(`note-${note.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
                    {note.title}
                  </h3>
                  {note.excerpt && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                      {note.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {note.isPinned && (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        📌 Pinned
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors mt-0.5">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
