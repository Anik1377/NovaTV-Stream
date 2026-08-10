export interface Provider {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  movieUrl: (tmdbId: number) => string;
  tvUrl: (tmdbId: number, season: number, episode: number) => string;
}

export const providers: Provider[] = [
  {
    id: 'vidsrc-sbs',
    name: 'VidSrc',
    description: 'Fast & reliable, subtitle support',
    color: '#e50914',
    icon: '▶',
    movieUrl: (id) => `https://vidsrc.sbs/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc PM',
    description: 'Alternate server, multi-audio',
    color: '#6366f1',
    icon: '◈',
    movieUrl: (id) => `https://vidsrc.pm/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    description: 'High quality streams',
    color: '#f59e0b',
    icon: '★',
    movieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: '2embed',
    name: '2Embed',
    description: 'Wide library, fast load',
    color: '#3b82f6',
    icon: '▷',
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, s, e) => `https://www.2embed.cc/embed/${id}/${s}/${e}`,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    description: 'Auto server selection',
    color: '#ec4899',
    icon: '⬡',
    movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'playembeds',
    name: 'PlayEmbeds',
    description: 'Direct streams, minimal ads',
    color: '#10b981',
    icon: '◉',
    movieUrl: (id) => `https://playembeds.com/movie/${id}`,
    tvUrl: (id, s, e) => `https://playembeds.com/tv/${id}/${s}/${e}`,
  },
];

export function getProvider(id: string): Provider {
  return providers.find((p) => p.id === id) || providers[0];
}

export function getEmbedUrl(providerId: string, type: 'movie' | 'tv', tmdbId: number, season?: number, episode?: number): string {
  const provider = getProvider(providerId);
  if (type === 'movie') {
    return provider.movieUrl(tmdbId);
  }
  return provider.tvUrl(tmdbId, season || 1, episode || 1);
}
