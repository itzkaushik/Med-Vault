"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import React from "react";

// ─── WikiLink Node View (React component) ────────────────────
function WikiLinkView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer transition-all duration-150 hover:brightness-125"
        style={{
          background: "var(--accent-glow)",
          color: "var(--accent-secondary)",
          border: "1px solid rgba(108, 92, 231, 0.3)",
        }}
        data-note-id={node.attrs.noteId}
        title={`Go to: ${node.attrs.noteTitle}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 opacity-60">
          <path d="M4 2L8 2L8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {node.attrs.noteTitle}
      </span>
    </NodeViewWrapper>
  );
}

// ─── WikiLink TipTap Extension ───────────────────────────────
export const WikiLink = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      noteTitle: { default: "" },
      noteId: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="wiki-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "wiki-link" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkView);
  },
});

export default WikiLink;
