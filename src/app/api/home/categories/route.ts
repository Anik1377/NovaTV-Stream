import { NextRequest, NextResponse } from 'next/server';
import type { Movie } from '@/lib/types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let baseHost = 'http://localhost:3000';

interface CategoryDef {
  genreIds?: string;
  mediaType: 'movie' | 'tv' | 'all';
  languages?: string[];
}

const CATEGORY_MAP: Record<string, CategoryDef> = {
  action:      { genreIds: '28,12',    mediaType: 'movie' },
  comedy:      { genreIds: '35',        mediaType: 'movie' },
  thriller:    { genreIds: '53,9648',   mediaType: 'movie' },
  romance:     { genreIds: '10749',     mediaType: 'movie' },
  scifi:       { genreIds: '878,14',    mediaType: 'all'   },
  horror:      { genreIds: '27',        mediaType: 'movie' },
  'drama-tv':  { genreIds: '18',        mediaType: 'tv'    },
  'crime-tv':  { genreIds: '80,9648',   mediaType: 'tv'    },
  animation:   { genreIds: '16,10751',  mediaType: 'all'   },
};

// Per-key cache: stores resolved Movie[] arrays
type CategoryCache = Record<string, { data: Movie[]; ts: number }>;
let categoryCache: CategoryCache = {};

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch discover results for a single media type
 */
async function discoverFetch(
  mediaType: 'movie' | 'tv',
  genreIds?: string,
  language?: string,
): Promise<Movie[]> {
  const params = new URLSearchParams();
  params.set('media_type', mediaType);
  if (genreIds) params.set('genre_id', genreIds);
  if (language) params.set('with_original_language', language);

  const res = await safeFetch<{ results: Movie[] }>(
    `${baseHost}/api/tmdb/discover?${params.toString()}`,
  );
  return res?.results ?? [];
}

/**
 * Merge, dedupe by id, sort by popularity desc, take top N
 */
function mergeAndSort(arrays: Movie[][], limit = 20): Movie[] {
  const seen = new Map<number, Movie>();
  for (const arr of arrays) {
    for (const item of arr) {
      // Keep higher-popularity duplicate
      const existing = seen.get(item.id);
      if (!existing || item.popularity > existing.popularity) {
        seen.set(item.id, item);
      }
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Resolve a single category key into a Movie[] array
 */
async function resolveCategory(key: string): Promise<Movie[]> {
  const def = CATEGORY_MAP[key];
  if (!def) return [];

  // Special handling for "indian" — fetch by language
  if (def.languages) {
    const langFetches = def.languages.map(async (lang) => {
      const [movies, tv] = await Promise.all([
        discoverFetch('movie', undefined, lang),
        discoverFetch('tv', undefined, lang),
      ]);
      return [...movies, ...tv];
    });
    const allArrays = await Promise.all(langFetches);
    return mergeAndSort(allArrays, 20);
  }

  // mediaType 'all' — fetch both and merge
  if (def.mediaType === 'all') {
    const [movies, tv] = await Promise.all([
      discoverFetch('movie', def.genreIds),
      discoverFetch('tv', def.genreIds),
    ]);
    return mergeAndSort([movies, tv], 20);
  }

  // Single media type
  return discoverFetch(def.mediaType, def.genreIds);
}

export async function GET(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  baseHost = `${proto}://${host}`;

  const { searchParams } = new URL(req.url);
  const rawKeys = searchParams.get('keys');
  if (!rawKeys) {
    return NextResponse.json(
      { error: 'Missing "keys" query parameter' },
      { status: 400 },
    );
  }

  const keys = rawKeys.split(',').map((k) => k.trim());
  const now = Date.now();
  const result: Record<string, Movie[]> = {};

  // Build list of keys that need fetching (not cached or expired)
  const pendingKeys: string[] = [];

  for (const key of keys) {
    const cached = categoryCache[key];
    if (cached && now - cached.ts < CACHE_TTL) {
      result[key] = cached.data;
    } else {
      pendingKeys.push(key);
    }
  }

  // Fetch all uncached categories in parallel
  if (pendingKeys.length > 0) {
    const fetched = await Promise.all(
      pendingKeys.map(async (key) => {
        const movies = await resolveCategory(key);
        return { key, movies };
      }),
    );

    for (const { key, movies } of fetched) {
      result[key] = movies;
      categoryCache[key] = { data: movies, ts: now };
    }
  }

  return NextResponse.json(result);
}
