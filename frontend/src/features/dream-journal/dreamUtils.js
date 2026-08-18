import { DREAM_AUTO_TAGS } from "./data/dreamAutoTags";

export function detectAutoTags(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const { keyword, tag } of DREAM_AUTO_TAGS) {
    if (lower.includes(keyword)) found.add(tag);
  }
  return Array.from(found);
}


export function edinDreamReflection(text, tags) {
  if (tags.includes("recall-blocker")) {
    return "Real, not a failure — recall-blockers loosen with repetition, not force. Even a fragment logged here is worth more than waiting for the full memory.";
  }
  if (tags.includes("door symbol")) {
    return "That symbol's shown up before — worth checking the Symbol Body Map to see if this is the same spiral deepening, or a genuinely new thread.";
  }
  if (tags.includes("waking-activation")) {
    return "Logged as a waking-activation moment. Worth noting what you were mid-processing right before it happened — that context usually matters more than the jolt itself.";
  }
  if (tags.includes("integration-milestone")) {
    return "That's an integration-milestone entry — exactly the kind the Dream Arc View is built to track. Nice one to come back to later.";
  }
  if (tags.length > 0) {
    return `Noted the thread${tags.length > 1 ? "s" : ""} here — ${tags.join(", ")}. Nothing to resolve tonight; just let it sit in the record.`;
  }
  return "Logged. Even a quiet or uneventful entry is real information — the pattern usually isn't visible until you look back over several of these at once.";
}


export function humanizeTag(tag) {
  return tag.split("/").map((s) => s.trim()).join(" & ").replace(/\b\w/g, (c) => c.toUpperCase());
}


export function generateCoverStats(entries) {
  const tagCounts = {};
  entries.forEach((e) => e.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const topTag = sorted.length ? sorted[0][0] : null;
  return { entryCount: entries.length, topTag };
}
