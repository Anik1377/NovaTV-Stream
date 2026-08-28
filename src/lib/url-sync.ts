/**
 * URL ↔ View synchronization
 * Maps query params (?v=anime, ?v=livetv, ?movie=123, ?tv=456, etc.)
 * to zustand view state so search engines can crawl distinct URLs.
 */

import type { ViewType, MediaFilter } from '@/store/app-store';

/* ── Mapping: ?v= value → { view, mediaFilter? } ── */
const VIEW_MAP: Record<string, { view: ViewType; mediaFilter?: MediaFilter }> = {
  movies:    { view: 'home', mediaFilter: 'movie' },
  tv:        { view: 'home', mediaFilter: 'tv' },
  anime:     { view: 'anime' },
  livetv:    { view: 'livetv' },
  asian:     { view: 'asian' },
  desi:      { view: 'desi' },
  read:      { view: 'read' },
  games:     { view: 'games' },
  showreels: { view: 'showreels' },
  people:    { view: 'people' },
  search:    { view: 'search' },
  warning:   { view: 'warning' },
  privacy:   { view: 'privacy' },
  dmca:      { view: 'dmca' },
  profile:   { view: 'profile' },
};

/* Reverse mapping: view → ?v= param value (only for section pages) */
const REVERSE_MAP: Record<string, string> = {
  livetv: 'livetv',
  anime: 'anime',
  games: 'games',
  asian: 'asian',
  desi: 'desi',
  showreels: 'showreels',
  read: 'read',
  people: 'people',
  search: 'search',
  warning: 'warning',
  privacy: 'privacy',
  dmca: 'dmca',
  profile: 'profile',
};

/**
 * Read URL params on page load.
 * Returns instructions for the app to apply.
 */
export interface UrlInitState {
  kind: 'view' | 'movie' | 'tvshow';
  view?: ViewType;
  mediaFilter?: MediaFilter;
  searchQuery?: string;
  tmdbId?: number;
}

export function readUrlParams(): UrlInitState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);

  // ?movie=123 → open movie detail
  const movieId = params.get('movie');
  if (movieId) {
    const id = parseInt(movieId, 10);
    if (!isNaN(id)) return { kind: 'movie', tmdbId: id };
  }

  // ?tv=456 → open TV show detail
  const tvId = params.get('tv');
  if (tvId) {
    const id = parseInt(tvId, 10);
    if (!isNaN(id)) return { kind: 'tvshow', tmdbId: id };
  }

  // ?v=section
  const v = params.get('v');
  const q = params.get('q');
  if (!v && !q) return null;

  const mapped = v ? VIEW_MAP[v] : null;
  if (!mapped) return null;

  return {
    kind: 'view',
    view: mapped.view,
    mediaFilter: mapped.mediaFilter || 'all',
    searchQuery: q || '',
  };
}

/**
 * Sync the current view state to the browser URL.
 * Called via zustand subscribe after every view change.
 */
export function syncViewToUrl(
  view: string,
  mediaFilter: string,
  searchQuery?: string,
  movieId?: number | null,
  tvId?: number | null,
): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();

  if (view === 'movie' && movieId) {
    params.set('movie', String(movieId));
  } else if (view === 'tv' && tvId) {
    params.set('tv', String(tvId));
  } else {
    const param = REVERSE_MAP[view];
    if (param) params.set('v', param);
  }

  if (searchQuery) params.set('q', searchQuery);

  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}
