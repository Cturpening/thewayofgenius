import { useState, useEffect } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { FOLLOWTHROUGH_SOURCES, INITIAL_PATTERNS, STATUS_META } from "./data/followThroughData";
import { fetchFollowThroughs, createFollowThrough, updateFollowThrough } from "./api";

export default function BehavioralScienceView() {
  const [followThroughs, setFollowThroughs] = useState([]);
  const [intention, setIntention] = useState("");
  const [source, setSource] = useState("dream");
  const [patterns, setPatterns] = useState(INITIAL_PATTERNS);
  const [newPattern, setNewPattern] = useState("");
  const [crisisMessage, setCrisisMessage] = useState(null);

  useEffect(() => {
    fetchFollowThroughs()
      .then(setFollowThroughs)
      .catch((err) => console.error("Failed to load follow-through log:", err));
  }, []);

  const addFollowThrough = async () => {
    if (!intention.trim()) return;
    try {
      const { entry, crisisResponse } = await createFollowThrough({ source, intention: intention.trim() });
      setFollowThroughs([entry, ...followThroughs]);
      if (crisisResponse) setCrisisMessage(crisisResponse);
      setIntention("");
    } catch (err) {
      console.error("Failed to log follow-through:", err);
    }
  };
  const setStatus = (id, status) => {
    setFollowThroughs(followThroughs.map((f) => f.id === id ? { ...f, status } : f));
    updateFollowThrough(id, { status }).catch((err) => console.error("Failed to save status:", err));
  };
  const setEmotionalShift = (id, emotionalShift) => {
    setFollowThroughs(followThroughs.map((f) => f.id === id ? { ...f, emotionalShift } : f));
    updateFollowThrough(id, { emotionalShift }).catch((err) => console.error("Failed to save emotional shift:", err));
  };
  const saveNote = (id, note) => {
    setFollowThroughs(followThroughs.map((f) => f.id === id ? { ...f, note } : f));
    updateFollowThrough(id, { note })
      .then(({ crisisResponse }) => { if (crisisResponse) setCrisisMessage(crisisResponse); })
      .catch((err) => console.error("Failed to save note:", err));
  };
  const saveIntention = (id, intention) => {
    setFollowThroughs(followThroughs.map((f) => f.id === id ? { ...f, intention } : f));
    updateFollowThrough(id, { intention })
      .then(({ crisisResponse }) => { if (crisisResponse) setCrisisMessage(crisisResponse); })
      .catch((err) => console.error("Failed to save intention:", err));
  };

  const addPattern = () => {
    if (!newPattern.trim()) return;
    setPatterns([...patterns, { id: Date.now(), name: newPattern.trim(), trend: "steady", entries: 1 }]);
    setNewPattern("");
  };
  const logPatternOccurrence = (id) => setPatterns(patterns.map((p) => p.id === id ? { ...p, entries: p.entries + 1 } : p));

  const followThroughRate = followThroughs.length > 0
    ? Math.round((followThroughs.filter((f) => f.status === "did").length / followThroughs.filter((f) => f.status !== "pending").length || 0) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.coral}14`, border: `1px solid ${COLORS.coral}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Behavioral Sciences — her own coaching-behavior track, separate from Vanessa's SandboxLife lane
        above. Core signal: real-world follow-through — did an insight actually become an action, built
        on the real Insight_Event and Emotional_Shift_Score fields from her Beta Client Workflow
        Protocol. Habit and pattern logging runs alongside it as supporting context, not the main event.
      </div>

      {crisisMessage && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
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

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5 }}>FOLLOW-THROUGH LOG — THE CORE SIGNAL</div>
          {followThroughs.some((f) => f.status !== "pending") && (
            <div style={{ fontSize: 11, color: COLORS.teal }}>{followThroughRate}% followed through</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {FOLLOWTHROUGH_SOURCES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSource(s.key)}
              style={{
                padding: "5px 11px", borderRadius: 999, fontSize: 11, cursor: "pointer",
                border: `1px solid ${source === s.key ? s.color : COLORS.grid}`,
                background: source === s.key ? `${s.color}22` : "transparent",
                color: source === s.key ? s.color : COLORS.inkDim,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFollowThrough()}
            placeholder="What did the insight ask you to actually do?"
            spellCheck
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
          />
          <button
            onClick={addFollowThrough}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.coral, color: "#FDFEFC", fontSize: 12.5, cursor: "pointer" }}
          >
            Log It
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {followThroughs.map((f) => (
            <FollowThroughRow
              key={f.id}
              entry={f}
              srcMeta={FOLLOWTHROUGH_SOURCES.find((s) => s.key === f.source)}
              onSetStatus={setStatus}
              onSetEmotionalShift={setEmotionalShift}
              onSaveNote={saveNote}
              onSaveIntention={saveIntention}
            />
          ))}
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 12 }}>
          PATTERN & HABIT TRACKER — SUPPORTING CONTEXT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {patterns.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.bgPanelAlt, borderRadius: 8, padding: "10px 14px" }}>
              <div>
                <div style={{ fontSize: 12.5, color: COLORS.ink }}>{p.name}</div>
                <div style={{ fontSize: 10, color: COLORS.inkDim, marginTop: 2 }}>{p.entries} logged · trending {p.trend}</div>
              </div>
              <button
                onClick={() => logPatternOccurrence(p.id)}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 11, cursor: "pointer" }}
              >
                + Log again
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPattern()}
            placeholder="Track a new habit or pattern..."
            spellCheck
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
          />
          <button
            onClick={addPattern}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer" }}
          >
            Add
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Illustrative UI with two seeded examples — but the framing is real: perspective changes → belief
        changes → action changes, and follow-through is the actual, honest measure of whether that
        happened. This is her own metadata, independent of whatever Vanessa's lane eventually adds.
      </div>
    </div>
  );
}

