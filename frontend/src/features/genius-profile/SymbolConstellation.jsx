import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { COLORS } from "../../theme/tokens";

// The one visual in this app actually built live from the user's own real
// data, not a static illustration -- every other "map" (Weave View, Body
// View, Arc View) is either the app's own architecture or invented sample
// content, both honestly labeled as such. This constellation is real tag
// frequency and real co-occurrence from the user's own dream_journal_entries
// (see backend/app/models.py's DreamJournalEntry.tags), nothing invented.

// Small deterministic hash so each tag gets a stable-but-organic jitter --
// same tag always lands in the same spot across reloads, but the layout
// doesn't look like a grid.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const PALETTE = [COLORS.teal, COLORS.gold, COLORS.coral, COLORS.violet];

export default function SymbolConstellation({ dreamEntries = [] }) {
  const [selected, setSelected] = useState(null);

  const { nodes, links, maxCount, w, h, cx, cy } = useMemo(() => {
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

    // Size the canvas to however many real symbols this user has built up --
    // a brand-new account and a years-deep one both need to fit without
    // clipping, so this scales with content instead of a fixed 440x440.
    const ringCountTotal = Math.max(1, Math.ceil(tagList.length / 6));
    const maxRadius = 40 + (ringCountTotal - 1) * 70 + 20;
    const size = Math.max(320, (maxRadius + 45) * 2);
    const w = size, h = size, cx = size / 2, cy = size / 2;

    const nodes = tagList.map((tag, i) => {
      const ring = Math.floor(i / 6);
      const posInRing = i % 6;
      const ringCount = Math.min(6, tagList.length - ring * 6);
      const baseAngle = (posInRing / ringCount) * Math.PI * 2;
      const jitter = hash(tag);
      const angle = baseAngle + ((jitter % 100) / 100 - 0.5) * 0.5;
      const radius = 40 + ring * 70 + ((jitter >> 8) % 20);
      return {
        tag,
        count: freq.get(tag),
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        color: PALETTE[jitter % PALETTE.length],
        phase: (jitter % 1000) / 1000,
      };
    });

    const nodeByTag = Object.fromEntries(nodes.map((n) => [n.tag, n]));
    const links = Array.from(cooccur.entries()).map(([key, count]) => {
      const [a, b] = key.split("::");
      return { a: nodeByTag[a], b: nodeByTag[b], count };
    });

    return { nodes, links, maxCount, w, h, cx, cy };
  }, [dreamEntries]);

  const selectedNode = nodes.find((n) => n.tag === selected);
  const entriesWithTag = selectedNode
    ? dreamEntries.filter((e) => (e.tags || []).includes(selectedNode.tag))
    : [];
  const neighborCounts = new Map();
  if (selectedNode) {
    for (const l of links) {
      if (l.a.tag === selectedNode.tag) neighborCounts.set(l.b.tag, l.count);
      if (l.b.tag === selectedNode.tag) neighborCounts.set(l.a.tag, l.count);
    }
  }
  const neighbors = Array.from(neighborCounts.entries()).sort((a, b) => b[1] - a[1]);

  if (nodes.length === 0) {
    return (
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "16px 18px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Your constellation is real, and it's empty because you haven't logged a tagged dream yet -- this
        isn't a placeholder waiting to be filled with sample content. Log a few dream journal entries and
        this fills in with your own actual recurring symbols, not invented ones.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Live — real data. Every point here is a tag that's actually appeared in your dream journal;
        size is real recurrence, and the faint lines are real co-occurrence -- two symbols that have
        shown up together in the same entry. Tap a point to see exactly which entries it came from.
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{
          maxWidth: w,
          background: `radial-gradient(ellipse at center, ${COLORS.bgPanelAlt} 0%, ${COLORS.bg} 75%)`,
          borderRadius: 16,
          border: `1px solid ${COLORS.grid}`,
        }}>
          {links.map((l, i) => (
            <line
              key={i}
              x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
              stroke={COLORS.inkDim}
              strokeWidth={Math.min(2.5, 0.6 + l.count * 0.5)}
              opacity={selected && (l.a.tag === selected || l.b.tag === selected) ? 0.6 : 0.18}
            />
          ))}
          {nodes.map((n) => {
            const radius = 6 + (n.count / Math.max(1, maxCount)) * 16;
            const isSel = selected === n.tag;
            return (
              <motion.g
                key={n.tag}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(isSel ? null : n.tag)}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4 + n.phase * 2, repeat: Infinity, ease: "easeInOut", delay: n.phase * 2 }}
              >
                <circle cx={n.x} cy={n.y} r={isSel ? radius + 4 : radius} fill={`${n.color}33`} stroke={n.color} strokeWidth={isSel ? 2.5 : 1.4} />
                <text
                  x={n.x}
                  y={n.y}
                  dy={-(radius + 6)}
                  fontSize="9.5"
                  fill={isSel ? n.color : COLORS.inkDim}
                  textAnchor="middle"
                  style={{ paintOrder: "stroke", stroke: COLORS.bg, strokeWidth: 3 }}
                >
                  {n.tag}
                </text>
              </motion.g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 240px", minWidth: 240, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          {!selectedNode ? (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
              Tap any symbol in your constellation to see where it's actually shown up -- {nodes.length} real
              symbol{nodes.length === 1 ? "" : "s"} across {dreamEntries.length} entr{dreamEntries.length === 1 ? "y" : "ies"} so far.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: selectedNode.color, marginBottom: 4 }}>
                {selectedNode.tag}
              </div>
              <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14 }}>
                Appeared in {selectedNode.count} entr{selectedNode.count === 1 ? "y" : "ies"}
              </div>

              <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
                REAL ENTRIES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: neighbors.length ? 16 : 0 }}>
                {entriesWithTag.map((e) => (
                  <div key={e.id} style={{ fontSize: 12, color: COLORS.ink, background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontFamily: "Georgia, serif" }}>{e.title || "untitled"}</div>
                    <div style={{ fontSize: 10, color: COLORS.inkDim }}>{e.date}</div>
                  </div>
                ))}
              </div>

              {neighbors.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
                    OFTEN SHOWS UP WITH
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {neighbors.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setSelected(tag)}
                        style={{
                          padding: "4px 10px", borderRadius: 14, border: `1px solid ${COLORS.grid}`,
                          background: "transparent", color: COLORS.inkDim, fontSize: 10.5, cursor: "pointer",
                        }}
                      >
                        {tag} × {count}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
