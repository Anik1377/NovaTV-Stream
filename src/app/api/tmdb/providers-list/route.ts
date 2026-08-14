import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

const TARGET_IDS = [8, 9, 350, 337, 15, 384, 531, 386, 283, 4179];

// In-memory cache
let cached: { map: Map<number, string | null>; ts: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL) {
    const results = TARGET_IDS.map(id => ({
      id,
      name: '',
      logo_path: cached!.map.get(id) ?? null,
    }));
    return NextResponse.json({ results });
  }

  try {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<{ results: TmdbProvider[] }>('/watch/providers/movie', { watch_region: 'IN' }),
      tmdbFetch<{ results: TmdbProvider[] }>('/watch/providers/tv', { watch_region: 'IN' }),
    ]);

    const logoMap = new Map<number, string | null>();
    for (const p of [...movieRes.results, ...tvRes.results]) {
      if (TARGET_IDS.includes(p.provider_id) && !logoMap.has(p.provider_id)) {
        logoMap.set(p.provider_id, p.logo_path);
      }
    }

    cached = { map: logoMap, ts: now };

    const results = TARGET_IDS.map(id => ({
      id,
      name: '',
      logo_path: logoMap.get(id) ?? null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Providers list error:', error);
    return NextResponse.json({ results: [] });
  }
}
