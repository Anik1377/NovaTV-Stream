import { NextRequest, NextResponse } from 'next/server';
import { ytFetch, getCached, setCache } from '@/lib/youtube';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface PlaylistResult {
  playlistId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  videoCount: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required query parameter' },
      { status: 400 },
    );
  }

  const cacheKey = `yt:playlists:${query.trim()}`;
  const cached = getCached<{ results: PlaylistResult[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Step 1 – search for music playlists
    const searchData = await ytFetch<{
      items: Array<{
        id: { playlistId?: string } | string;
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: {
            medium?: { url?: string };
            high?: { url?: string };
            default?: { url?: string };
          };
        };
      }>;
    }>('search', {
      part: 'snippet',
      type: 'playlist',
      q: `${query.trim()} music playlist`,
      maxResults: '10',
    });

    if (!searchData.items || searchData.items.length === 0) {
      const empty = { results: [] };
      setCache(cacheKey, empty, CACHE_TTL);
      return NextResponse.json(empty);
    }

    // Step 2 – extract playlist IDs and fetch video counts
    const playlistIds = searchData.items
      .map((item) =>
        typeof item.id === 'object' && 'playlistId' in item.id
          ? item.id.playlistId
          : null,
      )
      .filter(Boolean) as string[];

    // Fetch playlist details (itemCount) in one call
    const countMap = new Map<string, number>();
    if (playlistIds.length > 0) {
      // YouTube allows max 50 IDs per request
      const chunks: string[][] = [];
      for (let i = 0; i < playlistIds.length; i += 50) {
        chunks.push(playlistIds.slice(i, i + 50));
      }

      for (const chunk of chunks) {
        const playlistData = await ytFetch<{
          items: Array<{
            id: string;
            contentDetails?: { itemCount?: number };
          }>;
        }>('playlists', {
          part: 'contentDetails',
          id: chunk.join(','),
        });

        for (const pl of playlistData.items ?? []) {
          countMap.set(pl.id, pl.contentDetails?.itemCount ?? 0);
        }
      }
    }

    // Step 3 – build response
    const results: PlaylistResult[] = searchData.items.map((item) => {
      const playlistId =
        typeof item.id === 'object' && 'playlistId' in item.id
          ? item.id.playlistId ?? ''
          : String(item.id);

      const thumbs = item.snippet.thumbnails;
      const thumbnail =
        thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url || '';

      return {
        playlistId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail,
        videoCount: countMap.get(playlistId) ?? 0,
      };
    });

    const response = { results };
    setCache(cacheKey, response, CACHE_TTL);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to search playlists', details: message },
      { status: 500 },
    );
  }
}
