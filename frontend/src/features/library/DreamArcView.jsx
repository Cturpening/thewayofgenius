import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { ARC_HISTORY } from "./data/dreamArcData";

export default function DreamArcView() {
  const [selected, setSelected] = useState(ARC_HISTORY.length - 1);
  const point = ARC_HISTORY[selected];
  const stageColor = { Emerging: COLORS.gold, Active: COLORS.coral, "Arc Complete": COLORS.teal };
  const w = 640, h = 140;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Illustrative — invented example, real field structure. Tracks one theme (the same locked-door
        thread from the Biofeedback Lab) through your real Arc_Status stages, with the Fibonacci spiral
        depth increasing on each full return — not just recurrence count.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14, letterSpacing: 0.5 }}>
          ARC PROGRESSION — THE LOCKED DOOR THEME
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
          <line x1="30" y1="70" x2={w - 30} y2="70" stroke={COLORS.grid} strokeWidth="1.5" />
          {ARC_HISTORY.map((p, i) => {
            const x = 30 + (i / (ARC_HISTORY.length - 1)) * (w - 60);
            const isSel = i === selected;
            const r = 8 + p.fibonacci_depth * 3;
            return (
              <g key={i} style={{ cursor: "pointer" }} onClick={() => setSelected(i)}>
                <circle cx={x} cy="70" r={r} fill={`${stageColor[p.stage]}33`} stroke={stageColor[p.stage]} strokeWidth={isSel ? 2.5 : 1.5} />
                <text x={x} y="70" textAnchor="middle" dy="4" fontSize="9" fill={stageColor[p.stage]}>{p.fibonacci_depth}</text>
                <text x={x} y="95" textAnchor="middle" fontSize="9.5" fill={isSel ? COLORS.ink : COLORS.inkDim}>{p.date}</text>
                <text x={x} y="45" textAnchor="middle" fontSize="9" fill={stageColor[p.stage]}>{p.stage}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 4 }}>
          Circle size = Fibonacci spiral depth (how many full returns), not just recurrence count.
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: stageColor[point.stage] }}>{point.date} — {point.stage}</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Spiral depth: {point.fibonacci_depth}</div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>{point.note}</div>
      </div>

      {point.stage === "Arc Complete" && (
        <div style={{
          background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 12,
          padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 13, color: COLORS.gold, marginBottom: 4 }}>A real perspective shift just landed here.</div>
            <div style={{ fontSize: 11.5, color: COLORS.ink, lineHeight: 1.5 }}>
              Perspective changes → belief changes → action changes. Your Genius Constitution is a living
              document, not a one-time result — an Arc Complete moment like this one is exactly the kind
              of real milestone worth reviewing it against.
            </div>
          </div>
          <button style={{
            padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.gold,
            color: "#1C2E24", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Review My Constitution →
          </button>
        </div>
      )}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        This same arc logic applies to any theme, in any room — Biofeedback symbols, Journal entries,
        even a Metacognitive Training skill's progression. One mechanism, reused everywhere.
      </div>
    </div>
  );
}
