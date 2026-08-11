import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PaginatedResponse, Movie } from '@/lib/types';

// Anime-specific: TMDB genre 16 = Animation
// We use discover with with_genres=16 and with_original_language=ja for Japanese anime
// plus english anime for broader reach

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'trending';
    const page = searchParams.get('page') || '1';

    let data: PaginatedResponse<Movie>;

    switch (type) {
      case 'trending':
        // Trending anime this week (TV)
        data = await tmdbFetch<PaginatedResponse<Movie>>('/trending/tv/week', { page });
        // Filter to animation genre
        data.results = data.results.filter((item) =>
          item.genre_ids?.includes(16) || item.media_type === 'tv'
        );
        break;

      case 'popular':
        // Popular anime TV shows
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
          page,
          with_genres: '16',
          sort_by: 'popularity.desc',
          with_original_language: 'ja',
          vote_count_gte: '50',
        });
        break;

      case 'top-rated':
        // Top rated anime
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
          page,
          with_genres: '16',
          sort_by: 'vote_average.desc',
          with_original_language: 'ja',
          vote_count_gte: '200',
        });
        break;

      case 'airing':
        // Currently airing anime
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
          page,
          with_genres: '16',
          with_status: 'returning_series',
          sort_by: 'popularity.desc',
          with_original_language: 'ja',
          vote_count_gte: '5',
        });
        break;

      case 'upcoming':
        // Upcoming anime movies
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/movie', {
          page,
          with_genres: '16',
          sort_by: 'popularity.desc',
          with_original_language: 'ja',
          'vote_count.gte': '10',
          'primary_release_date.gte': new Date().toISOString().split('T')[0],
        });
        // Fallback if no upcoming, get recent anime movies
        if (data.results.length === 0) {
          data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/movie', {
            page,
            with_genres: '16',
            sort_by: 'popularity.desc',
            with_original_language: 'ja',
            'primary_release_date.gte': '2024-01-01',
            vote_count_gte: '10',
          });
        }
        break;

      case 'movies':
        // Anime movies (all time popular)
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/movie', {
          page,
          with_genres: '16',
          sort_by: 'popularity.desc',
          with_original_language: 'ja',
          vote_count_gte: '500',
        });
        break;

      case 'all-popular':
        // Broad anime: Japanese + English animation, TV only
        data = await tmdbFetch<PaginatedResponse<Movie>>('/discover/tv', {
          page,
          with_genres: '16',
          sort_by: 'popularity.desc',
          vote_count_gte: '100',
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Tag all results as tv type for consistent handling
    const tagged = {
      ...data,
      results: data.results.map((item) => ({
        ...item,
        media_type: (item.media_type || 'tv') as 'tv',
      })),
    };

    return NextResponse.json(tagged);
  } catch (error) {
    console.error('Anime API error:', error);
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 });
  }
}
