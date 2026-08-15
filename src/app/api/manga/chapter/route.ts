import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; expiry: number }>();

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Chapter ID is required' },
      { status: 400 }
    );
  }

  const cacheKey = `chapter:${id}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(
      `https://api.mangadex.org/at-home/server/${id}`,
      {
        headers: { 'User-Agent': 'MangaReader/1.0' },
      }
    );

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    const chapter = await res.json();

    const data = {
      baseUrl: chapter.baseUrl,
      hash: chapter.chapter.hash,
      pages: chapter.chapter.data,
      pagesLowRes: chapter.chapter.dataSaver,
    };

    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chapter fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter pages' },
      { status: 500 }
    );
  }
}
