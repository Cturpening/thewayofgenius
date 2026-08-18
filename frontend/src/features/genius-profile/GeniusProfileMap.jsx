import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { CROSS_LINKS, NODE_EXTRAS, PROFILE_NODES } from "./data/profileNodes";
import { DOMINANT_COLOR, TRIFECTA_LAYER } from "../genius-constitution/data/constitutionData";
import { computeConstitutionResult } from "../genius-constitution/constitutionUtils";

export default function GeniusProfileMap({ setView, constitutionAnswers = [] }) {
  const [selected, setSelected] = useState("eeg");
  const [subSelected, setSubSelected] = useState(null);
  const cx = 220, cy = 220, r = 155;
  const w = 440, h = 440;
  const node = PROFILE_NODES.find((n) => n.key === selected);
  const statusColor = { live: COLORS.teal, illustrative: COLORS.gold, planned: COLORS.inkDim };
  const statusLabel = { live: "LIVE — REAL DATA", illustrative: "ILLUSTRATIVE — INVENTED", planned: "PLANNED — NO DATA YET" };
  const selectNode = (key) => { setSelected(key); setSubSelected(null); };
  const nodeToTab = { biofeedback: "biofeedback", microbiome: "microbiome", genetics: "genetics", hrv: "other" };
  const lean = computeConstitutionResult(constitutionAnswers);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This is the live Genius Profile — every thread from the architecture, in one map. Tap any node
        to zoom into what's actually there: real data where it exists, an honest "planned" where it
        doesn't, and a clearly-labeled illustrative taste for the two rooms (Journals, Metacognitive
        Training) that only existed in the vision doc until now.
      </div>

      <div style={{
        background: lean.taken ? `${DOMINANT_COLOR[lean.dominant]}14` : COLORS.bgPanelAlt,
        border: `1px solid ${lean.taken ? `${DOMINANT_COLOR[lean.dominant]}55` : COLORS.grid}`,
        borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        {lean.taken ? (
          <div>
            <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 3 }}>YOUR CURRENT LEAN</div>
            <div style={{ fontSize: 14, color: DOMINANT_COLOR[lean.dominant] }}>
              {lean.dominant.charAt(0).toUpperCase() + lean.dominant.slice(1)} — {TRIFECTA_LAYER[lean.dominant]} layer
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: COLORS.inkDim }}>
            Not yet measured — take your Genius Constitution in the Psyche Dojo to see your lean here.
          </div>
        )}
        <button
          onClick={() => setView("dojo")}
          style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.gold}`, background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {lean.taken ? "Retake in Psyche Dojo →" : "Take it in Psyche Dojo →"}
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: COLORS.ink, fontStyle: "italic", lineHeight: 1.6, borderLeft: `2px solid ${COLORS.gold}`, paddingLeft: 12 }}>
        "You are no longer simply the one experiencing your mind. You are the one working with it...
        Weaver. The one who sits at the center of a living network of information, perception, memory,
        and intelligence, and moves through it with deliberate hands." — from "Integration: The Weaver
        of Information," The Way of the Insane
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <style>{`
          @keyframes weaveLine { from { stroke-dashoffset: 500; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
          @keyframes weaveNode { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
          .weave-spoke { stroke-dasharray: 500; animation: weaveLine 0.9s ease-out forwards; }
          .weave-cross { stroke-dasharray: 500; animation: weaveLine 1.1s ease-out forwards; }
          .weave-node { animation: weaveNode 0.5s ease-out forwards; transform-origin: center; transform-box: fill-box; }
        `}</style>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{
          maxWidth: 440,
          background: `radial-gradient(ellipse at center, ${COLORS.bgPanelAlt} 0%, ${COLORS.bg} 75%)`,
          borderRadius: 16,
          border: `1px solid ${COLORS.grid}`,
        }} height={h}>
          {/* cross-connections: real relationships between lanes, investigator-board style */}
          {CROSS_LINKS.map((link, i) => {
            const a = PROFILE_NODES.find((n) => n.key === link.from);
            const b = PROFILE_NODES.find((n) => n.key === link.to);
            const radA = (a.angle * Math.PI) / 180, radB = (b.angle * Math.PI) / 180;
            const ax = cx + r * Math.cos(radA), ay = cy + r * Math.sin(radA);
            const bx = cx + r * Math.cos(radB), by = cy + r * Math.sin(radB);
            const midx = (ax + bx) / 2, midy = (ay + by) / 2;
            return (
              <g key={i}>
                <line className="weave-cross" x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={link.color} strokeWidth="1" strokeDasharray="4 3" opacity="0.55"
                  style={{ animationDelay: `${0.6 + i * 0.15}s` }} />
                <text x={midx} y={midy} fontSize="8" fill={COLORS.inkDim} textAnchor="middle"
                  style={{ paintOrder: "stroke", stroke: COLORS.bg, strokeWidth: 3 }}>
                  {link.label}
                </text>
              </g>
            );
          })}

          {PROFILE_NODES.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            const isSel = selected === n.key;
            return (
              <line key={n.key + "-line"} className="weave-spoke" x1={cx} y1={cy} x2={x} y2={y}
                stroke={n.color} strokeWidth={isSel ? 2.5 : 1.3} opacity={n.status === "planned" ? 0.35 : 0.8}
                style={{ animationDelay: `${i * 0.1}s` }} />
            );
          })}
          <circle cx={cx} cy={cy} r="46" fill={COLORS.bgPanelAlt} stroke={COLORS.ink} strokeWidth="1.4" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fill={COLORS.ink} fontFamily="Georgia, serif">Genius</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="12" fill={COLORS.ink} fontFamily="Georgia, serif">Profile</text>

          {PROFILE_NODES.map((n, i) => {
            const rad = (n.angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            const isSel = selected === n.key;
            return (
              <g key={n.key} className="weave-node" style={{ cursor: "pointer", animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }} onClick={() => selectNode(n.key)}>
                <circle cx={x} cy={y} r={isSel ? 15 : 11} fill={n.status === "planned" ? COLORS.bgPanelAlt : `${n.color}33`} stroke={n.color} strokeWidth={isSel ? 2.5 : 1.5} />
                {n.status === "live" && <circle cx={x} cy={y} r={isSel ? 15 : 11} fill="none" stroke={n.color} strokeWidth="0.8" opacity="0.4" />}
                <text
                  x={x + (Math.cos(rad) >= 0 ? 18 : -18)}
                  y={y + (Math.sin(rad) >= 0 ? 5 : 5)}
                  fontSize="11" fill={isSel ? n.color : COLORS.ink} fontWeight={isSel ? "600" : "400"}
                  textAnchor={Math.cos(rad) >= 0 ? "start" : "end"}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 260px", minWidth: 260, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: node.color }}>{node.label}</div>
            <div style={{ fontSize: 9, color: statusColor[node.status], letterSpacing: 0.4 }}>{statusLabel[node.status]}</div>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>{node.detail}</div>

          <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 18, color: node.color, fontFamily: "Georgia, serif" }}>{node.stat}</div>
            <div style={{ fontSize: 10.5, color: COLORS.inkDim }}>{node.statLabel}</div>
          </div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5, marginBottom: node.key === "journals" || node.key === "metacog" ? 14 : 0 }}>
            {node.note}
          </div>

          {node.key === "journals" && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: COLORS.ink, fontStyle: "italic", lineHeight: 1.5, marginBottom: 8, borderLeft: `2px solid ${node.color}`, paddingLeft: 10 }}>
                {NODE_EXTRAS.journals.entry}
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.5 }}>{NODE_EXTRAS.journals.reflection}</div>
            </div>
          )}
          {node.key === "metacog" && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: COLORS.ink, fontStyle: "italic", lineHeight: 1.5, marginBottom: 8, borderLeft: `2px solid ${node.color}`, paddingLeft: 10 }}>
                {NODE_EXTRAS.metacog.prompt}
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.5 }}>{NODE_EXTRAS.metacog.debrief}</div>
            </div>
          )}

          {node.subs && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.grid}` }}>
              <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
                ZOOM IN — {node.label}'S OWN THREADS
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {node.subs.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSubSelected(subSelected === i ? null : i)}
                    style={{
                      padding: "5px 10px", borderRadius: 14,
                      border: `1px solid ${subSelected === i ? node.color : COLORS.grid}`,
                      background: subSelected === i ? `${node.color}22` : "transparent",
                      color: subSelected === i ? node.color : COLORS.inkDim,
                      fontSize: 10.5, cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {subSelected !== null && (
                <div style={{ fontSize: 11.5, color: COLORS.ink, lineHeight: 1.5, background: COLORS.bgPanelAlt, borderRadius: 8, padding: "10px 12px" }}>
                  {node.subs[subSelected].detail}
                </div>
              )}
            </div>
          )}
          {nodeToTab[node.key] && setView && (
            <button
              onClick={() => setView(nodeToTab[node.key])}
              style={{
                marginTop: 14, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: node.color, color: "#FDFEFC", fontSize: 12, fontWeight: 600, width: "100%",
              }}
            >
              View Full {node.label} Room →
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5, fontStyle: "italic" }}>
        This is the "map within map" pattern — each node's own threads, zoomable the same way the
        top-level map is. The full version would keep going deeper (a thread within a thread within a
        thread); this prototype shows two levels to demonstrate the pattern honestly without pretending
        infinite depth is already built.
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: COLORS.inkDim }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.teal }} />Live — real data</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.gold }} />Illustrative — invented</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.inkDim }} />Planned — no data yet</div>
      </div>
    </div>
  );
}
