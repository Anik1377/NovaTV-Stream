import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { SeasonDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; season: string }> }
) {
  try {
    const { id, season } = await params;
    const data = await tmdbFetch<SeasonDetails>(`/tv/${id}/season/${season}`);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
