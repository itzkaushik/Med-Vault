"use client";

import React, { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFFile {
  id: string;
  name: string;
  data: string; // base64 data URL
  addedAt: string;
  totalPages: number;
  lastPage: number;
}

const TEXTBOOKS_KEY = "medvault_textbooks";

function loadTextbooks(): PDFFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEXTBOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTextbooks(books: PDFFile[]) {
  localStorage.setItem(TEXTBOOKS_KEY, JSON.stringify(books));
}

export default function TextbookView() {
  const [textbooks, setTextbooks] = useState<PDFFile[]>(loadTextbooks);
  const [activeBook, setActiveBook] = useState<PDFFile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || file.type !== "application/pdf") return;

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const newBook: PDFFile = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
          name: file.name.replace(".pdf", ""),
          data: reader.result as string,
          addedAt: new Date().toISOString(),
          totalPages: 0,
          lastPage: 1,
        };

        const updated = [...textbooks, newBook];
        setTextbooks(updated);
        // Save metadata only (not data) — data is too large for some localStorage limits
        // For now, we'll store data too and rely on the user having enough space
        try {
          saveTextbooks(updated);
        } catch {
          // If localStorage is full, just keep in memory
          console.warn("PDF too large for localStorage persistence");
        }
        setActiveBook(newBook);
        setCurrentPage(1);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [textbooks]
  );

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      if (activeBook) {
        const updated = textbooks.map((b) =>
          b.id === activeBook.id ? { ...b, totalPages: n } : b
        );
        setTextbooks(updated);
        try { saveTextbooks(updated); } catch { /* */ }
      }
    },
    [activeBook, textbooks]
  );

  const handleDeleteBook = useCallback(
    (bookId: string) => {
      const updated = textbooks.filter((b) => b.id !== bookId);
      setTextbooks(updated);
      saveTextbooks(updated);
      if (activeBook?.id === bookId) {
        setActiveBook(null);
        setCurrentPage(1);
        setNumPages(0);
      }
    },
    [textbooks, activeBook]
  );

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(page, numPages));
      setCurrentPage(p);
      // Save reading position
      if (activeBook) {
        const updated = textbooks.map((b) =>
          b.id === activeBook.id ? { ...b, lastPage: p } : b
        );
        setTextbooks(updated);
        try { saveTextbooks(updated); } catch { /* */ }
      }
    },
    [numPages, activeBook, textbooks]
  );

  // ─── Library View ──────────────────────────────────
  if (!activeBook) {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              📚 Textbook Library
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              Upload and read your medical textbooks in-app
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Upload PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-[var(--text-secondary)]">Loading PDF...</span>
          </div>
        )}

        {textbooks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)]"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="text-6xl mb-4">📖</div>
            <p className="text-[var(--text-secondary)] font-semibold mb-2 text-lg">
              No textbooks yet
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mb-5 text-center max-w-md">
              Upload your medical PDFs (Guyton, Robbins, Gray&apos;s Anatomy, etc.)
              and read them right here alongside your notes.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Upload Your First Textbook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {textbooks.map((book) => (
              <div
                key={book.id}
                className="group relative p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 hover-lift cursor-pointer"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div
                  className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "radial-gradient(circle at 50% 0%, rgba(108, 92, 231, 0.08), transparent 70%)" }}
                />
                <div className="relative z-10" onClick={() => { setActiveBook(book); setCurrentPage(book.lastPage || 1); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-14 rounded-[var(--radius-sm)] flex items-center justify-center text-2xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      📕
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                      title="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 3H10M4 3V2C4 1.5 4.5 1 5 1H7C7.5 1 8 1.5 8 2V3M9 3V10C9 10.5 8.5 11 8 11H4C3.5 11 3 10.5 3 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
                    {book.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    {book.totalPages > 0 && <span>{book.totalPages} pages</span>}
                    {book.lastPage > 1 && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-[var(--text-muted)]" />
                        <span>Page {book.lastPage}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Reader View ───────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto animate-fadeIn flex flex-col h-full">
      {/* Reader Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveBook(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Library
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[300px]">
            {activeBook.name}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded"
            >
              −
            </button>
            <span className="text-xs text-[var(--text-secondary)] w-10 text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
              className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded"
            >
              +
            </button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-10 text-center text-xs font-mono text-[var(--text-primary)] bg-transparent outline-none"
                min={1}
                max={numPages}
              />
              <span className="text-xs text-[var(--text-muted)]">/ {numPages}</span>
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex justify-center py-6"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <Document
          file={activeBook.data}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-[var(--text-secondary)]">Loading document...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-3xl mb-3">⚠️</span>
              <p className="text-sm text-red-400">Failed to load PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-2xl rounded-sm"
            loading={
              <div className="w-[595px] h-[842px] flex items-center justify-center bg-white/5 rounded-sm">
                <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
