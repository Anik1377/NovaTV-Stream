import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

const CURRENT_YEAR = new Date().getFullYear().toString();

interface DiscoverItem {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';

    // Fetch 2025 movies and TV separately via discover
    const [moviesRes, tvRes] = await Promise.all([
      tmdbFetch<{ results: DiscoverItem[] }>('/discover/movie', {
        page,
        region: 'IN',
        sort_by: 'popularity.desc',
        'primary_release_year': CURRENT_YEAR,
        'vote_count.gte': '10',
      }),
      tmdbFetch<{ results: DiscoverItem[] }>('/discover/tv', {
        page,
        region: 'IN',
        sort_by: 'popularity.desc',
        'first_air_date_year': CURRENT_YEAR,
        'vote_count.gte': '10',
      }),
    ]);

    const movies: Movie[] = moviesRes.results.map(r => ({
      ...r,
      media_type: 'movie' as const,
      title: r.title || '',
      release_date: r.release_date,
    }));

    const tv: Movie[] = tvRes.results.map(r => ({
      ...r,
      media_type: 'tv' as const,
      title: r.name || r.title || '',
      name: r.name,
      release_date: r.first_air_date,
    }));

    // Interleave movies and TV by popularity
    const combined = [...movies, ...tv].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return NextResponse.json({
      page: parseInt(page),
      results: combined,
      total_results: moviesRes.results.length + tvRes.results.length,
      total_pages: 1,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
