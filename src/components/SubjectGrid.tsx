"use client";

import React from "react";
import { useStore } from "@/lib/store";

interface SubjectGridProps {
  onNavigate: (view: string) => void;
  onAddSubject: () => void;
}

export default function SubjectGrid({ onNavigate, onAddSubject }: SubjectGridProps) {
  const { subjects, getTopicsForSubject, getNotesForSubject } = useStore();

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Subjects</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Select a subject to view topics and notes
          </p>
        </div>
        <button
          onClick={onAddSubject}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--accent-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {subjects.map((subject) => {
          const topics = getTopicsForSubject(subject.id);
          const notes = getNotesForSubject(subject.id);
          return (
            <button
              key={subject.id}
              onClick={() => onNavigate(`subject-${subject.id}`)}
              className="group relative text-left p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 hover-lift cursor-pointer"
              style={{ background: "var(--bg-secondary)" }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${subject.color}15, transparent 70%)` }}
              />

              <div className="relative z-10">
                {/* Icon + Color Dot */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-200 group-hover:w-3 group-hover:h-3"
                    style={{ background: subject.color }}
                  />
                </div>

                {/* Info */}
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 group-hover:text-white transition-colors">
                  {subject.name}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
                  {subject.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  <span>{topics.length} topics</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[var(--text-muted)]" />
                  <span>{notes.length} notes</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
