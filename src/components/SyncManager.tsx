"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useStore, StoreState } from "@/lib/store";
import { mergeStoreState, generatePairCode, getFullPeerId, PEER_PREFIX } from "@/lib/sync";
import type { DataConnection, Peer } from "peerjs";

interface SyncContextType {
  myCode: string | null;
  linkedPeers: string[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  linkNewDevice: (code: string) => Promise<boolean>;
  unlinkDevice: (code: string) => void;
  syncNow: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

const LINKED_PEERS_KEY = "medvault_linked_peers";
const MY_CODE_KEY = "medvault_my_sync_code";

export function SyncManagerProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const storeRef = useRef<StoreState | null>(null);
  
  // Keep storeRef updated without triggering effects
  useEffect(() => {
    storeRef.current = {
      subjects: store.subjects,
      topics: store.topics,
      notes: store.notes,
      noteLinks: store.noteLinks,
      activeSubjectId: store.activeSubjectId,
      activeTopicId: store.activeTopicId,
    };
  }, [store.subjects, store.topics, store.notes, store.noteLinks, store.activeSubjectId, store.activeTopicId]);

  const [myCode, setMyCode] = useState<string | null>(null);
  const [linkedPeers, setLinkedPeers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const isImportingRef = useRef(false);

  // Initialize Code and Linked Peers from Storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let code = localStorage.getItem(MY_CODE_KEY);
    if (!code) {
      code = generatePairCode();
      localStorage.setItem(MY_CODE_KEY, code);
    }
    setMyCode(code);

    const savedPeers = localStorage.getItem(LINKED_PEERS_KEY);
    if (savedPeers) {
      try {
        setLinkedPeers(JSON.parse(savedPeers));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save linked peers to storage
  useEffect(() => {
    if (linkedPeers.length > 0) {
      localStorage.setItem(LINKED_PEERS_KEY, JSON.stringify(linkedPeers));
    }
  }, [linkedPeers]);

  // Setup PeerJS and Auto-Connect
  useEffect(() => {
    if (!myCode || typeof window === "undefined") return;

    let isActive = true;

    const initPeer = async () => {
      const { Peer } = await import("peerjs");
      if (!isActive) return;

      setConnectionStatus("connecting");
      const peer = new Peer(getFullPeerId(myCode));
      peerRef.current = peer;

      peer.on("open", () => {
        // Auto-connect to known peers
        linkedPeers.forEach(connectToPeer);
        if (connectionsRef.current.size === 0) {
           setConnectionStatus("disconnected");
        }
      });

      peer.on("connection", (conn) => {
        handleIncomingConnection(conn);
      });

      peer.on("error", (err) => {
        console.error("PeerJS Error:", err);
      });
    };

    initPeer();

    return () => {
      isActive = false;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCode]);

  const connectToPeer = useCallback((code: string) => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(getFullPeerId(code), { reliable: true });
    handleIncomingConnection(conn);
  }, []);

  const handleIncomingConnection = useCallback((conn: DataConnection) => {
    conn.on("open", () => {
      connectionsRef.current.set(conn.peer, conn);
      setConnectionStatus("connected");
      
      // Save peer if not already saved
      const rawCode = conn.peer.replace(PEER_PREFIX, "");
      setLinkedPeers((prev) => {
        if (!prev.includes(rawCode)) return [...prev, rawCode];
        return prev;
      });

      // Send initial state upon connection
      if (storeRef.current) {
        conn.send({ type: "SYNC_STATE", payload: storeRef.current });
      }
    });

    conn.on("data", (data: any) => {
      if (data && data.type === "SYNC_STATE" && data.payload) {
        if (!storeRef.current) return;
        
        const remoteState = data.payload as StoreState;
        const merged = mergeStoreState(storeRef.current, remoteState);
        
        isImportingRef.current = true;
        store.importState(merged);
        
        // Reset flag after a short delay so local changes trigger broadcasts again
        setTimeout(() => {
          isImportingRef.current = false;
        }, 500);
      }
    });

    conn.on("close", () => {
      connectionsRef.current.delete(conn.peer);
      if (connectionsRef.current.size === 0) {
        setConnectionStatus("disconnected");
      }
    });
    
    conn.on("error", () => {
      connectionsRef.current.delete(conn.peer);
      if (connectionsRef.current.size === 0) {
        setConnectionStatus("disconnected");
      }
    });
  }, [store]);

  // Broadcast state changes to all connected peers
  useEffect(() => {
    // Prevent infinite loop if the change was triggered by an incoming sync
    if (isImportingRef.current || connectionsRef.current.size === 0 || !storeRef.current) return;

    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({ type: "SYNC_STATE", payload: storeRef.current });
      }
    });
  }, [store.subjects, store.topics, store.notes, store.noteLinks]);

  const linkNewDevice = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === myCode || linkedPeers.includes(cleanCode)) return false;
    
    setLinkedPeers((prev) => [...prev, cleanCode]);
    connectToPeer(cleanCode);
    return true;
  };

  const unlinkDevice = (code: string) => {
    const fullId = getFullPeerId(code);
    const conn = connectionsRef.current.get(fullId);
    if (conn) {
      conn.close();
      connectionsRef.current.delete(fullId);
    }
    setLinkedPeers((prev) => prev.filter((p) => p !== code));
    if (connectionsRef.current.size === 0) setConnectionStatus("disconnected");
  };

  const syncNow = () => {
    if (connectionsRef.current.size === 0 || !storeRef.current) return;
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({ type: "SYNC_STATE", payload: storeRef.current });
      }
    });
  };

  return (
    <SyncContext.Provider value={{ myCode, linkedPeers, connectionStatus, linkNewDevice, unlinkDevice, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncManagerProvider");
  return ctx;
}
