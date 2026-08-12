import { NextResponse } from 'next/server';
import { ytFetch, getCached, setCache } from '@/lib/youtube';
import type { YoutubeVideoResult, SnippetItem } from '@/lib/youtube';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  const cacheKey = 'yt:trending:music:us';
  const cached = getCached<{
    results: YoutubeVideoResult[];
    nextPageToken: string | null;
    totalResults: number;
  }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const data = await ytFetch<{
      items: SnippetItem[];
      nextPageToken?: string;
      pageInfo?: { totalResults?: number };
    }>('videos', {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      videoCategoryId: '10',
      maxResults: '20',
      regionCode: 'US',
    });

    const results: YoutubeVideoResult[] = (data.items ?? []).map((item) => {
      const videoId =
        typeof item.id === 'object' && 'videoId' in item.id
          ? item.id.videoId
          : String(item.id);

      // Pick best thumbnail
      const thumbs = item.snippet?.thumbnails;
      const thumbnail =
        thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url || '';

      return {
        videoId,
        title: item.snippet?.title ?? '',
        channelTitle: item.snippet?.channelTitle ?? '',
        thumbnail,
        duration: item.contentDetails?.duration ?? 'PT0S',
        viewCount: parseInt(item.statistics?.viewCount ?? '0') || 0,
        publishedAt: item.snippet?.publishedAt ?? '',
      } satisfies YoutubeVideoResult;
    });

    const response = {
      results,
      nextPageToken: data.nextPageToken ?? null,
      totalResults: data.pageInfo?.totalResults ?? 0,
    };

    setCache(cacheKey, response, CACHE_TTL);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch trending music', details: message },
      { status: 500 },
    );
  }
}
