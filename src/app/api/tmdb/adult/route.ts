import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie, PaginatedResponse } from '@/lib/types';

const cache = new Map<string, { data: Movie[]; total: number; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const dynamic = 'force-dynamic';

interface DiscoverResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
}

function toMovie(r: DiscoverResult, mediaType: 'movie' | 'tv'): Movie {
  return {
    ...r,
    media_type: mediaType,
    title: r.title || r.name || '',
    release_date: r.release_date || r.first_air_date,
  };
}

export async function GET(req: NextRequest) {
  // Auth check: verify Supabase session and adult_enabled profile flag
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  if (!supabase) {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('adult_enabled')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.adult_enabled) {
    return NextResponse.json({ error: 'Adult content access is not enabled for this account' }, { status: 403 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const page = sp.get('page') || '1';
    const query = sp.get('query') || '';
    const genre = sp.get('genre') || '';

    const cacheKey = `adult:${query}:${genre}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    let movies: Movie[] = [];
    let totalPages = 500;

    if (query) {
      // Search mode: search movies + TV
      const [mRes, tRes] = await Promise.all([
        tmdbFetch<PaginatedResponse<DiscoverResult>>('/search/movie', {
          query,
          include_adult: 'true',
          page,
        }).catch(() => ({ results: [], total_pages: 0 })),
        tmdbFetch<PaginatedResponse<DiscoverResult>>('/search/tv', {
          query,
          include_adult: 'true',
          page,
        }).catch(() => ({ results: [], total_pages: 0 })),
      ]);

      movies = [
        ...mRes.results.map(r => toMovie(r, 'movie')),
        ...tRes.results.map(r => toMovie(r, 'tv')),
      ];
      totalPages = Math.max(mRes.total_pages, tRes.total_pages, 1);
    } else {
      // Discover mode
      const discoverParams: Record<string, string> = {
        sort_by: 'popularity.desc',
        include_adult: 'true',
        page,
        'vote_count.gte': '50',
      };

      // Default to Romance genre (10749) if no genre specified
      const genreId = genre || '10749';
      discoverParams.with_genres = genreId;

      const [mRes, tRes] = await Promise.all([
        tmdbFetch<PaginatedResponse<DiscoverResult>>('/discover/movie', discoverParams)
          .catch(() => ({ results: [], total_pages: 0 })),
        tmdbFetch<PaginatedResponse<DiscoverResult>>('/discover/tv', {
          ...discoverParams,
          'vote_count.gte': '30',
        }).catch(() => ({ results: [], total_pages: 0 })),
      ]);

      movies = [
        ...mRes.results.map(r => toMovie(r, 'movie')),
        ...tRes.results.map(r => toMovie(r, 'tv')),
      ];
      totalPages = Math.max(mRes.total_pages, tRes.total_pages, 1);
    }

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, { data: movies, total: totalPages, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json(movies);
  } catch (err: any) {
    console.error('Adult API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
