import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Person } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const category = searchParams.get('category') || 'popular';

    let endpoint = '/person/popular';
    if (category === 'trending') endpoint = '/trending/person/week';

    const data = await tmdbFetch<{ results: Person[]; total_pages: number; total_results: number }>(
      endpoint,
      { page },
    );

    return NextResponse.json({
      page: parseInt(page),
      results: data.results,
      total_results: data.total_results,
      total_pages: data.total_pages,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}
