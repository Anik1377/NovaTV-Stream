import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { getCached } from '@/lib/cache';
import type { SeasonDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; season: string }> }
) {
  try {
    const { id, season } = await params;
    if (!/^\d+$/.test(id)) { return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 }); }
    if (!/^\d+$/.test(season)) { return NextResponse.json({ error: 'Invalid season format' }, { status: 400 }); }
    const data = await getCached(`tmdb-tv-${id}-s${season}`, 10 * 60 * 1000, () =>
      tmdbFetch<SeasonDetails>(`/tv/${id}/season/${season}`)
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
