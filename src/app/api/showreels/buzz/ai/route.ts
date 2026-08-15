import { NextRequest, NextResponse } from 'next/server';

// ── Cached ZAI instance (shared singleton) ──
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;
let zaiInitPromise: Promise<Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>> | null = null;

async function getZAI() {
  if (zaiInstance) return zaiInstance;
  if (!zaiInitPromise) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInitPromise = ZAI.create();
    zaiInitPromise.then((instance) => { zaiInstance = instance; }).catch(() => { zaiInitPromise = null; });
  }
  return zaiInitPromise;
}

// ── In-memory cache (30 min TTL) ──
const cache = new Map<string, { data: string; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const title = req.nextUrl.searchParams.get('title');

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing id or title' }, { status: 400 });
    }

    const cacheKey = `buzz:ai:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json({ analysis: cached.data });
    }

    const zai = await getZAI();

    // Quick web search to get context for LLM
    let searchContext = '';
    try {
      const results = await zai.functions.invoke('web_search', {
        query: `${title} movie 2025 2026 trailer reaction hype`,
        num: 5,
      });
      searchContext = results
        .slice(0, 5)
        .map((r: { title: string; snippet: string; host_name: string }, i: number) =>
          `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.host_name}`
        )
        .join('\n\n');
    } catch {
      // continue without context
    }

    // LLM analysis
    let analysis = `The buzz is building for "${title}"! Fans are eagerly discussing trailers and early reactions across social media.`;
    if (searchContext) {
      try {
        const response = await zai.chat.completions.create({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: `You are a movie hype analyst. Based on these web search results about the upcoming movie '${title}', write a brief, exciting analysis of the internet buzz and hype (2-3 sentences). Mention specific reactions or trending topics if found. Be engaging and concise.`,
            },
            {
              role: 'user',
              content: `Here are the search results:\n\n${searchContext}`,
            },
          ],
        });

        const content = response?.choices?.[0]?.message?.content;
        if (content && content.length > 20) {
          analysis = content;
        }
      } catch {
        // use fallback
      }
    }

    cache.set(cacheKey, { data: analysis, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Buzz AI error:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
