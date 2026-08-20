import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PaginatedResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('provider_id');
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isNaN(rawPage) ? 1 : Math.max(1, Math.min(rawPage, 500));
  const type = searchParams.get('type') || 'movie';

  if (!providerId) {
    return NextResponse.json({ error: 'provider_id is required' }, { status: 400 });
  }

  if (!/^\d+$/.test(providerId)) {
    return NextResponse.json({ error: 'Invalid provider_id format' }, { status: 400 });
  }

  if (type && type !== 'movie' && type !== 'tv') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const endpoint =
      type === 'tv'
        ? '/discover/tv'
        : '/discover/movie';

    const data = await tmdbFetch<PaginatedResponse<Record<string, unknown>>>(endpoint, {
      with_watch_providers: providerId,
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page: String(page),
    });

    // Normalize results
    const results = (data.results || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      title: (item.title as string) || '',
      name: (item.name as string) || '',
      overview: (item.overview as string) || '',
      poster_path: item.poster_path as string | null,
      backdrop_path: item.backdrop_path as string | null,
      release_date: (item.release_date as string) || undefined,
      first_air_date: (item.first_air_date as string) || undefined,
      vote_average: (item.vote_average as number) || 0,
      vote_count: (item.vote_count as number) || 0,
      genre_ids: item.genre_ids as number[] | undefined,
      media_type: type,
      popularity: (item.popularity as number) || 0,
      adult: (item.adult as boolean) || false,
      original_language: (item.original_language as string) || '',
    }));

    return NextResponse.json({
      results,
      total_results: data.total_results,
      total_pages: data.total_pages,
      page: data.page,
    });
  } catch (error) {
    console.error('Provider fetch error:', error);
    return NextResponse.json({ results: [], total_results: 0, total_pages: 0, page: 1 });
  }
}
