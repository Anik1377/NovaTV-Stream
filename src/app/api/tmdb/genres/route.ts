import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { Genre } from '@/lib/types';

interface GenreListResponse {
  genres: Genre[];
}

export async function GET() {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdbFetch<GenreListResponse>('/genre/movie/list'),
      tmdbFetch<GenreListResponse>('/genre/tv/list'),
    ]);

    const allGenres = [...movieGenres.genres, ...tvGenres.genres].filter(
      (g, i, arr) => arr.findIndex((x) => x.id === g.id) === i
    );

    return NextResponse.json({ genres: allGenres });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
