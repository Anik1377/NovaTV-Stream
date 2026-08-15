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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mergeFiftyFifty<T extends { id: number }>(a: T[], b: T[], total = 20): T[] {
  const half = Math.ceil(total / 2);
  const pickA = a.slice(0, half);
  const pickB = b.slice(0, total - half);
  const merged = [...pickA, ...pickB];
  return shuffleArray(merged);
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const [trending, popularMovies, popularTv, topRated, upcoming, topRatedTv, genres, providers, indianMovies, indianTv] =
    await Promise.all([
      safe(() => tmdbFetch<{ results: Movie[] }>('/trending/all/week')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/popular')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/tv/popular')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/top_rated')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/movie/upcoming')),
      safe(() => tmdbFetch<{ results: Movie[] }>('/tv/top_rated')),
      safe(() => tmdbFetch<{ genres: Genre[] }>('/genre/movie/list')),
      safe(() => tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>('/watch/providers/movie', { watch_region: 'US' })),
      safe(() => tmdbFetch<{ results: Movie[] }>('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc' })),
      safe(() => tmdbFetch<{ results: Movie[] }>('/discover/tv', { with_original_language: 'hi', sort_by: 'popularity.desc' })),
    ]);

  const finalPopularMovies = mergeFiftyFifty(popularMovies?.results || [], indianMovies?.results || []);
  const finalPopularTv = mergeFiftyFifty(popularTv?.results || [], indianTv?.results || []);

  const data: Record<string, unknown> = {
    trending,
    popularMovies: { results: finalPopularMovies },
    popularTv: { results: finalPopularTv },
    topRated,
    upcoming,
    topRatedTv,
    genres,
    providers,
  };

  cache = { data, ts: now };
  return NextResponse.json(data);
}
