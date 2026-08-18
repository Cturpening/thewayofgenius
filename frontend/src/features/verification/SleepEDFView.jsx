import { COLORS, STAGE_COLORS, STAGE_ORDER } from "../../theme/tokens";
import { SLEEPEDF_DATA } from "./data/sleepEdfData";
import BandBars from "../../components/common/BandBars";

export default function SleepEDFView() {
  const { epochs, summary } = SLEEPEDF_DATA;
  const w = 700, h = 130;
  const t0 = epochs[0].t, t1 = epochs[epochs.length - 1].t;
  const trackPath = (key) =>
    epochs
      .map((e, i) => {
        const x = ((e.t - t0) / (t1 - t0)) * w;
        const y = h - 10 - STAGE_ORDER[e.stage] * ((h - 20) / 3);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        A real overnight recording from PhysioNet's Sleep-EDF database (subject SC4001, first night),
        with sleep stages hand-scored by real technicians. {epochs.length} real 30-second epochs, each
        run through actual Welch's PSD — the same method as your original research — with the real
        scored label attached. This is the strongest validation the prototype has right now.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 10, letterSpacing: 0.5 }}>
          REAL HYPNOGRAM — {(epochs.length * 30 / 60).toFixed(0)} MINUTES, TECHNICIAN-SCORED
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
          {Object.keys(STAGE_ORDER).map((k) => (
            <line
              key={k}
              x1="0" x2={w}
              y1={h - 10 - STAGE_ORDER[k] * ((h - 20) / 3)}
              y2={h - 10 - STAGE_ORDER[k] * ((h - 20) / 3)}
              stroke={COLORS.grid} strokeWidth="1"
            />
          ))}
          <path d={trackPath()} fill="none" stroke={COLORS.teal} strokeWidth="1.8" />
          {Object.entries(STAGE_ORDER).map(([k, v]) => (
            <text key={k} x="4" y={h - 10 - v * ((h - 20) / 3) - 4} fontSize="9" fill={COLORS.inkDim}>{k}</text>
          ))}
        </svg>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          REAL AVERAGE BAND POWER PER SLEEP STAGE (FROM TRAINING PORTION)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(summary.centroids).map(([stage, bp]) => (
            <div key={stage}>
              <div style={{ fontSize: 12, color: STAGE_COLORS[stage], marginBottom: 4 }}>{stage}</div>
              <BandBars bandPowers={bp} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 22, color: COLORS.teal, fontFamily: "Georgia, serif" }}>{summary.test_accuracy}%</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>
            Real classifier accuracy — nearest-centroid, 4 bands only, tested on {summary.n_test} held-out epochs
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.6 }}>
        Honest context: this is a deliberately simple classifier (4 band-power features, nearest-centroid —
        not the full 168-dimensional engine, not a personalized model) so {summary.test_accuracy}% is a
        real but modest first pass, not a final number. Your original research's 94-99% came from the
        full feature set plus per-subject personalization — this confirms the same underlying signal is
        genuinely present in real data, which is what this step needed to prove.
      </div>
    </div>
  );
}
