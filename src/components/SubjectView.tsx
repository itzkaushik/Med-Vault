"use client";

import React, { useState } from "react";
import { useStore, type Subject, type Topic } from "@/lib/store";
import TopicModal from "@/components/TopicModal";

interface SubjectViewProps {
  subjectId: string;
  onNavigate: (view: string) => void;
}

export default function SubjectView({ subjectId, onNavigate }: SubjectViewProps) {
  const { subjects, getTopicsForSubject, getNotesForSubject, getNotesForTopic, deleteSubject, deleteTopic } = useStore();
  const [topicModal, setTopicModal] = useState<{ open: boolean; edit: Topic | null }>({ open: false, edit: null });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) return null;

  const topics = getTopicsForSubject(subjectId);
  const allNotes = getNotesForSubject(subjectId);

  const handleDeleteSubject = () => {
    deleteSubject(subjectId);
    onNavigate("home");
  };

  const handleDeleteTopic = (topicId: string) => {
    deleteTopic(topicId);
    setConfirmDelete(null);
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
        <span className="text-[var(--text-primary)] font-medium">{subject.name}</span>
      </div>

      {/* Subject Header */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] p-4 sm:p-6 lg:p-8 mb-6"
        style={{
          background: `linear-gradient(135deg, ${subject.color}18, ${subject.color}08, transparent)`,
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${subject.color}, transparent)` }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-3xl"
              style={{ background: `${subject.color}25` }}
            >
              {subject.icon}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{subject.name}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{subject.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
                <span>{topics.length} topics</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <span>{allNotes.length} notes</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(`edit-subject-${subjectId}`)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteSubject}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Topics</h2>
        <button
          onClick={() => setTopicModal({ open: true, edit: null })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--accent-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Topic
        </button>
      </div>

      {topics.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)]"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[var(--text-secondary)] font-medium mb-1">No topics yet</p>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            Start organizing your {subject.name} notes by adding topics
          </p>
          <button
            onClick={() => setTopicModal({ open: true, edit: null })}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Create First Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {topics.map((topic) => {
            const topicNotes = getNotesForTopic(topic.id);
            return (
              <div
                key={topic.id}
                className="group relative p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 hover-lift cursor-pointer"
                style={{ background: "var(--bg-secondary)" }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${subject.color}12, transparent 70%)` }}
                />

                <div className="relative z-10">
                  {/* Topic Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      onClick={() => onNavigate(`topic-${topic.id}`)}
                      className="flex-1"
                    >
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
                        {topic.name}
                      </h3>
                      {topic.description && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    {/* Topic actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setTopicModal({ open: true, edit: topic }); }}
                        className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
                        title="Edit"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(topic.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3H10M4 3V2C4 1.5 4.5 1 5 1H7C7.5 1 8 1.5 8 2V3M9 3V10C9 10.5 8.5 11 8 11H4C3.5 11 3 10.5 3 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: subject.color }}
                    />
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      {topicNotes.length} notes
                    </span>
                  </div>

                  {/* Click to open */}
                  <div
                    className="absolute inset-0 rounded-[var(--radius-lg)]"
                    onClick={() => onNavigate(`topic-${topic.id}`)}
                  />
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === topic.id && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center rounded-[var(--radius-lg)] animate-scaleIn"
                    style={{ background: "rgba(12, 14, 20, 0.95)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="text-center p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium mb-3">Delete &quot;{topic.name}&quot;?</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Topic Modal */}
      <TopicModal
        isOpen={topicModal.open}
        onClose={() => setTopicModal({ open: false, edit: null })}
        subjectId={subjectId}
        editTopic={topicModal.edit}
      />
    </div>
  );
}
