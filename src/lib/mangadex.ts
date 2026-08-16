// Shared MangaDex API helpers

const BASE = 'https://api.mangadex.org';
const HEADERS = { 'User-Agent': 'MangaReader/1.0' };

export function getCoverUrl(item: any): string {
  const coverRel = item.relationships?.find(
    (r: any) => r.type === 'cover_art'
  );
  if (!coverRel) return '';
  return `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.512.jpg`;
}

export function getAuthorName(item: any): string {
  const authorRel = item.relationships?.find(
    (r: any) => r.type === 'author'
  );
  if (!authorRel) return 'Unknown';
  const name = authorRel.attributes?.name;
  return name?.en || Object.values(name || {})[0] || 'Unknown';
}

export function getArtistName(item: any): string {
  const artistRel = item.relationships?.find(
    (r: any) => r.type === 'artist'
  );
  if (!artistRel) return 'Unknown';
  const name = artistRel.attributes?.name;
  return name?.en || Object.values(name || {})[0] || 'Unknown';
}

export function getScanlationGroup(ch: any): string {
  const groupRel = ch.relationships?.find(
    (r: any) => r.type === 'scanlation_group'
  );
  if (!groupRel) return '';
  return groupRel.attributes?.name || '';
}

export function getTitle(item: any): string {
  return (
    item.attributes?.title?.en ||
    Object.values(item.attributes?.title || {})[0] ||
    'Untitled'
  );
}

/** Build a MangaDex API URL with proper parameter encoding */
export function mdxUrl(path: string, params: Record<string, string | undefined> = {}): string {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

/** Simple in-memory cache */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  private ttlMs: number;
  private maxSize: number;

  constructor(ttlMs: number, maxSize = 500) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    if (entry) this.cache.delete(key);
    return undefined;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest 20%
      const entries = [...this.cache.entries()];
      entries.sort((a, b) => a[1].expiry - b[1].expiry);
      const evictCount = Math.ceil(this.maxSize * 0.2);
      for (let i = 0; i < evictCount; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
    this.cache.set(key, { data, expiry: Date.now() + this.ttlMs });
  }
}

export { BASE, HEADERS };
