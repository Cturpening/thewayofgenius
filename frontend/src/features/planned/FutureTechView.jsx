import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { FUTURE_TECH, RESEARCH_STAGE_1 } from "./data/futureTechData";

export default function FutureTechView() {
  const [openKey, setOpenKey] = useState("band");
  const open = FUTURE_TECH.find((t) => t.key === openKey);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        The Edin Ecosystem, ahead of where the Dojo is today — real roadmap, clearly marked as not yet
        built. Every phase here trains and proves out on the software/research side first; hardware ships
        when it's actually ready, not before.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 1, marginBottom: 4 }}>
          RESEARCH STAGE 1 — WHERE THE METHODS ARE RIGHT NOW
        </div>
        <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.5, marginBottom: 14 }}>
          Distinct from the hardware Phase 1-3 rollout below — this is the data/research track: which
          modalities are currently being introduced through research, not which product ships next.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RESEARCH_STAGE_1.map((m) => (
            <div key={m.name} style={{
              display: "flex", alignItems: "center", gap: 6,
              border: `1px solid ${m.color}55`, background: `${m.color}14`,
              borderRadius: 999, padding: "6px 12px",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
              <span style={{ fontSize: 12, color: COLORS.ink }}>{m.name}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 12, fontStyle: "italic" }}>
          All six: Research Stage 1 — introducing research now, methods being proven out before any
          consumer product claim is made.
        </div>
      </div>

      <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 1, marginTop: 4 }}>
        PRODUCT ROLLOUT — PHASE 1-3 (HARDWARE)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {FUTURE_TECH.map((t) => (
          <div
            key={t.key}
            onClick={() => setOpenKey(t.key)}
            style={{
              cursor: "pointer", borderRadius: 16, overflow: "hidden",
              border: `1px solid ${openKey === t.key ? t.color : COLORS.grid}`,
              background: openKey === t.key
                ? `linear-gradient(135deg, ${t.color}22, ${COLORS.bgPanel})`
                : COLORS.bgPanel,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ padding: "18px 22px" }}>
              <div style={{ fontSize: 10, color: t.color, letterSpacing: 1.5, marginBottom: 6 }}>{t.phase}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 13.5, color: t.color, fontStyle: "italic", marginBottom: openKey === t.key ? 14 : 0 }}>{t.tagline}</div>

              {openKey === t.key && (
                <>
                  <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.65, marginBottom: 16 }}>
                    {t.body}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {t.points.map((p) => (
                      <div key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: t.color, fontSize: 13, lineHeight: 1.5 }}>✦</span>
                        <span style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.bgPanelAlt, borderRadius: 12, padding: "14px 18px", fontSize: 12, color: COLORS.inkDim, lineHeight: 1.6, fontStyle: "italic" }}>
        Why this sequencing: the Dojo trains and proves the methods on real users and real research
        (Origin Point Missions) right now, with zero dependency on hardware existing yet. Each phase after
        it ships only once it's genuinely ready — not rushed to hit a roadmap date.
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${COLORS.gold}18, ${COLORS.teal}12)`,
        border: `1px solid ${COLORS.gold}55`, borderRadius: 12, padding: "16px 20px",
      }}>
        <div style={{ fontSize: 10, color: COLORS.gold, letterSpacing: 1, marginBottom: 8 }}>
          FOR INVESTORS & PARTNERS
        </div>
        <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.7 }}>
          The regulatory and hardware landscape around this space is still catching up — genetic data
          law, consumer EEG cost, extreme-environment wearable manufacturing all still moving. We're not
          waiting on that to start proving the method. Real data, real research, real training happens
          now, on the software side, with real users — while the vision for what this becomes stays
          clear and undiluted the whole way through. Hardware and full regulatory clarity arrive on
          their own timeline; the methodology doesn't wait for either one.
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.ink, marginBottom: 4 }}>
          How It All Fits Together
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkDim, marginBottom: 16, lineHeight: 1.5 }}>
          Three layers, one loop — not three separate efforts.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            {
              label: "The Methods",
              color: COLORS.gold,
              desc: "The real, proprietary coaching curriculum — dreamwork, the Biofeedback Lab, Metacognitive Training, the Four-Stream framework. Authored, owned, and continuously updated by Chelsey Turpening Coxsey.",
            },
            {
              label: "The Research",
              color: COLORS.teal,
              desc: "Origin Point Missions — the Cognitive Systems Research Initiative that proves those methods work, on a real cohort (space professionals), with real EEG/sleep-state/biofeedback/behavioral/gut-brain data, co-run with Sandbox Life.",
            },
            {
              label: "The Tech Ecosystem",
              color: "#8e7ad1",
              desc: "Edin's Psyche Dojo today, then the Band, then the VR Headset, then Consumer EEG when it's ready — the product layer that eventually ships what the research already proved.",
            },
          ].map((layer, i, arr) => (
            <div key={layer.label}>
              <div style={{
                background: COLORS.bgPanel, borderRadius: 12, padding: "14px 18px",
                borderLeft: `3px solid ${layer.color}`,
              }}>
                <div style={{ fontSize: 13, color: layer.color, marginBottom: 4 }}>{layer.label}</div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{layer.desc}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ textAlign: "center", fontSize: 14, color: COLORS.inkDim, padding: "4px 0" }}>↓</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 12, fontStyle: "italic", lineHeight: 1.5 }}>
          It loops back, too: what the research and the product surface in real use feeds back into
          refining the methods themselves — same as everything else in this system, nothing here is
          one-directional.
        </div>
      </div>
    </div>
  );
}
