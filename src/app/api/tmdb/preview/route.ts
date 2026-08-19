import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const type = req.nextUrl.searchParams.get('type') || 'movie';

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (type && type !== 'movie' && type !== 'tv') return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  try {
    const d = await tmdbFetch<Record<string, unknown>>(
      `/${type}/${id}`,
      { append_to_response: 'credits,videos' }
    );

    const allVideos = (d.videos as { results: { id: string; key: string; name: string; site: string; type: string }[] } | undefined)?.results || [];
    const trailer =
      allVideos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      allVideos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
      allVideos.find((v) => v.site === 'YouTube');

    const credits = d.credits as { cast: { name: string; character: string; profile_path: string | null }[] } | undefined;

    return NextResponse.json({
      id: d.id,
      title: (d.title as string) || (d.name as string) || '',
      overview: (d.overview as string) || '',
      backdrop_path: d.backdrop_path as string | null,
      poster_path: d.poster_path as string | null,
      release_date: (d.release_date as string) || (d.first_air_date as string) || '',
      vote_average: (d.vote_average as number) || 0,
      vote_count: (d.vote_count as number) || 0,
      runtime: (d.runtime as number) || null,
      number_of_seasons: (d.number_of_seasons as number) || null,
      genres: (d.genres as { id: number; name: string }[]) || [],
      tagline: (d.tagline as string) || '',
      cast: (credits?.cast || []).slice(0, 5).map((c) => ({
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
      })),
      trailer_key: trailer?.key || null,
    });
  } catch (error) {
    console.error('Preview fetch error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
