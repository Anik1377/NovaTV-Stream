// JioSaavn API Helper — Direct API with URL decryption

const BASE = 'https://www.jiosaavn.com/api.php';

// In-memory cache
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

// Decrypt JioSaavn encrypted media URL
function decryptMediaUrl(encUrl: string): string {
  // Swap adjacent character pairs then base64 decode
  let swapped = '';
  for (let i = 0; i < encUrl.length - 1; i += 2) {
    swapped += encUrl[i + 1] + encUrl[i];
  }
  if (encUrl.length % 2 !== 0) {
    swapped += encUrl[encUrl.length - 1];
  }
  try {
    return Buffer.from(swapped, 'base64').toString('utf-8');
  } catch {
    return encUrl;
  }
}

// Get high quality image URL
function getHQImage(url: string): string {
  return url.replace(/-\d+x\d+\./, '-500x500.');
}

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface RawSongResult {
  id: string;
  title?: string;
  subtitle?: string;
  image?: string;
  more_info?: {
    music?: string;
    primary_artists?: string;
    artistMap?: {
      primary_artists?: Array<{ name: string }>;
    };
    album?: string;
    duration?: string;
    encrypted_media_url?: string;
    '320kbps'?: string;
    year?: string;
    label?: string;
  };
  year?: string;
  play_count?: string;
}

function mapSong(raw: RawSongResult): SaavnSong {
  const info = raw.more_info || {};
  const primaryArtists =
    info.artistMap?.primary_artists?.map((a) => a.name).join(', ') ||
    info.primary_artists ||
    raw.subtitle ||
    'Unknown Artist';

  let audioUrl = '';
  const encUrl = info.encrypted_media_url;
  if (encUrl) {
    audioUrl = decryptMediaUrl(encUrl);
  }

  return {
    id: raw.id || '',
    title: (raw.title || 'Unknown').replace(/&quot;/g, '"'),
    artists: primaryArtists.replace(/&quot;/g, '"'),
    album: (info.album || '').replace(/&quot;/g, '"'),
    thumbnail: raw.image ? getHQImage(raw.image) : '',
    duration: parseInt(info.duration || '0', 10),
    audioUrl,
    year: info.year || raw.year || '',
  };
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function saavnFetch(params: Record<string, string>): Promise<string> {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set('_', String(Date.now()));
  url.searchParams.set('api_version', '4');
  url.searchParams.set('_format', 'json');
  url.searchParams.set('ctx', 'wap6dot0');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) throw new Error(`JioSaavn API error: ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchSongs(query: string, limit = 20): Promise<SaavnSong[]> {
  const cacheKey = `saavn:search:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  const text = await saavnFetch({
    __call: 'search.getResults',
    q: query,
    n: String(limit),
  });

  const json = JSON.parse(text);
  const results: SaavnSong[] = (json.results || [])
    .filter((r: RawSongResult) => r.type === 'song' || !r.type)
    .map(mapSong);

  setCache(cacheKey, results, 5 * 60 * 1000);
  return results;
}

export async function getTrending(query: string, limit = 25): Promise<SaavnSong[]> {
  const cacheKey = `saavn:trending:${query}:${limit}`;
  const cached = getCached<SaavnSong[]>(cacheKey);
  if (cached) return cached;

  const text = await saavnFetch({
    __call: 'search.getResults',
    q: query,
    n: String(limit),
  });

  const json = JSON.parse(text);
  const results: SaavnSong[] = (json.results || [])
    .filter((r: RawSongResult) => r.type === 'song' || !r.type)
    .map(mapSong);

  setCache(cacheKey, results, 30 * 60 * 1000);
  return results;
}
