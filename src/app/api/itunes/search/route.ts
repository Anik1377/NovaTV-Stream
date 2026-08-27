import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiry) { cache.delete(key); return null; }
  return e.data as T;
}
function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// iTunes Search API result type
interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
  trackViewUrl: string;
}

// Normalized track
interface ITunesTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
  link: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '25';
  const country = searchParams.get('country') || 'us';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 });
  }

  const cacheKey = `itunes:search:${q}:${limit}`;
  const cached = getCached<{ tracks: ITunesTrack[]; total: number }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', q);
    url.searchParams.set('media', 'music');
    url.searchParams.set('limit', limit);
    url.searchParams.set('country', country);

    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const data = await res.json();
    const results: ITunesResult[] = data.results || [];

    const tracks: ITunesTrack[] = results.map((r) => ({
      id: String(r.trackId),
      title: r.trackName,
      artist: r.artistName,
      cover: r.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      preview: r.previewUrl,
      duration: r.trackTimeMillis,
      link: r.trackViewUrl,
    }));

    const response = { tracks, total: data.resultCount || 0 };
    setCache(cacheKey, response, 5 * 60 * 1000); // 5 min
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Search failed', details: message }, { status: 500 });
  }
}
