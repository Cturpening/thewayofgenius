import { COLORS } from "../../theme/tokens";

// Shared real-data computation behind every "your own symbols" visual --
// 2D constellation and 3D universe both read from this, so the actual
// frequency/co-occurrence math only lives in one place. Built entirely
// from real dream_journal_entries.tags (see backend/app/models.py); never
// invents a symbol or a connection that isn't actually in the data.

// Same palette in both the 2D constellation and the 3D universe, so a
// given real symbol is always the same color wherever you look at it.
export const SYMBOL_PALETTE = [COLORS.teal, COLORS.gold, COLORS.coral, COLORS.violet];

export function buildSymbolGraph(dreamEntries) {
  const freq = new Map();
  const cooccur = new Map();
  for (const entry of dreamEntries) {
    const tags = entry.tags || [];
    for (const t of tags) freq.set(t, (freq.get(t) || 0) + 1);
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = [tags[i], tags[j]].sort().join("::");
        cooccur.set(key, (cooccur.get(key) || 0) + 1);
      }
    }
  }
  const tagList = Array.from(freq.keys()).sort((a, b) => freq.get(b) - freq.get(a));
  const maxCount = tagList.length ? freq.get(tagList[0]) : 0;
  const links = Array.from(cooccur.entries()).map(([key, count]) => {
    const [a, b] = key.split("::");
    return { a, b, count };
  });
  return { tagList, freq, links, maxCount };
}

// Small deterministic hash so each tag gets a stable-but-organic feel --
// same tag always lands in the same spot/color across reloads without
// looking like a grid.
export function hashTag(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function entriesForTag(dreamEntries, tag) {
  return dreamEntries.filter((e) => (e.tags || []).includes(tag));
}

export function neighborsForTag(links, tag) {
  const counts = new Map();
  for (const l of links) {
    if (l.a === tag) counts.set(l.b, l.count);
    if (l.b === tag) counts.set(l.a, l.count);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}
