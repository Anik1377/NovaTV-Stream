import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

// ── Types ──
interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  status: string;
  adult: boolean;
  tagline?: string;
}

interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface ShowReelItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  hypeScore: number;
  trailers: { key: string; name: string; type: string }[];
  watchProviders: { name: string; logo_path: string }[];
  status: string;
  tagline?: string;
}

// ── In-memory cache (10 min TTL) ──
let cachedData: { data: ShowReelItem[]; expiry: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

function calculateHypeScore(movie: TmdbMovie, trailers: { key: string; name: string; type: string }[]): number {
  // popularity: normalize 0-500 → 0-40 points
  const popularityPoints = Math.min(40, (Math.min(movie.popularity, 500) / 500) * 40);

  // videos: any video type counts, min(20 points, videoCount * 4)
  const videoPoints = Math.min(20, trailers.length * 4);

  // voteCount: normalize 0-5000 → 0-15
  const voteCountPoints = Math.min(15, (Math.min(movie.vote_count, 5000) / 5000) * 15);

  // daysToRelease proximity
  const now = new Date();
  const release = new Date(movie.release_date);
  const diffDays = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let daysPoints = 0;
  if (diffDays <= 7 && diffDays >= -14) daysPoints = 25;
  else if (diffDays <= 30) daysPoints = 18;
  else if (diffDays <= 90) daysPoints = 12;
  else if (diffDays <= 180) daysPoints = 6;
  else if (diffDays <= 365) daysPoints = 3;

  // bonus: has "Official Trailer"
  let bonus = 0;
  if (trailers.some((t) => t.name.toLowerCase().includes('official trailer'))) bonus = 10;
  // bonus: has Teaser + Trailer combo
  else if (trailers.some((t) => t.type === 'Trailer') && trailers.some((t) => t.type === 'Teaser')) bonus = 5;

  return Math.round(Math.min(100, popularityPoints + videoPoints + voteCountPoints + daysPoints + bonus));
}

export async function GET() {
  try {
    if (cachedData && Date.now() < cachedData.expiry) {
      return NextResponse.json(cachedData.data);
    }

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch from MULTIPLE sources for maximum coverage
    const [up1, up2, up3, np1, np2, trending, popular] = await Promise.all([
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '1' })),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '2' })),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '3' })),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/now_playing', { page: '1' })),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/now_playing', { page: '2' })),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/trending/movie/week')),
      safe(() => tmdbFetch<{ results: TmdbMovie[] }>('/movie/popular', { page: '1' })),
    ]);

    // Combine and deduplicate
    const allMovies = [
      ...(up1?.results || []),
      ...(up2?.results || []),
      ...(up3?.results || []),
      ...(np1?.results || []),
      ...(np2?.results || []),
      ...(trending?.results || []),
      ...(popular?.results || []),
    ];

    const seen = new Set<number>();
    const unique: TmdbMovie[] = [];
    for (const m of allMovies) {
      if (seen.has(m.id) || m.adult) continue;
      seen.add(m.id);

      if (!m.release_date) continue;
      const releaseDate = new Date(m.release_date);

      // Keep movies: upcoming OR released within last 6 months
      // This gives us a huge pool of movies with trailers
      const isFuture = releaseDate >= today;
      const isRecent = releaseDate >= sixMonthsAgo && releaseDate < today;

      if (isFuture || isRecent) {
        unique.push(m);
      }
    }

    // Process in batches to get trailers & providers (BATCH of 8 for speed)
    const BATCH_SIZE = 8;
    const results: ShowReelItem[] = [];

    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      const batch = unique.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (movie) => {
          try {
            const [videosRes, providersRes] = await Promise.all([
              tmdbFetch<{ results: TmdbVideo[] }>(`/movie/${movie.id}/videos`).catch(() => ({ results: [] })),
              tmdbFetch<{ results: { flatrate?: WatchProvider[] } }>(`/movie/${movie.id}/watch/providers`, { watch_region: 'US' }).catch(() => ({ results: { flatrate: [] } })),
            ]);

            // Accept ALL video types (Trailer, Teaser, Clip, Featurette, Behind the Scenes)
            const trailers = (videosRes.results || [])
              .filter((v) => v.site === 'YouTube')
              .map((v) => ({ key: v.key, name: v.name, type: v.type }));

            const watchProviders = (providersRes.results?.flatrate || [])
              .slice(0, 5)
              .map((p) => ({ name: p.provider_name, logo_path: p.logo_path || '' }));

            const hypeScore = calculateHypeScore(movie, trailers);

            // Get tagline for high-hype movies
            let tagline = movie.tagline;
            if (hypeScore >= 40 && !tagline) {
              const details = await safe(() => tmdbFetch<{ tagline?: string }>(`/movie/${movie.id}`));
              tagline = details?.tagline;
            }

            return {
              id: movie.id,
              title: movie.title,
              overview: movie.overview,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              release_date: movie.release_date,
              popularity: movie.popularity,
              vote_average: movie.vote_average,
              vote_count: movie.vote_count,
              genre_ids: movie.genre_ids,
              hypeScore,
              trailers,
              watchProviders,
              status: movie.status,
              tagline: tagline || undefined,
            } satisfies ShowReelItem;
          } catch {
            return null;
          }
        }),
      );

      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }

    // Sort by hype score descending
    results.sort((a, b) => b.hypeScore - a.hypeScore);

    // Return top 40
    const top40 = results.slice(0, 40);

    cachedData = { data: top40, expiry: Date.now() + CACHE_TTL };
    return NextResponse.json(top40);
  } catch (error) {
    console.error('ShowReels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch showreels' }, { status: 500 });
  }
}
