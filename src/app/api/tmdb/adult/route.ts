import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

const cache = new Map<string, { data: Movie[]; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

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

function toMovie(r: DiscoverResult, mediaType: 'movie' | 'tv'): Movie {
  return {
    ...r,
    media_type: mediaType,
    title: r.title || r.name || '',
    release_date: r.release_date || r.first_air_date,
  };
}

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get('page') || '1';
    const cacheKey = `adult:${page}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    const [mRes, tRes] = await Promise.all([
      tmdbFetch<{ results: DiscoverResult[] }>('/discover/movie', {
        sort_by: 'popularity.desc',
        include_adult: 'true',
        'vote_count.gte': '50',
        page,
        'with_runtime.gte': '60',
      }).catch(() => ({ results: [] })),
      tmdbFetch<{ results: DiscoverResult[] }>('/discover/tv', {
        sort_by: 'popularity.desc',
        include_adult: 'true',
        'vote_count.gte': '50',
        page,
      }).catch(() => ({ results: [] })),
    ]);

    const movies = (mRes.results || [])
      .filter(r => r.adult)
      .map(r => toMovie(r, 'movie'));
    const tv = (tRes.results || [])
      .filter(r => r.adult)
      .map(r => toMovie(r, 'tv'));

    const combined = [...movies, ...tv]
      .sort((a, b) => b.popularity - a.popularity);

    cache.set(cacheKey, { data: combined, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json(combined);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
