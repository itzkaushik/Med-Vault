"use client";

import React, { useState } from "react";
import { useStore, type Subject } from "@/lib/store";
import Modal from "@/components/Modal";

const ICON_OPTIONS = ["🦴", "💓", "🧪", "🔬", "💊", "🦠", "🔍", "🏥", "🧬", "🫁", "🧠", "👁️", "🦷", "🩺", "📋", "🧫", "💉", "🩻"];
const COLOR_OPTIONS = [
  "#e17055", "#00b894", "#fdcb6e", "#d63031", "#6c5ce7",
  "#00cec9", "#636e72", "#0984e3", "#e84393", "#fd79a8",
  "#a29bfe", "#55efc4", "#ffeaa7", "#fab1a0", "#74b9ff",
];

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSubject?: Subject | null;
}

export default function SubjectModal({ isOpen, onClose, editSubject }: SubjectModalProps) {
  const { addSubject, updateSubject } = useStore();
  const [name, setName] = useState(editSubject?.name || "");
  const [description, setDescription] = useState(editSubject?.description || "");
  const [icon, setIcon] = useState(editSubject?.icon || "📋");
  const [color, setColor] = useState(editSubject?.color || "#6c5ce7");

  // Reset form when modal opens with different subject
  React.useEffect(() => {
    if (isOpen) {
      setName(editSubject?.name || "");
      setDescription(editSubject?.description || "");
      setIcon(editSubject?.icon || "📋");
      setColor(editSubject?.color || "#6c5ce7");
    }
  }, [isOpen, editSubject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editSubject) {
      updateSubject(editSubject.id, { name: name.trim(), description: description.trim(), icon, color });
    } else {
      addSubject({ name: name.trim(), description: description.trim(), icon, color });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editSubject ? "Edit Subject" : "New Subject"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Subject Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anatomy"
            autoFocus
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-primary)]"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Structure of the human body"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-primary)]"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Icon
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map((ico) => (
              <button
                key={ico}
                type="button"
                onClick={() => setIcon(ico)}
                className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-lg transition-all duration-150 hover:scale-110"
                style={{
                  background: icon === ico ? "var(--accent-glow)" : "var(--bg-tertiary)",
                  border: icon === ico ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                }}
              >
                {ico}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-125"
                style={{
                  background: c,
                  outline: color === c ? "2px solid white" : "none",
                  outlineOffset: "2px",
                  boxShadow: color === c ? `0 0 12px ${c}60` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            {editSubject ? "Save Changes" : "Create Subject"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
