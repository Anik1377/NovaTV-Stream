/* ── Pure client-safe utilities for Indian / International content splitting ── */

const INDIAN_LANGS = ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa', 'ur'];

export function isIndianLang(lang?: string): boolean {
  return !!lang && INDIAN_LANGS.includes(lang);
}

/**
 * Splits an array into 50% Indian + 50% international, interleaved.
 * Each half is trimmed to `halfCount` items.
 * Result alternates: indian[0], intl[0], indian[1], intl[1], ...
 */
export function splitFiftyFifty<T extends { original_language?: string }>(
  items: T[],
  totalCount = 20,
): T[] {
  const halfCount = Math.ceil(totalCount / 2);
  const indian: T[] = [];
  const intl: T[] = [];

  for (const item of items) {
    if (isIndianLang(item.original_language)) {
      if (indian.length < halfCount) indian.push(item);
    } else {
      if (intl.length < halfCount) intl.push(item);
    }
  }

  const result: T[] = [];
  const maxLen = Math.max(indian.length, intl.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < indian.length) result.push(indian[i]);
    if (i < intl.length) result.push(intl[i]);
  }

  return result;
}

/**
 * Merges fresh Indian items into existing array, enforcing 50/50 split.
 */
export function mergeWithFiftyFifty<T extends { id: number; original_language?: string }>(
  existing: T[],
  freshIndian: T[],
  totalCount = 20,
): T[] {
  const halfCount = Math.ceil(totalCount / 2);
  const existingIds = new Set(existing.map(r => r.id));
  const newIndian = freshIndian.filter(r => !existingIds.has(r.id));

  const currentIndian = existing.filter(r => isIndianLang(r.original_language));
  const needed = Math.max(0, halfCount - currentIndian.length);
  const toAdd = newIndian.slice(0, needed);

  const combined = [...toAdd, ...existing];
  return splitFiftyFifty(combined, totalCount);
}
