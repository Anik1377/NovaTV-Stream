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

function getScanlationGroup(ch: any): string {
  const groupRel = ch.relationships?.find(
    (r: any) => r.type === 'scanlation_group'
  );
  if (!groupRel) return 'Unknown';
  return groupRel.attributes?.name || 'Unknown';
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Manga ID is required' }, { status: 400 });
  }

  const cacheKey = `detail:${id}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const [mangaRes, chaptersRes] = await Promise.all([
      fetch(
        `https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`,
        { headers: { 'User-Agent': 'MangaReader/1.0' } }
      ),
      fetch(
        `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=200&includes[]=scanlation_group`,
        { headers: { 'User-Agent': 'MangaReader/1.0' } }
      ),
    ]);

    if (!mangaRes.ok) {
      throw new Error(`MangaDex API error: ${mangaRes.status}`);
    }

    const mangaData = await mangaRes.json();
    const chaptersData = await chaptersRes.json();

    const item = mangaData.data;

    const data = {
      manga: {
        id: item.id,
        title:
          item.attributes.title.en ||
          Object.values(item.attributes.title)[0] ||
          'Untitled',
        coverUrl: getCoverUrl(item),
        author: getAuthorName(item),
        artist: getArtistName(item),
        description:
          item.attributes.description.en?.substring(0, 500) || '',
        tags: item.attributes.tags.map((t: any) => t.attributes.name.en),
        status: item.attributes.status,
        year: item.attributes.year,
        contentRating: item.attributes.contentRating,
        demographics: item.attributes.publicationDemographic || null,
        originalLanguage: item.attributes.originalLanguage,
      },
      chapters: chaptersData.data
        .map((ch: any) => ({
          id: ch.id,
          chapter: ch.attributes.chapter || '?',
          title:
            ch.attributes.title ||
            `Chapter ${ch.attributes.chapter || '?'}`,
          publishAt: ch.attributes.publishAt,
          pages: ch.attributes.pages || 0,
          group: getScanlationGroup(ch),
        }))
        .filter((ch: any) => ch.pages > 0),
    };

    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manga details' },
      { status: 500 }
    );
  }
}
