import { NextRequest, NextResponse } from 'next/server';
import { ytFetch, fetchVideoDetails, mergeSearchResults, type SnippetItem } from '@/lib/youtube';
import { geminiGenerate, isGeminiConfigured, type GeminiSource } from '@/lib/gemini';

// ── Types ──
interface BuzzResponse {
  analysis: string | null; // null = not yet generated (client should fetch /ai separately)
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

    // ── Run web search (Gemini grounding) + YouTube in PARALLEL ──
    const [searchResults, youtubeBuzz] = await Promise.all([
      // Web search via Gemini with Google Search grounding
      (async () => {
        try {
          if (!isGeminiConfigured()) return [] as GeminiSource[];

          const result = await geminiGenerate(
            `Find the latest news, reviews, reactions, and hype about the movie "${title}". What are people saying about it online?`,
            { useSearch: true },
          );

          // If grounding returned sources, use those
          if (result.sources.length > 0) {
            // Enrich sources with snippets from the generated text
            return result.sources.map((s) => ({
              ...s,
              snippet: '', // Grounding doesn't always include snippets
            }));
          }

          // Otherwise return empty — YouTube data is the primary source
          return [] as GeminiSource[];
        } catch {
          return [] as GeminiSource[];
        }
      })(),

      // YouTube search + details (no external AI needed)
      (async () => {
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
      })(),
    ]);

    // Return immediately without LLM analysis — client fetches /ai separately
    const result: BuzzResponse = {
      analysis: null, // signals client to fetch /ai endpoint
      sources: searchResults,
      youtubeBuzz,
    };
    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Buzz API error:', error);
    return NextResponse.json({ error: 'Failed to fetch buzz' }, { status: 500 });
  }
}
