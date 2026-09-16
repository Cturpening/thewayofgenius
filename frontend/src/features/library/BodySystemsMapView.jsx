import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { BODY_SYSTEMS } from "./data/bodySystems";

// Fixed illustration, always -- the camera/viewport never moves here.
// "Isolating a system" and the alive/holographic feel both come from
// glow, opacity, and gradient color animating in place on one still
// picture, not from moving anything. Every interaction is a plain click
// on a category button; nothing is dragged, panned, or orbited, ever.
//
// Each system gets its own small hand-placed glyph roughly where that
// system actually sits in the body (lungs in the chest, kidneys in the
// back, etc.) instead of a generic dot -- illustrative, not medically
// precise, but recognizably that system rather than an abstract point.

const VB_W = 260, VB_H = 460;

// The body's own outline doubles as the Integumentary system's glyph --
// skin is quite literally the outer boundary, so that mapping is exact,
// not just a convenient reuse.
const BODY_OUTLINE = (
  <>
    <ellipse cx="130" cy="48" rx="27" ry="31" />
    <path d="M100 95 Q130 85 160 95 L168 250 Q130 268 92 250 Z" />
    <path d="M96 105 Q75 150 82 230 M164 105 Q185 150 178 230" />
    <path d="M113 255 L100 330 L96 440 M147 255 L160 330 L164 440" />
  </>
);

