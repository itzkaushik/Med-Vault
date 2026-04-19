"use client";

import React, { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  type: "subject" | "topic" | "note";
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
}

interface GraphViewProps {
  onNavigate: (view: string) => void;
}

// We dynamically import react-force-graph-2d only on client
let ForceGraph2DComponent: React.ComponentType<Record<string, unknown>> | null = null;

export default function GraphView({ onNavigate }: GraphViewProps) {
  const { subjects, topics, notes, noteLinks } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [ForceGraph, setForceGraph] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Dynamically import ForceGraph2D
  useEffect(() => {
    if (ForceGraph2DComponent) {
      setForceGraph(() => ForceGraph2DComponent);
      return;
    }
    import("react-force-graph-2d").then((mod) => {
      ForceGraph2DComponent = mod.default as unknown as React.ComponentType<Record<string, unknown>>;
      setForceGraph(() => ForceGraph2DComponent);
    });
  }, []);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add subjects as large nodes
    subjects.forEach((s) => {
      nodes.push({
        id: `s-${s.id}`,
        name: `${s.icon} ${s.name}`,
        val: 20,
        color: s.color,
        type: "subject",
      });
    });

    // Add topics as medium nodes, linked to their subject
    topics.forEach((t) => {
      const subject = subjects.find((s) => s.id === t.subjectId);
      nodes.push({
        id: `t-${t.id}`,
        name: t.name,
        val: 10,
        color: subject?.color || "#6c5ce7",
        type: "topic",
      });
      links.push({
        source: `s-${t.subjectId}`,
        target: `t-${t.id}`,
        color: `${subject?.color || "#6c5ce7"}40`,
      });
    });

    // Add notes as small nodes, linked to their topic
    notes.forEach((n) => {
      const subject = n.subjectId ? subjects.find((s) => s.id === n.subjectId) : null;
      nodes.push({
        id: `n-${n.id}`,
        name: n.title,
        val: 5,
        color: subject?.color || "#a29bfe",
        type: "note",
      });
      if (n.topicId) {
        links.push({
          source: `t-${n.topicId}`,
          target: `n-${n.id}`,
          color: `${subject?.color || "#a29bfe"}30`,
        });
      } else if (n.subjectId) {
        links.push({
          source: `s-${n.subjectId}`,
          target: `n-${n.id}`,
          color: `${subject?.color || "#a29bfe"}30`,
        });
      }
    });

    // Add note-to-note links (wiki-links)
    noteLinks.forEach((l) => {
      links.push({
        source: `n-${l.sourceId}`,
        target: `n-${l.targetId}`,
        color: "rgba(162, 155, 254, 0.5)",
      });
    });

    return { nodes, links };
  }, [subjects, topics, notes, noteLinks]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "subject") {
        onNavigate(`subject-${node.id.replace("s-", "")}`);
      } else if (node.type === "topic") {
        onNavigate(`topic-${node.id.replace("t-", "")}`);
      } else if (node.type === "note") {
        onNavigate(`note-${node.id.replace("n-", "")}`);
      }
    },
    [onNavigate]
  );

  const totalNodes = subjects.length + topics.length + notes.length;
  const totalConnections = noteLinks.length + topics.length + notes.filter((n) => n.topicId || n.subjectId).length;

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            🧬 Knowledge Graph
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Visualize how your medical concepts interconnect
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            {totalNodes} nodes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-px bg-[var(--accent-secondary)]" />
            {totalConnections} connections
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-[var(--accent-primary)]" /> Subjects
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-[var(--accent-secondary)]" /> Topics
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border-2 border-[var(--text-tertiary)]" /> Notes
        </span>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="relative rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]"
        style={{ background: "var(--bg-secondary)", height: "60vh" }}
      >
        {totalNodes === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl mb-4">🕸️</div>
            <p className="text-[var(--text-secondary)] font-medium mb-1">Your graph is empty</p>
            <p className="text-sm text-[var(--text-tertiary)] text-center max-w-sm">
              Create subjects, topics, and notes to see your knowledge web grow. 
              Use [[wiki-links]] to connect concepts.
            </p>
          </div>
        ) : ForceGraph ? (
          <ForceGraph
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="transparent"
            nodeRelSize={4}
            nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name;
              const fontSize = Math.max(10 / globalScale, 2);
              const r = Math.sqrt(node.val) * 2;
              const isHovered = hoveredNode === node.id;

              // Draw glow
              if (isHovered) {
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, r + 4, 0, 2 * Math.PI);
                ctx.fillStyle = `${node.color}40`;
                ctx.fill();
              }

              // Draw node
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
              ctx.fillStyle = isHovered ? node.color : `${node.color}cc`;
              ctx.fill();
              ctx.strokeStyle = node.color;
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();

              // Draw label
              if (globalScale > 0.6 || node.type === "subject") {
                ctx.font = `${node.type === "subject" ? "bold " : ""}${fontSize}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.fillStyle = isHovered ? "#fff" : "rgba(232, 234, 240, 0.8)";
                ctx.fillText(label, node.x!, node.y! + r + fontSize + 2);
              }
            }}
            linkColor={(link: GraphLink) => link.color}
            linkWidth={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={(link: GraphLink) => link.color}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: GraphNode | null) => setHoveredNode(node?.id || null)}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--text-tertiary)] text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              Loading graph engine...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
