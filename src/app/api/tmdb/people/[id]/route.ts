import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import type { PersonDetails } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [details, movieCredits, tvCredits, images] = await Promise.all([
      tmdbFetch<PersonDetails>(`/person/${id}`),
      tmdbFetch<{ cast: PersonDetails['movie_credits']['cast']; crew: PersonDetails['movie_credits']['crew'] }>(
        `/person/${id}/movie_credits`,
      ),
      tmdbFetch<{ cast: PersonDetails['tv_credits']['cast']; crew: PersonDetails['tv_credits']['crew'] }>(
        `/person/${id}/tv_credits`,
      ),
      tmdbFetch<{ profiles: PersonDetails['images']['profiles'] }>(
        `/person/${id}/images`,
      ),
    ]);

    // Sort cast by popularity, take top 40
    const sortedMovieCast = [...(movieCredits.cast || [])]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 40)
      .map((c) => ({ ...c, media_type: 'movie' as const }));

    const sortedTvCast = [...(tvCredits.cast || [])]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 40)
      .map((c) => ({ ...c, media_type: 'tv' as const }));

    // Get directing/writing crew credits
    const movieCrew = [...(movieCredits.crew || [])]
      .filter((c) => c.job === 'Director' || c.job === 'Writer' || c.job === 'Producer' || c.job === 'Screenplay')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20)
      .map((c) => ({ ...c, media_type: 'movie' as const }));

    const tvCrew = [...(tvCredits.crew || [])]
      .filter((c) => c.job === 'Director' || c.job === 'Writer' || c.job === 'Producer' || c.job === 'Executive Producer')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20)
      .map((c) => ({ ...c, media_type: 'tv' as const }));

    return NextResponse.json({
      ...details,
      movie_credits: { cast: sortedMovieCast, crew: movieCrew },
      tv_credits: { cast: sortedTvCast, crew: tvCrew },
      images: images.profiles || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch person details' }, { status: 500 });
  }
}
