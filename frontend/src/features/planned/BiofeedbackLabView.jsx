import { Fragment, useState } from "react";
import { COLORS } from "../../theme/tokens";
import { BIOFEEDBACK_STEPS } from "./data/biofeedbackSteps";

export default function BiofeedbackLabView() {
  const [step, setStep] = useState(0);
  const s = BIOFEEDBACK_STEPS[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.teal}12`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This is your actual Biofeedback Lab protocol — five real steps, already used with real clients,
        symbolic and story-based by design. No device, no numbers yet — that comes later, cross-referenced
        against the map built here. The example running through all five steps (the locked door) is
        invented for illustration — not drawn from any real client's story.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Phase 1 — Symbolic-Somatic Mapping", status: "You are here", color: COLORS.teal },
          { label: "Phase 2 — Device-Assisted Correlation", status: "Planned", color: COLORS.gold },
          { label: "Phase 3 — Device-Independent Mastery", status: "Planned", color: COLORS.inkDim },
        ].map((p) => (
          <div key={p.label} style={{
            flex: "1 1 180px", borderRadius: 10, padding: "10px 12px",
            border: `1px solid ${p.status === "You are here" ? p.color : COLORS.grid}`,
            background: p.status === "You are here" ? `${p.color}14` : "transparent",
          }}>
            <div style={{ fontSize: 11.5, color: p.status === "You are here" ? p.color : COLORS.ink }}>{p.label}</div>
            <div style={{ fontSize: 9.5, color: COLORS.inkDim, marginTop: 2, letterSpacing: 0.5 }}>{p.status.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5, fontStyle: "italic" }}>
        Corrected sequencing: symbolic-somatic work is the true entry point (Phase 1, below) — device data
        (HRV, breath) is introduced later in Phase 2 as a deepening/validation layer, not the starting
        point. The Phase 2→3 transition — reproducing regulation without the device — is the outcome that
        actually matters.
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>
        The "psyche-part" language is inspired by Richard Schwartz's Internal Family Systems model,
        credited as such in her book's "IFS Games" chapter — her own applied, non-clinical exploration
        of the idea, not a claim of IFS training, certification, or formal delivery.
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {BIOFEEDBACK_STEPS.map((st, i) => (
          <button
            key={st.title}
            onClick={() => setStep(i)}
            style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: `1px solid ${step === i ? st.color : COLORS.grid}`,
              background: step === i ? `${st.color}22` : "transparent",
              color: step === i ? st.color : COLORS.inkDim,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {i + 1}. {st.title}
          </button>
        ))}
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ fontSize: 11, color: s.color, letterSpacing: 1, marginBottom: 8 }}>
          STEP {step + 1} OF 5
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: COLORS.ink, marginBottom: 12 }}>
          {s.title}
        </div>
        <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, marginBottom: s.prompt ? 16 : 0 }}>
          {s.desc}
        </div>
        {s.prompt && (
          <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic", borderLeft: `2px solid ${s.color}`, marginBottom: s.example ? 14 : 0 }}>
            {s.prompt}
          </div>
        )}
        {s.example && (
          <div>
            <div style={{ fontSize: 10, color: s.color, letterSpacing: 0.5, marginBottom: 6 }}>
              ILLUSTRATIVE EXAMPLE — INVENTED, NOT REAL CLIENT DATA
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>{s.example}</div>
          </div>
        )}
      </div>

      {step === 2 && (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
            EXAMPLE MAP ENTRY (ILLUSTRATIVE — INVENTED, NOT REAL CLIENT DATA)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Symbol", "A locked door"],
              ["Emotional tone", "Apprehension, curiosity"],
              ["Story", "Recurring across three sessions, always before a decision point"],
              ["Alchemized meaning", "Not a barrier — a threshold waiting for readiness"],
              ["Linked psyche-part", "\"The Cautious One\""],
            ].map(([k, v]) => (
              <Fragment key={k}>
                <div style={{ fontSize: 11, color: COLORS.inkDim }}>{k}</div>
                <div style={{ fontSize: 12, color: COLORS.ink }}>{v}</div>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: step === 0 ? COLORS.grid : COLORS.inkDim, cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setStep(Math.min(4, step + 1))}
          disabled={step === 4}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${s.color}`, background: `${s.color}22`, color: step === 4 ? COLORS.grid : s.color, cursor: step === 4 ? "default" : "pointer", fontSize: 12 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
