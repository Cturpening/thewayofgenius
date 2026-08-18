import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { REAL_PATIENT_DATA } from "./data/realPatientData";
import BandBars from "../../components/common/BandBars";

export default function RealPatientView() {
  const channels = Object.keys(REAL_PATIENT_DATA);
  const [ch, setCh] = useState("F8");
  const d = REAL_PATIENT_DATA[ch];
  const w = 600, h = 90;
  const max = Math.max(...d.wave.map((v) => Math.abs(v))) || 1;
  const path = d.wave
    .map((v, i) => {
      const x = (i / (d.wave.length - 1)) * w;
      const y = h / 2 - (v / max) * (h / 2 - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.coral}14`, border: `1px solid ${COLORS.coralDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This is a real clinical EEG recording (Nihon Kohden system, standard 10-20 montage) — not a
        synthetic test file. The band powers below are computed with actual Welch's method, the same
        approach your original 168-feature research used, run on genuine brain signal. Patient
        identifiers from the file header are intentionally left out of this view.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {channels.map((c) => (
          <button
            key={c}
            onClick={() => setCh(c)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${ch === c ? COLORS.coral : COLORS.grid}`,
              background: ch === c ? `${COLORS.coral}22` : "transparent",
              color: ch === c ? COLORS.coral : COLORS.inkDim,
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 8, letterSpacing: 0.5 }}>
          REAL SIGNAL — CHANNEL {ch} — {d.sr} Hz — CLINICAL RECORDING
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={COLORS.grid} strokeWidth="1" />
          <path d={path} fill="none" stroke={COLORS.teal} strokeWidth="1.4" opacity="0.9" />
        </svg>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          REAL BAND POWER — WELCH'S METHOD, {ch} (RELATIVE POWER PER BAND)
        </div>
        <BandBars bandPowers={d.band_power} />
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.ink, fontFamily: "Georgia, serif" }}>{d.peak_uv} µV</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Peak amplitude</div>
        </div>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.teal, fontFamily: "Georgia, serif" }}>{d.rms_uv} µV</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>RMS amplitude</div>
        </div>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.coral, fontFamily: "Georgia, serif" }}>
            {(d.band_power.delta * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Delta share of power</div>
        </div>
      </div>
    </div>
  );
}
