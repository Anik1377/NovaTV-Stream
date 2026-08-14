const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = 'f71458d399e1eb9bdbfdc1c3318f5f75';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: string = 'w500') => {
  if (!path) return '/placeholder-movie.png';
  return `${IMG_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'original') => {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
};

export async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json();
}

/* ── Indian content priority helper ── */
const INDIAN_LANGS = ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa', 'ur'];

interface HasId {
  id: number;
  original_language?: string;
}

/**
 * Boosts Indian-language items to the top of a results array.
 * Items with an Indian `original_language` are moved to the front (stable-sorted by popularity).
 * No extra API calls — purely a client-side reorder.
 */
export function prioritizeIndian<T extends HasId>(results: T[]): T[] {
  const indian: T[] = [];
  const rest: T[] = [];
  for (const item of results) {
    const lang = item.original_language || '';
    if (INDIAN_LANGS.includes(lang)) {
      indian.push(item);
    } else {
      rest.push(item);
    }
  }
  return [...indian, ...rest];
}

/**
 * Fetches Hindi content and prepends it to existing results (deduped by id).
 * Use when the base endpoint doesn't naturally surface enough Indian content.
 */
export async function fetchIndianBoost<T extends HasId>(
  type: 'movie' | 'tv',
  existing: T[],
  sortBy = 'popularity.desc',
  voteCountGte = '100',
): Promise<T[]> {
  try {
    const data = await tmdbFetch<{ results: T[] }>(`/discover/${type}`, {
      region: 'IN',
      sort_by: sortBy,
      with_original_language: 'hi',
      'vote_count.gte': voteCountGte,
    });
    const existingIds = new Set(existing.map(r => r.id));
    const fresh = data.results.filter(r => !existingIds.has(r.id));
    return [...fresh, ...existing];
  } catch {
    return existing;
  }
}
