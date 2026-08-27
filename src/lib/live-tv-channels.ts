export interface LiveChannel {
  id: string;
  name: string;
  url: string;
  group: string;
  tvgLogo: string;
  country: string;
  language: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// These categories map to common iptv-org group-title values
export const channelCategories: ChannelCategory[] = [
  { id: 'all', name: 'All', icon: '📡', color: '#10b981' },
  { id: 'news', name: 'News', icon: '📰', color: '#ef4444' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#22c55e' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#a855f7' },
  { id: 'music', name: 'Music', icon: '🎵', color: '#ec4899' },
  { id: 'kids', name: 'Kids', icon: '🧸', color: '#f59e0b' },
  { id: 'religious', name: 'Religious', icon: '🙏', color: '#f97316' },
  { id: 'documentary', name: 'Documentary', icon: '🎥', color: '#06b6d4' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#8b5cf6' },
  { id: 'regional', name: 'Regional', icon: '🌍', color: '#3b82f6' },
];

// Map common group-title variants to our category IDs
const GROUP_ALIASES: Record<string, string> = {
  'news': 'news',
  'news hd': 'news',
  'english news': 'news',
  'hindi news': 'news',
  'news channels': 'news',
  '24/7 news': 'news',
  'sports': 'sports',
  'sports hd': 'sports',
  'cricket': 'sports',
  'football': 'sports',
  'entertainment': 'entertainment',
  'entertainment hd': 'entertainment',
  'general': 'entertainment',
  'general entertainment': 'entertainment',
  'hindi entertainment': 'entertainment',
  'english entertainment': 'entertainment',
  'music': 'music',
  'music hd': 'music',
  'music channels': 'music',
  'kids': 'kids',
  'kids hd': 'kids',
  'kids channels': 'kids',
  'children': 'kids',
  'animation': 'kids',
  'religious': 'religious',
  'spiritual': 'religious',
  'devotional': 'religious',
  'documentary': 'documentary',
  'documentaries': 'documentary',
  'education': 'documentary',
  'lifestyle': 'lifestyle',
  'lifestyle hd': 'lifestyle',
  'travel': 'lifestyle',
  'food': 'lifestyle',
  'shopping': 'lifestyle',
  'regional': 'regional',
  'regional channels': 'regional',
  'regional hd': 'regional',
  'bengali': 'regional',
  'tamil': 'regional',
  'telugu': 'regional',
  'marathi': 'regional',
  'punjabi': 'regional',
  'kannada': 'regional',
  'malayalam': 'regional',
};

export function mapGroupToCategory(group: string): string {
  if (!group) return 'regional';
  const lower = group.toLowerCase().trim();
  return GROUP_ALIASES[lower] || 'regional';
}

// Deduplicate channels by name, preferring entries with logos and common stream hosts
export function deduplicateChannels(channels: LiveChannel[]): LiveChannel[] {
  const seen = new Map<string, LiveChannel>();

  for (const ch of channels) {
    const key = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, ch);
    } else {
      // Prefer channels with logos
      if (!existing.tvgLogo && ch.tvgLogo) {
        seen.set(key, ch);
      }
      // Prefer .m3u8 streams over other formats
      else if (!existing.url.endsWith('.m3u8') && ch.url.endsWith('.m3u8')) {
        seen.set(key, ch);
      }
    }
  }

  return Array.from(seen.values());
}
