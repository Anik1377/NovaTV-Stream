import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

/* ── In-memory cache ── */
const searchCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string, page: string): string {
  return `${query.toLowerCase()}::${page}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = getCacheKey(query, page);
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
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
    ].sort((a, b) => b.popularity - a.popularity);

    const responseData = {
      page: parseInt(page),
      results: combined,
      total_results: movies.total_results + tv.total_results,
      total_pages: Math.max(movies.total_pages, tv.total_pages),
    };

    // Store in cache
    searchCache.set(cacheKey, { data: responseData, expiry: Date.now() + CACHE_TTL });

    // Prune old entries periodically (keep cache manageable)
    if (searchCache.size > 200) {
      const now = Date.now();
      for (const [key, val] of searchCache) {
        if (now >= val.expiry) searchCache.delete(key);
      }
    }

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
