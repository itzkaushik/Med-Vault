"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  isPinned: boolean;
  subjectId: string | null;
  topicId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface NoteLink {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface StoreState {
  subjects: Subject[];
  topics: Topic[];
  notes: Note[];
  noteLinks: NoteLink[];
  activeSubjectId: string | null;
  activeTopicId: string | null;
  theme: 'dark' | 'light';
}

interface StoreActions {
  // Subjects
  addSubject: (data: Omit<Subject, "id" | "createdAt" | "updatedAt" | "order">) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  // Topics
  addTopic: (data: Omit<Topic, "id" | "createdAt" | "updatedAt" | "order">) => Topic;
  updateTopic: (id: string, data: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  // Notes
  addNote: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  // Helpers
  getTopicsForSubject: (subjectId: string) => Topic[];
  getNotesForTopic: (topicId: string) => Note[];
  getNotesForSubject: (subjectId: string) => Note[];
  getNoteById: (id: string) => Note | undefined;
  getBacklinks: (noteId: string) => Note[];
  addNoteLink: (sourceId: string, targetId: string) => void;
  removeNoteLink: (sourceId: string, targetId: string) => void;
  importState: (newState: Partial<StoreState>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveContext: (subjectId: string | null, topicId: string | null) => void;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const STORAGE_KEY = "medvault_store";

const INITIAL_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "s1", name: "Anatomy", description: "Structure of the human body", icon: "🦴", color: "#e17055", order: 0, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s2", name: "Physiology", description: "Functions and mechanisms", icon: "💓", color: "#00b894", order: 1, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s3", name: "Biochemistry", description: "Chemical processes in living organisms", icon: "🧪", color: "#fdcb6e", order: 2, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s4", name: "Pathology", description: "Study of diseases and causes", icon: "🔬", color: "#d63031", order: 3, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s5", name: "Pharmacology", description: "Drugs and their actions", icon: "💊", color: "#6c5ce7", order: 4, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s6", name: "Microbiology", description: "Microorganisms and infections", icon: "🦠", color: "#00cec9", order: 5, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s7", name: "Forensic Medicine", description: "Medicolegal aspects", icon: "🔍", color: "#636e72", order: 6, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
  { id: "s8", name: "Community Medicine", description: "Preventive & social medicine", icon: "🏥", color: "#0984e3", order: 7, createdAt: INITIAL_TIMESTAMP, updatedAt: INITIAL_TIMESTAMP },
];

const DEFAULT_STATE: StoreState = { subjects: DEFAULT_SUBJECTS, topics: [], notes: [], noteLinks: [], activeSubjectId: null, activeTopicId: null, theme: 'dark' };

function loadFromStorage(): StoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        subjects: parsed.subjects || DEFAULT_SUBJECTS,
        topics: parsed.topics || [],
        notes: parsed.notes || [],
        noteLinks: parsed.noteLinks || [],
        activeSubjectId: parsed.activeSubjectId || null,
        activeTopicId: parsed.activeTopicId || null,
        theme: parsed.theme || 'dark',
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Always start with default state to match server render
  const [state, setState] = useState<StoreState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage AFTER first render (avoids hydration mismatch)
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) setState(saved);
    setHydrated(true);
  }, []);

  // Persist to localStorage only after hydration
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  // Apply theme class to html/body
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (state.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }, [state.theme]);

  // ─── Subject CRUD ──────────────────────────────────────────
  const addSubject = useCallback(
    (data: Omit<Subject, "id" | "createdAt" | "updatedAt" | "order">) => {
      const now = new Date().toISOString();
      const subject: Subject = {
        ...data,
        id: generateId(),
        order: state.subjects.length,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, subjects: [...prev.subjects, subject] }));
      return subject;
    },
    [state.subjects.length]
  );

  const updateSubject = useCallback((id: string, data: Partial<Subject>) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === id ? { ...s, deletedAt: new Date().toISOString() } : s),
      topics: prev.topics.map(t => t.subjectId === id ? { ...t, deletedAt: new Date().toISOString() } : t),
      notes: prev.notes.map((n) => n.subjectId === id ? { ...n, subjectId: null, updatedAt: new Date().toISOString() } : n),
    }));
  }, []);

  // ─── Topic CRUD ────────────────────────────────────────────
  const addTopic = useCallback(
    (data: Omit<Topic, "id" | "createdAt" | "updatedAt" | "order">) => {
      const now = new Date().toISOString();
      const topic: Topic = {
        ...data,
        id: generateId(),
        order: state.topics.filter((t) => t.subjectId === data.subjectId).length,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, topics: [...prev.topics, topic] }));
      return topic;
    },
    [state.topics]
  );

  const updateTopic = useCallback((id: string, data: Partial<Topic>) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, []);

  const deleteTopic = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t),
      notes: prev.notes.map((n) => n.topicId === id ? { ...n, topicId: null, updatedAt: new Date().toISOString() } : n),
    }));
  }, []);

  // ─── Note CRUD ─────────────────────────────────────────────
  const addNote = useCallback(
    (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const note: Note = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      setState((prev) => ({ ...prev, notes: [...prev.notes, note] }));
      return note;
    },
    []
  );

  const updateNote = useCallback((id: string, data: Partial<Note>) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n),
      noteLinks: prev.noteLinks.map((l) => (l.sourceId === id || l.targetId === id) ? { ...l, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : l),
    }));
  }, []);

  // ─── Helpers ───────────────────────────────────────────────
  const getTopicsForSubject = useCallback(
    (subjectId: string) =>
      state.topics
        .filter((t) => t.subjectId === subjectId)
        .sort((a, b) => a.order - b.order),
    [state.topics]
  );

  const getNotesForTopic = useCallback(
    (topicId: string) =>
      state.notes.filter((n) => n.topicId === topicId),
    [state.notes]
  );

  const getNotesForSubject = useCallback(
    (subjectId: string) =>
      state.notes.filter((n) => n.subjectId === subjectId),
    [state.notes]
  );

  const getNoteById = useCallback(
    (id: string) => state.notes.find((n) => n.id === id),
    [state.notes]
  );

  const getBacklinks = useCallback(
    (noteId: string) => {
      const incomingIds = state.noteLinks
        .filter((l) => l.targetId === noteId)
        .map((l) => l.sourceId);
      return state.notes.filter((n) => incomingIds.includes(n.id));
    },
    [state.noteLinks, state.notes]
  );

  const addNoteLink = useCallback((sourceId: string, targetId: string) => {
    setState((prev) => {
      const exists = prev.noteLinks.some(
        (l) => l.sourceId === sourceId && l.targetId === targetId
      );
      if (exists) return prev;
      return {
        ...prev,
        noteLinks: [
          ...prev.noteLinks,
          { id: generateId(), sourceId, targetId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
      };
    });
  }, []);

  const removeNoteLink = useCallback((sourceId: string, targetId: string) => {
    setState((prev) => ({
      ...prev,
      noteLinks: prev.noteLinks.map(
        (l) => (l.sourceId === sourceId && l.targetId === targetId) ? { ...l, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : l
      ),
    }));
  }, []);

  const importState = useCallback((newState: Partial<StoreState>) => {
    setState((prev) => ({
      ...prev,
      ...newState,
    }));
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const setActiveContext = useCallback((subjectId: string | null, topicId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeSubjectId: subjectId,
      activeTopicId: topicId,
    }));
  }, []);

  const store: Store = {
    ...state,
    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    updateTopic,
    deleteTopic,
    addNote,
    updateNote,
    deleteNote,
    getTopicsForSubject,
    getNotesForTopic,
    getNotesForSubject,
    getNoteById,
    getBacklinks,
    addNoteLink,
    removeNoteLink,
    importState,
    setTheme,
    setActiveContext,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
    
    // Transparently filter out soft-deleted items for UI consumers
    return {
      ...ctx,
      subjects: ctx.subjects.filter((s) => !s.deletedAt),
      topics: ctx.topics.filter((t) => !t.deletedAt),
      notes: ctx.notes.filter((n) => !n.deletedAt),
      noteLinks: ctx.noteLinks.filter((nl) => !nl.deletedAt),
    };

}
