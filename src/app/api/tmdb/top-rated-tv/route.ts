import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { splitFiftyFifty } from '@/lib/content-split';
import type { PaginatedResponse, Movie } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
      page,
      region: 'IN',
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
    });
    data.results = splitFiftyFifty(data.results);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch top rated TV shows' }, { status: 500 });
  }
}
