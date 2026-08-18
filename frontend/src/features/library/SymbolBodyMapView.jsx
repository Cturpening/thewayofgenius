import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { BODY_SYMBOLS } from "./data/bodySymbols";

export default function SymbolBodyMapView() {
  const [selected, setSelected] = useState("chest");
  const sym = BODY_SYMBOLS.find((s) => s.key === selected);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Illustrative — invented for this demo, but the shape is real: your Analytical Methods spec
        already has a somatic_location field for every dream/biofeedback entry. This just gives it a
        body to live on. Tap a point to zoom into that symbol's real-shaped history.
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{
          position: "relative", width: 300, height: 320,
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.teal}18, ${COLORS.bg} 70%)`,
          borderRadius: 16, border: `1px solid ${COLORS.grid}`, flexShrink: 0,
        }}>
          <svg viewBox="0 0 300 320" width="300" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
            {/* simple holographic-style body outline */}
            <ellipse cx="150" cy="42" rx="26" ry="30" fill="none" stroke={COLORS.teal} strokeWidth="1.2" opacity="0.5" />
            <path d="M 150 72 L 150 260 M 105 110 Q 90 160 100 230 M 195 110 Q 210 160 200 230 M 130 260 L 118 310 M 170 260 L 182 310"
              fill="none" stroke={COLORS.teal} strokeWidth="1.2" opacity="0.5" />
            <path d="M 118 100 Q 150 90 182 100 L 190 230 Q 150 245 110 230 Z" fill="none" stroke={COLORS.teal} strokeWidth="1" opacity="0.3" />
            {BODY_SYMBOLS.map((s) => (
              <g key={s.key} style={{ cursor: "pointer" }} onClick={() => setSelected(s.key)}>
                <circle cx={s.cx} cy={s.cy} r={selected === s.key ? 13 : 9} fill={`${s.color}44`} stroke={s.color} strokeWidth={selected === s.key ? 2.5 : 1.5}>
                  {selected === s.key && <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />}
                </circle>
                <circle cx={s.cx} cy={s.cy} r="3" fill={s.color} />
              </g>
            ))}
          </svg>
        </div>

        <div style={{ flex: "1 1 260px", minWidth: 260, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: sym.color, marginBottom: 4 }}>{sym.label}</div>
          <div style={{ fontSize: 13, color: COLORS.ink, fontStyle: "italic", marginBottom: 14 }}>"{sym.symbol}"</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: COLORS.inkDim }}>FIRST SEEN</div>
              <div style={{ fontSize: 12, color: COLORS.ink }}>{sym.firstSeen}</div>
            </div>
            <div style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: COLORS.inkDim }}>RECURRENCE</div>
              <div style={{ fontSize: 12, color: COLORS.ink }}>{sym.recurrence}</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 4 }}>EMOTIONAL TONE</div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14 }}>{sym.tone}</div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 4 }}>HOW THE SUBCONSCIOUS/BODY USES IT</div>
          <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5, marginBottom: 14 }}>{sym.bioNote}</div>

          <div style={{ background: `${sym.color}18`, borderRadius: 8, padding: "8px 12px", fontSize: 11.5, color: COLORS.ink }}>
            Linked goal: <span style={{ color: sym.color }}>{sym.goal}</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5, fontStyle: "italic" }}>
        True 3D/holographic rendering (vs. this flat glow-style map) would be a bigger build — and
        interestingly, your own site already lists an Edin-integrated VR headset as a real future
        product. This 2D version proves the concept the same way everything else here has.
      </div>

      <div style={{ background: `${COLORS.violet}14`, border: `1px dashed ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: COLORS.inkDim }}>
        <span style={{ color: COLORS.violet }}>COMING NEXT — Parts Identity Chart:</span> each named
        psyche-part gets its own profile — story, feelings, role, historical hurt/help, current
        healed/evolving status, and how it's active in daily life now. Waiting on more rehearsal
        material before building it out.
      </div>
    </div>
  );
}