function FollowThroughRow({ entry, srcMeta, onSetStatus, onSetEmotionalShift, onSaveNote, onSaveIntention }) {
  const [noteDraft, setNoteDraft] = useState(entry.note || "");
  const noteDirty = noteDraft.trim() !== (entry.note || "");
  const [editingIntention, setEditingIntention] = useState(false);
  const [intentionDraft, setIntentionDraft] = useState(entry.intention);

  const saveIntention = () => {
    const trimmed = intentionDraft.trim();
    if (!trimmed) return;
    onSaveIntention(entry.id, trimmed);
    setEditingIntention(false);
  };

  return (
    <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        {editingIntention ? (
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <input
              value={intentionDraft}
              onChange={(e) => setIntentionDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveIntention()}
              autoFocus
              spellCheck
              style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
            />
            <button
              onClick={saveIntention}
              style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: COLORS.teal, color: "#0f151b", fontSize: 10.5, cursor: "pointer" }}
            >
              Save
            </button>
            <button
              onClick={() => { setIntentionDraft(entry.intention); setEditingIntention(false); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 10.5, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.4, flex: 1, display: "flex", gap: 8, alignItems: "baseline" }}>
            <span>{entry.intention}</span>
            <button
              onClick={() => { setIntentionDraft(entry.intention); setEditingIntention(true); }}
              style={{ padding: "1px 6px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 9.5, cursor: "pointer", flexShrink: 0 }}
            >
              Edit
            </button>
          </div>
        )}
        <span style={{ fontSize: 9, color: srcMeta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{srcMeta.label.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 8 }}>{entry.date}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && noteDirty && onSaveNote(entry.id, noteDraft.trim())}
          placeholder="Add a note..."
          spellCheck
          style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.inkDim, fontSize: 11.5, fontStyle: "italic", outline: "none" }}
        />
        {noteDirty && (
          <button
            onClick={() => onSaveNote(entry.id, noteDraft.trim())}
            style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: COLORS.teal, color: "#0f151b", fontSize: 10.5, cursor: "pointer" }}
          >
            Save
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: entry.status !== "pending" ? 8 : 0 }}>
        {Object.entries(STATUS_META).map(([k, meta]) => (
          <button
            key={k}
            onClick={() => onSetStatus(entry.id, k)}
            style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 10.5, cursor: "pointer",
              border: `1px solid ${entry.status === k ? meta.color : COLORS.grid}`,
              background: entry.status === k ? `${meta.color}22` : "transparent",
              color: entry.status === k ? meta.color : COLORS.inkDim,
            }}
          >
            {meta.label}
          </button>
        ))}
      </div>
      {entry.status !== "pending" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9.5, color: COLORS.inkDim }}>EMOTIONAL_SHIFT_SCORE:</span>
          {["lower", "same", "higher"].map((v) => (
            <button
              key={v}
              onClick={() => onSetEmotionalShift(entry.id, v)}
              style={{
                padding: "3px 9px", borderRadius: 999, fontSize: 10, cursor: "pointer", textTransform: "capitalize",
                border: `1px solid ${entry.emotionalShift === v ? COLORS.violet : COLORS.grid}`,
                background: entry.emotionalShift === v ? `${COLORS.violet}22` : "transparent",
                color: entry.emotionalShift === v ? COLORS.violet : COLORS.inkDim,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
