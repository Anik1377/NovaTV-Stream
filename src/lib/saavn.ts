// JioSaavn Music API Helper
// Primary: saavn.dev (returns decrypted direct URLs)
// Fallback: www.jiosaavn.com (metadata only — encrypted URLs can't be decrypted client-side)

const SAavn_DEV = 'https://saavn.dev/api';
const JIOSAAVN = 'https://www.jiosaavn.com/api.php';

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

// ─── saavn.dev response mapping (primary — has direct audio URLs) ────────────

interface SaavnDevSong {
  id?: string;
  name?: string;
 title?: string;
  primaryArtists?: string;
  subtitle?: string;
  album?: { name?: string } | string;
  image?: Array<{ quality: string; link: string }>;
  duration?: number;
  downloadUrl?: Array<{ quality: string; link: string }>;
  year?: string;
}

function mapDevSong(raw: SaavnDevSong): SaavnSong {
  const images = raw.image || [];
  const img = images.find((i) => i.quality === '500x500') || images.find((i) => i.quality === '50x50') || images[0];
  const downloads = raw.downloadUrl || [];
  const audio = downloads.find((d) => d.quality === '320kbps') || downloads.find((d) => d.quality === '160kbps') || downloads[0];
  const albumName = typeof raw.album === 'string' ? raw.album : raw.album?.name || '';

  return {
    id: raw.id || '',
    title: raw.name || raw.title || 'Unknown',
    artists: raw.primaryArtists || raw.subtitle || 'Unknown Artist',
    album: albumName,
    thumbnail: img?.link || '',
    duration: raw.duration || 0,
    audioUrl: audio?.link || '',
    year: raw.year || '',
  };
}

// ─── Direct JioSaavn API mapping (fallback — metadata only, no audio) ──────

interface RawSaavnResult {
  id: string;
  title?: string;
  subtitle?: string;
  image?: string;
  more_info?: {
    primary_artists?: string;
    artistMap?: { primary_artists?: Array<{ name: string }> };
    album?: string;
    duration?: string;
    year?: string;
  };
}

function getHQImage(url: string): string {
  return url.replace(/-\d+x\d+\./, '-500x500.');
}

function mapRawSong(raw: RawSaavnResult): SaavnSong {
  const info = raw.more_info || {};
  const artists =
    info.artistMap?.primary_artists?.map((a) => a.name).join(', ') ||
    info.primary_artists ||
    raw.subtitle ||
    'Unknown Artist';

  return {
    id: raw.id || '',
    title: (raw.title || 'Unknown').replace(/&quot;/g, '"'),
    artists: artists.replace(/&quot;/g, '"'),
    album: (info.album || '').replace(/&quot;/g, '"'),
    thumbnail: raw.image ? getHQImage(raw.image) : '',
    duration: parseInt(info.duration || '0', 10),
    audioUrl: '', // Fallback has no audio
    year: info.year || '',
  };
}

// ─── API: saavn.dev (primary) ───────────────────────────────────────────────

async function fetchFromSaavnDev(path: string): Promise<SaavnSong[]> {
 const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${SAavn_DEV}${path}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`saavn.dev ${res.status}`);
    const json = await res.json();
    const results = (json.data?.results || json.results || []).map(mapDevSong);
    return results;
  } finally {
    clearTimeout(timer);
  }
}

// ─── API: Direct JioSaavn (fallback — metadata only) ────────────────────────

async function fetchFromJioSaavn(query: string, limit: number): Promise<SaavnSong[]> {
  const url = new URL(JIOSAAVN);
  url.searchParams.set('__call', 'search.getResults');
  url.searchParams.set('q', query);
  url.searchParams.set('n', String(limit));
  url.searchParams.set('_', String(Date.now()));
  url.searchParams.set('api_version', '4');
  url.searchParams.set('_format', 'json');
  url.searchParams.set('ctx', 'wap6dot0');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) throw new Error(`JioSaavn ${res.status}`);
    const json = JSON.parse(await res.text());
    return (json.results || []).map(mapRawSong);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function searchSongs(query: string, limit = 20): Promise<SaavnSong[]> {
  const cacheKey = `saavn:search:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  let results: SaavnSong[] = [];

  // Try saavn.dev first (has direct audio URLs)
  try {
    results = await fetchFromSaavnDev(`/search/songs?query=${encodeURIComponent(query)}&page=1&limit=${limit}`);
  } catch {
    // Fallback to direct API (metadata only)
    try {
      results = await fetchFromJioSaavn(query, limit);
    } catch {
      return [];
    }
  }

  setCache(cacheKey, results, 5 * 60 * 1000);
  return results;
}

export async function getTrending(query: string, limit = 25): Promise<SaavnSong[]> {
  const cacheKey = `saavn:trending:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  let results: SaavnSong[] = [];

  // Try saavn.dev first
  try {
    results = await fetchFromSaavnDev(`/search/songs?query=${encodeURIComponent(query)}&page=1&limit=${limit}`);
  } catch {
    // Fallback to direct API
    try {
      results = await fetchFromJioSaavn(query, limit);
    } catch {
      return [];
    }
  }

  setCache(cacheKey, results, 30 * 60 * 1000);
  return results;
}
