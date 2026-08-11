export interface OttPlatform {
  id: number;
  name: string;
  shortName: string;
  color: string;
  textColor?: string;
  logoInitials: string;
}

export const OTT_PLATFORMS: OttPlatform[] = [
  { id: 8,   name: 'Netflix',             shortName: 'Netflix',   color: '#E50914', logoInitials: 'N' },
  { id: 9,   name: 'Amazon Prime Video', shortName: 'Prime',    color: '#00A8E1', logoInitials: 'P' },
  { id: 350, name: 'Apple TV+',           shortName: 'Apple',    color: '#A2AAAD', logoInitials: '\u2318' },
  { id: 337, name: 'Disney+',             shortName: 'Disney+',  color: '#113CCF', logoInitials: 'D' },
  { id: 15,  name: 'Hulu',                shortName: 'Hulu',     color: '#1CE783', logoInitials: 'H' },
  { id: 384, name: 'Max',                 shortName: 'Max',      color: '#B026FF', textColor: '#FFFFFF', logoInitials: 'M' },
  { id: 531, name: 'Paramount+',          shortName: 'Paramount', color: '#0064FF', logoInitials: 'P' },
  { id: 386, name: 'Peacock',             shortName: 'Peacock',  color: '#000000', textColor: '#FFFFFF', logoInitials: '\u2618' },
  { id: 283, name: 'Crunchyroll',         shortName: 'Crunchy',  color: '#F47521', logoInitials: 'C' },
  { id: 4179, name: 'MGM+',               shortName: 'MGM+',     color: '#C9A84C', logoInitials: 'M' },
];

export function getOttPlatform(id: number): OttPlatform | undefined {
  return OTT_PLATFORMS.find(p => p.id === id);
}
