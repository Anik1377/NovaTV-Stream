const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = 'f71458d399e1eb9bdbfdc1c3318f5f75';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: string = 'w500') => {
  if (!path) return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" fill="%23222"><rect width="500" height="750"/><text x="250" y="375" text-anchor="middle" fill="%23666" font-family="system-ui" font-size="48">🎬</text></svg>');
  return `${IMG_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'original') => {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
};

export async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json();
}
