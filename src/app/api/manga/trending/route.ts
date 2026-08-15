import { NextRequest, NextResponse } from 'next/server';
import {
  getCoverUrl,
  getAuthorName,
  getArtistName,
  getTitle,
  SimpleCache,
} from '@/lib/mangadex';

const cache = new SimpleCache<unknown>(5 * 60 * 1000); // 5 minutes

const LANG_MAP: Record<string, string> = {
  manga: 'ja',
  manhwa: 'ko',
  manhua: 'zh',
};

export async function GET(req: NextRequest) {
  const offset = req.nextUrl.searchParams.get('offset') || '0';
  const type = req.nextUrl.searchParams.get('type');

  const cacheKey = `trending:${offset}:${type || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Build URL with multiple same-key params using append
  const url = new URL('https://api.mangadex.org/manga');
  url.searchParams.append('includes[]', 'cover_art');
  url.searchParams.append('includes[]', 'author');
  url.searchParams.append('includes[]', 'artist');
  url.searchParams.set('order[latestUploadedChapter]', 'desc');
  url.searchParams.append('contentRating[]', 'safe');
  url.searchParams.append('contentRating[]', 'suggestive');
  url.searchParams.set('hasAvailableChapters', 'true');
  url.searchParams.append('availableTranslatedLanguage[]', 'en');
  url.searchParams.set('limit', '20');
  url.searchParams.set('offset', offset);

  if (type && LANG_MAP[type]) {
    url.searchParams.set('originalLanguage[]', LANG_MAP[type]);
  }

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
        artist: getArtistName(item),
        description:
          item.attributes.description.en?.substring(0, 300) ||
          item.attributes.description.ja?.substring(0, 300) ||
          '',
        tags: item.attributes.tags
          .map((t: any) => t.attributes.name.en)
          .filter(Boolean)
          .slice(0, 5),
        status: item.attributes.status,
        year: item.attributes.year,
        contentRating: item.attributes.contentRating,
        originalLanguage: item.attributes.originalLanguage,
      })),
      total: manga.total,
      hasMore: Number(offset) + (manga.data?.length || 0) < manga.total,
    };

    cache.set(cacheKey, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Trending fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending manga' },
      { status: 500 }
    );
  }
}
