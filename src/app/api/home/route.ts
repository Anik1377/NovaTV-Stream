import { NextRequest, NextResponse } from 'next/server';
import type { Movie, Genre } from '@/lib/types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  data: Record<string, unknown>;
  ts: number;
};

let cache: CacheEntry | null = null;

async function safeFetch(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const now = Date.now();

  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  const base = `${proto}://${host}`;

  const [trending, popularMovies, popularTv, topRated, upcoming, topRatedTv, genres, providers] =
    await Promise.all([
      safeFetch(`${base}/api/tmdb/trending?time_window=week`),
      safeFetch(`${base}/api/tmdb/popular-movies`),
      safeFetch(`${base}/api/tmdb/popular-tv`),
      safeFetch(`${base}/api/tmdb/top-rated`),
      safeFetch(`${base}/api/tmdb/upcoming`),
      safeFetch(`${base}/api/tmdb/top-rated-tv`),
      safeFetch(`${base}/api/tmdb/genres`),
      safeFetch(`${base}/api/tmdb/providers-list`),
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
