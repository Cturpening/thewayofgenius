import { COLORS } from "../../theme/tokens";
import PlannedLaneCard from "../../components/common/PlannedLaneCard";
import BehavioralScienceView from "../follow-through/BehavioralScienceView";

export default function OtherLanesView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        The remaining lanes from the full architecture — placeholders, not built. No numbers invented
        for these; they wait until real data or a real partnership exists, same rule as everywhere else
        in this prototype.
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <PlannedLaneCard
          name="Environmental (Vanessa's Lane)"
          color={COLORS.inkDim}
          desc="Vanessa Valore's lane, via SandboxLife API — cognitive load, environmental inputs. NDA signed between both teams; no data flowing yet. Separate from the Behavioral Sciences track below, which is her own."
        />
        <PlannedLaneCard
          name="HRV (Device-Assisted)"
          color={COLORS.inkDim}
          desc="hrv_rmssd, hrv_sdnn, lf_hf_ratio — Phase 2 of the Biofeedback Lab, cross-referenced against the symbolic map already built."
        />
        <PlannedLaneCard
          name="ECG"
          color={COLORS.inkDim}
          desc="Extends the biofeedback lane with cardiac signal — later-stage per the two-year roadmap."
        />
      </div>

      <BehavioralScienceView />

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Gene Panels has its own dedicated tab now — see "Genetics + Subconscious Interface" — since it's
        being built as an open, two-sided category rather than a flat placeholder.
      </div>
    </div>
  );
}
