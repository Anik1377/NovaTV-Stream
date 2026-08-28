/**
 * URL ↔ View synchronization
 * Maps query params (?v=anime, ?v=livetv, etc.) to zustand view state
 * so search engines can crawl distinct URLs for each section.
 */

import type { ViewType, MediaFilter } from '@/store/app-store';

/* ── Mapping: query param value → { view, mediaFilter? } ── */
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

/* Reverse mapping: view → query param value */
const REVERSE_MAP: Record<string, string> = {
  home: '',
  movie: 'movie',
  tv: 'tv',
  search: 'search',
  genre: '',
  category: '',
  livetv: 'livetv',
  anime: 'anime',
  games: 'games',
  asian: 'asian',
  desi: 'desi',
  showreels: 'showreels',
  showreel: '',
  'showreel-detail': '',
  read: 'read',
  'manga-detail': '',
  'manga-reader': '',
  'novel-reader': '',
  'comic-detail': '',
  people: 'people',
  'people-detail': '',
  warning: 'warning',
  privacy: 'privacy',
  dmca: 'dmca',
  profile: 'profile',
};

/**
 * Read ?v= and ?q= from URL on page load.
 * Returns the view, mediaFilter, and search query to apply.
 */
export function readUrlParams(): {
  view: ViewType;
  mediaFilter: MediaFilter;
  searchQuery: string;
} | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const v = params.get('v');
  const q = params.get('q');

  if (!v && !q) return null;

  const mapped = v ? VIEW_MAP[v] : null;
  if (!mapped) return null;

  return {
    view: mapped.view,
    mediaFilter: mapped.mediaFilter || 'all',
    searchQuery: q || '',
  };
}

/**
 * Push the current view state to the browser URL via replaceState.
 * Called after every navigation so the URL stays in sync.
 */
export function syncViewToUrl(view: string, mediaFilter: string, searchQuery?: string): void {
  if (typeof window === 'undefined') return;
  const param = REVERSE_MAP[view];
  const params = new URLSearchParams();

  if (param) params.set('v', param);
  if (searchQuery) params.set('q', searchQuery);

  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}
