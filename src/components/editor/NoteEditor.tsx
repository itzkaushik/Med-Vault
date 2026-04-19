"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import EditorToolbar from "./EditorToolbar";
import WikiLinkPopover from "./WikiLinkPopover";
import WikiLink from "./WikiLinkExtension";
import { useStore, type Note } from "@/lib/store";

interface NoteEditorProps {
  noteId: string;
  onNavigate: (view: string) => void;
}

export default function NoteEditor({ noteId, onNavigate }: NoteEditorProps) {
  const { getNoteById, updateNote, notes, subjects, topics, getBacklinks, addNoteLink } = useStore();
  const note = getNoteById(noteId);
  const [title, setTitle] = useState(note?.title || "");
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subject = note?.subjectId ? subjects.find((s) => s.id === note.subjectId) : null;
  const topic = note?.topicId ? topics.find((t) => t.id === note.topicId) : null;
  const backlinks = note ? getBacklinks(note.id) : [];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start typing your notes... Use [[ to link to other notes.",
      }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      WikiLink,
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: "prose-editor outline-none min-h-[400px] px-6 py-4 text-[var(--text-primary)]",
      },
      handleKeyDown: (_view, event) => {
        // Detect [[ typing for wiki-link
        if (event.key === "[") {
          const { state } = _view;
          const { from } = state.selection;
          const textBefore = state.doc.textBetween(Math.max(0, from - 1), from);
          if (textBefore === "[") {
            // User typed [[
            const coords = _view.coordsAtPos(from);
            setLinkPosition({ top: coords.top, left: coords.left });
            setShowLinkPopover(true);
            setLinkQuery("");
          }
        }
        if (event.key === "]" && showLinkPopover) {
          setShowLinkPopover(false);
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      // Check for link query updates
      if (showLinkPopover) {
        const { state } = e;
        const { from } = state.selection;
        const text = state.doc.textBetween(0, from);
        const lastBrackets = text.lastIndexOf("[[");
        if (lastBrackets !== -1) {
          const query = text.substring(lastBrackets + 2);
          setLinkQuery(query);
        }
      }

      // Auto-save with debounce
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const html = e.getHTML();
        const textContent = e.getText();
        updateNote(noteId, {
          content: html,
          excerpt: textContent.substring(0, 150),
        });
      }, 500);
    },
  });

  // Handle wiki-link selection
  const handleLinkSelect = useCallback(
    (targetNote: Note) => {
      if (!editor) return;
      // Delete the [[ query text
      const { state } = editor;
      const { from } = state.selection;
      const text = state.doc.textBetween(0, from);
      const lastBrackets = text.lastIndexOf("[[");
      if (lastBrackets !== -1) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: lastBrackets + 1, to: from })
          .insertContent({
            type: "wikiLink",
            attrs: { noteTitle: targetNote.title, noteId: targetNote.id },
          })
          .run();
      }
      // Record the link
      addNoteLink(noteId, targetNote.id);
      setShowLinkPopover(false);
    },
    [editor, noteId, addNoteLink]
  );

  // Save title on change
  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateNote(noteId, { title: val });
      }, 300);
    },
    [noteId, updateNote]
  );

  // Sync title if note changes externally
  useEffect(() => {
    if (note) setTitle(note.title);
  }, [note]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[var(--text-tertiary)]">Note not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <button onClick={() => onNavigate("home")} className="text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors">
          Home
        </button>
        {subject && (
          <>
            <span className="text-[var(--text-muted)]">/</span>
            <button onClick={() => onNavigate(`subject-${subject.id}`)} className="text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors">
              {subject.name}
            </button>
          </>
        )}
        {topic && (
          <>
            <span className="text-[var(--text-muted)]">/</span>
            <button onClick={() => onNavigate(`topic-${topic.id}`)} className="text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors">
              {topic.name}
            </button>
          </>
        )}
        <span className="text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">{note.title}</span>
      </div>

      {/* Editor Container */}
      <div
        className="rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]"
        style={{ background: "var(--bg-secondary)" }}
      >
        {/* Title */}
        <div className="px-6 pt-6 pb-2">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="w-full text-2xl lg:text-3xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-transparent outline-none"
          />
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
            {subject && (
              <span className="px-2 py-0.5 rounded-full" style={{ background: `${subject.color}20`, color: subject.color }}>
                {subject.name}
              </span>
            )}
            {topic && <span className="text-[var(--text-muted)]">{topic.name}</span>}
            <span className="text-[var(--text-muted)]">
              Last saved: {new Date(note.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar editor={editor} />

        {/* Editor */}
        <div className="relative">
          <EditorContent editor={editor} />

          {/* Wiki-link popover */}
          {showLinkPopover && (
            <WikiLinkPopover
              query={linkQuery}
              position={linkPosition}
              onSelect={handleLinkSelect}
              onClose={() => setShowLinkPopover(false)}
              excludeNoteId={noteId}
            />
          )}
        </div>
      </div>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="mt-6 p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8 2L12 2L12 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M6 12L2 12L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Backlinks ({backlinks.length})
          </h3>
          <div className="space-y-1.5">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => onNavigate(`note-${bl.id}`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-left hover:bg-[var(--bg-hover)] transition-all group"
              >
                <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--accent-secondary)] transition-colors">📝</span>
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate">
                  {bl.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
