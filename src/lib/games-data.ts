/* ── OnlineGames.io embeddable games ── */

export interface EmbedGame {
  title: string;
  embed: string;
  image: string;
  tags: string;
  description: string;
}

/* ── Category definitions derived from top tags ── */
export interface GameCategory {
  id: string;
  label: string;
  tag: string;
  icon: string;
}

export const GAME_CATEGORIES: GameCategory[] = [
  { id: 'all',         label: 'All Games',         tag: '',            icon: 'Grid3X3' },
  { id: 'popular',     label: 'Popular',           tag: '',            icon: 'Flame' },
  { id: 'action',      label: 'Action & Battle',   tag: 'action',     icon: 'Swords' },
  { id: 'driving',     label: 'Driving & Racing',  tag: 'driving',    icon: 'Car' },
  { id: 'shooting',    label: 'Shooting & War',    tag: 'shooting',   icon: 'Crosshair' },
  { id: 'arcade',      label: 'Arcade & Fun',      tag: 'arcade',     icon: 'Joystick' },
  { id: 'puzzle',      label: 'Puzzle & Strategy', tag: 'puzzle',     icon: 'Puzzle' },
  { id: 'multiplayer', label: 'Multiplayer',       tag: 'multiplayer',icon: 'Users' },
  { id: 'simulator',   label: 'Simulator',         tag: 'simulator',  icon: 'Gauge' },
  { id: 'io-games',    label: '.io Games',         tag: 'io-games',   icon: 'Globe' },
  { id: '2d',          label: '2D Games',          tag: '2d',         icon: 'Square' },
  { id: '3d',          label: '3D Games',          tag: '3d',         icon: 'Box' },
  { id: 'mobile',      label: 'Mobile Friendly',   tag: 'mobile',     icon: 'Smartphone' },
  { id: 'kids',        label: 'Kids',              tag: 'kids',       icon: 'Baby' },
  { id: 'adventure',   label: 'Adventure',         tag: 'adventure',  icon: 'Compass' },
  { id: 'survival',    label: 'Survival',          tag: 'survival',   icon: 'Shield' },
  { id: 'snake',       label: 'Snake Games',       tag: 'snake',      icon: 'Worm' },
];

/* ── Load games from the static JSON ── */
let _cachedGames: EmbedGame[] | null = null;

export async function loadGames(): Promise<EmbedGame[]> {
  if (_cachedGames) return _cachedGames;
  try {
    const res = await fetch('/games-data.json');
    const data: EmbedGame[] = await res.json();
    _cachedGames = data;
    return data;
  } catch {
    return [];
  }
}

/* ── Helper: filter games by category ── */
export function filterByCategory(games: EmbedGame[], categoryId: string): EmbedGame[] {
  if (categoryId === 'all' || categoryId === 'popular') return games;
  const cat = GAME_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat || !cat.tag) return games;
  return games.filter((g) => g.tags.split(',').map((t) => t.trim()).includes(cat.tag));
}

/* ── Helper: search games ── */
export function searchGames(games: EmbedGame[], query: string): EmbedGame[] {
  const q = query.toLowerCase().trim();
  if (!q) return games;
  return games.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.tags.toLowerCase().includes(q)
  );
}

/* ── Helper: truncate description ── */
export function truncateDescription(desc: string, maxLen = 100): string {
  // Remove "About GameTitle\n" prefix if present
  const cleaned = desc.replace(/^About\s+[^\n]+\n?/i, '').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}
