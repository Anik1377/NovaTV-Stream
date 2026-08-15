import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { ytFetch, fetchVideoDetails, mergeSearchResults, type SnippetItem } from '@/lib/youtube';

// ── Types ──
interface BuzzResponse {
  analysis: string;
  sources: { title: string; url: string; snippet: string; host_name: string }[];
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

    // Initialize SDK
    const zai = await ZAI.create();

    // ── Web search ──
    let searchResults: { title: string; url: string; snippet: string; host_name: string }[] = [];
    try {
      const results = await zai.functions.invoke('web_search', {
        query: `${title} movie 2025 2026 trailer reaction hype review`,
        num: 8,
      });
      searchResults = results.map((r) => ({
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        host_name: r.host_name,
      }));
    } catch {
      // search may fail, continue with empty
    }

    // ── LLM analysis ──
    let analysis = `The buzz is building for "${title}"! Fans are eagerly discussing trailers and early reactions across social media. Stay tuned for more updates as the release date approaches.`;
    if (searchResults.length > 0) {
      try {
        const contextStr = searchResults
          .slice(0, 8)
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.host_name}`)
          .join('\n\n');

        const response = await zai.chat.completions.create({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: `You are a movie hype analyst. Based on these web search results about the upcoming movie '${title}', write a brief, exciting analysis of the internet buzz and hype (3-4 sentences). Mention specific reactions, fan theories, or trending topics if found. Be engaging and conversational.`,
            },
            {
              role: 'user',
              content: `Here are the search results:\n\n${contextStr}`,
            },
          ],
        });

        const content = response?.choices?.[0]?.message?.content;
        if (content && content.length > 20) {
          analysis = content;
        }
      } catch {
        // LLM may fail, use fallback
      }
    }

    // ── YouTube search ──
    let youtubeBuzz: BuzzResponse['youtubeBuzz'] = [];
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

      if (videoIds.length > 0) {
        const detailMap = await fetchVideoDetails(videoIds);
        const merged = mergeSearchResults(items, detailMap);
        youtubeBuzz = merged.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnail: v.thumbnail,
          viewCount: v.viewCount,
        }));
      }
    } catch {
      // YouTube may fail
    }

    const result: BuzzResponse = { analysis, sources: searchResults, youtubeBuzz };
    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Buzz API error:', error);
    return NextResponse.json({ error: 'Failed to fetch buzz' }, { status: 500 });
  }
}
