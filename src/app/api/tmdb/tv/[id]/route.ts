import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { TvShowDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [details, credits, similar, videos] = await Promise.all([
      tmdbFetch<TvShowDetails>(`/tv/${id}`),
      tmdbFetch<{ cast: any[]; crew: any[] }>(`/tv/${id}/credits`),
      tmdbFetch<{ results: any[] }>(`/tv/${id}/similar`),
      tmdbFetch<{ results: any[] }>(`/tv/${id}/videos`),
    ]);

    return NextResponse.json({
      ...details,
      credits,
      similar,
      videos,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch TV show details' }, { status: 500 });
  }
}
