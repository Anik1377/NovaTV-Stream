import { NextRequest, NextResponse } from 'next/server';
import { ytFetch, fetchVideoDetails, mergeSearchResults, type SnippetItem } from '@/lib/youtube';

// ── Types ──
interface BuzzResponse {
  youtubeBuzz: { videoId: string; title: string; channelTitle: string; thumbnail: string; viewCount: number }[];
}

// ── In-memory cache (30 min TTL) ──
const cache = new Map<string, { data: BuzzResponse; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const title = req.nextUrl.searchParams.get('title');

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing id or title' }, { status: 400 });
    }

    const cacheKey = `buzz:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    // YouTube search + details
    const youtubeBuzz = await (async () => {
      try {
        const ytData = await ytFetch<{ items: SnippetItem[] }>('search', {
          part: 'snippet',
          q: `${title} movie trailer`,
          type: 'video',
          maxResults: '6',
          order: 'relevance',
        });

        const items = ytData.items || [];
        const videoIds = items.map((item) => {
          if (typeof item.id === 'object' && item.id.videoId) return item.id.videoId;
          return '';
        }).filter(Boolean);

        if (videoIds.length === 0) return [];

        const detailMap = await fetchVideoDetails(videoIds);
        const merged = mergeSearchResults(items, detailMap);
        return merged.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnail: v.thumbnail,
          viewCount: v.viewCount,
        }));
      } catch {
        return [];
      }
    })();

    const result: BuzzResponse = { youtubeBuzz };
    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Buzz API error:', error);
    return NextResponse.json({ error: 'Failed to fetch buzz' }, { status: 500 });
  }
}
