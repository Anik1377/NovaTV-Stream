import { NextRequest, NextResponse } from 'next/server';
import { ytFetch, getCached, setCache, fetchVideoDetails, mergeSearchResults } from '@/lib/youtube';
import type { YoutubeVideoResult } from '@/lib/youtube';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');
  const pageToken = searchParams.get('pageToken') ?? '';

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required query parameter' },
      { status: 400 },
    );
  }

  const cacheKey = `yt:search:${query}:${pageToken}`;
  const cached = getCached<{ results: YoutubeVideoResult[]; nextPageToken: string | null; totalResults: number }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Step 1 – search for music videos
    const searchParams: Record<string, string> = {
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: '20',
      q: query.trim(),
    };
    if (pageToken) searchParams.pageToken = pageToken;

    const searchData = await ytFetch<{
      items: Array<{
        id: { videoId?: string } | string;
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: {
            medium?: { url?: string };
            high?: { url?: string };
            default?: { url?: string };
          };
          publishedAt: string;
        };
      }>;
      nextPageToken?: string;
      totalResults: number;
    }>('search', searchParams);

    // Step 2 – get duration & viewCount for each video
    const videoIds = searchData.items
      .map((item) => (typeof item.id === 'object' ? item.id.videoId : item.id))
      .filter(Boolean) as string[];

    const detailMap = await fetchVideoDetails(videoIds);
    const results = mergeSearchResults(searchData.items, detailMap);

    const response = {
      results,
      nextPageToken: searchData.nextPageToken ?? null,
      totalResults: searchData.totalResults ?? 0,
    };

    setCache(cacheKey, response, CACHE_TTL);
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to search YouTube' },
      { status: 500 },
    );
  }
}
