import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie, Genre } from '@/lib/types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  data: Record<string, unknown>;
  ts: number;
};

let cache: CacheEntry | null = null;

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const [trending, popularMovies, popularTv, topRated, upcoming, topRatedTv, genres, providers] =
    await Promise.all([
      safe(() => tmdbFetch<{ results: Movie[] }>('/trending/all/week')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/popular')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/tv/popular')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/top_rated')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/upcoming')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/tv/top_rated')),
      safe(() => tmdbFetch<{ genres: Genre[] }>('/genre/movie/list')),
      safe(() => tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>('/watch/providers/movie', { watch_region: 'US' })),
    ]);

  const data: Record<string, unknown> = {
    trending,
    popularMovies,
    popularTv,
    topRated,
    upcoming,
    topRatedTv,
    genres,
    providers,
  };

  cache = { data, ts: now };
  return NextResponse.json(data);
}
