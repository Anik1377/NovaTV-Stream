import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Person } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page') || '1';
    const category = searchParams.get('category') || 'popular';
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10); const limit = Math.min(Number.isNaN(rawLimit) ? 50 : Math.max(1, rawLimit), 100);

    let endpoint = '/person/popular';
    if (category === 'trending') endpoint = '/trending/person/week';

    // TMDB returns 20 per page, so we may need multiple pages to fill the limit
    const tmdbPerPage = 20;
    const pagesNeeded = Math.ceil(limit / tmdbPerPage);
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    // Map our logical page to TMDB pages (page 1 → TMDB 1-3, page 2 → TMDB 4-6, etc.)
    const tmdbStartPage = (page - 1) * pagesNeeded + 1;

    const allResults: Person[] = [];
    let totalPages = 500;
    let totalResults = 0;

    for (let i = 0; i < pagesNeeded; i++) {
      const tmdbPage = tmdbStartPage + i;
      if (tmdbPage > totalPages) break;

      const data = await tmdbFetch<{
        results: Person[];
        total_pages: number;
        total_results: number;
      }>(endpoint, { page: String(tmdbPage) });

      totalPages = data.total_pages;
      totalResults = data.total_results;

      // Filter out people without photos and dedupe within batch
      const seen = new Set(allResults.map((p) => p.id));
      const withPhotos = (data.results || []).filter((p) => p.profile_path && !seen.has(p.id));
      allResults.push(...withPhotos);

      if (allResults.length >= limit) break;
    }

    // Trim to limit
    const results = allResults.slice(0, limit);
    const effectiveTotalPages = Math.ceil(totalPages / pagesNeeded);

    return NextResponse.json({
      page: page,
      results,
      total_results: totalResults,
      total_pages: effectiveTotalPages,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}
