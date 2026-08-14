import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface BasicItem {
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

export async function GET() {
  try {
    // Sequential fetches to reduce peak memory
    const moviesRes = await tmdbFetch<{ results: BasicItem[] }>('/discover/movie', {
      region: 'IN', sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': '50',
    });
    const tvRes = await tmdbFetch<{ results: BasicItem[] }>('/discover/tv', {
      region: 'IN', sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': '30',
    });
    const tamilRes = await tmdbFetch<{ results: BasicItem[] }>('/discover/movie', {
      region: 'IN', sort_by: 'popularity.desc', with_original_language: 'ta', 'vote_count.gte': '20',
    });
    const teluguRes = await tmdbFetch<{ results: BasicItem[] }>('/discover/movie', {
      region: 'IN', sort_by: 'popularity.desc', with_original_language: 'te', 'vote_count.gte': '20',
    });

    const normalize = (items: BasicItem[], type: 'movie' | 'tv') =>
      items.map(r => ({
        ...r,
        media_type: type,
        title: r.title || r.name || '',
        release_date: r.release_date || r.first_air_date,
      }));

    const seen = new Set<number>();
    const all: ReturnType<typeof normalize> = [];
    for (const item of [
      ...normalize(moviesRes.results, 'movie'),
      ...normalize(tvRes.results, 'tv'),
      ...normalize(tamilRes.results, 'movie'),
      ...normalize(teluguRes.results, 'movie'),
    ]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }

    return NextResponse.json({ results: all });
  } catch (error) {
    console.error('Indian boost error:', error);
    return NextResponse.json({ results: [] });
  }
}
