import { NextRequest, NextResponse } from 'next/server';
import {
  getCoverUrl,
  getAuthorName,
  getTitle,
  SimpleCache,
} from '@/lib/mangadex';

const cache = new SimpleCache<unknown>(5 * 60 * 1000); // 5 minutes

const COMICS_LANGUAGES = ['ko', 'zh', 'en'];

export async function GET(req: NextRequest) {
  const offset = req.nextUrl.searchParams.get('offset') || '0';

  const cacheKey = `comics:trending:${offset}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = new URL('https://api.mangadex.org/manga');
  for (const lang of COMICS_LANGUAGES) {
    url.searchParams.append('originalLanguage[]', lang);
  }
  url.searchParams.append('includes[]', 'cover_art');
  url.searchParams.append('includes[]', 'author');
  url.searchParams.set('order[followedCount]', 'desc');
  url.searchParams.append('contentRating[]', 'safe');
  url.searchParams.append('contentRating[]', 'suggestive');
  url.searchParams.set('hasAvailableChapters', 'true');
  url.searchParams.append('availableTranslatedLanguage[]', 'en');
  url.searchParams.set('limit', '20');
  url.searchParams.set('offset', offset);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MangaReader/1.0' },
    });

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    const manga = await res.json();

    const data = {
      results: manga.data.map((item: any) => ({
        id: item.id,
        title: getTitle(item),
        coverUrl: getCoverUrl(item),
        author: getAuthorName(item),
        tags: item.attributes.tags
          .map((t: any) => t.attributes.name.en)
          .filter(Boolean)
          .slice(0, 5),
        status: item.attributes.status,
        year: item.attributes.year,
        originalLanguage: item.attributes.originalLanguage,
      })),
      total: manga.total,
      hasMore: Number(offset) + (manga.data?.length || 0) < manga.total,
    };

    cache.set(cacheKey, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Comics trending fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending comics' },
      { status: 500 }
    );
  }
}
