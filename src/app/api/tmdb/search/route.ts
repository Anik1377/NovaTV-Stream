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

    // Search movies, TV shows, and people in parallel
    const [movies, tv, people] = await Promise.all([
      tmdbFetch<{ page: number; results: any[]; total_results: number; total_pages: number }>(
        '/search/movie',
        { query, page }
      ),
      tmdbFetch<{ page: number; results: any[]; total_results: number; total_pages: number }>(
        '/search/tv',
        { query, page }
      ),
      tmdbFetch<{ page: number; results: any[]; total_results: number; total_pages: number }>(
        '/search/person',
        { query, page }
      ),
    ]);

    const mediaResults = [
      ...movies.results.map((m) => ({ ...m, media_type: 'movie' as const })),
      ...tv.results.map((t) => ({ ...t, media_type: 'tv' as const, title: t.name, name: t.name })),
    ].sort((a, b) => b.popularity - a.popularity);

    // People results — filter out those without a profile photo
    const personResults = people.results
      .filter((p) => p.profile_path)
      .map((p) => ({
        id: p.id,
        name: p.name,
        profile_path: p.profile_path,
        popularity: p.popularity,
        known_for_department: p.known_for_department,
        known_for: (p.known_for || []).map((kf: any) => ({
          id: kf.id,
          title: kf.title || kf.name,
          poster_path: kf.poster_path,
          media_type: kf.media_type || (kf.first_air_date ? 'tv' : 'movie'),
          release_date: kf.release_date,
          first_air_date: kf.first_air_date,
          vote_average: kf.vote_average,
        })),
      }))
      .sort((a, b) => b.popularity - a.popularity);

    const responseData = {
      page: parseInt(page),
      results: mediaResults,
      people: personResults,
      total_results: movies.total_results + tv.total_results + people.total_results,
      total_pages: Math.max(movies.total_pages, tv.total_pages, people.total_pages),
      media_total: movies.total_results + tv.total_results,
      people_total: people.total_results,
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
