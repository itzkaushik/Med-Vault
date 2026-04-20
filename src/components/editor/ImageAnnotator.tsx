"use client";

import React, { useRef, useState } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

interface ImageAnnotatorProps {
  isOpen: boolean;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onClose: () => void;
}

export default function ImageAnnotator({ isOpen, imageUrl, onSave, onClose }: ImageAnnotatorProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("red");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserMode, setEraserMode] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await canvasRef.current.exportImage("png");
      onSave(dataUrl);
    } catch (e) {
      console.error("Failed to export image", e);
      onClose();
    }
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const toggleEraser = () => {
    const newMode = !eraserMode;
    setEraserMode(newMode);
    canvasRef.current?.eraseMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--bg-primary)] animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Edit Photo</h2>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)]">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] hover:brightness-110 rounded-[var(--radius-md)] shadow-glow">
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)] overflow-x-auto">
        <div className="flex items-center gap-2">
          {["red", "blue", "green", "yellow", "white", "black"].map((color) => (
            <button
              key={color}
              onClick={() => { setStrokeColor(color); setEraserMode(false); canvasRef.current?.eraseMode(false); }}
              className={`w-6 h-6 rounded-full border-2 ${strokeColor === color && !eraserMode ? "border-[var(--accent-primary)] scale-110" : "border-transparent"}`}
              style={{ backgroundColor: color }}
              title={color}
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
          onClick={toggleEraser}
          className={`px-3 py-1 text-xs font-medium rounded ${eraserMode ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-primary)]"}`}
        >
          Eraser
        </button>
        <button onClick={handleUndo} className="px-3 py-1 text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-primary)] rounded hover:brightness-110">
          Undo
        </button>
        <button onClick={handleClear} className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded hover:brightness-110">
          Clear All
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-black/5 flex items-center justify-center overflow-hidden p-4">
        <div className="relative w-full h-full max-w-4xl max-h-full" style={{ boxShadow: "var(--shadow-lg)" }}>
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            backgroundImage={imageUrl}
            exportWithBackgroundImage={true}
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
          />
        </div>
      </div>
    </div>
  );
}
