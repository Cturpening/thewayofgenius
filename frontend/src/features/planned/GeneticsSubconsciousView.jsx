import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { DNA_MARKERS_REPRESENTATIVE, PATTERN_PILLARS, SUBCONSCIOUS_GENETIC_THEMES } from "./data/geneticsData";

export default function GeneticsSubconsciousView() {
  const [tab, setTab] = useState("dna");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.gold}18`, border: `1px solid ${COLORS.gold}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        An open category, built to be honest either direction: real DNA data on one side, what surfaces
        through subconscious/dreamwork on the other — side by side, so a real pattern would be visible
        if one exists, and nothing is assumed if it doesn't. No real gene panel data connected yet, and
        the subconscious side is pattern-notes, not a confirmed mechanism.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["dna", "subconscious"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", borderRadius: 10,
              border: `1px solid ${tab === t ? COLORS.gold : COLORS.grid}`,
              background: tab === t ? `${COLORS.gold}22` : "transparent",
              color: tab === t ? COLORS.gold : COLORS.inkDim,
              fontSize: 13, cursor: "pointer",
            }}
          >
            {t === "dna" ? "DNA Panel (Representative)" : "Subconscious Interface (Her Practice)"}
          </button>
        ))}
      </div>

      {tab === "dna" ? (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14, letterSpacing: 0.5 }}>
            REPRESENTATIVE MARKER CATEGORIES — NOT REAL DATA, NO SPECIFIC GENES CLAIMED
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DNA_MARKERS_REPRESENTATIVE.map((m) => (
              <div key={m.category} style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 4 }}>{m.category}</div>
                <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.4 }}>{m.relevance}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 14, lineHeight: 1.6 }}>
            Deliberately kept at the category level, not specific SNPs — a lot of "behavior gene" claims
            in pop science are weaker than they sound, and this category shouldn't inherit that problem.
            Real markers get named once a real panel and a real research partner (Dr. Gupta or Diverse
            Vitality/ESAA) are actually in place.
          </div>
        </div>
      ) : (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14, letterSpacing: 0.5 }}>
            PATTERN PILLARS — HOW EDIN CATEGORIZES WHAT SURFACES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {PATTERN_PILLARS.map((p) => (
              <div key={p.pillar} style={{ background: `${p.color}14`, border: `1px solid ${p.color}55`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: p.color, marginBottom: 4 }}>{p.pillar}</div>
                <div style={{ fontSize: 11.5, color: COLORS.ink, lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14, letterSpacing: 0.5 }}>
            PATTERNS NOTICED IN REAL COACHING WORK — NOT YET SYSTEMATICALLY TRACKED
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SUBCONSCIOUS_GENETIC_THEMES.map((t) => (
              <div key={t.theme} style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: COLORS.gold, marginBottom: 4 }}>{t.theme}</div>
                <div style={{ fontSize: 11.5, color: COLORS.ink, lineHeight: 1.4 }}>{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: COLORS.violet, letterSpacing: 0.5, marginBottom: 8 }}>
          PROPOSED LOOP (HYPOTHESIS, NOT YET TESTABLE — NEEDS BOTH REAL SIDES FIRST)
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6 }}>
          Trigger: a dream/symbol entry gets tagged as ancestral/generational (a real category already
          used in her coaching practice). Action, once both sides are real: check whether anything in
          that person's actual gene panel data lines up with the theme. Outcome is reported honestly
          either way — a real correlation is notable; no correlation is also a real, useful finding, not
          a failure. This loop can't run yet — it's the target to build toward once a real gene panel
          partner is in place.
        </div>
      </div>
    </div>
  );
}
