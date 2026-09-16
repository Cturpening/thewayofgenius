import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { speakText, stopSpeaking } from "../../lib/speech";
import SpeakButton from "../../components/common/SpeakButton";
import { CONSTITUTION_SCENARIOS } from "../genius-constitution/data/constitutionData";
import { fetchChatMessages, sendChatMessage } from "./api";

// Plain-language label for each real, account-changing tool Edin can call
// (see backend/app/edin_tools.py's ALL_TOOL_DECLARATIONS) -- shown as a
// small chip under her reply so what she actually did is never invisible,
// same honesty rule as every REAL/ILLUSTRATIVE label elsewhere in this
// app. Read-only lookups (list_goals, list_open_follow_throughs) are
// deliberately left out -- nothing changed on the account, so a chip
// implying otherwise would be dishonest in the other direction.
const TOOL_CALL_LABELS = {
  save_neuron_record: "Saved to this node",
  log_neuron_practice: "Logged a practice",
  log_dream_journal_entry: "Logged a dream journal entry",
  create_goal: "Created a goal",
  update_goal_progress: "Updated goal progress",
  log_follow_through: "Logged a follow-through intention",
  update_follow_through_status: "Updated a follow-through intention",
  add_calendar_event: "Added a calendar event",
};

// `compact`: used by the floating "Edin -- Available Anywhere" popup (see
// App.jsx). Same underlying conversation and memory as the full Edin tab --
// every message still goes through the same /chat-messages endpoints and
// account context -- it just doesn't render the full scrollback and extra
// chrome (journal strip, Constitution check-in, disclaimer) in a 360px
// popup. `onOpenFull`, when given, renders a link back to the full tab.
export default function EdinChatView({ dreamEntries = [], compact = false, onOpenFull = null, activeNodeKey = null }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  // "New chat" doesn't delete anything -- Edin's memory of the account
  // stays whole either way -- it just collapses everything before the
  // marker out of view, the same way a normal AI's chat history stays
  // reachable without cluttering the active conversation.
  const [sessionMarkerIndex, setSessionMarkerIndex] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  // Edin's reply is already fully generated and safety-checked (see
  // app/language_safety.py) by the time it reaches the frontend -- this
  // just reveals that finished, already-safe text word by word instead of
  // dumping it in all at once, so it reads like she's actually typing.
  // Never reveals a partial/unchecked reply -- there isn't one.
  const [revealingId, setRevealingId] = useState(null);
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const endRef = useRef(null);
  const prevCountRef = useRef(0);
  const revealTimerRef = useRef(null);

  useEffect(() => {
    fetchChatMessages()
      .then((msgs) => { setMessages(msgs); prevCountRef.current = msgs.length; })
      .catch((err) => { console.error("Failed to load chat history:", err); setLoadError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => clearInterval(revealTimerRef.current), []);

  const revealMessage = (message) => {
    clearInterval(revealTimerRef.current);
    const wordCount = message.text.split(" ").length;
    setRevealingId(message.id);
    setRevealedWordCount(0);
    let count = 0;
    revealTimerRef.current = setInterval(() => {
      count += 1;
      setRevealedWordCount(count);
      if (count >= wordCount) {
        clearInterval(revealTimerRef.current);
        setRevealingId(null);
      }
    }, 45);
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, revealedWordCount]);

  useEffect(() => {
    if (voiceMode && messages.length > prevCountRef.current) {
      const last = messages[messages.length - 1];
      if (last.from === "edin") speakText(last.text);
    }
    prevCountRef.current = messages.length;
  }, [messages, voiceMode]);

  useEffect(() => () => stopSpeaking(), []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setSendError(null);

    // Real, persisted conversation -- backend runs Track B, then a real
    // Gemini call with actual account context, per app/edin_prompt's v5
    // "Live chat conversation" context type. See backend/app/main.py's
    // /chat-messages and protocols/03_Crisis_Escalation_Protocol.md.
    try {
      const { userMessage, edinMessage, crisisResponse, toolCalls } = await sendChatMessage(text, activeNodeKey);
      // toolCalls is real, not decorative -- see backend/app/neuron_tools.py.
      // Surfaced right on the message so it's visible when Edin actually
      // acted, not just talked, same honesty rule as every REAL/ILLUSTRATIVE
      // label elsewhere in this app.
      const fullEdinMessage = { ...edinMessage, crisis: !!crisisResponse, toolCalls };
      setMessages((msgs) => [...msgs, userMessage, fullEdinMessage]);
      revealMessage(fullEdinMessage);
    } catch (err) {
      console.error("Failed to send chat message:", err);
      setSendError("Couldn't send that -- " + err.message);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const startNewChat = () => {
    setSessionMarkerIndex(messages.length);
    setHistoryExpanded(false);
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

  const visibleMessages = compact
    ? messages.slice(-6)
    : sessionMarkerIndex !== null && !historyExpanded
    ? messages.slice(sessionMarkerIndex)
    : messages;
  const hiddenEarlierCount = compact || historyExpanded ? 0 : sessionMarkerIndex ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 16 }}>
      {!compact && (
        <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
          This is Edin — the voice, not the data. The Genius Profile Map, Body Map, and Arc View are what
          Edin knows about you; this is what it sounds like when it talks to you about it. Try typing about
          sleep, the door symbol, your gut, or tonight's practice — those have real data behind them. She can
          also act for real now, not just talk: log a dream, create or update a goal, log or resolve a
          follow-through intention, or add a calendar item, right from this conversation. Any reply where
          she actually did something shows a small ✓ chip so it's never invisible. She'll also notice on her
          own when something you say sounds worth recording and ask first — she never saves anything without
          you saying yes.
        </div>
      )}

      {compact && onOpenFull && (
        <button
          onClick={onOpenFull}
          style={{ alignSelf: "flex-end", border: "none", background: "transparent", color: COLORS.teal, fontSize: 11, cursor: "pointer", padding: 0 }}
        >
          Open full conversation →
        </button>
      )}

      {!compact && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                onClick={startNewChat}
                disabled={messages.length === 0}
                title="Starts a fresh-looking conversation -- Edin still remembers your account, and the earlier messages stay one click away."
                style={{
                  padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.grid}`,
                  background: "transparent", color: COLORS.inkDim, fontSize: 12,
                  cursor: messages.length === 0 ? "default" : "pointer", opacity: messages.length === 0 ? 0.5 : 1,
                }}
              >
                🆕 New Chat
              </button>
            </div>
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
        </>
      )}

      {loadError && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink }}>
          Couldn't load your conversation history: {loadError}
        </div>
      )}

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: compact ? "12px 14px" : "18px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: compact ? 260 : 420, overflowY: "auto" }}>
        {loading && <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>Loading your conversation...</div>}
        {!loading && messages.length === 0 && !loadError && (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>Nothing here yet — say something to start.</div>
        )}
        {hiddenEarlierCount > 0 && (
          <button
            onClick={() => setHistoryExpanded(true)}
            style={{
              alignSelf: "center", border: `1px solid ${COLORS.grid}`, background: "transparent",
              color: COLORS.inkDim, fontSize: 11, cursor: "pointer", borderRadius: 20, padding: "4px 12px",
            }}
          >
            ↑ Show earlier conversation ({hiddenEarlierCount} messages)
          </button>
        )}
        {visibleMessages.map((m, i) => {
          const displayText = m.id === revealingId
            ? m.text.split(" ").slice(0, revealedWordCount).join(" ")
            : m.text;
          return (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
              {m.from === "edin" && (
                <motion.img
                  src={EDIN_ICON}
                  alt="Edin"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginRight: 2,
                    objectFit: "cover", boxShadow: `0 0 8px ${COLORS.gold}55`,
                  }}
                />
              )}
              <div style={{
                maxWidth: m.crisis ? "85%" : "68%", padding: "10px 14px", borderRadius: 14,
                background: m.crisis ? `${COLORS.coral}18` : m.from === "user" ? COLORS.teal : COLORS.bgPanelAlt,
                border: m.crisis ? `1px solid ${COLORS.coral}` : "none",
                color: m.from === "user" ? "#FDFEFC" : COLORS.ink,
                fontSize: 13, lineHeight: 1.5,
              }}>
                {displayText}
              </div>
              {m.from === "edin" && <SpeakButton text={m.text} small />}
            </div>
            {m.toolCalls?.some((c) => TOOL_CALL_LABELS[c.name]) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: 34 }}>
                {m.toolCalls.filter((c) => TOOL_CALL_LABELS[c.name]).map((call, ci) => (
                  <span key={ci} style={{ fontSize: 10, color: COLORS.teal, background: `${COLORS.teal}18`, borderRadius: 10, padding: "2px 8px" }}>
                    ✓ {TOOL_CALL_LABELS[call.name]}
                  </span>
                ))}
              </div>
            )}
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
          </motion.div>
          );
        })}
        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "flex-end", gap: 6 }}
          >
            <motion.img
              src={EDIN_ICON}
              alt="Edin"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginRight: 2,
              objectFit: "cover", boxShadow: `0 0 8px ${COLORS.gold}55`,
            }} />
            <div style={{
              padding: "10px 14px", borderRadius: 14, background: COLORS.bgPanelAlt,
              color: COLORS.inkDim, fontSize: 13, fontStyle: "italic",
            }}>
              Edin is thinking…
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {sendError && (
        <div style={{ fontSize: 12, color: COLORS.coral }}>{sendError}</div>
      )}

      {activeNodeKey && (
        <div style={{ fontSize: 10.5, color: COLORS.teal, fontStyle: "italic" }}>
          Edin can save a story or log a practice to the body-map node you have open right now, if you ask her to.
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Talk to Edin..."
          disabled={sending}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.grid}`,
            background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none",
            opacity: sending ? 0.6 : 1,
          }}
        />
        <motion.button
          onClick={send}
          disabled={sending}
          whileHover={sending ? {} : { scale: 1.05 }}
          whileTap={sending ? {} : { scale: 0.93 }}
          style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: COLORS.teal, color: "#FDFEFC", fontSize: 13, cursor: sending ? "default" : "pointer", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "..." : "Send"}
        </motion.button>
      </div>

      {!compact && dreamEntries.length > 0 && (
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

      {!compact && (
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
          Real conversation — every reply comes from a live Gemini call, grounded in your actual recent
          dreams, goals, and follow-through, and saved so it's here next time you come back. Voice Mode uses
          real browser text-to-speech, not a simulated voice. Every message is checked for crisis language
          before Edin ever responds, same as everywhere else in the app.
        </div>
      )}
    </div>
  );
}
