import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface LogoResult {
  titleLogo: string | null;
  studios: { name: string; logo: string | null }[];
}

interface TmdbLogo {
  file_path: string;
  iso_639_1: string | null;
  aspect_ratio: number;
}

interface TmdbImages {
  logos: TmdbLogo[];
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

interface DetailResult {
  production_companies: ProductionCompany[];
}

const IMG_BASE = 'https://image.tmdb.org/t/p';

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get('ids');
    const typesParam = req.nextUrl.searchParams.get('types');

    if (!idsParam || !typesParam) {
      return NextResponse.json({});
    }

    const ids = idsParam.split(',');
    const types = typesParam.split(',');

    if (ids.length > 20) { return NextResponse.json({ error: 'Too many IDs requested' }, { status: 400 }); }
    const validTypes = types.every((t: string) => t === 'movie' || t === 'tv');
    if (!validTypes) { return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 }); }
    const results: Record<string, LogoResult> = {};

    // Fetch in parallel batches of 4 to avoid rate limiting
    const batchSize = 4;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchTypes = types.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (id, idx) => {
          const type = batchTypes[idx] || 'movie';

          const [images, details] = await Promise.all([
            safe(() => tmdbFetch<TmdbImages>(`/${type}/${id}/images`)),
            safe(() => tmdbFetch<DetailResult>(`/${type}/${id}`)),
          ]);

          // Pick best logo: prefer English, then any, pick highest aspect ratio (wider = better for titles)
          let titleLogo: string | null = null;
          if (images?.logos?.length) {
            const english = images.logos.filter(l => l.iso_639_1 === 'en');
            const pool = english.length > 0 ? english : images.logos;
            pool.sort((a, b) => b.aspect_ratio - a.aspect_ratio);
            const best = pool[0];
            if (best?.file_path) {
              titleLogo = `${IMG_BASE}/w500${best.file_path}`;
            }
          }

          // Production company logos (max 4, only those with logos)
          const studios: { name: string; logo: string | null }[] = (details?.production_companies || [])
            .filter(c => c.logo_path)
            .slice(0, 4)
            .map(c => ({
              name: c.name,
              logo: `${IMG_BASE}/w92${c.logo_path}`,
            }));

          return { id, data: { titleLogo, studios } };
        })
      );

      for (const r of batchResults) {
        results[r.id] = r.data;
      }
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
