"use client";

import React from "react";
import { useStore } from "@/lib/store";

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

  return (
    <aside
      className="h-full flex flex-col glass-strong transition-all duration-300 ease-in-out shrink-0"
      style={{
        width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
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
          onClick={() => onNavigate("home")}
        >
          M
        </div>
        {!collapsed && (
          <div className="animate-fadeIn overflow-hidden cursor-pointer" onClick={() => onNavigate("home")}>
            <h1 className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
              MedVault
            </h1>
            <p className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-wider uppercase whitespace-nowrap">
              Knowledge Base
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">
          {collapsed ? "•••" : "Navigate"}
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-150 group"
              style={{
                background: isActive ? "var(--accent-glow)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent",
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && (
                <span
                  className="text-sm font-medium whitespace-nowrap animate-fadeIn"
                  style={{ color: isActive ? "var(--accent-secondary)" : "var(--text-secondary)" }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Subjects Section */}
        <div className="mt-6">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">
            {collapsed ? "•••" : "Subjects"}
          </p>
          <div className="space-y-0.5 stagger-children">
            {subjects.map((subject) => {
              const isActive = activeView === `subject-${subject.id}`;
              return (
                <button
                  key={subject.id}
                  onClick={() => onNavigate(`subject-${subject.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-150 group"
                  style={{
                    background: isActive ? "var(--bg-hover)" : "transparent",
                  }}
                  title={collapsed ? subject.name : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover:scale-125"
                    style={{ background: subject.color }}
                  />
                  {!collapsed && (
                    <span
                      className="text-sm whitespace-nowrap truncate transition-colors"
                      style={{
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {subject.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[var(--border-subtle)] p-3">
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
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && (
            <span className="text-xs font-medium animate-fadeIn">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
