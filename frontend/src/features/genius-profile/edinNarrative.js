export function edinNarrative(mode, activeKey, states) {
  const s = states[activeKey];
  if (mode === "workload") {
    if (activeKey === "test") {
      return "The tapestry is pulling taut right now — Conscious Mind at the loom, beta rising through the frontal threads. This is willful creation, the pattern you choose rather than the one that finds you.";
    }
    return "The threads are loosening. Alpha leads, and the Subconscious takes the loom back — quiet reorganizing, nothing to direct here, just watch the pattern settle.";
  }
  const map = {
    awake: "Still awake in the tapestry's night section — Conscious Mind hasn't fully released the thread yet. If this recurs, the Symbolic Coding Room is the place to ask what's still being held.",
    light: "Light sleep — the Subconscious begins its nightly weaving, sorting the day's threads. Theta rising.",
    deep: "Deep, slow-wave sleep — the tapestry's most repaired stitch. The Subconscious at its most biofeedback-master self, delta dominant.",
    rem: "REM — the symbolic dye enters the thread. Waking from this window is often when a dream is still close enough to carry into the Journals.",
  };
  return map[activeKey] || "";
}
