import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    // No region=IN — show global top rated TV shows
    const data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
      page,
      sort_by: 'vote_average.desc',
      'vote_count.gte': '500',
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch top rated TV shows' }, { status: 500 });
  }
}
