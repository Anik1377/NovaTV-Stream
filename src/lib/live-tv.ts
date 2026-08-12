export interface LiveChannel {
  name: string;
  logo: string;
  url: string;
  category: string;
  country: string;
  language: string;
  guide?: string;
}

export const LIVE_TV_CATEGORIES = [
  'All',
  'News',
  'Entertainment',
  'Sports',
  'Music',
  'Kids',
  'Documentary',
  'Religious',
  'Education',
  'Lifestyle',
] as const;

export type LiveTVCategory = (typeof LIVE_TV_CATEGORIES)[number];

// Predefined popular channel configs for quick access
export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'us', name: 'USA', flag: '🇺🇸' },
  { code: 'gb', name: 'UK', flag: '🇬🇧' },
  { code: 'bd', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'pk', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
];

export async function fetchChannels(countryCode: string): Promise<LiveChannel[]> {
  try {
    const res = await fetch(`/api/live-tv/channels?country=${countryCode}`);
    if (!res.ok) throw new Error('Failed to fetch channels');
    const data = await res.json();
    return data.channels || [];
  } catch (error) {
    console.error('Failed to fetch live TV channels:', error);
    return [];
  }
}

export function filterChannels(
  channels: LiveChannel[],
  category: LiveTVCategory,
  searchQuery: string
): LiveChannel[] {
  let filtered = channels;

  if (category !== 'All') {
    filtered = filtered.filter(
      (ch) => ch.category?.toLowerCase() === category.toLowerCase()
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (ch) =>
        ch.name?.toLowerCase().includes(q) ||
        ch.language?.toLowerCase().includes(q) ||
        ch.category?.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export function getCategoriesFromChannels(channels: LiveChannel[]): string[] {
  const cats = new Set<string>();
  channels.forEach((ch) => {
    if (ch.category?.trim()) cats.add(ch.category.trim());
  });
  return Array.from(cats).sort();
}
