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

interface ITunesTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
  link: string;
}

function parseRssEntry(entry: Record<string, unknown>): ITunesTrack {
  const name = (entry['im:name'] as Record<string, { label: string }>)?.label || '';
  const artist = (entry['im:artist'] as Record<string, { label: string }>)?.label || '';
  
  const images = entry['im:image'] as Array<{ label: string }> | undefined;
  const cover = images?.[images.length - 1]?.label?.replace(/\d+x\d+bb/, '600x600bb') || '';
  
  const links = entry.link as Array<Record<string, unknown>> | undefined;
  let preview = '';
  if (links) {
    for (const link of links) {
      const attrs = link.attributes as Record<string, string> | undefined;
      if (attrs?.rel === 'enclosure') {
        preview = attrs.href || '';
        break;
      }
    }
  }
  
  const trackLink = links?.[0]?.attributes as Record<string, string> | undefined;
  const link = trackLink?.href || '';
  
  const id = (entry.id as Record<string, Record<string, string>>)?.attributes?.['im:id'] || '';
  
  return { id, title: name, artist, cover, preview, duration: 0, link };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const genre = searchParams.get('genre') || 'topsongs';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 200);
  const country = searchParams.get('country') || 'us';

  const cacheKey = `itunes:chart:${country}:${genre}:${limit}`;
  const cached = getCached<{ tracks: ITunesTrack[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const url = `https://itunes.apple.com/${country}/rss/${genre}/limit=${limit}/json`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch chart' }, { status: 500 });
    }

    const data = await res.json();
    const entries = data.feed?.entry;

    if (!entries) {
      return NextResponse.json({ tracks: [] });
    }

    const entryArray = Array.isArray(entries) ? entries : [entries];
    const tracks = entryArray.map(parseRssEntry);

    // Batch lookup full durations via iTunes Lookup API
    const ids = tracks.map(t => t.id).filter(Boolean).join(',');
    if (ids) {
      try {
        const lookupRes = await fetch(
          `https://itunes.apple.com/lookup?id=${ids}&country=${country}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          const results: Array<{ trackId: number; trackTimeMillis: number }> = lookupData.results || [];
          const durationMap = new Map<string, number>();
          for (const r of results) {
            if (r.trackId && r.trackTimeMillis) {
              durationMap.set(String(r.trackId), r.trackTimeMillis);
            }
          }
          for (const track of tracks) {
            track.duration = durationMap.get(track.id) || 0;
          }
        }
      } catch {
        // Keep duration as 0 if lookup fails
      }
    }

    const response = { tracks };
    setCache(cacheKey, response, 30 * 60 * 1000);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch chart', details: message }, { status: 500 });
  }
}
