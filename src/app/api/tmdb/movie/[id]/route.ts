import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { getCached } from '@/lib/cache';
import type { MovieDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) { return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 }); }
    const data = await getCached(`tmdb-movie-${id}`, 5 * 60 * 1000, () =>
      Promise.all([
        tmdbFetch<MovieDetails>(`/movie/${id}`),
        tmdbFetch<{ cast: any[]; crew: any[] }>(`/movie/${id}/credits`),
        tmdbFetch<{ results: any[] }>(`/movie/${id}/similar`),
        tmdbFetch<{ results: any[] }>(`/movie/${id}/videos`),
      ]).then(([details, credits, similar, videos]) => ({
        ...details,
        credits,
        similar,
        videos,
      }))
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
