import { StoreState } from "./store";

// Merge strategy: last write wins based on updatedAt
export function mergeStoreState(local: StoreState, remote: StoreState): StoreState {
  const merged: StoreState = { subjects: [], topics: [], notes: [], noteLinks: [], activeSubjectId: local.activeSubjectId, activeTopicId: local.activeTopicId };

  const mergeItems = <T extends { id: string; updatedAt?: string }>(localItems: T[], remoteItems: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of localItems) map.set(item.id, item);
    for (const item of remoteItems) {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else if (item.updatedAt && existing.updatedAt && new Date(item.updatedAt) > new Date(existing.updatedAt)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  };

  merged.subjects = mergeItems(local.subjects, remote.subjects);
  merged.topics = mergeItems(local.topics, remote.topics);
  merged.notes = mergeItems(local.notes, remote.notes);

  // NoteLinks don't have updatedAt, so union by ID
  const linkMap = new Map<string, any>();
  for (const l of local.noteLinks) linkMap.set(l.id, l);
  for (const l of remote.noteLinks) linkMap.set(l.id, l);
  merged.noteLinks = Array.from(linkMap.values());

  return merged;
}

// Generate a random 6-character alphanumeric code for easier pairing
export function generatePairCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to add prefix to ensure PeerJS IDs are unique to this app namespace
export const PEER_PREFIX = 'medvault-sync-';

export function getFullPeerId(code: string): string {
  return `${PEER_PREFIX}${code}`;
}
