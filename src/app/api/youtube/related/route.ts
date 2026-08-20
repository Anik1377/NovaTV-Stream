import { NextRequest, NextResponse } from 'next/server';
import { ytFetch, getCached, setCache, fetchVideoDetails, mergeSearchResults } from '@/lib/youtube';
import type { YoutubeVideoResult, SnippetItem } from '@/lib/youtube';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing required videoId parameter' },
      { status: 400 },
    );
  }

  const cacheKey = `yt:related:${videoId}`;
  const cached = getCached<{
    results: YoutubeVideoResult[];
    nextPageToken: string | null;
    totalResults: number;
  }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // The `relatedToVideoId` parameter on search.list has been deprecated by YouTube.
    // Workaround: fetch the source video's title, then search for similar music content.
    const videoData = await ytFetch<{
      items: Array<{
        id: string;
        snippet: {
          title?: string;
          channelTitle?: string;
          tags?: string[];
        };
      }>;
    }>('videos', {
      part: 'snippet',
      id: videoId,
    });

    if (!videoData.items || videoData.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 },
      );
    }

    const source = videoData.items[0];
    // Build a search query from the video title and tags
    const title = source.snippet.title ?? '';
    const tags = source.snippet.tags ?? [];
    const searchQuery = tags.length > 0
      ? `${title} ${tags.slice(0, 3).join(' ')}`
      : title;

    // Search for related music videos using the constructed query
    const searchData = await ytFetch<{
      items: SnippetItem[];
      nextPageToken?: string;
      totalResults: number;
    }>('search', {
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      q: searchQuery,
      maxResults: '15',
    });

    // Filter out the original video from results
    const filteredItems = (searchData.items ?? []).filter((item) => {
      const id = typeof item.id === 'object' && 'videoId' in item.id
        ? item.id.videoId
        : String(item.id);
      return id !== videoId;
    });

    // Get duration & viewCount for the remaining videos
    const videoIds = filteredItems
      .map((item) => {
        if (typeof item.id === 'object' && 'videoId' in item.id) return item.id.videoId;
        return String(item.id);
      })
      .filter(Boolean) as string[];

    const detailMap = await fetchVideoDetails(videoIds);
    const results = mergeSearchResults(filteredItems, detailMap);

    const response = {
      results,
      nextPageToken: searchData.nextPageToken ?? null,
      totalResults: searchData.totalResults ?? 0,
    };

    setCache(cacheKey, response, CACHE_TTL);
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch related videos' },
      { status: 500 },
    );
  }
}
