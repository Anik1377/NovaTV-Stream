'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';

const STORAGE_KEY = 'streamvault-browse-history';
const MAX_LOCAL_ITEMS = 200;

export interface BrowseHistoryEntry {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv' | 'person';
  subtitle: string | null;
  visitedAt: string;
}

interface RecordHistoryParams {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv' | 'person';
  subtitle?: string;
}

/* ── localStorage helpers ── */
function getLocalHistory(): BrowseHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(items: BrowseHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_ITEMS)));
  } catch {
    /* storage full */
  }
}

function upsertLocalHistory(entry: BrowseHistoryEntry): void {
  const items = getLocalHistory();
  const idx = items.findIndex(
    (i) => i.tmdbId === entry.tmdbId && i.mediaType === entry.mediaType
  );
  if (idx >= 0) {
    items[idx].title = entry.title;
    items[idx].posterPath = entry.posterPath;
    items[idx].subtitle = entry.subtitle;
    items[idx].visitedAt = entry.visitedAt;
    // Move to front
    const [updated] = items.splice(idx, 1);
    items.unshift(updated);
  } else {
    items.unshift(entry);
  }
  saveLocalHistory(items);
}

/* ── Sync local history to server on login ── */
function syncLocalToServer() {
  const local = getLocalHistory();
  if (!local.length) return;
  // Send each item to server (fire and forget)
  local.forEach((item) => {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: item.tmdbId,
        title: item.title,
        posterPath: item.posterPath,
        mediaType: item.mediaType,
        subtitle: item.subtitle || undefined,
      }),
    }).catch(() => {});
  });
  // Clear local after sync
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Hook ── */
export function useRecordHistory() {
  const user = useAuthStore((s) => s.user);
  const syncedRef = useRef(false);

  // Sync localStorage → server once when user logs in
  useEffect(() => {
    if (user && !syncedRef.current) {
      syncedRef.current = true;
      syncLocalToServer();
    }
    if (!user) {
      syncedRef.current = false;
    }
  }, [user]);

  const record = useCallback(
    (params: RecordHistoryParams) => {
      const entry: BrowseHistoryEntry = {
        id: `local-${params.tmdbId}-${params.mediaType}`,
        tmdbId: params.tmdbId,
        title: params.title,
        posterPath: params.posterPath,
        mediaType: params.mediaType,
        subtitle: params.subtitle || null,
        visitedAt: new Date().toISOString(),
      };

      if (user) {
        // Authenticated: save to server (also save locally as cache)
        upsertLocalHistory(entry);
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }).catch(() => {
          /* ignore */
        });
      } else {
        // Not authenticated: save to localStorage only
        upsertLocalHistory(entry);
      }
    },
    [user],
  );

  return { record };
}

/* ── Exported reader for ProfilePage ── */
export function getLocalBrowseHistory(): BrowseHistoryEntry[] {
  return getLocalHistory();
}

export function deleteLocalHistoryItem(id: string): BrowseHistoryEntry[] {
  const items = getLocalHistory().filter((i) => i.id !== id);
  saveLocalHistory(items);
  return items;
}

export function clearLocalHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
