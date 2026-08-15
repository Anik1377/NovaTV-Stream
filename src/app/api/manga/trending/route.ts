import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCoverUrl(item: any): string {
  const coverRel = item.relationships?.find(
    (r: any) => r.type === 'cover_art'
  );
  if (!coverRel) return '';
  return `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.512.jpg`;
}

function getAuthorName(item: any): string {
  const authorRel = item.relationships?.find(
    (r: any) => r.type === 'author'
  );
  if (!authorRel) return 'Unknown';
  const name = authorRel.attributes?.name;
  return name?.en || Object.values(name || {})[0] || 'Unknown';
}

function getArtistName(item: any): string {
  const artistRel = item.relationships?.find(
    (r: any) => r.type === 'artist'
  );
  if (!artistRel) return 'Unknown';
  const name = artistRel.attributes?.name;
  return name?.en || Object.values(name || {})[0] || 'Unknown';
}

export async function GET(req: NextRequest) {
  const offset = req.nextUrl.searchParams.get('offset') || '0';
  const type = req.nextUrl.searchParams.get('type');

  const langMap: Record<string, string> = {
    manga: 'ja',
    manhwa: 'ko',
    manhua: 'zh',
  };

  const langFilter =
    type && langMap[type] ? `&originalLanguage[]=${langMap[type]}` : '';

  const cacheKey = `trending:${offset}:${type || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://api.mangadex.org/manga?includes[]=cover_art&includes[]=author&includes[]=artist&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true&limit=20&offset=${offset}${langFilter}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MangaReader/1.0' },
    });

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    const manga = await res.json();

    const data = {
      results: manga.data.map((item: any) => ({
        id: item.id,
        title:
          item.attributes.title.en ||
          Object.values(item.attributes.title)[0] ||
          'Untitled',
        coverUrl: getCoverUrl(item),
        author: getAuthorName(item),
        artist: getArtistName(item),
        description:
          item.attributes.description.en?.substring(0, 300) || '',
        tags: item.attributes.tags
          .map((t: any) => t.attributes.name.en)
          .slice(0, 5),
        status: item.attributes.status,
        year: item.attributes.year,
        contentRating: item.attributes.contentRating,
        originalLanguage: item.attributes.originalLanguage,
      })),
      total: manga.total,
    };

    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Trending fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending manga' },
      { status: 500 }
    );
  }
}
