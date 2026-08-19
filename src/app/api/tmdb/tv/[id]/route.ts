import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { getCached } from '@/lib/cache';
import type { TvShowDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getCached(`tmdb-tv-${id}`, 5 * 60 * 1000, () =>
      Promise.all([
        tmdbFetch<TvShowDetails>(`/tv/${id}`),
        tmdbFetch<{ cast: any[]; crew: any[] }>(`/tv/${id}/credits`),
        tmdbFetch<{ results: any[] }>(`/tv/${id}/similar`),
        tmdbFetch<{ results: any[] }>(`/tv/${id}/videos`),
      ]).then(([details, credits, similar, videos]) => ({
        ...details,
        credits,
        similar,
        videos,
      }))
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch TV show details' }, { status: 500 });
  }
}
