"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import EditorToolbar from "./EditorToolbar";
import WikiLinkPopover from "./WikiLinkPopover";
import WikiLink from "./WikiLinkExtension";
import ImageAnnotator from "./ImageAnnotator";
import { useStore, type Note } from "@/lib/store";

interface NoteEditorProps {
  noteId: string;
  onNavigate: (view: string) => void;
}

// ─── PDF Attachment Types ─────────────────────────────────────
interface Attachment {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  addedAt: string;
}

const ATTACHMENTS_KEY = "medvault_attachments";

function loadAttachments(): Record<string, Attachment[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ATTACHMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAttachments(data: Record<string, Attachment[]>) {
  localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(data));
}

export default function NoteEditor({ noteId, onNavigate }: NoteEditorProps) {
  const { getNoteById, updateNote, notes, subjects, topics, getBacklinks, addNoteLink } = useStore();
  const note = getNoteById(noteId);
  const [mode, setMode] = useState<"read" | "edit">(note?.content ? "read" : "edit");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [title, setTitle] = useState(note?.title || "");
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewingPdf, setViewingPdf] = useState<Attachment | null>(null);
  
  // Image Annotator State
  const [annotatingImage, setAnnotatingImage] = useState<{ src: string, pos: number } | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subject = note?.subjectId ? subjects.find((s) => s.id === note.subjectId) : null;
  const topic = note?.topicId ? topics.find((t) => t.id === note.topicId) : null;
  const backlinks = note ? getBacklinks(note.id) : [];

  // Load attachments for this note
  useEffect(() => {
    const all = loadAttachments();
    setAttachments(all[noteId] || []);
  }, [noteId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start typing your notes... Use [[ to link to other notes." }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Image.configure({ inline: true, allowBase64: true }),
      Youtube.configure({ width: 480, height: 320, inline: false }),
      BubbleMenuExtension,
      WikiLink,
    ],
    content: note?.content || "",
    editable: mode === "edit",
    editorProps: {
      attributes: {
        class: "prose-editor outline-none min-h-[300px] px-4 sm:px-6 py-4 text-[var(--text-primary)]",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "[") {
          const { state } = _view;
          const { from } = state.selection;
          const textBefore = state.doc.textBetween(Math.max(0, from - 1), from);
          if (textBefore === "[") {
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
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        if (target && target.nodeName === 'IMG') {
          const src = target.getAttribute('src');
          if (src) {
            setAnnotatingImage({ src, pos });
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      if (showLinkPopover) {
        const { state } = e;
        const { from } = state.selection;
        const text = state.doc.textBetween(0, from);
        const lastBrackets = text.lastIndexOf("[[");
        if (lastBrackets !== -1) {
          setLinkQuery(text.substring(lastBrackets + 2));
        }
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const html = e.getHTML();
        const textContent = e.getText();
        updateNote(noteId, { content: html, excerpt: textContent.substring(0, 150) });
      }, 500);
    },
  });

  // Toggle editor editable when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(mode === "edit");
    }
  }, [mode, editor]);

  // Handle wiki-link selection
  const handleLinkSelect = useCallback(
    (targetNote: Note) => {
      if (!editor) return;
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
      addNoteLink(noteId, targetNote.id);
      setShowLinkPopover(false);
    },
    [editor, noteId, addNoteLink]
  );

  // Save title
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

  // Camera / Photo Add Handler
  const handleAddPhoto = useCallback(async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });
      if (image.dataUrl && editor) {
        editor.chain().focus().setImage({ src: image.dataUrl }).run();
      }
    } catch (e) {
      console.warn("Camera cancelled or failed", e);
    }
  }, [editor]);

  const handleAnnotatorSave = (editedDataUrl: string) => {
    if (editor && annotatingImage) {
      let nodeFoundPos = -1;
      
      // Find the exact node position by matching the src
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === annotatingImage.src) {
          nodeFoundPos = pos;
          return false; // Stop searching
        }
      });

      if (nodeFoundPos !== -1) {
        editor
          .chain()
          .focus()
          .setNodeSelection(nodeFoundPos)
          .setImage({ src: editedDataUrl })
          .run();
      } else {
        // Fallback if not found (shouldn't happen)
        editor.chain().focus().setImage({ src: editedDataUrl }).run();
      }
    }
    setAnnotatingImage(null);
  };

  // PDF Attachment handler
  const handleAttachPdf = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || file.type !== "application/pdf") return;
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          id: Date.now().toString(36),
          name: file.name,
          size: file.size,
          dataUrl: reader.result as string,
          addedAt: new Date().toISOString(),
        };
        const all = loadAttachments();
        const noteAttachments = [...(all[noteId] || []), attachment];
        all[noteId] = noteAttachments;
        saveAttachments(all);
        setAttachments(noteAttachments);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [noteId]
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      const all = loadAttachments();
      const noteAttachments = (all[noteId] || []).filter((a) => a.id !== attachmentId);
      all[noteId] = noteAttachments;
      saveAttachments(all);
      setAttachments(noteAttachments);
      if (viewingPdf?.id === attachmentId) setViewingPdf(null);
    },
    [noteId, viewingPdf]
  );

  const handleEmbedVideo = useCallback(() => {
    if (!editor) return;
    const url = prompt("Enter YouTube video URL:");
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const handleAskAI = useCallback(async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const apiKey = localStorage.getItem("medvault_gemini_key");
    if (!apiKey) {
      alert("Please set up your Gemini API key in the AI Co-pilot settings first.");
      return;
    }

    setIsAskingAI(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `You are a medical study assistant. Explain the following concept or text concisely, providing high-yield medical facts if applicable. Format it beautifully in markdown.\n\nText: "${selectedText}"` }]
            }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          })
        }
      );
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) {
        editor.chain().focus().insertContentAt(to, `\n\n> **💡 AI Explanation:**\n> ${aiText.replace(/\n/g, '\n> ')}\n\n`).run();
      }
    } catch (e) {
      console.error("AI Error", e);
      alert("Failed to get AI suggestion. Try again.");
    } finally {
      setIsAskingAI(false);
    }
  }, [editor]);

  useEffect(() => {
    if (note) setTitle(note.title);
  }, [note]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`mx-auto animate-fadeIn transition-all duration-300 ${isFocusMode ? "fixed inset-0 z-[100] bg-[var(--bg-primary)] overflow-y-auto p-4 sm:p-8 lg:p-12" : "max-w-4xl"}`}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

      {/* Breadcrumb - hide in focus mode */}
      {!isFocusMode && (
        <div className="flex items-center gap-2 text-xs sm:text-sm mb-4 flex-wrap">
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
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[150px] sm:max-w-[200px]">{note.title}</span>
      </div>
      )}

      {/* Note Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ${isFocusMode ? "max-w-4xl mx-auto border-none bg-transparent" : "rounded-[var(--radius-xl)] border border-[var(--border-subtle)]"}`}
        style={{ background: isFocusMode ? "transparent" : "var(--bg-secondary)" }}
      >
        {/* Header: Title + Mode Toggle */}
        <div className="px-4 sm:px-6 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            {mode === "edit" ? (
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Note"
                className="flex-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-transparent outline-none"
              />
            ) : (
              <h1 className="flex-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
                {note.title || "Untitled Note"}
              </h1>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {mode === "read" && (
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  title="Toggle Focus Mode"
                >
                  {isFocusMode ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 2V5H2M9 2V5H12M5 12V9H2M9 12V9H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:inline">Exit Focus</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 5V2H5M12 5V2H9M2 9V12H5M12 9V12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:inline">Focus Mode</span>
                    </>
                  )}
                </button>
              )}
              
              {mode === "read" ? (
                <button
                  onClick={() => { setMode("edit"); setTimeout(() => editor?.commands.focus(), 100); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all text-white hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", boxShadow: "var(--shadow-glow)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Edit Note</span>
                </button>
              ) : (
                <button
                  onClick={() => setMode("read")}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all text-white bg-[var(--accent-success)] hover:brightness-110"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Done Editing</span>
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-[var(--text-tertiary)]">
            {subject && (
              <span className="px-2 py-0.5 rounded-full" style={{ background: `${subject.color}20`, color: subject.color }}>
                {subject.name}
              </span>
            )}
            {topic && <span className="text-[var(--text-muted)]">{topic.name}</span>}
            <span className="text-[var(--text-muted)]">
              {new Date(note.updatedAt).toLocaleDateString()} at {new Date(note.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {mode === "edit" && (
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Editing
              </span>
            )}
          </div>
        </div>

        {/* Toolbar — only in edit mode */}
        {mode === "edit" && <EditorToolbar editor={editor} onAddPhoto={handleAddPhoto} />}

        {/* Content */}
        <div className="relative">
          {mode === "read" ? (
            // ─── Read Mode: Rendered HTML ─────────────────────
            <div
              className="prose-editor px-4 sm:px-6 py-4 min-h-[200px] text-[var(--text-primary)] cursor-default"
              dangerouslySetInnerHTML={{ __html: note.content || '<p style="color: var(--text-muted); font-style: italic;">This note is empty. Click Edit to start writing.</p>' }}
            />
          ) : (
            // ─── Edit Mode: TipTap Editor ─────────────────────
            <>
              {editor && mode === "edit" && (
                <BubbleMenu
                  editor={editor}
                  options={{ placement: "top" }}
                  className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-[var(--radius-md)] shadow-glow"
                >
                  <button
                    onClick={handleAskAI}
                    disabled={isAskingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold text-white bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    <span>🤖</span> {isAskingAI ? "Thinking..." : "Explain with AI"}
                  </button>
                  <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                  <button
                    onClick={handleEmbedVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    <span className="text-red-500">▶️</span> Add Video
                  </button>
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
              {showLinkPopover && (
                <WikiLinkPopover
                  query={linkQuery}
                  position={linkPosition}
                  onSelect={handleLinkSelect}
                  onClose={() => setShowLinkPopover(false)}
                  excludeNoteId={noteId}
                />
              )}
            </>
          )}
        </div>

        {/* Attachments Section */}
        <div className="border-t border-[var(--border-subtle)] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 6L6.5 9.5C5.3 10.7 3.4 10.7 2.2 9.5C1 8.3 1 6.4 2.2 5.2L6.7 0.7C7.5 -0.1 8.8 -0.1 9.6 0.7C10.4 1.5 10.4 2.8 9.6 3.6L5.1 8.1C4.7 8.5 4.1 8.5 3.7 8.1C3.3 7.7 3.3 7.1 3.7 6.7L7.2 3.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Attachments ({attachments.length})
            </h3>
            <button
              onClick={handleAttachPdf}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[10px] font-medium text-[var(--accent-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Add PDF
            </button>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
                  onClick={() => setViewingPdf(viewingPdf?.id === att.id ? null : att)}
                >
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center bg-red-500/10 text-red-400 text-xs font-bold shrink-0">
                    PDF
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{att.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{formatFileSize(att.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingPdf(viewingPdf?.id === att.id ? null : att); }}
                      className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] hover:bg-[var(--bg-tertiary)] transition-all"
                      title="View"
                    >
                      👁
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(att.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] py-1">No PDFs attached. Click &quot;Add PDF&quot; to attach study material.</p>
          )}
        </div>
      </div>

      {/* PDF Viewer (inline) */}
      {viewingPdf && (
        <div className="mt-4 rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-xs font-bold">PDF</span>
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{viewingPdf.name}</span>
            </div>
            <button
              onClick={() => setViewingPdf(null)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
            >
              ✕
            </button>
          </div>
          <iframe
            src={viewingPdf.dataUrl}
            className="w-full border-none"
            style={{ height: "70vh" }}
            title={viewingPdf.name}
          />
        </div>
      )}

      {/* Backlinks - hide in focus mode */}
      {!isFocusMode && backlinks.length > 0 && (
        <div className="mt-4 p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
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

      {/* Image Annotator Modal */}
      {annotatingImage && (
        <ImageAnnotator
          isOpen={true}
          imageUrl={annotatingImage.src}
          onSave={handleAnnotatorSave}
          onClose={() => setAnnotatingImage(null)}
        />
      )}
    </div>
  );
}
