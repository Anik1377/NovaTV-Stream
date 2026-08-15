import { NextRequest, NextResponse } from 'next/server';
import {
  getCoverUrl,
  getAuthorName,
  getArtistName,
  getTitle,
  getScanlationGroup,
  SimpleCache,
} from '@/lib/mangadex';

const cache = new SimpleCache<unknown>(5 * 60 * 1000);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Manga ID is required' }, { status: 400 });
  }

  const cacheKey = `detail:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Build manga detail URL
    const mangaUrl = new URL(`https://api.mangadex.org/manga/${id}`);
    mangaUrl.searchParams.append('includes[]', 'cover_art');
    mangaUrl.searchParams.append('includes[]', 'author');
    mangaUrl.searchParams.append('includes[]', 'artist');

    // Build chapters feed URL — exclude external-only chapters
    const chaptersUrl = new URL(`https://api.mangadex.org/manga/${id}/feed`);
    chaptersUrl.searchParams.append('translatedLanguage[]', 'en');
    chaptersUrl.searchParams.append('order[chapter]', 'desc');
    chaptersUrl.searchParams.set('limit', '200');
    chaptersUrl.searchParams.append('includes[]', 'scanlation_group');
    chaptersUrl.searchParams.set('includeExternalUrl', '0');

    const [mangaRes, chaptersRes] = await Promise.all([
      fetch(mangaUrl.toString(), {
        headers: { 'User-Agent': 'MangaReader/1.0' },
      }),
      fetch(chaptersUrl.toString(), {
        headers: { 'User-Agent': 'MangaReader/1.0' },
      }),
    ]);

    if (!mangaRes.ok) {
      throw new Error(`MangaDex API error: ${mangaRes.status}`);
    }

    const mangaData = await mangaRes.json();
    const chaptersData = chaptersRes.ok ? await chaptersRes.json() : { data: [] };

    const item = mangaData.data;

    const data = {
      manga: {
        id: item.id,
        title: getTitle(item),
        coverUrl: getCoverUrl(item),
        author: getAuthorName(item),
        artist: getArtistName(item),
        description:
          item.attributes.description.en?.substring(0, 500) ||
          item.attributes.description.ja?.substring(0, 500) ||
          '',
        tags: item.attributes.tags
          .map((t: any) => t.attributes.name.en)
          .filter(Boolean),
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

    cache.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manga details' },
      { status: 500 }
    );
  }
}
