import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

interface TrendingItem {
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
  media_type?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const timeWindow = searchParams.get('time_window') || 'week';

    // Use TMDB's trending endpoint — always returns 20 popular items
    const data = await tmdbFetch<{ results: TrendingItem[] }>(
      `/trending/all/${timeWindow}`,
      { page },
    );

    const results: Movie[] = data.results.map((r) => ({
      ...r,
      media_type: (r.media_type as 'movie' | 'tv') || (r.first_air_date ? 'tv' : 'movie'),
      title: r.title || r.name || '',
      release_date: r.release_date || r.first_air_date,
    }));

    return NextResponse.json({
      page: parseInt(page),
      results,
      total_results: results.length,
      total_pages: 1,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
