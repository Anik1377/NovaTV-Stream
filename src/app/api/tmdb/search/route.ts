import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const [movies, tv] = await Promise.all([
      tmdbFetch<{ page: number; results: any[]; total_results: number; total_pages: number }>(
        '/search/movie',
        { query, page }
      ),
      tmdbFetch<{ page: number; results: any[]; total_results: number; total_pages: number }>(
        '/search/tv',
        { query, page }
      ),
    ]);

    const combined = [
      ...movies.results.map((m) => ({ ...m, media_type: 'movie' as const })),
      ...tv.results.map((t) => ({ ...t, media_type: 'tv' as const, title: t.name, name: t.name })),
    ]
      .sort((a, b) => b.popularity - a.popularity);

    return NextResponse.json({
      page: parseInt(page),
      results: combined,
      total_results: movies.total_results + tv.total_results,
      total_pages: Math.max(movies.total_pages, tv.total_pages),
    });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
