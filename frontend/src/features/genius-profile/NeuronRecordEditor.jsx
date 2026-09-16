import { useEffect, useState } from "react";
import { COLORS } from "../../theme/tokens";

// Shared by both Flat (BodySystemsMapView) and Hologram (LivingMap) so a
// signal/neuron node's real story/skill/practice-goal/vitals/dream content
// reads and edits identically in either mode -- same fields, same
// progress-state meaning, same "Log a practice" action. See
// neuronRecordsApi.js and backend/app/main.py's /neuron-records routes.
export const PROGRESS_STATE_META = {
  unformed: { label: "Not yet practiced", color: COLORS.inkDim },
  practicing: { label: "Practicing", color: COLORS.teal },
  strengthened: { label: "Strengthened", color: COLORS.gold },
  wounded: { label: "Weak / working through it", color: COLORS.coral },
};

export function NeuronRecordEditor({ nodeKey, record, onSave, onLogPractice, accentColor }) {
  const [draft, setDraft] = useState({
    story: record?.story || "",
    skill: record?.skill || "",
    practiceGoal: record?.practiceGoal || "",
    vitalsNote: record?.vitalsNote || "",
    dreamContent: record?.dreamContent || "",
  });
  const [dirty, setDirty] = useState(false);

  // Re-sync whenever the node itself changes (or a fresh fetch resolves) --
  // without this, switching nodes would keep showing the previous node's
  // half-typed text.
  useEffect(() => {
    setDraft({
      story: record?.story || "",
      skill: record?.skill || "",
      practiceGoal: record?.practiceGoal || "",
      vitalsNote: record?.vitalsNote || "",
      dreamContent: record?.dreamContent || "",
    });
    setDirty(false);
  }, [nodeKey, record]);

  const field = (key, label, placeholder) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.4, marginBottom: 3 }}>{label.toUpperCase()}</div>
      <textarea
        value={draft[key]}
        onChange={(e) => { setDraft((d) => ({ ...d, [key]: e.target.value })); setDirty(true); }}
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%", resize: "vertical", fontFamily: "inherit", fontSize: 12,
          color: COLORS.ink, background: COLORS.bg, border: `1px solid ${COLORS.grid}`,
          borderRadius: 6, padding: "6px 8px", boxSizing: "border-box",
        }}
      />
    </div>
  );

  const state = PROGRESS_STATE_META[record?.progressState || "unformed"];

  return (
    <div style={{ border: `1px solid ${accentColor}44`, borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: state.color, display: "inline-block" }} />
          <span style={{ fontSize: 11, color: state.color, fontWeight: 600 }}>{state.label}</span>
          {record?.practiceCount > 0 && (
            <span style={{ fontSize: 10.5, color: COLORS.inkDim }}>— {record.practiceCount} rep{record.practiceCount === 1 ? "" : "s"} logged</span>
          )}
        </div>
        <button
          onClick={() => onLogPractice(nodeKey)}
          style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${COLORS.teal}`, background: `${COLORS.teal}18`, color: COLORS.teal, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}
        >
          Log a practice
        </button>
      </div>

      {field("story", "Story / experience", "What real moment or experience does this hold?")}
      {field("skill", "Skill this is building", "e.g. staying grounded before I speak")}
      {field("practiceGoal", "Metacognitive practice goal", "What are you training here?")}
      {field("vitalsNote", "Health record / vitals note", "Anything real from your body worth noting here")}
      {field("dreamContent", "Subconscious / dream content", "What's shown up in dreams tied to this")}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <div>
          {record?.progressState !== "wounded" && (
            <button
              onClick={() => onSave(nodeKey, { progressState: "wounded" })}
              style={{ padding: "3px 9px", borderRadius: 8, border: `1px solid ${PROGRESS_STATE_META.wounded.color}55`, background: "transparent", color: PROGRESS_STATE_META.wounded.color, fontSize: 10, cursor: "pointer" }}
            >
              Mark weak / damaged
            </button>
          )}
        </div>
        <button
          onClick={() => { onSave(nodeKey, draft); setDirty(false); }}
          disabled={!dirty}
          style={{
            padding: "5px 14px", borderRadius: 8, border: `1px solid ${dirty ? accentColor : COLORS.grid}`,
            background: dirty ? `${accentColor}22` : "transparent", color: dirty ? accentColor : COLORS.inkDim,
            fontSize: 11, fontWeight: 600, cursor: dirty ? "pointer" : "default",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
