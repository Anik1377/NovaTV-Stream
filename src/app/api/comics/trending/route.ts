import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/* ── readcomicsonline.lol slug mapping ── */
const READ_SLUG_MAP: Record<string, string> = {
  'amazing-spider-man': 'The-Amazing-Spider-Man-2025',
  'batman-2016': 'Batman-2025',
  'x-men-2019': 'Uncanny-X-Men-2024',
  'superman-2016': 'Superman-2023',
  'wonder-woman-2016': 'wonder-woman-2023',
  'the-flash-2016': 'The-Flash-2023',
  'iron-man-2019': 'Iron-Man-2026',
  'captain-america-2018': 'Captain-America-2025',
  'the-walking-dead': 'the-walking-dead-deluxe-2020',
  'invincible': 'Invincible',
  'green-lantern-2016': 'Green-Lantern-2023',
  'daredevil-2019': 'Daredevil-2026',
  'nightwing-2016': 'Nightwing-2016',
  'the-boys': 'The-Boys',
  'venom-2018': 'Venom-2025',
  'fantastic-four-2018': 'Fantastic-Four-2025',
  'green-arrow-2016': 'Absolute-Green-Arrow',
  'catwoman-2016': 'catwoman-2018',
  'immortal-hulk-2018': 'The-Infernal-Hulk',
  'star-wars-2015': 'star-wars-galaxys-edge-echoes-of-the-empire-2026',
  'batman-year-one': 'dc-finest-batman-year-one-two',
  'supergirl-2016': 'Supergirl-Survive',
  'alien-2021': 'alien-king-killer-2026',
  'spectacular-spider-man-brand-new-day': 'Spectacular-Spider-Man-Brand-New-Day',
  'ultimate-spider-man-2024': 'Ultimate-Spider-Man-2024',
  'x-men-2024': 'X-Men-2024',
  'the-amazing-spider-man-2018': 'The-Amazing-Spider-Man-2018',
  'avengers-2018': 'Avengers-Armageddon',
  'hulk': 'The-Infernal-Hulk',
};

const COVER_CDN = 'https://cdn.readcomicsonline.lol/covers';

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
  readSlug?: string;
  coverUrl?: string;
  readAvailable?: boolean;
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

    const enriched = results.map((comic) => {
      const readSlug = READ_SLUG_MAP[comic.slug];
      if (readSlug) {
        return {
          ...comic,
          readSlug,
          coverUrl: `${COVER_CDN}/${readSlug}/1.webp`,
          readAvailable: true,
        };
      }
      return comic;
    });

    return NextResponse.json({
      results: enriched,
      total: enriched.length,
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