const SYSTEM_GLYPHS = {
  nervous: (
    <>
      <path d="M120 32 Q130 24 140 32 Q145 42 136 46 Q128 50 122 44 Q116 40 120 32Z" />
      <path d="M133 79 Q138 150 130 220 Q124 280 133 300" />
      <path d="M133 130 Q105 145 88 150 M133 175 Q158 188 172 185 M133 220 Q108 232 92 232 M133 260 Q155 270 168 268" />
    </>
  ),
  skeletal: (
    <>
      <ellipse cx="130" cy="48" rx="18" ry="21" />
      <path d="M126 80 L126 300" />
      {[100, 118, 136, 154, 172, 190, 208, 226].map((y) => <line key={y} x1="118" y1={y} x2="134" y2={y} />)}
      <path d="M100 108 Q130 100 160 108 M96 128 Q130 118 164 128" />
      <path d="M108 260 L152 260 L146 278 L114 278 Z" />
      <path d="M96 105 Q75 150 82 230 M164 105 Q185 150 178 230 M113 255 L100 330 L96 440 M147 255 L160 330 L164 440" />
    </>
  ),
  muscular: (
    <>
      <path d="M92 130 Q86 165 90 200 M168 130 Q174 165 170 200" />
      <path d="M104 260 Q98 300 100 340 M156 260 Q162 300 160 340" />
      <path d="M105 100 Q130 94 155 100" />
    </>
  ),
  integumentary: BODY_OUTLINE,
  endocrine: (
    <>
      <circle cx="130" cy="45" r="2.6" />
      <circle cx="130" cy="92" r="2.6" />
      <circle cx="118" cy="150" r="2.6" />
      <circle cx="142" cy="150" r="2.6" />
      <circle cx="130" cy="185" r="2.6" />
      <circle cx="130" cy="252" r="2.6" />
      <path d="M130 45 L130 92 L118 150 M130 92 L142 150 M130 92 L130 185 L130 252" opacity="0.6" />
    </>
  ),
  respiratory: (
    <>
      <path d="M128 108 L128 128" />
      <path d="M126 128 Q100 132 98 165 Q96 190 112 200 Q124 205 126 185 Z" />
      <path d="M134 128 Q160 132 162 165 Q164 190 148 200 Q136 205 134 185 Z" />
    </>
  ),
  cardiovascular: (
    <>
      <path d="M130 148 Q112 132 100 146 Q90 160 130 190 Q170 160 160 146 Q148 132 130 148Z" />
      <path d="M130 190 Q100 215 95 235 M130 190 Q160 215 165 235 M110 190 Q90 260 88 330 M150 190 Q170 260 172 330" opacity="0.55" />
    </>
  ),
  lymphatic: (
    <>
      <circle cx="115" cy="88" r="2.2" /><circle cx="145" cy="88" r="2.2" />
      <circle cx="94" cy="145" r="2.2" /><circle cx="166" cy="145" r="2.2" />
      <circle cx="118" cy="252" r="2.2" /><circle cx="142" cy="252" r="2.2" />
      <path d="M115 88 Q100 110 94 145 Q98 190 118 252 M145 88 Q160 110 166 145 Q162 190 142 252" strokeDasharray="2 4" opacity="0.6" />
    </>
  ),
  digestive: (
    <>
      <ellipse cx="120" cy="168" rx="14" ry="10" transform="rotate(-20 120 168)" />
      <path d="M145 158 Q158 162 156 178 Q154 190 140 188 Z" />
      <path d="M112 182 Q100 195 112 205 Q124 215 116 228 Q108 240 122 248 Q136 254 130 240 Q142 236 134 222 Q148 216 138 204 Q150 196 138 188" />
    </>
  ),
  urinary: (
    <>
      <path d="M108 195 Q100 205 106 218 Q112 228 120 220 Q118 205 108 195Z" />
      <path d="M152 195 Q160 205 154 218 Q148 228 140 220 Q142 205 152 195Z" />
      <path d="M114 220 Q122 250 128 262 M146 220 Q138 250 132 262" opacity="0.6" />
      <ellipse cx="130" cy="270" rx="10" ry="9" />
    </>
  ),
  reproductive: (
    <>
      <ellipse cx="130" cy="272" rx="13" ry="10" />
    </>
  ),
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
        Reference — real physiology, not client data. The picture never moves -- pick a system below and
        it lights up in place; everything else settles back. Tap a substructure or signal in the box to go
        deeper.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {BODY_SYSTEMS.map((s) => (
          <button
            key={s.key}
            onClick={() => pickSystem(s.key)}
            style={{
              padding: "6px 13px", borderRadius: 999,
              border: `1px solid ${systemKey === s.key ? s.color : COLORS.grid}`,
              background: systemKey === s.key ? `${s.color}22` : "transparent",
              color: systemKey === s.key ? s.color : COLORS.inkDim,
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{
          position: "relative", width: 260, height: 420,
          background: `radial-gradient(ellipse at 50% 38%, ${system.color}1c, ${COLORS.bg} 72%)`,
          borderRadius: 16, border: `1px solid ${COLORS.grid}`, flexShrink: 0,
        }}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="260" height="420" style={{ position: "absolute", top: 0, left: 0 }}>
            <defs>
              {BODY_SYSTEMS.map((s) => (
                <linearGradient key={s.key} id={`sysgrad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.35" />
                </linearGradient>
              ))}
            </defs>

            {/* faint body outline as a constant anchor, always visible regardless of selection */}
            <g fill="none" stroke={COLORS.grid} strokeWidth="1" opacity="0.5">{BODY_OUTLINE}</g>

            {/* every system rendered at low rest-opacity so the whole body always reads as "alive,"
                then the selected one lifts to full opacity with a slow pulse and the rest dim further */}
            {BODY_SYSTEMS.map((s) => {
              const isSel = systemKey === s.key;
              return (
                <g
                  key={s.key}
                  fill="none"
                  stroke={`url(#sysgrad-${s.key})`}
                  strokeWidth={isSel ? 2 : 1}
                  strokeLinecap="round"
                  opacity={isSel ? 1 : 0.16}
                  style={{ cursor: "pointer" }}
                  onClick={() => pickSystem(s.key)}
                >
                  {isSel && <animate attributeName="opacity" values="0.75;1;0.75" dur="2.6s" repeatCount="indefinite" />}
                  {SYSTEM_GLYPHS[s.key]}
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
