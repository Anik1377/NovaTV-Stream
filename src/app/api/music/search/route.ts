import { NextRequest, NextResponse } from 'next/server';

/* ── In-memory cache with 5-min TTL ── */
interface CacheEntry {
  data: { songs: Song[]; total: number; page: number };
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Song {
  id: string;
  title: string;
  album: string;
  artists: string;
  year: string;
  image: string;
  language: string;
  duration: number;
  previewUrl: string;
  permaUrl: string;
  playCount: number;
}

function getImageUrl(url: string | undefined): string {
  if (!url) return '';
  return url.replace(/-\d+x\d+\.jpg$/, '-500x500.jpg');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  if (!query.trim()) {
    return NextResponse.json({ songs: [], total: 0, page: 1 });
  }

  const cacheKey = `${query.toLowerCase().trim()}:${page}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data);
  }

  try {
    const params = new URLSearchParams({
      _format: 'json',
      _marker: '0',
      ctx: 'wap6dot0',
      q: query.trim(),
      type: 'song',
      p: String(page),
      n: String(limit),
      __call: 'search.getResults',
    });

    const res = await fetch(
      `https://www.jiosaavn.com/api.php?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      throw new Error(`JioSaavn API returned ${res.status}`);
    }

    const data = await res.json();
    const rawResults = data.results || [];

    const songs: Song[] = rawResults.map(
      (item: Record<string, string>) => ({
        id: item.id || '',
        title: item.song || 'Unknown',
        album: item.album || '',
        artists: item.primary_artists || 'Unknown Artist',
        year: item.year || '',
        image: getImageUrl(item.image),
        language: (item.language || 'unknown').toLowerCase(),
        duration: parseInt(item.duration || '0', 10),
        previewUrl: item.media_preview_url || '',
        permaUrl: item.perma_url || '',
        playCount: parseInt(item.play_count || '0', 10),
      })
    );

    const result = {
      songs,
      total: parseInt(data.total || '0', 10),
      page,
    };

    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    // Prune stale cache entries periodically
    if (cache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of cache) {
        if (now >= entry.expiry) cache.delete(key);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Music search error:', error);
    return NextResponse.json(
      { songs: [], total: 0, page, error: 'Failed to search songs. Please try again.' },
      { status: 500 }
    );
  }
}
