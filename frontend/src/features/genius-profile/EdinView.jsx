import { COLORS } from "../../theme/tokens";
import { edinNarrative } from "./edinNarrative";
import TapestryWeb from "./TapestryWeb";

export default function EdinView({ mode, states, activeKey, setActiveKey }) {
  const keys = Object.keys(states);
  const s = states[activeKey];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: `${COLORS.teal}12`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This is how the same EEG state surfaces through Edin — the tapestry web, the symbolic story
        narrative, the Genius Rooms — not lab language. Three threads are lit now (EEG, Biofeedback,
        Symbolic Coding); Behavioral, Journals, and Growth Arc are real in the architecture but have no
        data feeding them yet.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: COLORS.ink, lineHeight: 1.6, fontStyle: "italic", borderLeft: "2px solid #8e7ad1" }}>
        "Symbolic coding is the underlying structure... the architecture beneath the surface, the
        grammar beneath the language... Symbolic language is how that coding is expressed... Coding is
        the system. Language is how the system speaks." — from "Symbolic Coding and Language," The Way
        of the Insane
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setActiveKey(k)}
            style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: `1px solid ${activeKey === k ? states[k].accent : COLORS.grid}`,
              background: activeKey === k ? `${states[k].accent}22` : "transparent",
              color: activeKey === k ? states[k].accent : COLORS.inkDim,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {states[k].label}
          </button>
        ))}
      </div>

      {/* Inner World Tapestry Web */}
      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 4, letterSpacing: 0.5 }}>
          INNER WORLD TAPESTRY WEB — ZOOM: EEG THREAD
        </div>
        <TapestryWeb activeColor={s.accent} activeLabel={s.label} />
      </div>

      {/* Symbolic story narrative — Edin's voice */}
      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, ${s.accent}, ${COLORS.bgPanelAlt})`,
            boxShadow: `0 0 18px ${s.accent}55`,
          }}
        />
        <div>
          <div style={{ fontSize: 11, color: COLORS.teal, letterSpacing: 1, marginBottom: 6 }}>
            EDIN — SYMBOLIC STORY NARRATIVE
          </div>
          <div style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.6, fontFamily: "Georgia, serif" }}>
            {edinNarrative(mode, activeKey, states)}
          </div>
        </div>
      </div>

      {/* Genius chart — living map, not a bar chart, framed as such */}
      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          GENIUS CHART — {mode === "workload" ? "HEALTH LAB" : "HEALTH LAB · SLEEP THREAD"} — LOGGED FROM THIS SESSION
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 4 }}>STATE</div>
            <div style={{ fontSize: 14, color: s.accent }}>{s.label}</div>
          </div>
          <div style={{ flex: "1 1 140px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 4 }}>LANE</div>
            <div style={{ fontSize: 14, color: COLORS.ink }}>EEG · Phase 1</div>
          </div>
          <div style={{ flex: "1 1 140px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 4 }}>TRIFECTA LAYER</div>
            <div style={{ fontSize: 14, color: COLORS.ink }}>
              {mode === "workload" && activeKey === "test" ? "Conscious" : "Subconscious"}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: COLORS.inkDim, lineHeight: 1.6 }}>
          Zoom-in detail map: this card is the granular view behind one thread of the tapestry. Later,
          the Behavioral and Biofeedback threads zoom into their own Genius charts the same way — same
          profile, same timeline, more threads, not a rebuild.
        </div>
      </div>
    </div>
  );
}
