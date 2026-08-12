// JioSaavn Music API Helper
// Uses jiosaavn-api.vercel.app for search/metadata
// Uses JioTunePreview (vlink) for playable 30s audio previews

const JIOSAAVN_API = 'https://jiosaavn-api.vercel.app';

// ─── Cache ────────────────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttl: number) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SaavnSong {
  id: string;
  title: string;
  artists: string;
  album: string;
  thumbnail: string;
  duration: number;
  audioUrl: string;
  year: string;
}

// ─── Raw API response types ─────────────────────────────────────────────────

interface RawSearchResult {
  id: string;
  title: string;
  image: string;
  images?: { '50x50': string; '150x150': string; '500x500': string };
  album: string;
  description: string;
  perma_url: string;
  more_info?: {
    vlink?: string;
    singers?: string;
    language?: string;
    album_id?: string;
  };
  year?: string;
}

interface RawSearchResponse {
  status: boolean;
  searchQuery?: string;
  results?: RawSearchResult[];
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function mapSong(raw: RawSearchResult): SaavnSong {
  // Use highest quality thumbnail available
  const thumb = raw.images?.['500x500'] || raw.images?.['150x150'] || raw.image || '';

  // Clean HTML entities
  const clean = (s: string) => (s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

  return {
    id: raw.id || '',
    title: clean(raw.title),
    artists: clean(raw.more_info?.singers || raw.description?.split(' · ').pop() || ''),
    album: clean(raw.album),
    thumbnail: thumb,
    duration: 30, // JioTunePreview clips are ~30s
    audioUrl: raw.more_info?.vlink || '',
    year: raw.year || '',
  };
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function fetchSearch(query: string, limit: number): Promise<SaavnSong[]> {
  const url = `${JIOSAAVN_API}/api/search?query=${encodeURIComponent(query)}&limit=${limit}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`JioSaavn API returned ${res.status}`);

    const json: RawSearchResponse = await res.json();
    const results = (json.results || []).filter((r) => r.more_info?.vlink).map(mapSong);

    return results;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function searchSongs(query: string, limit = 20): Promise<SaavnSong[]> {
  const cacheKey = `saavn:search:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  try {
    const results = await fetchSearch(query, limit);
    setCache(cacheKey, results, 5 * 60 * 1000);
    return results;
  } catch {
    return [];
  }
}

export async function getTrending(query: string, limit = 25): Promise<SaavnSong[]> {
  const cacheKey = `saavn:trending:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  try {
    const results = await fetchSearch(query, limit);
    setCache(cacheKey, results, 30 * 60 * 1000);
    return results;
  } catch {
    return [];
  }
}
