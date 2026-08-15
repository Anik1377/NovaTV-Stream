import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Movie } from '@/lib/types';

interface DiscoverItem {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genreId = searchParams.get('genre_id');
    const mediaType = searchParams.get('media_type') || 'movie';
    const page = searchParams.get('page') || '1';
    const sortBy = searchParams.get('sort_by') || 'popularity.desc';
    const region = searchParams.get('region') || '';
    const withLang = searchParams.get('with_original_language') || '';
    const withoutGenres = searchParams.get('without_genres') || '';
    const originCountry = searchParams.get('with_origin_country') || '';
    const minVotes = searchParams.get('min_votes');

    const endpoint = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';

    const params: Record<string, string> = {
      page,
      sort_by: sortBy,
      'vote_count.gte': minVotes || '30',
    };

    if (genreId) params.with_genres = genreId;
    if (withoutGenres) params.without_genres = withoutGenres;
    if (region) params.region = region;
    if (withLang) params.with_original_language = withLang;
    if (originCountry) params.with_origin_country = originCountry;

    const data = await tmdbFetch<{ results: DiscoverItem[]; total_pages: number; total_results: number }>(endpoint, params);

    const results: Movie[] = data.results.map((r) => ({
      ...r,
      media_type: mediaType as 'movie' | 'tv',
      title: r.title || r.name || '',
      release_date: r.release_date || r.first_air_date,
    }));

    return NextResponse.json({
      page: parseInt(page),
      results,
      total_pages: data.total_pages,
      total_results: data.total_results,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to discover' }, { status: 500 });
  }
}
