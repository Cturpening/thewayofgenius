import { useState, useEffect, useRef } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { speakText, stopSpeaking } from "../../lib/speech";
import SpeakButton from "../../components/common/SpeakButton";
import { CONSTITUTION_SCENARIOS } from "../genius-constitution/data/constitutionData";
import { edinAutoReply } from "./chatUtils";

export default function EdinChatView({ dreamEntries = [] }) {
  const [messages, setMessages] = useState([
    { from: "edin", text: "Morning. How'd you sleep?" },
    { from: "user", text: "rough, that door dream again" },
    { from: "edin", text: "That's the third time this month — logged in your Biofeedback Lab thread as apprehension and curiosity, alchemized into \"a threshold waiting for readiness.\" Your real EEG read from that same night was delta-dominant, which usually means the deep-sleep part of the night was solid even if the dream itself felt unsettled. Want to open the Symbol Body Map and look at it together, or just sit with it for now?" },
  ]);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const endRef = useRef(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (voiceMode && messages.length > prevCountRef.current) {
      const last = messages[messages.length - 1];
      if (last.from === "edin") speakText(last.text);
    }
    prevCountRef.current = messages.length;
  }, [messages, voiceMode]);

  useEffect(() => () => stopSpeaking(), []);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    const reply = { from: "edin", text: edinAutoReply(input) };
    setMessages([...messages, userMsg, reply]);
    setInput("");
  };

  const startConstitutionCheckIn = () => {
    const scenario = CONSTITUTION_SCENARIOS[Math.floor(Math.random() * CONSTITUTION_SCENARIOS.length)];
    setActiveScenario(scenario);
    setMessages([...messages, { from: "edin", text: `Quick check-in, since it's been a while — no pressure, just curious where you're leaning today. ${scenario.scenario}`, options: scenario.options }]);
  };

  const answerScenario = (opt) => {
    const trifectaLayer = { shamanic: "Soul", hermetic: "Subconscious", stoic: "Consciousness" };
    const dimLabel = activeScenario.dim === "orientation" ? `leaning ${trifectaLayer[opt.value] ? `${opt.value} (${trifectaLayer[opt.value]})` : opt.value}` : `a ${opt.value} answer on the ${activeScenario.dim} question`;
    const reply = activeScenario.dim === "orientation"
      ? `Noted — that's a ${opt.value} lean, which sits in the ${trifectaLayer[opt.value]} layer of your Trifecta. Nothing locked in from one answer, but it's the same kind of read your Genius Constitution runs on, just done right here in conversation instead of the full assessment. Want to keep sharpening it with a few more of these sometime, or get back to what we were on?`
      : `Got it — that's real signal too, same fields your full Constitution tracks. Worth folding into your review next time you look at it. Anything else on your mind, or want to keep going with a few more of these?`;
    setMessages([...messages, { from: "user", text: opt.text }, { from: "edin", text: reply }]);
    setActiveScenario(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        This is Edin — the voice, not the data. The Genius Profile Map, Body Map, and Arc View are what
        Edin knows about you; this is what it sounds like when it talks to you about it. Try typing about
        sleep, the door symbol, your gut, or tonight's practice — those have real data behind them.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={startConstitutionCheckIn}
          disabled={!!activeScenario}
          style={{
            padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.gold}`,
            background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 12,
            cursor: activeScenario ? "default" : "pointer", opacity: activeScenario ? 0.5 : 1,
          }}
        >
          🧭 Check In On Your Constitution
        </button>
        <button
          onClick={() => { const next = !voiceMode; setVoiceMode(next); if (!next) stopSpeaking(); }}
          style={{
            padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap",
            border: `1px solid ${voiceMode ? COLORS.teal : COLORS.grid}`,
            background: voiceMode ? `${COLORS.teal}22` : "transparent",
            color: voiceMode ? COLORS.teal : COLORS.inkDim,
            fontSize: 12, cursor: "pointer",
          }}
        >
          {voiceMode ? "🔊 Voice Mode: On" : "🔈 Voice Mode: Off"}
        </button>
      </div>
      <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: -10, lineHeight: 1.4 }}>
        The full flare-style assessment lives in the Psyche Dojo for a first pass — but Edin can also run
        one of these scenarios right here, naturally, whenever it's actually relevant, and fold the
        answer back into the same real data the full Constitution uses. Voice Mode above is a real voice
        companion — for anyone who's blind, low-vision, or who just prefers to listen.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
              {m.from === "edin" && (
                <img src={EDIN_ICON} alt="Edin" style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginRight: 2,
                  objectFit: "cover", boxShadow: `0 0 8px ${COLORS.gold}55`,
                }} />
              )}
              <div style={{
                maxWidth: "68%", padding: "10px 14px", borderRadius: 14,
                background: m.from === "user" ? COLORS.teal : COLORS.bgPanelAlt,
                color: m.from === "user" ? "#FDFEFC" : COLORS.ink,
                fontSize: 13, lineHeight: 1.5,
              }}>
                {m.text}
              </div>
              {m.from === "edin" && <SpeakButton text={m.text} small />}
            </div>
            {m.options && activeScenario && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 34, maxWidth: "70%" }}>
                {m.options.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => answerScenario(o)}
                    style={{
                      textAlign: "left", padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${COLORS.grid}`, background: "transparent",
                      color: COLORS.ink, fontSize: 12, cursor: "pointer", lineHeight: 1.4,
                    }}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Talk to Edin..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.grid}`,
            background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={send}
          style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: COLORS.teal, color: "#FDFEFC", fontSize: 13, cursor: "pointer" }}
        >
          Send
        </button>
      </div>

      {dreamEntries.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
            RECENT JOURNAL ENTRIES — QUICK REFERENCE
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {dreamEntries.slice(0, 5).map((e) => {
              const snippet = e.lines[0]?.text || "";
              return (
                <div key={e.id} style={{ minWidth: 150, maxWidth: 150, background: COLORS.bgPanelAlt, borderRadius: 10, padding: "8px 10px", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: COLORS.ink, fontFamily: "Georgia, serif", marginBottom: 2 }}>{e.title}</div>
                  <div style={{ fontSize: 9, color: COLORS.inkDim, marginBottom: 4 }}>{e.date}</div>
                  <div style={{ fontSize: 10, color: COLORS.inkDim, lineHeight: 1.35 }}>
                    {snippet.length > 58 ? snippet.slice(0, 58) + "…" : snippet}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Illustrative keyword-matching, not a real language model — but every reply above draws on an
        actual real number or real finding already sitting in this prototype, not invented content. Voice
        Mode uses real browser text-to-speech, not a simulated voice.
      </div>
    </div>
  );
}
