import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ComicItem {
  id: number;
  title: string;
  publisher: string;
  year: number;
  description: string;
  genres: string[];
  slug: string;
  coverColor: string;
  rating: number;
  status: string;
  issueCount: number;
}

let comicsCache: ComicItem[] | null = null;

function loadComics(): ComicItem[] {
  if (comicsCache) return comicsCache;
  const filePath = path.join(process.cwd(), 'public', 'comics-data.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  comicsCache = JSON.parse(raw) as ComicItem[];
  return comicsCache;
}

function getAllPublishers(comics: ComicItem[]): string[] {
  const set = new Set(comics.map(c => c.publisher));
  return Array.from(set).sort();
}

function getAllGenres(comics: ComicItem[]): string[] {
  const set = new Set<string>();
  comics.forEach(c => c.genres.forEach(g => set.add(g)));
  return Array.from(set).sort();
}

export async function GET(req: NextRequest) {
  try {
    const comics = loadComics();
    const publisher = req.nextUrl.searchParams.get('publisher') || '';
    const genre = req.nextUrl.searchParams.get('genre') || '';
    const q = req.nextUrl.searchParams.get('q') || '';
    const sort = req.nextUrl.searchParams.get('sort') || 'popular';

    let results = [...comics];

    if (publisher && publisher !== 'All') {
      results = results.filter(c => c.publisher === publisher);
    }

    if (genre && genre !== 'All') {
      results = results.filter(c => c.genres.includes(genre));
    }

    if (q.trim()) {
      const query = q.trim().toLowerCase();
      results = results.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    switch (sort) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'year-new':
        results.sort((a, b) => b.year - a.year);
        break;
      case 'year-old':
        results.sort((a, b) => a.year - b.year);
        break;
      case 'popular':
      default:
        results.sort((a, b) => b.issueCount * b.rating - a.issueCount * a.rating);
        break;
    }

    return NextResponse.json({
      results,
      total: results.length,
      publishers: getAllPublishers(comics),
      genres: getAllGenres(comics),
    });
  } catch (error) {
    console.error('Comics trending fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comics' },
      { status: 500 }
    );
  }
}
