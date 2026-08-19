import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

const LIMIT = 20;

function tagAs(results: Movie[], mediaType: 'tv' | 'movie' = 'tv'): Movie[] {
  return results.slice(0, LIMIT).map((item) => ({
    ...item,
    media_type: (item.media_type || mediaType) as 'tv' | 'movie',
  }));
}

export async function GET() {
  try {
    const [trending, popular, topRated, airing, movies, allPopular] = await Promise.all([
      tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
        page: '1',
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
        vote_count_gte: '50',
      }),
      tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
        page: '1',
        with_genres: '16',
        sort_by: 'popularity.desc',
        with_original_language: 'ja',
        vote_count_gte: '50',
      }),
      tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
        page: '1',
        with_genres: '16',
        sort_by: 'vote_average.desc',
        with_original_language: 'ja',
        vote_count_gte: '200',
      }),
      tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
        page: '1',
        with_genres: '16',
        with_status: 'returning_series',
        sort_by: 'popularity.desc',
        with_original_language: 'ja',
        vote_count_gte: '5',
      }),
      tmdbFetch<PaginatedResponse<Movie>>('/discover/movie', {
        page: '1',
        with_genres: '16',
        sort_by: 'popularity.desc',
        with_original_language: 'ja',
        vote_count_gte: '500',
      }),
      tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
        page: '1',
        with_genres: '16',
        sort_by: 'popularity.desc',
        vote_count_gte: '100',
      }),
    ]);

    return NextResponse.json({
      trending: tagAs(trending.results),
      popular: tagAs(popular.results),
      topRated: tagAs(topRated.results),
      airing: tagAs(airing.results),
      movies: tagAs(movies.results, 'movie'),
      allPopular: tagAs(allPopular.results),
    });
  } catch (error) {
    console.error('Anime batch API error:', error);
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 });
  }
}
