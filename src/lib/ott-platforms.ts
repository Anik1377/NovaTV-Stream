export interface OttPlatform {
  id: number;
  name: string;
  shortName: string;
  color: string;
  textColor?: string;
  logoInitials: string;
  logoPath?: string | null;
  svgLogo?: string;
}

export const OTT_PLATFORMS: OttPlatform[] = [
  { id: 8,    name: 'Netflix',             shortName: 'Netflix',   color: '#E50914', svgLogo: '/logos/netflix.svg' },
  { id: 9,    name: 'Amazon Prime Video', shortName: 'Prime',     color: '#00A8E1', svgLogo: '/logos/prime.svg' },
  { id: 350,  name: 'Apple TV+',           shortName: 'Apple TV+', color: '#A2AAAD', svgLogo: '/logos/appletv.svg' },
  { id: 337,  name: 'Disney+',             shortName: 'Disney+',   color: '#113CCF', svgLogo: '/logos/disneyplus.svg' },
  { id: 15,   name: 'Hulu',                shortName: 'Hulu',      color: '#1CE783', svgLogo: '/logos/hulu.svg' },
  { id: 384,  name: 'Max',                 shortName: 'Max',       color: '#B026FF', textColor: '#FFFFFF', svgLogo: '/logos/max.svg' },
  { id: 531,  name: 'Paramount+',          shortName: 'Paramount+', color: '#0064FF', svgLogo: '/logos/paramountplus.svg' },
  { id: 386,  name: 'Peacock',             shortName: 'Peacock',   color: '#0064FF', textColor: '#FFFFFF', svgLogo: '/logos/peacock.svg' },
  { id: 283,  name: 'Crunchyroll',         shortName: 'Crunchyroll', color: '#F47521', svgLogo: '/logos/crunchyroll.svg' },
  { id: 4179, name: 'MGM+',                shortName: 'MGM+',      color: '#C9A84C', svgLogo: '/logos/mgmplus.svg' },
];

export function getOttPlatform(id: number): OttPlatform | undefined {
  return OTT_PLATFORMS.find(p => p.id === id);
}

/** Merge TMDB logo paths into the static platform list */
export function mergeProviderLogos(
  platforms: OttPlatform[],
  tmdbProviders: { id: number; logo_path: string | null }[]
): OttPlatform[] {
  const logoMap = new Map(tmdbProviders.map(p => [p.id, p.logo_path]));
  return platforms.map(p => ({
    ...p,
    logoPath: logoMap.get(p.id) ?? null,
  }));
}
