/**
 * Server Ranking System
 * Tracks how often users select each provider and uses that data
 * to rank servers by popularity — a crowdsourced reliability signal.
 *
 * Logic: If most users pick Server X, it likely has the content they need.
 */

const STORAGE_KEY = 'streamvault-server-rankings';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface RankingEntry {
  providerId: string;
  picks: number;       // how many times users selected this
  lastPicked: number;   // timestamp of last pick
}

function loadRankings(): Map<string, RankingEntry> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as [string, RankingEntry][];
    const now = Date.now();
    const map = new Map<string, RankingEntry>();
    for (const [id, entry] of parsed) {
      // Decay old entries
      if (now - entry.lastPicked < MAX_AGE_MS) {
        map.set(id, entry);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveRankings(rankings: Map<string, RankingEntry>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(rankings.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Storage full or unavailable
  }
}

/** Record that a user picked a provider */
export function recordServerPick(providerId: string) {
  const rankings = loadRankings();
  const existing = rankings.get(providerId);
  if (existing) {
    existing.picks += 1;
    existing.lastPicked = Date.now();
  } else {
    rankings.set(providerId, { providerId, picks: 1, lastPicked: Date.now() });
  }
  saveRankings(rankings);
}

/** Get pick count for a provider */
export function getServerPickCount(providerId: string): number {
  const rankings = loadRankings();
  return rankings.get(providerId)?.picks || 0;
}

/** Get all provider IDs sorted by popularity (most picks first) */
export function getRankedProviderIds(): string[] {
  const rankings = loadRankings();
  return Array.from(rankings.values())
    .sort((a, b) => b.picks - a.picks || b.lastPicked - a.lastPicked)
    .map(e => e.providerId);
}

/** Get a normalized score 0–100 for a provider (relative to the top provider) */
export function getServerScore(providerId: string): number {
  const rankings = loadRankings();
  const entries = Array.from(rankings.values());
  if (entries.length === 0) return 0;
  const maxPicks = Math.max(...entries.map(e => e.picks));
  if (maxPicks === 0) return 0;
  const entry = rankings.get(providerId);
  if (!entry) return 0;
  return Math.round((entry.picks / maxPicks) * 100);
}
