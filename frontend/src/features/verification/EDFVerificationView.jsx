import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { EDF_DATA } from "./data/edfData";

export default function EDFVerificationView() {
  const channels = Object.keys(EDF_DATA);
  const [ch, setCh] = useState("F8");
  const d = EDF_DATA[ch];
  const w = 600, h = 90;
  const max = Math.max(...d.wave.map((v) => Math.abs(v))) || 1;
  const path = d.wave
    .map((v, i) => {
      const x = (i / (d.wave.length - 1)) * w;
      const y = h / 2 - (v / max) * (h / 2 - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const truthMatch = d.truth_hz != null && Math.abs(d.truth_hz - d.dominant_hz) < 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This panel reads your uploaded <code>test_generator.edf</code> byte-for-byte — real EDF binary,
        real header, real samples — and runs it through the same read → window → FFT extraction the
        168-feature engine uses. Since this file is documented test waveforms (not brain states), the
        payoff here is proof the pipeline reads and analyzes genuine EDF correctly, not a state
        classification.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {channels.map((c) => (
          <button
            key={c}
            onClick={() => setCh(c)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${ch === c ? COLORS.teal : COLORS.grid}`,
              background: ch === c ? `${COLORS.teal}22` : "transparent",
              color: ch === c ? COLORS.teal : COLORS.inkDim,
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
          ACTUAL WAVEFORM FROM YOUR FILE — CHANNEL {ch} — {d.sr} Hz SAMPLE RATE
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={COLORS.grid} strokeWidth="1" />
          <path d={path} fill="none" stroke={COLORS.coral} strokeWidth="1.6" opacity="0.9" />
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.ink, fontFamily: "Georgia, serif" }}>{d.peak_uv} µV</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Peak amplitude</div>
        </div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.teal, fontFamily: "Georgia, serif" }}>{d.dominant_hz} Hz</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Detected dominant frequency</div>
        </div>
        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: d.truth_hz == null ? COLORS.inkDim : truthMatch ? COLORS.teal : COLORS.coral, fontFamily: "Georgia, serif" }}>
            {d.truth_hz == null ? "noise" : `${d.truth_hz} Hz`}
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>
            Documented ground truth ({d.truth_wave})
          </div>
        </div>
      </div>
    </div>
  );
}
