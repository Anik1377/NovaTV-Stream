import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

async function safeDiscover(
  mediaType: 'movie' | 'tv',
  params: Record<string, string> = {},
): Promise<Movie[]> {
  try {
    const endpoint = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';
    const data = await tmdbFetch<{ results: Movie[] }>(endpoint, {
      sort_by: 'popularity.desc',
      'vote_count.gte': '30',
      ...params,
    });
    return data.results.map((r) => ({
      ...r,
      media_type: mediaType as 'movie' | 'tv',
      title: r.title || r.name || '',
      release_date: r.release_date || r.first_air_date,
    }));
  } catch {
    return [];
  }
}

/** Merge, dedupe by id, sort by popularity desc, take top N */
function mergeAndSort(arrays: Movie[][], limit = 20): Movie[] {
  const seen = new Map<number, Movie>();
  for (const arr of arrays) {
    for (const item of arr) {
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

/** Resolve a single category key into a Movie[] array */
async function resolveCategory(key: string): Promise<Movie[]> {
  const def = CATEGORY_MAP[key];
  if (!def) return [];

  const extra: Record<string, string> = {};
  if (def.genreIds) extra.with_genres = def.genreIds;

  if (def.mediaType === 'all') {
    const [movies, tv] = await Promise.all([
      safeDiscover('movie', extra),
      safeDiscover('tv', extra),
    ]);
    return mergeAndSort([movies, tv], 20);
  }

  return safeDiscover(def.mediaType, extra);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKeys = searchParams.get('keys');
  if (!rawKeys) {
    return NextResponse.json({ error: 'Missing "keys" query parameter' }, { status: 400 });
  }

  const keys = rawKeys.split(',').map((k) => k.trim());
  const now = Date.now();
  const result: Record<string, Movie[]> = {};

  const pendingKeys: string[] = [];
  for (const key of keys) {
    const cached = categoryCache[key];
    if (cached && now - cached.ts < CACHE_TTL) {
      result[key] = cached.data;
    } else {
      pendingKeys.push(key);
    }
  }

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
