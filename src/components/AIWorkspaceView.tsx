"use client";

import React, { useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import AIChatView from "./AIChatView";

// Open URL in in-app browser (native) or new tab (web)
async function openExternal(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: "popover" });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
}

const AI_PROVIDERS: AIProvider[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "🤖", url: "https://chatgpt.com", color: "#10a37f" },
  { id: "gemini", name: "Gemini", icon: "✨", url: "https://gemini.google.com", color: "#4285f4" },
  { id: "claude", name: "Claude", icon: "🧠", url: "https://claude.ai", color: "#d97706" },
  { id: "copilot", name: "Copilot", icon: "💡", url: "https://copilot.microsoft.com", color: "#0078d4" },
  { id: "perplexity", name: "Perplexity", icon: "🔍", url: "https://www.perplexity.ai", color: "#20b2aa" },
];

const SAVED_PROMPTS_KEY = "medvault_smart_prompts";

interface SavedPrompt {
  id: string;
  text: string;
  createdAt: string;
}

function loadSavedPrompts(): SavedPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_PROMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const PROMPT_TEMPLATES = [
  { label: "Explain Concept", icon: "💡", template: "Explain the following medical concept in simple terms with clinical significance:\n\n[YOUR CONCEPT]" },
  { label: "Compare & Contrast", icon: "⚖️", template: "Compare and contrast the following two medical concepts. Include a table format:\n\n1. [CONCEPT A]\n2. [CONCEPT B]" },
  { label: "Clinical Vignette", icon: "🏥", template: "Create a clinical vignette (case scenario) that tests understanding of:\n\n[TOPIC]\n\nInclude 3 MCQs with explanations." },
  { label: "Mnemonic Generator", icon: "🧩", template: "Create a memorable mnemonic for:\n\n[LIST OR TOPIC]\n\nMake it creative, fun, and medically accurate." },
  { label: "Differential Diagnosis", icon: "🔬", template: "Given these presenting symptoms, provide a systematic differential diagnosis:\n\nSymptoms: [SYMPTOMS]\n\nOrganize by most likely to least likely with reasoning." },
  { label: "Summarize for Exam", icon: "📋", template: "Summarize the following topic in a concise, exam-ready format with key points, diagrams (described), and high-yield facts:\n\n[TOPIC]" },
];

