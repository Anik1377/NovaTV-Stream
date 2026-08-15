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

interface ShowReelItem {
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

// ── Batch helper to avoid rate limiting ──
async function processBatch(movies: TmdbMovie[]): Promise<ShowReelItem[]> {
  const results: ShowReelItem[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (movie) => {
        try {
          const [videosRes, providersRes] = await Promise.all([
            tmdbFetch<{ results: TmdbVideo[] }>(`/movie/${movie.id}/videos`).catch(() => ({ results: [] })),
            tmdbFetch<{ results: { flatrate?: WatchProvider[] } }>(`/movie/${movie.id}/watch/providers`, { watch_region: 'US' }).catch(() => ({ results: { flatrate: [] } })),
          ]);

          const trailers = (videosRes.results || [])
            .filter((v) => v.type === 'Trailer' && v.site === 'YouTube')
            .map((v) => ({ key: v.key, name: v.name, type: v.type }));

          const watchProviders = (providersRes.results?.flatrate || [])
            .slice(0, 5)
            .map((p) => ({ name: p.provider_name, logo_path: p.logo_path || '' }));

          // Hype score calculation
          const hypeScore = calculateHypeScore(movie, trailers);

          // Get tagline by fetching movie details (only for high-hype movies)
          let tagline = movie.tagline;
          if (hypeScore >= 50 && !tagline) {
            try {
              const details = await tmdbFetch<{ tagline?: string }>(`/movie/${movie.id}`);
              tagline = details.tagline;
            } catch {
              // ignore
            }
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
      if (r && r.trailers.length > 0) {
        results.push(r);
      }
    }
  }

  return results;
}

function calculateHypeScore(movie: TmdbMovie, trailers: { key: string; name: string; type: string }[]): number {
  // popularity: normalize 0-500 → 0-40 points
  const popularityPoints = Math.min(40, (Math.min(movie.popularity, 500) / 500) * 40);

  // trailers: min(15 points, trailerCount * 5)
  const trailerPoints = Math.min(15, trailers.length * 5);

  // voteCount: normalize 0-5000 → 0-15
  const voteCountPoints = Math.min(15, (Math.min(movie.vote_count, 5000) / 5000) * 15);

  // daysToRelease
  const now = new Date();
  const release = new Date(movie.release_date);
  const diffDays = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let daysPoints = 0;
  if (diffDays <= 7 && diffDays >= -7) daysPoints = 20;
  else if (diffDays <= 30) daysPoints = 15;
  else if (diffDays <= 90) daysPoints = 10;
  else if (diffDays <= 180) daysPoints = 5;

  // bonus: has "Official Trailer" in video names
  let bonus = 0;
  if (trailers.some((t) => t.name.toLowerCase().includes('official trailer'))) {
    bonus = 10;
  }

  return Math.round(Math.min(100, popularityPoints + trailerPoints + voteCountPoints + daysPoints + bonus));
}

export async function GET() {
  try {
    // Check cache
    if (cachedData && Date.now() < cachedData.expiry) {
      return NextResponse.json(cachedData.data);
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch upcoming (pages 1-3) and now_playing (page 1)
    const [up1, up2, up3, np1] = await Promise.all([
      tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '1' }),
      tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '2' }),
      tmdbFetch<{ results: TmdbMovie[] }>('/movie/upcoming', { page: '3' }),
      tmdbFetch<{ results: TmdbMovie[] }>('/movie/now_playing', { page: '1' }),
    ]);

    // Combine and deduplicate
    const allMovies = [...up1.results, ...up2.results, ...up3.results, ...np1.results];
    const seen = new Set<number>();
    const unique: TmdbMovie[] = [];
    for (const m of allMovies) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);

      // Filter: must have release_date
      if (!m.release_date) continue;
      const releaseDate = new Date(m.release_date);

      // Filter: release_date >= today (or up to 30 days ago for "just released")
      // AND status not "Released" (or released within 7 days)
      const isUpcoming = releaseDate >= today;
      const isJustReleased = releaseDate >= thirtyDaysAgo && releaseDate < today;
      const isRecentlyReleased = m.status === 'Released' && releaseDate >= sevenDaysAgo;

      if (isUpcoming || isJustReleased || isRecentlyReleased) {
        unique.push(m);
      }
    }

    // Process in batches to get trailers & providers
    const items = await processBatch(unique);

    // Sort by hype score descending
    items.sort((a, b) => b.hypeScore - a.hypeScore);

    // Top 30
    const top30 = items.slice(0, 30);

    // Cache
    cachedData = { data: top30, expiry: Date.now() + CACHE_TTL };

    return NextResponse.json(top30);
  } catch (error) {
    console.error('ShowReels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch showreels' }, { status: 500 });
  }
}
