import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

// ── Language configs ──
const DESI_LANGUAGES = [
  { key: 'hindi', lang: 'hi', country: 'IN' },
  { key: 'bengali-bd', lang: 'bn', country: 'BD' },
  { key: 'tamil', lang: 'ta', country: 'IN' },
  { key: 'telugu', lang: 'te', country: 'IN' },
  { key: 'malayalam', lang: 'ml', country: 'IN' },
  { key: 'kannada', lang: 'kn', country: 'IN' },
  { key: 'punjabi', lang: 'pa', country: 'IN' },
  { key: 'marathi', lang: 'mr', country: 'IN' },
  { key: 'urdu', lang: 'ur', country: 'PK' },
  { key: 'bengali-in', lang: 'bn', country: 'IN' },
];

// Small industries get lower vote threshold
const LOW_VOTE_LANGS = new Set(['bengali-bd', 'urdu']);

interface DiscoverResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
}

// ── In-memory cache (5 min TTL) ──
const cache = new Map<string, { data: Record<string, Movie[]>; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function toMovie(r: DiscoverResult, mediaType: 'movie' | 'tv'): Movie {
  return {
    ...r,
    media_type: mediaType,
    title: r.title || r.name || '',
    release_date: r.release_date || r.first_air_date,
  };
}

async function fetchLanguage(key: string, lang: string, country: string): Promise<Movie[]> {
  const minVotes = LOW_VOTE_LANGS.has(key) ? '0' : '10';
  const baseParams: Record<string, string> = {
    with_original_language: lang,
    with_origin_country: country,
    sort_by: 'popularity.desc',
    'vote_count.gte': minVotes,
  };

  const [mRes, tRes] = await Promise.all([
    tmdbFetch<{ results: DiscoverResult[] }>('/discover/movie', baseParams).catch(() => ({ results: [] })),
    tmdbFetch<{ results: DiscoverResult[] }>('/discover/tv', baseParams).catch(() => ({ results: [] })),
  ]);

  const movies = (mRes.results || []).map(r => toMovie(r, 'movie'));
  const tv = (tRes.results || []).map(r => toMovie(r, 'tv'));

  return [...movies, ...tv]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20);
}

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang');

    if (lang && lang !== 'all') {
      // Single language fetch
      const cacheKey = `desi:${lang}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return NextResponse.json({ [lang]: cached.data });
      }

      const config = DESI_LANGUAGES.find(l => l.key === lang);
      if (!config) {
        return NextResponse.json({ error: 'Unknown language' }, { status: 400 });
      }

      const items = await fetchLanguage(config.key, config.lang, config.country);
      const result = { [config.key]: items };

      cache.set(cacheKey, { data: items, expiry: Date.now() + CACHE_TTL });
      return NextResponse.json(result);
    }

    // Batch: fetch first 3 languages or all (for initial load)
    const fetchLangs = lang === 'all' ? DESI_LANGUAGES : DESI_LANGUAGES.slice(0, 3);
    const cacheKey = lang === 'all' ? 'desi:all' : 'desi:initial';

    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    const entries = await Promise.all(
      fetchLangs.map(async (config) => {
        const items = await fetchLanguage(config.key, config.lang, config.country);
        return [config.key, items] as const;
      })
    );

    const result: Record<string, Movie[]> = {};
    for (const [key, items] of entries) result[key] = items;

    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Desi content' }, { status: 500 });
  }
}
