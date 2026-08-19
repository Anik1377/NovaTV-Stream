'use client';

const STORAGE_KEY = 'streamvault-watch-history';
const MAX_ITEMS = 50;

export interface WatchHistoryEntry {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  episodeName: string | null;
  watchedAt: string;
}

interface RecordParams {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
}

function getItems(): WatchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: WatchHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* storage full */
  }
}

/** Record a watch event (called when user clicks Play or selects an episode) */
export function recordWatchHistory(params: RecordParams): void {
  const items = getItems();
  const entry: WatchHistoryEntry = {
    tmdbId: params.tmdbId,
    title: params.title,
    posterPath: params.posterPath,
    backdropPath: params.backdropPath,
    mediaType: params.mediaType,
    season: params.season ?? null,
    episode: params.episode ?? null,
    episodeName: params.episodeName ?? null,
    watchedAt: new Date().toISOString(),
  };

  // For TV shows: remove any existing entry for the same tmdbId (we only keep the latest episode)
  // For movies: remove existing entry and re-add at top
  const filtered = items.filter(
    (i) => !(i.tmdbId === entry.tmdbId && i.mediaType === entry.mediaType)
  );
  filtered.unshift(entry);
  saveItems(filtered);
  // Dispatch event so other components (ContinueWatching) can refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('watch-history-updated'));
  }
}

/** Get all watch history items, most recent first */
export function getWatchHistory(): WatchHistoryEntry[] {
  return getItems();
}

/** Remove a specific item from watch history */
export function removeWatchHistory(tmdbId: number, mediaType: string): WatchHistoryEntry[] {
  const items = getItems().filter(
    (i) => !(i.tmdbId === tmdbId && i.mediaType === mediaType)
  );
  saveItems(items);
  return items;
}

/** Clear all watch history */
export function clearWatchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
