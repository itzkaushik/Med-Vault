"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";

const API_KEY_STORAGE = "medvault_llm_api_key";
const LEGACY_GEMINI_API_KEY_STORAGE = "medvault_gemini_key";
const API_PROVIDER_STORAGE = "medvault_llm_provider";
const MODEL_STORAGE = "medvault_llm_model";
const MAX_OUTPUT_TOKENS_STORAGE = "medvault_llm_max_output_tokens";
const CONTEXT_TURNS_STORAGE = "medvault_llm_context_turns";
const CONCISE_MODE_STORAGE = "medvault_llm_concise_mode";
const CHAT_HISTORY_STORAGE = "medvault_chat_history";

type AIProvider = "gemini" | "openrouter";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem(LEGACY_GEMINI_API_KEY_STORAGE) || "";
}

function loadProvider(): AIProvider {
  if (typeof window === "undefined") return "openrouter";
  const provider = localStorage.getItem(API_PROVIDER_STORAGE);
  return provider === "gemini" ? "gemini" : "openrouter";
}

function loadModel(provider: AIProvider): string {
  if (typeof window === "undefined") return provider === "openrouter" ? "openrouter/auto" : "gemini-2.0-flash";
  const saved = localStorage.getItem(MODEL_STORAGE);
  if (saved) return saved;
  return provider === "openrouter" ? "openrouter/auto" : "gemini-2.0-flash";
}

function loadMaxOutputTokens(): number {
  if (typeof window === "undefined") return 512;
  const raw = Number(localStorage.getItem(MAX_OUTPUT_TOKENS_STORAGE));
  if (!Number.isFinite(raw) || raw < 64) return 512;
  return Math.min(2048, Math.floor(raw));
}

function loadContextTurns(): number {
  if (typeof window === "undefined") return 4;
  const raw = Number(localStorage.getItem(CONTEXT_TURNS_STORAGE));
  if (!Number.isFinite(raw) || raw < 1) return 4;
  return Math.min(10, Math.floor(raw));
}

function loadConciseMode(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(CONCISE_MODE_STORAGE);
  if (raw === null) return true;
  return raw === "true";
}

function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const MEDICAL_SYSTEM_PROMPT = `You are MedVault AI, a helpful medical study assistant for MBBS students. You specialize in:
- Anatomy, Physiology, Biochemistry, Pharmacology, Pathology, Microbiology, Forensic Medicine, and Community Medicine
- Creating mnemonics, clinical vignettes, and exam-ready summaries
- Explaining complex medical concepts in simple terms
- Comparing and contrasting related medical topics
- Providing differential diagnoses

Rules:
- Be concise but thorough. Use bullet points and headers for clarity.
- When relevant, mention clinical significance and high-yield exam facts.
- Use medical terminology correctly but explain it simply.
- Format responses with markdown: **bold**, *italic*, bullet points, numbered lists.
- If unsure, say so — never fabricate medical information.`;

