"use client";

import React, { useState } from "react";
import { useStore, type Topic } from "@/lib/store";
import Modal from "@/components/Modal";

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  editTopic?: Topic | null;
}

export default function TopicModal({ isOpen, onClose, subjectId, editTopic }: TopicModalProps) {
  const { addTopic, updateTopic } = useStore();
  const [name, setName] = useState(editTopic?.name || "");
  const [description, setDescription] = useState(editTopic?.description || "");

  React.useEffect(() => {
    if (isOpen) {
      setName(editTopic?.name || "");
      setDescription(editTopic?.description || "");
    }
  }, [isOpen, editTopic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editTopic) {
      updateTopic(editTopic.id, { name: name.trim(), description: description.trim() });
    } else {
      addTopic({ subjectId, name: name.trim(), description: description.trim() });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTopic ? "Edit Topic" : "New Topic"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            Topic Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Upper Limb"
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
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Muscles, nerves, and vessels of the upper limb"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-primary)]"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
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
            {editTopic ? "Save Changes" : "Create Topic"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
