import { NextRequest, NextResponse } from 'next/server';
import { geminiGenerate, geminiChat, isGeminiConfigured } from '@/lib/gemini';

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

    let analysis: string;

    if (isGeminiConfigured()) {
      try {
        // Use Gemini with Google Search grounding for rich, up-to-date analysis
        const result = await geminiGenerate(
          `What is the internet buzz and hype around the movie "${title}"? Mention specific reactions, trending topics, fan expectations, and early reviews if available. Be engaging and concise (2-3 sentences).`,
          {
            systemInstruction: 'You are a movie hype analyst. Write brief, exciting analyses of internet buzz around upcoming movies. Be engaging and concise.',
            useSearch: true,
          },
        );
        analysis = result.text || `The buzz is building for "${title}"! Fans are eagerly discussing trailers and early reactions across social media.`;
      } catch (err) {
        console.error('Gemini AI error:', err);
        analysis = `The buzz is building for "${title}"! Fans are eagerly discussing trailers and early reactions across social media.`;
      }
    } else {
      // Fallback when no API key is configured
      analysis = `The buzz is building for "${title}"! Fans are eagerly discussing trailers and early reactions across social media. Set GEMINI_API_KEY for AI-powered analysis.`;
    }

    cache.set(cacheKey, { data: analysis, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Buzz AI error:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
