"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import SubjectGrid from "@/components/SubjectGrid";
import WelcomeHero from "@/components/WelcomeHero";
import SubjectView from "@/components/SubjectView";
import TopicView from "@/components/TopicView";
import SubjectModal from "@/components/SubjectModal";
import CommandPalette from "@/components/CommandPalette";
import { useStore } from "@/lib/store";

// Dynamic imports to avoid SSR issues
const NoteEditor = dynamic(() => import("@/components/editor/NoteEditor"), { ssr: false });
const GraphView = dynamic(() => import("@/components/GraphView"), { ssr: false });
const TextbookView = dynamic(() => import("@/components/TextbookView"), { ssr: false });
const AIWorkspaceView = dynamic(() => import("@/components/AIWorkspaceView"), { ssr: false });

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<string>("home");
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [searchOpen, setSearchOpen] = useState(false);
  const { subjects, addNote } = useStore();

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Handle "New Note" from TopBar — creates an unattached note
  const handleNewNote = useCallback(() => {
    const note = addNote({
      title: "Untitled Note",
      content: "",
      excerpt: "",
      isPinned: false,
      subjectId: null,
      topicId: null,
      tags: [],
    });
    setActiveView(`note-${note.id}`);
  }, [addNote]);

  // Parse the active view to determine what to render
  const renderContent = () => {
    if (activeView.startsWith("note-")) {
      const noteId = activeView.replace("note-", "");
      return <NoteEditor noteId={noteId} onNavigate={setActiveView} />;
    }
    if (activeView.startsWith("subject-")) {
      const subjectId = activeView.replace("subject-", "");
      return <SubjectView subjectId={subjectId} onNavigate={setActiveView} />;
    }
    if (activeView.startsWith("topic-")) {
      const topicId = activeView.replace("topic-", "");
      return <TopicView topicId={topicId} onNavigate={setActiveView} />;
    }

    switch (activeView) {
      case "home":
        return (
          <div className="max-w-6xl mx-auto animate-fadeIn">
            <WelcomeHero />
            <SubjectGrid
              onNavigate={setActiveView}
              onAddSubject={() => setSubjectModal({ open: true, editId: null })}
            />
          </div>
        );
      case "graph":
        return <GraphView onNavigate={setActiveView} />;
      case "textbooks":
        return <TextbookView />;
      case "ai":
        return <AIWorkspaceView />;
      default:
        return null;
    }
  };

  const editSubject = subjectModal.editId
    ? subjects.find((s) => s.id === subjectModal.editId) || null
    : null;

  return (
    <>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewNote={handleNewNote}
          onSearch={() => setSearchOpen(true)}
        />
        <div className={`flex-1 overflow-y-auto ${activeView === 'ai' ? '' : 'p-3 sm:p-6 lg:p-8'}`}>
          {renderContent()}
        </div>
      </main>

      {/* Subject Modal */}
      <SubjectModal
        isOpen={subjectModal.open}
        onClose={() => setSubjectModal({ open: false, editId: null })}
        editSubject={editSubject}
      />

      {/* Command Palette (Global Search) */}
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={setActiveView}
      />
    </>
  );
}
