import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const data = await tmdbFetch<PaginatedResponse<Movie>>('/tv/popular', { page });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch popular TV shows' }, { status: 500 });
  }
}
