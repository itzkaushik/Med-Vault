"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import SyncModal from "./SyncModal";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "graph", label: "Knowledge Graph", icon: "🧬" },
  { id: "textbooks", label: "Textbooks", icon: "📚" },
  { id: "ai", label: "AI Co-pilot", icon: "🧠" },
];

export default function Sidebar({ collapsed, onToggle, activeView, onNavigate }: SidebarProps) {
  const { subjects } = useStore();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Close sidebar on mobile when navigating
  const handleNavigate = (view: string) => {
    onNavigate(view);
    // Close on mobile (< 1024px)
    if (window.innerWidth < 1024 && !collapsed) {
      onToggle();
    }
  };

  // Close sidebar when pressing Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !collapsed && window.innerWidth < 1024) {
        onToggle();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [collapsed, onToggle]);

  return (
    <>
      {/* Mobile Backdrop — only visible on small screens when sidebar is open */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 z-40 transition-opacity duration-300"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-full flex flex-col glass-strong transition-all duration-300 ease-in-out shrink-0 z-50
          fixed lg:relative
          ${collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
        `}
        style={{
          width: "var(--sidebar-width)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[var(--topbar-height)] border-b border-[var(--border-subtle)] shrink-0">
          <div
            className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-lg font-bold text-white shrink-0 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
            onClick={() => handleNavigate("home")}
          >
            M
          </div>
          <div className="animate-fadeIn overflow-hidden cursor-pointer" onClick={() => handleNavigate("home")}>
            <h1 className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
              MedVault
            </h1>
            <p className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-wider uppercase whitespace-nowrap">
              Knowledge Base
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">
            Navigate
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-150 group"
                style={{
                  background: isActive ? "var(--accent-glow)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent",
                }}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <span
                  className="text-sm font-medium whitespace-nowrap animate-fadeIn"
                  style={{ color: isActive ? "var(--accent-secondary)" : "var(--text-secondary)" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Subjects Section */}
          <div className="mt-6">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">
              Subjects
            </p>
            <div className="space-y-0.5 stagger-children">
              {subjects.map((subject) => {
                const isActive = activeView === `subject-${subject.id}`;
                return (
                  <button
                    key={subject.id}
                    onClick={() => handleNavigate(`subject-${subject.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-150 group"
                    style={{
                      background: isActive ? "var(--bg-hover)" : "transparent",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover:scale-125"
                      style={{ background: subject.color }}
                    />
                    <span
                      className="text-sm whitespace-nowrap truncate transition-colors"
                      style={{
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {subject.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sync & Close buttons (bottom) */}
        <div className="border-t border-[var(--border-subtle)] p-3 space-y-1">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span className="text-lg shrink-0">🔄</span>
            <span className="text-sm font-medium animate-fadeIn">Device Sync</span>
          </button>
          
          {/* Close button (visible on mobile) */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-all duration-150 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300"
            >
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium animate-fadeIn">Close</span>
          </button>
        </div>
      </aside>

      {/* Sync Modal */}
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
}
