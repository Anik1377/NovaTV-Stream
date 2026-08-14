import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch, prioritizeIndian } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

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
  media_type: string;
  popularity: number;
  adult: boolean;
  original_language: string;
  original_title?: string;
  original_name?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const timeWindow = searchParams.get('time_window') || 'week';

    const data = await tmdbFetch<PaginatedResponse<TrendingItem>>(
      `/trending/all/${timeWindow}`,
      { page, region: 'IN' }
    );

    const results: Movie[] = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        ...item,
        title: item.title || item.name || '',
        release_date: item.release_date || item.first_air_date,
        media_type: item.media_type as 'movie' | 'tv',
      }));

    // Reorder: Indian content first
    data.results = prioritizeIndian(results);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
