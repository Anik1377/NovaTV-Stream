import { NextRequest, NextResponse } from 'next/server';
import { parseM3U, filterHlsChannels } from '@/lib/m3u-parser';
import { mapGroupToCategory, deduplicateChannels } from '@/lib/live-tv-channels';
import type { LiveChannel } from '@/lib/live-tv-channels';

// Cache the fetched channels
let cachedChannels: LiveChannel[] | null = null;
let cachedExpiry = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// iptv-org M3U playlist URLs with inferred country/language
const PLAYLISTS: Array<{ url: string; country: string; languages: string[] }> = [
  // Indian channels (main focus for Hindi/English)
  { url: 'https://iptv-org.github.io/iptv/countries/in.m3u', country: 'IN', languages: ['Hindi', 'English', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi'] },
  // English-language channels worldwide
  { url: 'https://iptv-org.github.io/iptv/languages/eng.m3u', country: '', languages: ['English'] },
  // Hindi-language channels
  { url: 'https://iptv-org.github.io/iptv/languages/hin.m3u', country: 'IN', languages: ['Hindi'] },
];

// Known working stream hosts to prioritize
const PREFERRED_HOSTS = [
  'cloudfront.net',
  'akamaized.net',
  'fastly',
  'akamai',
];

// Blacklisted group names to skip
const SKIP_GROUPS = [
  'xxx', 'adult', 'porno', 'gambling', 'casino',
  'test', 'test channels', 'radio', 'radio stations',
];

// Clean channel names from quality/resolution tags
function cleanName(name: string): string {
  return name
    .replace(/\s*\(\d+p\)\s*/gi, ' ')
    .replace(/\s*\((?:4K|HD|SD|UHD|FHD|QHD)\)\s*/gi, ' ')
    .replace(/\s*\[(?:Geo-blocked|Offline|Not 24\/7)\]\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateId(name: string, url: string): string {
  const str = (name + url).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '200', 10);

  // Return cached channels if still valid
  if (cachedChannels && cachedExpiry > Date.now()) {
    const filtered = filterChannels(cachedChannels, { category, search });
    const paginated = filtered.slice(offset, offset + limit);
    return NextResponse.json({ channels: paginated, total: filtered.length, allTotal: cachedChannels.length });
  }

  try {
    // Fetch all playlists in parallel
    const results = await Promise.allSettled(
      PLAYLISTS.map(async (playlist) => {
        const res = await fetch(playlist.url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/plain,application/octet-stream',
          },
        });
        if (!res.ok) return [];
        const text = await res.text();
        const channels = filterHlsChannels(parseM3U(text));
        // Attach inferred country/language from the playlist source
        return channels.map(ch => ({
          ...ch,
          country: ch.country || playlist.country,
          language: ch.language || (playlist.languages.length === 1 ? playlist.languages[0] : ch.language),
        }));
      })
    );

    // Merge all channels from successful fetches
    const allRaw: Array<{ name: string; url: string; group: string; tvgLogo: string; country: string; language: string }> = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allRaw.push(...result.value);
      }
    }

    // Convert to LiveChannel format
    let channels: LiveChannel[] = allRaw.map(ch => ({
      id: generateId(ch.name, ch.url),
      name: cleanName(ch.name),
      url: ch.url,
      group: mapGroupToCategory(ch.group),
      tvgLogo: ch.tvgLogo || '',
      country: (ch.country || '').toUpperCase(),
      language: ch.language || '',
    }));

    // Filter out blacklisted groups and empty names
    const skipLower = SKIP_GROUPS.map(g => g.toLowerCase());
    channels = channels.filter(ch => {
      const groupLower = ch.group.toLowerCase();
      const nameLower = ch.name.toLowerCase();
      return !skipLower.some(sg => groupLower.includes(sg) || nameLower.includes(sg));
    });

    // Sort: prioritize preferred hosts, then Indian channels, then English/Hindi
    channels.sort((a, b) => {
      // Preferred CDN hosts first (more reliable)
      const aPref = PREFERRED_HOSTS.some(h => a.url.includes(h)) ? 0 : 1;
      const bPref = PREFERRED_HOSTS.some(h => b.url.includes(h)) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;

      // IN country first
      const aIn = a.country === 'IN' ? 0 : 1;
      const bIn = b.country === 'IN' ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;

      // English/Hindi language priority
      const aLang = ['English', 'Hindi'].includes(a.language) ? 0 : 1;
      const bLang = ['English', 'Hindi'].includes(b.language) ? 0 : 1;
      if (aLang !== bLang) return aLang - bLang;

      // Alphabetical
      return a.name.localeCompare(b.name);
    });

    // Deduplicate (keeps first occurrence = highest priority)
    channels = deduplicateChannels(channels);

    // Cache
    cachedChannels = channels;
    cachedExpiry = Date.now() + CACHE_TTL;

    const filtered = filterChannels(channels, { category, search });
    const paginated = filtered.slice(offset, offset + limit);
    return NextResponse.json({ channels: paginated, total: filtered.length, allTotal: channels.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch channels';
    return NextResponse.json({ error: msg, channels: cachedChannels ? cachedChannels.slice(0, limit) : [], total: 0, allTotal: cachedChannels?.length || 0 }, { status: 502 });
  }
}

function filterChannels(
  channels: LiveChannel[],
  opts: { category: string | null; search: string | null }
): LiveChannel[] {
  let result = channels;

  if (opts.category && opts.category !== 'all') {
    result = result.filter(ch => ch.group === opts.category);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.language.toLowerCase().includes(q) ||
      ch.country.toLowerCase().includes(q)
    );
  }

  return result;
}
