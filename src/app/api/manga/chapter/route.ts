import { NextRequest, NextResponse } from 'next/server';
import { SimpleCache } from '@/lib/mangadex';

const cache = new SimpleCache<unknown>(10 * 60 * 1000); // 10 minutes

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
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const res = await fetch(
      `https://api.mangadex.org/at-home/server/${id}`,
      {
        headers: { 'User-Agent': 'MangaReader/1.0' },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`Chapter ${id} API error ${res.status}:`, text);
      return NextResponse.json(
        { error: `MangaDex returned ${res.status}`, pages: [], pagesLowRes: [], hash: '', baseUrl: '' },
        { status: res.status }
      );
    }

    const chapter = await res.json();

    // Validate that we got actual pages
    const pages: string[] = chapter.chapter?.data || [];
    const pagesLowRes: string[] = chapter.chapter?.dataSaver || [];

    if (pages.length === 0 && pagesLowRes.length === 0) {
      return NextResponse.json({
        baseUrl: chapter.baseUrl || '',
        hash: chapter.chapter?.hash || '',
        pages: [],
        pagesLowRes: [],
        error: 'This chapter has no readable pages available',
      });
    }

    const data = {
      baseUrl: chapter.baseUrl,
      hash: chapter.chapter.hash,
      pages,
      pagesLowRes,
    };

    cache.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chapter fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter pages' },
      { status: 500 }
    );
  }
}