export default function AIWorkspaceView() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [activeTab, setActiveTab] = useState<"chat" | "prompts" | "providers">("chat");
  const [promptText, setPromptText] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(loadSavedPrompts);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const handleCopyPrompt = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedPrompt(id || "custom");
    setTimeout(() => setCopiedPrompt(null), 2000);
  }, []);

  const handleSavePrompt = useCallback(() => {
    if (!promptText.trim()) return;
    const prompt: SavedPrompt = { id: Date.now().toString(36), text: promptText.trim(), createdAt: new Date().toISOString() };
    const updated = [prompt, ...savedPrompts].slice(0, 20);
    setSavedPrompts(updated);
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
    setPromptText("");
  }, [promptText, savedPrompts]);

  const handleDeletePrompt = useCallback(
    (id: string) => {
      const updated = savedPrompts.filter((p) => p.id !== id);
      setSavedPrompts(updated);
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
    },
    [savedPrompts]
  );

  return (
    <div className="h-full flex flex-col animate-fadeIn overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-[var(--border-subtle)] shrink-0"
        style={{ background: "var(--bg-secondary)" }}
      >
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          🧠 AI Co-pilot
        </h2>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-0.5">
          <button
            onClick={() => setActiveTab("chat")}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all"
            style={{
              background: activeTab === "chat" ? "var(--accent-glow)" : "transparent",
              color: activeTab === "chat" ? "var(--accent-secondary)" : "var(--text-tertiary)",
            }}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all"
            style={{
              background: activeTab === "providers" ? "var(--accent-glow)" : "transparent",
              color: activeTab === "providers" ? "var(--accent-secondary)" : "var(--text-tertiary)",
            }}
          >
            AI Tools
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all"
            style={{
              background: activeTab === "prompts" ? "var(--accent-glow)" : "transparent",
              color: activeTab === "prompts" ? "var(--accent-secondary)" : "var(--text-tertiary)",
            }}
          >
            Prompts
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${activeTab === 'chat' ? '' : 'overflow-y-auto'} flex flex-col min-h-0`}>
        {activeTab === "chat" ? (
          // ─── BUILT-IN AI CHAT ──────────────────────────
          <AIChatView />
        ) : activeTab === "providers" ? (
          // ─── AI PROVIDERS TAB ──────────────────────────
          <div className="p-3 sm:p-6 max-w-2xl mx-auto">
            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {AI_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider);
                    openExternal(provider.url);
                  }}
                  className="group flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border transition-all duration-200 hover-lift active:scale-[0.98] text-left"
                  style={{
                    background: selectedProvider.id === provider.id ? `${provider.color}10` : "var(--bg-secondary)",
                    border: selectedProvider.id === provider.id ? `1px solid ${provider.color}40` : "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${provider.color}15` }}
                  >
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{provider.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{provider.url}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-secondary)] transition-colors">
                    <path d="M12 4L4 12M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>

            {/* How it works */}
            <div className="rounded-[var(--radius-lg)] p-4 sm:p-5 border border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                How to use AI Co-pilot
              </h3>
              <div className="space-y-2.5">
                {[
                  { step: "1", text: 'Switch to the "Prompts" tab and write or pick a template', icon: "✍️" },
                  { step: "2", text: "Copy the prompt to your clipboard", icon: "📋" },
                  { step: "3", text: "Tap an AI tool above — it opens in your browser", icon: "🚀" },
                  { step: "4", text: "Paste the prompt, get your answer, and add it to your notes!", icon: "📝" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "var(--accent-glow)", color: "var(--accent-secondary)" }}
                    >
                      {s.step}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] flex-1">{s.text}</span>
                    <span className="text-base">{s.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // ─── PROMPTS TAB ───────────────────────────────
          <div className="p-3 sm:p-6 max-w-2xl mx-auto space-y-5">
            {/* Write Prompt */}
            <div className="rounded-[var(--radius-lg)] p-4 border border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                ✍️ Write a Prompt
              </h3>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type your question here, then copy and paste it into the AI..."
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", minHeight: "100px" }}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleCopyPrompt(promptText)}
                  disabled={!promptText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-white transition-all duration-150 hover:brightness-110 disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
                >
                  {copiedPrompt === "custom" ? "✓ Copied!" : "📋 Copy"}
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={!promptText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-30"
                >
                  💾 Save
                </button>
              </div>
            </div>

            {/* Smart Templates */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                ⚡ Smart Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => {
                      setPromptText(tmpl.template);
                      handleCopyPrompt(tmpl.template, tmpl.label);
                    }}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-[var(--radius-md)] text-left transition-all active:scale-[0.98]"
                    style={{
                      background: copiedPrompt === tmpl.label ? "var(--accent-glow)" : "var(--bg-secondary)",
                      border: copiedPrompt === tmpl.label ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                    }}
                  >
                    <span className="text-base">{tmpl.icon}</span>
                    <span className="text-xs font-medium text-[var(--text-secondary)] flex-1">
                      {tmpl.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {copiedPrompt === tmpl.label ? "✓ Copied" : "Tap to copy"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Prompts */}
            {savedPrompts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  📌 Saved Prompts
                </h3>
                <div className="space-y-2">
                  {savedPrompts.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-start gap-3 px-3 py-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 flex-1">{sp.text}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyPrompt(sp.text, sp.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] hover:bg-[var(--bg-tertiary)] transition-all text-xs"
                        >
                          {copiedPrompt === sp.id ? "✓" : "📋"}
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(sp.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
