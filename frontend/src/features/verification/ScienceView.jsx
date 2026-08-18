import { BANDS, COLORS } from "../../theme/tokens";
import WaveSVG from "../../components/common/WaveSVG";
import BandBars from "../../components/common/BandBars";
import ConfidenceGauge from "../../components/common/ConfidenceGauge";

export default function ScienceView({ mode, states, activeKey, setActiveKey }) {
  const keys = Object.keys(states);
  const acc = mode === "workload" ? 0.99 : 0.94;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
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
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {states[k].label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 8, letterSpacing: 0.5 }}>
            RAW SIGNAL — REPRESENTATIVE WAVEFORM
          </div>
          <WaveSVG bandPowers={states[activeKey]} seed={activeKey.length * 97 + 3} color={states[activeKey].accent} />
        </div>
        <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <ConfidenceGauge value={0.86 + (activeKey.length % 3) * 0.04} color={states[activeKey].accent} />
          <div style={{ fontSize: 12, color: COLORS.ink, marginTop: 6, fontFamily: "Inter, sans-serif" }}>
            {states[activeKey].label}
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          BAND POWER — 168-DIM FEATURE VECTOR (SIMPLIFIED TO 4 BANDS)
        </div>
        <BandBars bandPowers={states[activeKey]} />
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 22, color: COLORS.teal, fontFamily: "Georgia, serif" }}>{(acc * 100).toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Personalized model accuracy</div>
        </div>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 22, color: COLORS.coral, fontFamily: "Georgia, serif" }}>
            {mode === "workload" ? "94%" : "~93%*"}
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>
            {mode === "workload" ? "Global (one-size-fits-all) baseline" : "Global baseline, days 1–6"}
          </div>
        </div>
      </div>
    </div>
  );
}
