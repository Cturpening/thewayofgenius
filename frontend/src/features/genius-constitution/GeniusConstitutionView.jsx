import { useState, useEffect, useRef } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { CHALLENGE_PROMPTS, CONSTITUTION_SCENARIOS, DAILY_LIFE_NOTE, DENSITY_NOTES, DOMINANT_COLOR, DOMINANT_LABEL, TOUCH_NOTES, TRIFECTA_LAYER } from "./data/constitutionData";
import { computeConstitutionResult, pieSlicePath } from "./constitutionUtils";
import { createConstitutionResult, updateConstitutionIntention } from "./api";

export default function GeniusConstitutionView({ answers, setAnswers }) {
  const done = answers.length >= CONSTITUTION_SCENARIOS.length;
  const step = answers.length;
  const [history, setHistory] = useState([]);
  const [intention, setIntention] = useState("");
  const [savedIntention, setSavedIntention] = useState("");
  const [edinNote, setEdinNote] = useState("");
  const [savedResultId, setSavedResultId] = useState(null);
  const [customAnswer, setCustomAnswer] = useState("");
  const [editingIntention, setEditingIntention] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState(null);
  const prevDoneRef = useRef(false);

  const handleAnswer = (value) => {
    setAnswers([...answers, value]);
    setCustomAnswer("");
  };

  const saveIntention = () => {
    const trimmed = intention.trim();
    if (!trimmed) return;
    setSavedIntention(trimmed);
    setEditingIntention(false);
    if (savedResultId) {
      // The backend generates Edin's reflection on the dominant orientation +
      // this intention (see app/edin_ai.py's generate_constitution_reflection)
      // -- pull it back into local state once it comes back.
      updateConstitutionIntention(savedResultId, trimmed)
        .then(({ result, crisisResponse }) => {
          setEdinNote(result.edinNote);
          if (crisisResponse) setCrisisMessage(crisisResponse);
        })
        .catch((err) => console.error("Failed to save intention:", err));
    }
  };

  const { pct, dominant, focusAnswer, densityAnswer, touchAnswer, path } = computeConstitutionResult(answers);
  const dominantLabel = DOMINANT_LABEL;
  const dominantColor = DOMINANT_COLOR;
  const trifectaLayer = TRIFECTA_LAYER;
  const sortedPct = Object.entries(pct).sort((a, b) => b[1] - a[1]);
  const secondary = sortedPct[1] && sortedPct[1][1] > 0 ? sortedPct[1][0] : null;

  useEffect(() => {
    if (done && !prevDoneRef.current) {
      setHistory((h) => [...h, { n: h.length + 1, dominant, pct, focus: focusAnswer }]);
      createConstitutionResult({ answers, pct, dominant, focusAnswer, densityAnswer, touchAnswer })
        .then((result) => setSavedResultId(result.id))
        .catch((err) => console.error("Failed to save Genius Constitution result:", err));
    }
    prevDoneRef.current = done;
  }, [done, dominant]);

  let cumulative = 0;
  const slices = Object.entries(pct).filter(([, v]) => v > 0).map(([k, v]) => {
    const startAngle = (cumulative / 100) * 360;
    cumulative += v;
    const endAngle = (cumulative / 100) * 360;
    return { k, v, d: pieSlicePath(90, 90, 80, startAngle, endAngle) };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        The Genius Constitution — real orientation framework (Hermetic, Stoic, Shamanic), plus three
        further questions that decide focus area and coaching style. Every answer here doubles as real
        Discovery Call data — this isn't just a quiz, it's what decides someone's actual Day 1.
      </div>

      {!done ? (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: CONSTITUTION_SCENARIOS[step].color, letterSpacing: 1, marginBottom: 6 }}>
            {CONSTITUTION_SCENARIOS[step].orientation.toUpperCase()} — {CONSTITUTION_SCENARIOS[step].subtitle}
          </div>
          <div style={{ fontSize: 15, color: COLORS.ink, lineHeight: 1.6, marginBottom: 18, fontFamily: "Georgia, serif" }}>
            {CONSTITUTION_SCENARIOS[step].scenario}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CONSTITUTION_SCENARIOS[step].options.map((o, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(o.value)}
                style={{
                  textAlign: "left", padding: "12px 16px", borderRadius: 10,
                  border: `1px solid ${COLORS.grid}`, background: COLORS.bgPanelAlt,
                  color: COLORS.ink, fontSize: 13, cursor: "pointer", lineHeight: 1.4,
                }}
              >
                {o.text}
              </button>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customAnswer.trim() && handleAnswer(customAnswer.trim())}
                placeholder="Or write your own answer..."
                spellCheck
                style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px dashed ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
              />
              <button
                onClick={() => customAnswer.trim() && handleAnswer(customAnswer.trim())}
                disabled={!customAnswer.trim()}
                style={{
                  padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.grid}`,
                  background: "transparent", color: customAnswer.trim() ? COLORS.ink : COLORS.inkDim,
                  fontSize: 13, cursor: customAnswer.trim() ? "pointer" : "default",
                }}
              >
                Use this
              </button>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 16 }}>Scenario {step + 1} of {CONSTITUTION_SCENARIOS.length}</div>
        </div>
      ) : (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 16 }}>YOUR PROBABILISTIC BLEND</div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <svg viewBox="0 0 180 180" width="150" height="150" style={{ flexShrink: 0 }}>
              {slices.map((s) => (
                <path key={s.k} d={s.d} fill={dominantColor[s.k]} opacity={s.k === dominant ? 1 : 0.55} stroke={COLORS.bg} strokeWidth="2" />
              ))}
              <circle cx="90" cy="90" r="38" fill={COLORS.bgPanel} />
              <text x="90" y="86" textAnchor="middle" fontSize="10" fill={COLORS.inkDim}>Leaning</text>
              <text x="90" y="100" textAnchor="middle" fontSize="11" fill={dominantColor[dominant]} textTransform="capitalize">{dominant}</text>
            </svg>
            <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedPct.map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: dominantColor[k], flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: COLORS.ink, textTransform: "capitalize", flex: 1 }}>{k} <span style={{ color: COLORS.inkDim, fontSize: 10.5 }}>({trifectaLayer[k]})</span></span>
                  <span style={{ fontSize: 12, color: dominantColor[k] }}>{v}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "14px 16px", background: `${dominantColor[dominant]}18`, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 4 }}>DOMINANT ORIENTATION — TRIFECTA LAYER: {trifectaLayer[dominant].toUpperCase()}</div>
            <div style={{ fontSize: 14, color: dominantColor[dominant] }}>{dominantLabel[dominant]}</div>
            <div style={{ fontSize: 12, color: COLORS.ink, marginTop: 8, lineHeight: 1.5 }}>
              Right now you're leaning {dominant} ({trifectaLayer[dominant]}){secondary && <> with some {secondary} ({trifectaLayer[secondary]})</>} — {DAILY_LIFE_NOTE[dominant]}.
            </div>
          </div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 10, lineHeight: 1.5, fontStyle: "italic" }}>
            A beginner framework to build from, not a fixed label — this feeds the rest of the system
            from day one, then keeps remeasuring against the same Soul/Subconscious/Consciousness layers
            as real data (dreams, biofeedback, arc progress) accumulates.
          </div>

          {path && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${COLORS.grid}` }}>
              <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>
                YOUR DAY 1, BUILT FROM THESE ANSWERS
              </div>
              <div style={{ background: `${path.color}18`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: path.color, marginBottom: 4 }}>Focus: {path.label}</div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>
                  Opens with <strong>{path.lesson}</strong>{path.script && <> and the <strong>{path.script}</strong> meditation</>}. {path.note}
                </div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.6, marginBottom: 6 }}>
                <span style={{ color: COLORS.gold }}>Pacing: </span>{DENSITY_NOTES[densityAnswer]}
              </div>
              <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.6 }}>
                <span style={{ color: COLORS.teal }}>Edin's presence: </span>{TOUCH_NOTES[touchAnswer]}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${COLORS.grid}` }}>
            <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>
              TO CHALLENGE YOUR THINKING — NOT A CRITIQUE, JUST A GENTLE STRETCH
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CHALLENGE_PROMPTS[dominant].map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: dominantColor[dominant], fontSize: 12 }}>✦</span>
                  <span style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5, fontStyle: "italic" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${COLORS.grid}` }}>
              <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>
                WHERE IT'S BEEN, THIS SESSION — {history.length} {history.length === 1 ? "TAKE" : "TAKES"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {history.map((h) => (
                  <div key={h.n} style={{
                    padding: "6px 12px", borderRadius: 999, fontSize: 11,
                    border: `1px solid ${dominantColor[h.dominant]}55`, background: `${dominantColor[h.dominant]}14`, color: dominantColor[h.dominant],
                  }}>
                    Take {h.n}: {h.dominant}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 8, fontStyle: "italic" }}>
                Session-only for now — a real account would keep this permanently, showing where your lean
                actually shifts across months, not just retakes in one sitting.
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${COLORS.grid}` }}>
            {crisisMessage && (
              <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <img src={EDIN_ICON} alt="Edin" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6 }}>{crisisMessage}</div>
                </div>
                <button
                  onClick={() => setCrisisMessage(null)}
                  style={{ alignSelf: "flex-end", fontSize: 10.5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.coral}`, background: "transparent", color: COLORS.coral, cursor: "pointer" }}
                >
                  I've seen this
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>
              YOU CHOOSE WHERE THIS GOES NEXT
            </div>
            {savedIntention && !editingIntention ? (
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5, fontStyle: "italic", flex: 1 }}>"{savedIntention}"</div>
                  <button
                    onClick={() => { setIntention(savedIntention); setEditingIntention(true); }}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}
                  >
                    Edit
                  </button>
                </div>
                {edinNote && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10 }}>
                    <img src={EDIN_ICON} alt="Edin" style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: COLORS.inkDim, lineHeight: 1.6 }}>
                      {edinNote}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && intention.trim() && saveIntention()}
                  placeholder="How do you want this to show up for you next?"
                  autoFocus={editingIntention}
                  spellCheck
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
                />
                <button
                  onClick={saveIntention}
                  style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 12.5, cursor: "pointer" }}
                >
                  Save
                </button>
                {editingIntention && (
                  <button
                    onClick={() => { setIntention(""); setEditingIntention(false); }}
                    style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => { setAnswers([]); setSavedIntention(""); setEdinNote(""); setIntention(""); setSavedResultId(null); setCustomAnswer(""); setEditingIntention(false); }}
            style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer" }}
          >
            ↺ Try different answers
          </button>
        </div>
      )}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        The real version would be fully adaptive (Ender's-Game-style — each answer shapes the next
        scenario's difficulty and symbolism), feed straight into the Genius Profile, and use many more
        scenarios per orientation for a stable blend. This is the shape, not the final depth.
      </div>
    </div>
  );
}
