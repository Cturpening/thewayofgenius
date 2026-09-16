import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { BODY_SYSTEMS } from "./data/bodySystems";

// The flat, click-only counterpart to the Hologram map's Body Systems
// view -- same real data (function, symbolic parallel, commonly-tracked
// vitals, real substructures, signal points), but every interaction is a
// plain click on a shape or a button. No drag-to-orbit, no camera, no
// mouse movement required at all -- same pattern as this tab's other flat
// views (SymbolBodyMapView, SymbolConstellation, InnerTeamView): click a
// point, a fixed box on the right updates immediately.

// Hand-placed, illustrative positions on the shared body outline (same
// outline as SymbolBodyMapView) -- there's no anatomically "correct" 2D
// spot for something like the endocrine system as a whole, so these are
// spread for legibility, roughly following where each system is felt.
const SYSTEM_POSITION_2D = {
  nervous: { cx: 150, cy: 34 },
  endocrine: { cx: 150, cy: 76 },
  integumentary: { cx: 196, cy: 96 },
  lymphatic: { cx: 104, cy: 116 },
  respiratory: { cx: 128, cy: 142 },
  cardiovascular: { cx: 168, cy: 142 },
  digestive: { cx: 150, cy: 182 },
  urinary: { cx: 150, cy: 214 },
  reproductive: { cx: 150, cy: 236 },
  muscular: { cx: 120, cy: 276 },
  skeletal: { cx: 180, cy: 276 },
};

export default function BodySystemsMapView() {
  const [systemKey, setSystemKey] = useState("nervous");
  const [subKey, setSubKey] = useState(null);
  const [signalIdx, setSignalIdx] = useState(null);

  const system = BODY_SYSTEMS.find((s) => s.key === systemKey);
  const sub = subKey ? system.substructures.find((x) => x.key === subKey) : null;

  const pickSystem = (key) => { setSystemKey(key); setSubKey(null); setSignalIdx(null); };
  const pickSub = (key) => { setSubKey(key); setSignalIdx(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Reference — real physiology, not client data. Tap a point on the body for that system, then tap a
        substructure or signal in the box to go deeper -- everything here is a plain click, nothing to
        drag or navigate.
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{
          position: "relative", width: 300, height: 320,
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.coral}18, ${COLORS.bg} 70%)`,
          borderRadius: 16, border: `1px solid ${COLORS.grid}`, flexShrink: 0,
        }}>
          <svg viewBox="0 0 300 320" width="300" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
            {/* same holographic-style body outline as the Symbolic body map, for visual consistency */}
            <ellipse cx="150" cy="42" rx="26" ry="30" fill="none" stroke={COLORS.coral} strokeWidth="1.2" opacity="0.5" />
            <path d="M 150 72 L 150 260 M 105 110 Q 90 160 100 230 M 195 110 Q 210 160 200 230 M 130 260 L 118 310 M 170 260 L 182 310"
              fill="none" stroke={COLORS.coral} strokeWidth="1.2" opacity="0.5" />
            <path d="M 118 100 Q 150 90 182 100 L 190 230 Q 150 245 110 230 Z" fill="none" stroke={COLORS.coral} strokeWidth="1" opacity="0.3" />
            {BODY_SYSTEMS.map((s) => {
              const pos = SYSTEM_POSITION_2D[s.key];
              const isSel = systemKey === s.key;
              return (
                <g key={s.key} style={{ cursor: "pointer" }} onClick={() => pickSystem(s.key)}>
                  <circle cx={pos.cx} cy={pos.cy} r={isSel ? 13 : 9} fill={`${s.color}44`} stroke={s.color} strokeWidth={isSel ? 2.5 : 1.5}>
                    {isSel && <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />}
                  </circle>
                  <circle cx={pos.cx} cy={pos.cy} r="3" fill={s.color} />
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ flex: "1 1 260px", minWidth: 260, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11.5, marginBottom: 12 }}>
            <button
              onClick={() => pickSystem(systemKey)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: sub ? COLORS.inkDim : COLORS.coral, fontWeight: sub ? 400 : 600 }}
            >
              {system.label}
            </button>
            {sub && (
              <>
                <span style={{ color: COLORS.inkDim }}>›</span>
                <button
                  onClick={() => setSignalIdx(null)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: signalIdx === null ? COLORS.coral : COLORS.inkDim, fontWeight: signalIdx === null ? 600 : 400 }}
                >
                  {sub.label}
                </button>
              </>
            )}
            {signalIdx !== null && (
              <>
                <span style={{ color: COLORS.inkDim }}>›</span>
                <span style={{ color: COLORS.coral, fontWeight: 600 }}>{system.signalLabel || "Signal"} {signalIdx + 1}</span>
              </>
            )}
          </div>

          {signalIdx !== null && sub ? (
            <>
              <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>ILLUSTRATIVE — SCALE, NOT A REAL SCAN</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: system.color, marginBottom: 10 }}>{system.signalLabel || "Signal"} {signalIdx + 1}</div>
              <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
                This is as deep as it goes -- a single signal in the {sub.label.toLowerCase()}, the same
                pattern your symbols and story keep circling back to at the surface.
              </div>
            </>
          ) : sub ? (
            <>
              <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>REFERENCE — REAL ANATOMY, NOT CLIENT DATA</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: system.color, marginBottom: 10 }}>{sub.label}</div>
              <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>{sub.function}</div>
              <div style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>OFTEN SHOWS UP SYMBOLICALLY AS</div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{sub.symbolicParallel}</div>
              </div>
              <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 6 }}>TAP A {(system.signalLabel || "SIGNAL").toUpperCase()} TO GO DEEPER</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setSignalIdx(i)}
                    style={{ padding: "5px 12px", borderRadius: 14, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 11, cursor: "pointer" }}
                  >
                    {system.signalLabel || "Signal"} {i + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.4, marginBottom: 6 }}>REFERENCE — REAL PHYSIOLOGY, NOT CLIENT DATA</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: system.color, marginBottom: 10 }}>{system.label}</div>
              <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 12, lineHeight: 1.5 }}>{system.function}</div>
              <div style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>OFTEN SHOWS UP SYMBOLICALLY AS</div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>{system.symbolicParallel}</div>
              </div>
              {system.commonlyTracked?.length > 0 && (
                <div style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 6 }}>COMMONLY TRACKED HERE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {system.commonlyTracked.map((item) => (
                      <div key={item} style={{ fontSize: 11.5, color: COLORS.ink }}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 6 }}>REAL SUBSTRUCTURES — TAP ONE</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {system.substructures.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => pickSub(s.key)}
                    style={{ padding: "5px 12px", borderRadius: 14, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 11, cursor: "pointer" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
