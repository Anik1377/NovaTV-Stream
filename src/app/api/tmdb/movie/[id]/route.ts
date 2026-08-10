import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { MovieDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [details, credits, similar, videos] = await Promise.all([
      tmdbFetch<MovieDetails>(`/movie/${id}`),
      tmdbFetch<{ cast: any[]; crew: any[] }>(`/movie/${id}/credits`),
      tmdbFetch<{ results: any[] }>(`/movie/${id}/similar`),
      tmdbFetch<{ results: any[] }>(`/movie/${id}/videos`),
    ]);

    return NextResponse.json({
      ...details,
      credits,
      similar,
      videos,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
