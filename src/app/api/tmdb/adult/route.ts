import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BASE = 'https://www.xvideos.com';
const EMBED = 'https://www.xvideos.com/embedframe/';

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 3 * 60 * 1000;

export const dynamic = 'force-dynamic';

interface VideoItem {
  id: number;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploader: string;
  hd: boolean;
  embedUrl: string;
}

const DEFAULT_CATEGORIES = [
  { name: 'Amateur', slug: 'amateur-20' },
  { name: 'Anal', slug: 'anal' },
  { name: 'Asian', slug: 'asian_woman-39' },
  { name: 'Babe', slug: 'babe-41' },
  { name: 'BDSM', slug: 'bdsm-34' },
  { name: 'Big Ass', slug: 'big_ass-12' },
  { name: 'Big Tits', slug: 'big_tits-11' },
  { name: 'Blonde', slug: 'blonde-14' },
  { name: 'Blowjob', slug: 'blowjob-15' },
  { name: 'Brunette', slug: 'brunette-25' },
  { name: 'Creampie', slug: 'creampie-32' },
  { name: 'Cumshot', slug: 'cumshot-16' },
  { name: 'Gangbang', slug: 'gangbang-33' },
  { name: 'Hardcore', slug: 'hardcore-13' },
  { name: 'Interracial', slug: 'interracial-28' },
  { name: 'Latina', slug: 'latina-17' },
  { name: 'Lesbian', slug: 'lesbian-26' },
  { name: 'Masturbation', slug: 'masturbation-18' },
  { name: 'MILF', slug: 'milf-29' },
  { name: 'POV', slug: 'pov-30' },
  { name: 'Redhead', slug: 'redhead-31' },
  { name: 'Solo', slug: 'solo-27' },
  { name: 'Squirt', slug: 'squirt-43' },
  { name: 'Teen', slug: 'teen-19' },
  { name: 'Threesome', slug: 'threesome-35' },
  { name: 'Vintage', slug: 'vintage-42' },
];

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Fetch ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseVideos(html: string): VideoItem[] {
  const $ = cheerio.load(html);
  const videos: VideoItem[] = [];

  $('div[id^="video_"]').each((_i, el) => {
    const $el = $(el);
    const dataId = $el.attr('data-id');
    if (!dataId) return;

    const thumb = $el.find('img');
    const titleLink = $el.find('p.title a');
    const title = titleLink.attr('title') || titleLink.text().trim();
    const duration = $el.find('span.duration').first().text().trim();
    const nameSpan = $el.find('span.name');
    const uploader = nameSpan.text().trim();
    const metadataText = $el.find('p.metadata').text();
    const viewsMatch = metadataText.match(/([\d.]+[kKmMbB]?)\s*Views/);
    const views = viewsMatch ? viewsMatch[1] + ' views' : '';
    const hd = $el.find('.video-hd-mark').length > 0;

    const thumbSrc = thumb.attr('data-src') || thumb.attr('src') || '';
    const thumbnail = thumbSrc.replace(/_t\.jpg$/, '.jpg').replace(/\/xv_\d+_t\./, '/xv_1.');

    videos.push({
      id: parseInt(dataId),
      title: title.replace(/\s*<span[^>]*>[^<]*<\/span>\s*$/, '').trim(),
      thumbnail,
      duration: duration.replace(/\s+/g, ' ').trim(),
      views,
      uploader,
      hd,
      embedUrl: `${EMBED}${dataId}`,
    });
  });

  return videos;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type') || 'trending';
    const q = sp.get('q') || '';
    const p = sp.get('p') || '0';
    const category = sp.get('category') || '';
    const page = parseInt(p) || 0;

    const cacheKey = `adult:${type}:${q}:${category}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    let url = '';
    if (type === 'search' && q) {
      url = `${BASE}/?k=${encodeURIComponent(q)}&p=${page}`;
    } else if (type === 'category' && category) {
      url = `${BASE}/c/${category}-${page}`;
    } else {
      url = page === 0 ? BASE : `${BASE}/?p=${page}`;
    }

    const html = await fetchPage(url);
    const videos = parseVideos(html);

    cache.set(cacheKey, { data: videos, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json(videos);
  } catch (err: any) {
    console.error('Adult API error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

export async function CATEGORIES() {
  return NextResponse.json(DEFAULT_CATEGORIES);
}
