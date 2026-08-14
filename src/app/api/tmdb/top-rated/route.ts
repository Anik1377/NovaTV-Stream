import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch, prioritizeIndian } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/movie', {
      page,
      region: 'IN',
      sort_by: 'vote_average.desc',
      'vote_count.gte': '300',
    });
    data.results = prioritizeIndian(data.results);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch top rated movies' }, { status: 500 });
  }
}