export default function AIChatView() {
  const { activeSubjectId, activeTopicId, subjects, topics } = useStore();
  const [provider, setProvider] = useState<AIProvider>(loadProvider);
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [showSettings, setShowSettings] = useState(!loadApiKey());
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState(loadApiKey);
  const [model, setModel] = useState(loadModel(loadProvider()));
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(loadMaxOutputTokens);
  const [contextTurns, setContextTurns] = useState<number>(loadContextTurns);
  const [conciseMode, setConciseMode] = useState<boolean>(loadConciseMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save chat history
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_STORAGE, JSON.stringify(messages));
  }, [messages]);

  const saveApiKey = useCallback(() => {
    const key = tempKey.trim();
    if (!key) return;
    localStorage.setItem(API_KEY_STORAGE, key);
    localStorage.removeItem(LEGACY_GEMINI_API_KEY_STORAGE);
    localStorage.setItem(API_PROVIDER_STORAGE, provider);
    localStorage.setItem(MODEL_STORAGE, model.trim() || (provider === "openrouter" ? "openrouter/auto" : "gemini-2.0-flash"));
    localStorage.setItem(MAX_OUTPUT_TOKENS_STORAGE, String(maxOutputTokens));
    localStorage.setItem(CONTEXT_TURNS_STORAGE, String(contextTurns));
    localStorage.setItem(CONCISE_MODE_STORAGE, String(conciseMode));
    setApiKey(key);
    setShowSettings(false);
    setError(null);
  }, [tempKey, provider, model, maxOutputTokens, contextTurns, conciseMode]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: ChatMessage = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    setError(null);

    try {
      let contextAddition = "";
      if (activeSubjectId) {
        const matchingSubject = subjects.find(s => s.id === activeSubjectId);
        const matchingTopic = activeTopicId ? topics.find(t => t.id === activeTopicId) : null;
        if (matchingSubject && matchingTopic) {
          contextAddition = `\nContext: The user is currently studying the subject "${matchingSubject.name}", answering a query related to the topic "${matchingTopic.name}". Tailor your explanation to this context.`;
        } else if (matchingSubject) {
          contextAddition = `\nContext: The user is currently studying the subject "${matchingSubject.name}". Tailor your explanation to this context.`;
        }
      }

      // Keep only recent context turns to reduce token usage.
      const recentMessages = updatedMessages.slice(-(contextTurns * 2));
      const brevityInstruction = conciseMode
        ? "\n\nToken policy: keep replies concise, avoid long preambles, prefer compact bullet points, and cap response length unless user asks for deep detail."
        : "";
      const systemPrompt = MEDICAL_SYSTEM_PROMPT + contextAddition + brevityInstruction;

      let response: Response;
      if (provider === "openrouter") {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model.trim() || "openrouter/auto",
            messages: [
              { role: "system", content: systemPrompt },
              ...recentMessages.map((m) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.text,
              })),
            ],
            temperature: conciseMode ? 0.3 : 0.7,
            max_tokens: maxOutputTokens,
          }),
        });
      } else {
        const contents = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood! I'm MedVault AI, ready to help you study medicine. Ask me anything!" }] },
          ...recentMessages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        ];

        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim() || "gemini-2.0-flash")}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: conciseMode ? 0.3 : 0.7,
                topP: 0.9,
                maxOutputTokens,
              },
            }),
          }
        );
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 400 || response.status === 403) {
          throw new Error("Invalid API key. Please check your key in Settings.");
        }
        throw new Error(errData?.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const aiText = provider === "openrouter"
        ? (data?.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.")
        : (data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.");

      const aiMessage: ChatMessage = { role: "model", text: aiText, timestamp: new Date().toISOString() };
      setMessages([...updatedMessages, aiMessage]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get response";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputText,
    isLoading,
    apiKey,
    messages,
    activeSubjectId,
    activeTopicId,
    subjects,
    topics,
    provider,
    model,
    maxOutputTokens,
    contextTurns,
    conciseMode,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_STORAGE);
  }, []);

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h4 class="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">$1</h4>')
      .replace(/^## (.*$)/gm, '<h3 class="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">$1</h3>')
      .replace(/^# (.*$)/gm, '<h2 class="text-base font-bold text-[var(--text-primary)] mt-3 mb-1">$1</h2>')
      .replace(/^- (.*$)/gm, '<li class="ml-3">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-3"><span class="font-semibold">$1.</span> $2</li>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--accent-secondary)] text-[11px]">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 sm:p-4 border-b border-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                🔑 API Key Setup
              </h3>
              {apiKey && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ✕ Close
                </button>
              )}
            </div>

            <div
              className="px-3 py-2.5 rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)] leading-relaxed mb-3"
              style={{ background: "var(--accent-glow)", border: "1px solid rgba(108, 92, 231, 0.15)" }}
            >
              <p className="font-semibold text-[var(--accent-secondary)] mb-1">🔌 Provider + Token Saver Setup</p>
              <ol className="list-decimal pl-3.5 space-y-0.5">
                <li>Choose <strong>OpenRouter</strong> or <strong>Gemini</strong></li>
                <li>Paste API key and model</li>
                <li>Keep <strong>Max Output Tokens</strong> low (recommended: 256-768)</li>
                <li>Keep <strong>Context Turns</strong> low (recommended: 3-5)</li>
              </ol>
              <p className="mt-1.5 text-[var(--text-muted)]">Default settings are optimized to avoid burning tokens.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setProvider("openrouter")}
                className="px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
                style={{
                  background: provider === "openrouter" ? "var(--accent-glow)" : "var(--bg-tertiary)",
                  color: provider === "openrouter" ? "var(--accent-secondary)" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                OpenRouter
              </button>
              <button
                onClick={() => setProvider("gemini")}
                className="px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
                style={{
                  background: provider === "gemini" ? "var(--accent-glow)" : "var(--bg-tertiary)",
                  color: provider === "gemini" ? "var(--accent-secondary)" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Gemini
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder={provider === "openrouter" ? "Paste your OpenRouter API key..." : "Paste your Gemini API key..."}
                className="flex-1 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                onKeyDown={(e) => { if (e.key === "Enter") saveApiKey(); }}
              />
              <button
                onClick={saveApiKey}
                disabled={!tempKey.trim()}
                className="px-4 py-2 rounded-[var(--radius-md)] text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
              >
                Save
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === "openrouter" ? "Model (e.g. openai/gpt-4o-mini)" : "Model (e.g. gemini-2.0-flash)"}
                className="px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
              />
              <input
                type="number"
                min={64}
                max={2048}
                value={maxOutputTokens}
                onChange={(e) => setMaxOutputTokens(Math.max(64, Math.min(2048, Number(e.target.value) || 512)))}
                className="px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                title="Max output tokens"
              />
              <input
                type="number"
                min={1}
                max={10}
                value={contextTurns}
                onChange={(e) => setContextTurns(Math.max(1, Math.min(10, Number(e.target.value) || 4)))}
                className="px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                title="Context turns"
              />
            </div>

            <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={conciseMode}
                onChange={(e) => setConciseMode(e.target.checked)}
              />
              Concise mode (recommended to save tokens)
            </label>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 && !showSettings && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">MedVault AI</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-sm mb-6">
              Your context-aware medical study assistant. Ask me to explain concepts, create mnemonics, build case scenarios, or summarize topics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {[
                { text: "Explain the Renin-Angiotensin system", icon: "💡" },
                { text: "Create a mnemonic for cranial nerves", icon: "🧩" },
                { text: "Differential diagnosis for chest pain", icon: "🔬" },
                { text: "Compare Type 1 vs Type 2 Diabetes", icon: "⚖️" },
              ].map((q) => (
                <button
                  key={q.text}
                  onClick={() => { setInputText(q.text); inputRef.current?.focus(); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-left text-xs text-[var(--text-secondary)] transition-all active:scale-[0.98]"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  <span>{q.icon}</span>
                  <span className="line-clamp-1">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === "user"
                  ? "rounded-br-md"
                  : "rounded-bl-md"
              }`}
              style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                  : "var(--bg-secondary)",
                border: msg.role === "model" ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              {msg.role === "user" ? (
                <p className="text-sm text-white whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div
                  className="text-sm text-[var(--text-primary)] leading-relaxed prose-chat"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                />
              )}
              <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-white/50" : "text-[var(--text-muted)]"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-md px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="px-3 py-2 rounded-[var(--radius-md)] text-xs text-red-400 bg-red-500/10 border border-red-500/20 max-w-sm text-center">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="border-t border-[var(--border-subtle)] p-2 sm:p-3 shrink-0" 
        style={{ 
          background: "var(--bg-secondary)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))"
        }}
      >
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          {/* Settings + Clear */}
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
              title="Settings"
            >
              ⚙️
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Clear chat"
              >
                🗑️
              </button>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={apiKey ? "Ask anything about your studies..." : "Set up your API key first →"}
              disabled={!apiKey}
              rows={1}
              className="w-full px-3 py-2.5 rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-40"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading || !apiKey}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-all hover:brightness-110 active:scale-90 disabled:opacity-30 shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
