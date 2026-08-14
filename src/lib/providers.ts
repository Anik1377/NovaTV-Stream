export interface Provider {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  primary?: boolean;
  movieUrl: (tmdbId: number) => string;
  tvUrl: (tmdbId: number, season: number, episode: number) => string;
}

export const providers: Provider[] = [
  /* ── Tier 1: Most reliable, best UX ── */
  {
    id: 'vidsrc-cc',
    name: 'VidSrc',
    description: 'Recommended — HD, subtitles, fast load',
    color: '#00f2ff',
    icon: '◈',
    primary: true,
    movieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    description: 'HD, subtitles, auto-next episode',
    color: '#8B5CF6',
    icon: '▶',
    movieUrl: (id) => `https://player.videasy.net/movie/${id}?overlay=true&color=E50914`,
    tvUrl: (id, s, e) =>
      `https://player.videasy.net/tv/${id}/${s}/${e}?overlay=true&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&color=E50914`,
  },
  {
    id: 'vidsrc-icu',
    name: 'VidSrc ICU',
    description: 'Alternate server, multi-audio',
    color: '#f59e0b',
    icon: '★',
    movieUrl: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },

  /* ── Tier 2: Good backups ── */
  {
    id: 'vidsrc-sbs',
    name: 'VidSrc SBS',
    description: 'Fast & reliable',
    color: '#e50914',
    icon: '◈',
    movieUrl: (id) => `https://vidsrc.sbs/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc PM',
    description: 'High quality streams',
    color: '#6366f1',
    icon: '◈',
    movieUrl: (id) => `https://vidsrc.pm/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    description: 'Premium quality source',
    color: '#f97316',
    icon: '★',
    movieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    description: 'Multi-server, wide library',
    color: '#10b981',
    icon: '◉',
    movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'embed-su',
    name: 'Embed.su',
    description: 'Direct streams, minimal ads',
    color: '#3b82f6',
    icon: '▷',
    movieUrl: (id) => `https://embed.su/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },

  /* ── Tier 3: Fallbacks ── */
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
    description: 'Direct embed source',
    color: '#14b8a6',
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
