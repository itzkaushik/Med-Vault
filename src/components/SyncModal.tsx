"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { useSync } from "./SyncManager";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const { myCode, linkedPeers, connectionStatus, linkNewDevice, unlinkDevice, syncNow } = useSync();
  const [newCode, setNewCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCode.length !== 6) {
      setError("Code must be 6 characters");
      return;
    }
    setError(null);
    setIsLinking(true);
    const success = await linkNewDevice(newCode.toUpperCase());
    setIsLinking(false);
    if (success) {
      setNewCode("");
    } else {
      setError("Failed to link device or already linked");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Device Sync (P2P)">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
          <div className="relative flex h-3 w-3">
            {connectionStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-success)] opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                connectionStatus === "connected"
                  ? "bg-[var(--accent-success)]"
                  : connectionStatus === "connecting"
                  ? "bg-[var(--accent-warning)] animate-pulse"
                  : "bg-[var(--text-muted)]"
              }`}
            ></span>
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)] capitalize">
            {connectionStatus === "connected" ? "Connected & Syncing" : connectionStatus}
          </span>
          {connectionStatus === "connected" && (
            <button
              onClick={syncNow}
              className="ml-auto text-xs px-2 py-1 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--border-default)] transition-colors"
            >
              Sync Now
            </button>
          )}
        </div>

        {/* My Code */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-10" />
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-2 relative z-10">
            Your Device Code
          </p>
          <div className="text-3xl font-mono font-bold tracking-widest text-[var(--text-primary)] relative z-10">
            {myCode || "------"}
          </div>
        </div>

        {/* Link New Device */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Link a New Device
          </label>
          <form onSubmit={handleLink} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-char code"
              className="flex-1 input-field uppercase font-mono tracking-widest text-center"
            />
            <button
              type="submit"
              disabled={isLinking || newCode.length !== 6}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white font-medium rounded-[var(--radius-md)] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isLinking ? "Linking..." : "Link"}
            </button>
          </form>
          {error && <p className="text-xs text-[var(--accent-danger)] mt-2">{error}</p>}
        </div>

        {/* Linked Devices List */}
        {linkedPeers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
              Linked Devices
            </h3>
            <ul className="space-y-2">
              {linkedPeers.map((peerCode) => (
                <li
                  key={peerCode}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
                >
                  <span className="font-mono text-sm tracking-wider font-semibold text-[var(--text-secondary)]">
                    {peerCode}
                  </span>
                  <button
                    onClick={() => unlinkDevice(peerCode)}
                    className="text-xs font-medium text-[var(--accent-danger)] hover:underline"
                  >
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
