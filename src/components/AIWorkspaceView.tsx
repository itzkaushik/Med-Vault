"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
    url: "https://chatgpt.com",
    color: "#10a37f",
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "✨",
    url: "https://gemini.google.com",
    color: "#4285f4",
  },
  {
    id: "claude",
    name: "Claude",
    icon: "🧠",
    url: "https://claude.ai",
    color: "#d97706",
  },
  {
    id: "copilot",
    name: "Copilot",
    icon: "💡",
    url: "https://copilot.microsoft.com",
    color: "#0078d4",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    url: "https://www.perplexity.ai",
    color: "#20b2aa",
  },
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

export default function AIWorkspaceView() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [splitRatio, setSplitRatio] = useState(50);
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [promptText, setPromptText] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(loadSavedPrompts);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Smart prompt templates
  const PROMPT_TEMPLATES = [
    {
      label: "Explain Concept",
      template: "Explain the following medical concept in simple terms with clinical significance:\n\n[YOUR CONCEPT]",
    },
    {
      label: "Compare & Contrast",
      template: "Compare and contrast the following two medical concepts. Include a table format:\n\n1. [CONCEPT A]\n2. [CONCEPT B]",
    },
    {
      label: "Clinical Vignette",
      template: "Create a clinical vignette (case scenario) that tests understanding of:\n\n[TOPIC]\n\nInclude 3 MCQs with explanations.",
    },
    {
      label: "Mnemonic Generator",
      template: "Create a memorable mnemonic for:\n\n[LIST OR TOPIC]\n\nMake it creative, fun, and medically accurate.",
    },
    {
      label: "Differential Diagnosis",
      template: "Given these presenting symptoms, provide a systematic differential diagnosis:\n\nSymptoms: [SYMPTOMS]\n\nOrganize by most likely to least likely with reasoning.",
    },
    {
      label: "Summarize for Exam",
      template: "Summarize the following topic in a concise, exam-ready format with key points, diagrams (described), and high-yield facts:\n\n[TOPIC]",
    },
  ];

  // Copy prompt to clipboard
  const handleCopyPrompt = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(id || "custom");
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedPrompt(id || "custom");
      setTimeout(() => setCopiedPrompt(null), 2000);
    }
  }, []);

  // Save custom prompt
  const handleSavePrompt = useCallback(() => {
    if (!promptText.trim()) return;
    const prompt: SavedPrompt = {
      id: Date.now().toString(36),
      text: promptText.trim(),
      createdAt: new Date().toISOString(),
    };
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

  // Drag to resize split panel
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, ratio)));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* AI Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center gap-2">
          {/* Provider selector */}
          <div className="flex items-center gap-1">
            {AI_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  setSelectedProvider(provider);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all duration-150"
                style={{
                  background: selectedProvider.id === provider.id ? `${provider.color}20` : "transparent",
                  color: selectedProvider.id === provider.id ? provider.color : "var(--text-tertiary)",
                  border: selectedProvider.id === provider.id ? `1px solid ${provider.color}40` : "1px solid transparent",
                }}
              >
                <span>{provider.icon}</span>
                <span className="hidden sm:inline">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle prompt panel */}
          <button
            onClick={() => setShowPromptPanel(!showPromptPanel)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all duration-150"
            style={{
              background: showPromptPanel ? "var(--accent-glow)" : "transparent",
              color: showPromptPanel ? "var(--accent-secondary)" : "var(--text-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2H5V5H2ZM7 2H10V5H7ZM2 7H5V10H2Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Prompts
          </button>

          {/* Open in new tab */}
          <a
            href={selectedProvider.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M9 3H5M9 3V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Open
          </a>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div ref={splitRef} className="flex-1 flex overflow-hidden">
        {/* Left: Smart Prompts Panel */}
        {showPromptPanel && (
          <>
            <div
              className="overflow-y-auto border-r border-[var(--border-subtle)]"
              style={{ width: `${splitRatio}%`, background: "var(--bg-secondary)" }}
            >
              <div className="p-4 space-y-4">
                {/* Custom Prompt */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    ✍️ Write a Prompt
                  </h3>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Type your question here, then copy and paste it into the AI..."
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-primary)]"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", minHeight: "80px" }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleCopyPrompt(promptText)}
                      disabled={!promptText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-white transition-all duration-150 hover:brightness-110 disabled:opacity-30"
                      style={{
                        background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                      }}
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

                {/* Quick Templates */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    ⚡ Smart Templates
                  </h3>
                  <div className="space-y-1.5">
                    {PROMPT_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.label}
                        onClick={() => {
                          setPromptText(tmpl.template);
                          handleCopyPrompt(tmpl.template, tmpl.label);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-left hover:bg-[var(--bg-hover)] transition-all group"
                        style={{ border: "1px solid var(--border-subtle)" }}
                      >
                        <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                          {tmpl.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedPrompt === tmpl.label ? "✓" : "Copy"}
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
                    <div className="space-y-1.5">
                      {savedPrompts.map((sp) => (
                        <div
                          key={sp.id}
                          className="group relative px-3 py-2.5 rounded-[var(--radius-md)] text-left hover:bg-[var(--bg-hover)] transition-all"
                          style={{ border: "1px solid var(--border-subtle)" }}
                        >
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 pr-12">
                            {sp.text}
                          </p>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopyPrompt(sp.text, sp.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] hover:bg-[var(--bg-tertiary)] transition-all"
                              title="Copy"
                            >
                              {copiedPrompt === sp.id ? "✓" : "📋"}
                            </button>
                            <button
                              onClick={() => handleDeletePrompt(sp.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Tip */}
                <div
                  className="px-3 py-3 rounded-[var(--radius-md)] text-xs text-[var(--text-tertiary)] leading-relaxed"
                  style={{ background: "var(--accent-glow)", border: "1px solid rgba(108, 92, 231, 0.15)" }}
                >
                  <p className="font-semibold text-[var(--accent-secondary)] mb-1">💡 How to use</p>
                  <ol className="list-decimal pl-3.5 space-y-0.5">
                    <li>Write or pick a prompt template</li>
                    <li>Click &quot;Copy&quot; to copy it</li>
                    <li>Paste it into the AI on the right →</li>
                    <li>Copy the AI&apos;s answer back into your notes</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Drag Handle */}
            <div
              className="w-1 cursor-col-resize hover:bg-[var(--accent-primary)] transition-colors shrink-0"
              style={{ background: "var(--border-subtle)" }}
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        {/* Right: AI Provider Panel */}
        <div className="flex-1 relative flex items-center justify-center p-6 sm:p-10" style={{ background: "var(--bg-primary)" }}>
          <div className="max-w-sm w-full text-center">
            {/* Provider Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 transition-all duration-300"
              style={{ background: `${selectedProvider.color}15`, boxShadow: `0 0 40px ${selectedProvider.color}20` }}
            >
              {selectedProvider.icon}
            </div>

            {/* Provider Name */}
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              {selectedProvider.name}
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              Use your {selectedProvider.name} account to get AI-powered study help
            </p>

            {/* Open Button */}
            <a
              href={selectedProvider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${selectedProvider.color}, ${selectedProvider.color}cc)`,
                boxShadow: `0 4px 20px ${selectedProvider.color}40`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open {selectedProvider.name}
            </a>

            {/* Steps */}
            <div className="mt-8 text-left space-y-3">
              {[
                { step: "1", text: "Copy a prompt from the left panel", icon: "📋" },
                { step: "2", text: `Paste it into ${selectedProvider.name}`, icon: "💬" },
                { step: "3", text: "Copy the answer back into your notes", icon: "📝" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]" style={{ background: "var(--bg-secondary)" }}>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: `${selectedProvider.color}20`, color: selectedProvider.color }}
                  >
                    {s.step}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{s.text}</span>
                  <span className="ml-auto text-sm">{s.icon}</span>
                </div>
              ))}
            </div>

            {/* Native app tip */}
            <div
              className="mt-6 px-3 py-2.5 rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)] leading-relaxed"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
            >
              💡 <strong className="text-[var(--text-tertiary)]">Tip:</strong> Install the MedVault Android app for a fully embedded AI experience — no tab switching needed!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
