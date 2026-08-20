const YT_API_KEY = process.env.YOUTUBE_API_KEY || '';

/**
 * Generic YouTube API fetch helper.
 * MUST only be used server-side (API routes / server components).
 */
export async function ytFetch<T = Record<string, unknown>>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  if (!YT_API_KEY) throw new Error('YOUTUBE_API_KEY environment variable is required');
  const url = new URL('https://www.googleapis.com/youtube/v3/' + endpoint);
  url.searchParams.set('key', YT_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } } as RequestInit);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Simple in-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Get a cached value by key. Returns null on miss / expiry. */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Store a value in cache with a TTL in **milliseconds**. */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Shared response-shaping helpers
// ---------------------------------------------------------------------------

export interface YoutubeVideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: number;
  publishedAt: string;
}

export interface SnippetItem {
  id: { videoId?: string } | string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
    publishedAt?: string;
  };
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

/** Pick the best available thumbnail URL. */
export function pickThumbnail(thumbnails?: SnippetItem['snippet']['thumbnails']): string {
  if (!thumbnails) return '';
  return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
}

/** Extract videoId from a search result item (id can be object or string). */
export function extractVideoId(item: SnippetItem): string {
  if (typeof item.id === 'object' && item.id.videoId) return item.id.videoId;
  return String(item.id);
}

/** Fetch extra details (duration, viewCount) for a list of video IDs. */
export async function fetchVideoDetails(videoIds: string[]): Promise<
  Map<string, { duration: string; viewCount: string }>
> {
  const detailMap = new Map<string, { duration: string; viewCount: string }>();
  if (videoIds.length === 0) return detailMap;

  // YouTube allows max 50 IDs per request
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const data = await ytFetch<{ items: SnippetItem[] }>('videos', {
      part: 'contentDetails,statistics',
      id: chunk.join(','),
    });

    for (const item of data.items ?? []) {
      const id = extractVideoId(item);
      detailMap.set(id, {
        duration: item.contentDetails?.duration ?? 'PT0S',
        viewCount: item.statistics?.viewCount ?? '0',
      });
    }
  }

  return detailMap;
}

/** Merge search results with video detail data. */
export function mergeSearchResults(
  items: SnippetItem[],
  detailMap: Map<string, { duration: string; viewCount: string }>,
): YoutubeVideoResult[] {
  return items
    .map((item) => {
      const videoId = extractVideoId(item);
      const details = detailMap.get(videoId) ?? { duration: 'PT0S', viewCount: '0' };
      return {
        videoId,
        title: item.snippet?.title ?? '',
        channelTitle: item.snippet?.channelTitle ?? '',
        thumbnail: pickThumbnail(item.snippet?.thumbnails),
        duration: details.duration,
        viewCount: parseInt(details.viewCount) || 0,
        publishedAt: item.snippet?.publishedAt ?? '',
      } satisfies YoutubeVideoResult;
    });
}
