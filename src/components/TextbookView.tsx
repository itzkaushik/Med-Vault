import React, { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ReactSketchCanvas, ReactSketchCanvasRef, CanvasPath } from "react-sketch-canvas";

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
const ANNOTATIONS_KEY = "medvault_pdf_annotations";

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

function loadAllAnnotations(): Record<string, CanvasPath[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ANNOTATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllAnnotations(annotations: Record<string, CanvasPath[]>) {
  localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
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

  // Annotations State
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [strokeColor, setStrokeColor] = useState("red");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserMode, setEraserMode] = useState(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const isPageLoading = useRef(false);

  // Load current page annotations from local storage
  const renderCurrentPageAnnotations = useCallback(async () => {
    if (!canvasRef.current || !activeBook) return;
    try {
      isPageLoading.current = true;
      canvasRef.current.clearCanvas();
      const allAnnotations = loadAllAnnotations();
      const pagePaths = allAnnotations[`${activeBook.id}_${currentPage}`];
      if (pagePaths && pagePaths.length > 0) {
        await canvasRef.current.loadPaths(pagePaths);
      }
    } catch (e) {
      console.error("Error loading annotations", e);
    } finally {
      // Slight delay to handle async ReactSketchCanvas rendering/flushing if needed
      setTimeout(() => {
        isPageLoading.current = false;
      }, 50);
    }
  }, [activeBook, currentPage]);

  useEffect(() => {
    if (activeBook && canvasRef.current) {
      renderCurrentPageAnnotations();
    }
  }, [activeBook, currentPage, renderCurrentPageAnnotations]);

  const handleAnnotationChange = () => {
    if (isPageLoading.current || !canvasRef.current || !activeBook) return;
    canvasRef.current.exportPaths()
      .then((paths) => {
        const all = loadAllAnnotations();
        all[`${activeBook.id}_${currentPage}`] = paths;
        saveAllAnnotations(all);
      })
      .catch((e) => console.error("Export paths error", e));
  };

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
        try {
          saveTextbooks(updated);
        } catch {
          console.warn("PDF too large for localStorage persistence");
        }
        setActiveBook(newBook);
        setCurrentPage(1);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
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
      if (p !== currentPage) {
          // Delay page turn slightly to ensure state isn't overlapping
          setTimeout(() => {
              setCurrentPage(p);
              if (activeBook) {
                const updated = textbooks.map((b) =>
                  b.id === activeBook.id ? { ...b, lastPage: p } : b
                );
                setTextbooks(updated);
                try { saveTextbooks(updated); } catch { /* */ }
              }
          }, 0);
      }
    },
    [currentPage, numPages, activeBook, textbooks]
  );

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
              Upload your medical PDFs (Guyton, Robbins, Gray's Anatomy, etc.)
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
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Annotate Toggle */}
          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`px-3 py-1 flex items-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${isAnnotating ? "bg-[var(--accent-primary)] text-white shadow-glow" : "bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            {isAnnotating ? "Done" : "Annotate"}
          </button>

          <div className="w-px h-6 bg-[var(--border-subtle)] mx-1" />

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

      {/* Annotation Toolbar Area */}
      {isAnnotating && (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4 p-2 sm:p-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] animate-fadeIn shadow-sm overflow-x-auto min-w-0">
           <div className="flex items-center gap-2 sm:gap-3">
              {["red", "blue", "green", "#eab308", "rgba(255, 255, 0, 0.4)", "rgba(0,0,0,0.8)"].map((color) => (
                <button
                  key={color}
                  onClick={() => { setStrokeColor(color); setEraserMode(false); canvasRef.current?.eraseMode(false); }}
                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 ${strokeColor === color && !eraserMode ? "border-[var(--accent-primary)] scale-110" : "border-[var(--border-subtle)]"}`}
                  style={{ backgroundColor: color }}
                  title={color.startsWith("rgba") ? "Highlighter" : color}
                />
              ))}
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-24"
              title="Stroke Width"
            />
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <button
              onClick={() => {
                  const newMode = !eraserMode;
                  setEraserMode(newMode);
                  canvasRef.current?.eraseMode(newMode);
              }}
              className={`px-3 py-1 text-xs font-medium rounded ${eraserMode ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-primary)]"}`}
            >
              Eraser
            </button>
            <button onClick={() => canvasRef.current?.undo()} className="px-3 py-1 text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-primary)] rounded hover:brightness-110">
              Undo
            </button>
            <button onClick={() => canvasRef.current?.clearCanvas()} className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded hover:brightness-110">
              Clear All
            </button>
        </div>
      )}

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex justify-center p-6"
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
          <div className="relative inline-block shadow-2xl rounded-sm">
            <Page
              pageNumber={currentPage}
              scale={scale}
              loading={<div className="w-[595px] h-[842px] bg-white/5" />}
            />
            <div
              className="absolute inset-0 z-10"
              style={{ pointerEvents: isAnnotating ? "auto" : "none" }}
            >
                <ReactSketchCanvas
                  ref={canvasRef}
                  style={{ background: "transparent" }}
                  strokeColor={strokeColor}
                  strokeWidth={strokeWidth}
                  eraserWidth={strokeWidth * 2}
                  onChange={handleAnnotationChange}
                  canvasColor="transparent"
                />
            </div>
          </div>
        </Document>
      </div>
    </div>
  );
}
