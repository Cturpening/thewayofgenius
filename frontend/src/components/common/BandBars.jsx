import { BANDS, COLORS } from "../../theme/tokens";

export default function BandBars({ bandPowers }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {BANDS.map((b) => (
        <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 76, fontSize: 12, color: COLORS.inkDim, fontFamily: "Inter, sans-serif" }}>
            {b.label}
            <div style={{ fontSize: 10, opacity: 0.7 }}>{b.range}</div>
          </div>
          <div style={{ flex: 1, height: 8, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: `${bandPowers[b.key] * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.tealDim}, ${COLORS.teal})`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div style={{ width: 34, fontSize: 11, color: COLORS.ink, textAlign: "right", fontFamily: "monospace" }}>
            {(bandPowers[b.key] * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}
