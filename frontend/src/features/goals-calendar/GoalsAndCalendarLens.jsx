import { useState, useEffect } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { CALENDAR_CATEGORIES, GOAL_MODALITIES, WEEK_DAYS, WEEK_SESSIONS } from "./data/calendarData";
import { fetchGoals, createGoal, updateGoal, deleteGoal, fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "./api";

const PROGRESS_STEPS = [0, 0.25, 0.5, 0.75, 1];

export default function GoalsAndCalendarLens() {
  const [goals, setGoals] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalModality, setNewGoalModality] = useState("sleep");

  const [events, setEvents] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("health");
  const [newDay, setNewDay] = useState("Mon");

  const [crisisMessage, setCrisisMessage] = useState(null);

  useEffect(() => {
    fetchGoals().then(setGoals).catch((err) => console.error("Failed to load goals:", err));
    fetchCalendarEvents().then(setEvents).catch((err) => console.error("Failed to load calendar events:", err));
  }, []);

  const addGoal = () => {
    if (!newGoalName.trim()) return;
    createGoal({ name: newGoalName.trim(), modality: newGoalModality })
      .then(({ goal, crisisResponse }) => {
        setGoals((cur) => [goal, ...cur]);
        if (crisisResponse) setCrisisMessage(crisisResponse);
      })
      .catch((err) => console.error("Failed to add goal:", err));
    setNewGoalName("");
  };

  const setGoalProgress = (id, progress) => {
    setGoals((cur) => cur.map((g) => g.id === id ? { ...g, progress } : g));
    updateGoal(id, { progress }).catch((err) => console.error("Failed to update goal progress:", err));
  };

  const removeGoal = (id) => {
    setGoals((cur) => cur.filter((g) => g.id !== id));
    deleteGoal(id).catch((err) => console.error("Failed to delete goal:", err));
  };

  const addEvent = () => {
    if (!newLabel.trim()) return;
    createCalendarEvent({ day: newDay, label: newLabel.trim(), category: newCategory })
      .then(({ event, crisisResponse }) => {
        setEvents((cur) => [...cur, event]);
        if (crisisResponse) setCrisisMessage(crisisResponse);
      })
      .catch((err) => console.error("Failed to add calendar event:", err));
    setNewLabel("");
  };

  const removeEvent = (id) => {
    setEvents((cur) => cur.filter((e) => e.id !== id));
    deleteCalendarEvent(id).catch((err) => console.error("Failed to delete calendar event:", err));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Real per-user data now — goals and anything you add to the calendar persist to your account.
        Edin's own data model is the record (goals tagged to whichever modality actually feeds them);
        Google Calendar sync on top of it is future work, per the architecture this is built toward.
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
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          GOALS — TAGGED TO THE MODALITY THAT ACTUALLY FEEDS THEM
        </div>
        {goals.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic", marginBottom: 14 }}>
            No goals yet — add your first one below.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {goals.map((g) => {
            const modMeta = GOAL_MODALITIES.find((m) => m.key === g.modality) || GOAL_MODALITIES[GOAL_MODALITIES.length - 1];
            return (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: COLORS.ink, flex: 1 }}>{g.name}</span>
                  <span style={{ fontSize: 10.5, color: modMeta.color, whiteSpace: "nowrap" }}>{modMeta.label}</span>
                  <button
                    onClick={() => removeGoal(g.id)}
                    title="Remove goal"
                    style={{ border: "none", background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer", padding: "0 2px", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ height: 7, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${g.progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${modMeta.color}66, ${modMeta.color})` }} />
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {PROGRESS_STEPS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setGoalProgress(g.id, p)}
                      style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 9.5, cursor: "pointer",
                        border: `1px solid ${g.progress === p ? modMeta.color : COLORS.grid}`,
                        background: g.progress === p ? `${modMeta.color}22` : "transparent",
                        color: g.progress === p ? modMeta.color : COLORS.inkDim,
                      }}
                    >
                      {Math.round(p * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${COLORS.grid}` }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {GOAL_MODALITIES.map((m) => (
              <button
                key={m.key}
                onClick={() => setNewGoalModality(m.key)}
                style={{
                  padding: "5px 11px", borderRadius: 999, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${newGoalModality === m.key ? m.color : COLORS.grid}`,
                  background: newGoalModality === m.key ? `${m.color}22` : "transparent",
                  color: newGoalModality === m.key ? m.color : COLORS.inkDim,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              placeholder="What's the goal?"
              spellCheck
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
            />
            <button
              onClick={addGoal}
              style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 12.5, cursor: "pointer" }}
            >
              Add Goal
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          THIS WEEK — SYNCED TO GOOGLE CALENDAR
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {WEEK_SESSIONS.map((d) => {
            const added = events.filter((e) => e.day === d.day);
            return (
              <div key={d.day} style={{ background: d.time || added.length ? COLORS.bgPanelAlt : "transparent", borderRadius: 8, padding: "8px 6px", textAlign: "center", minHeight: 64 }}>
                <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 4 }}>{d.day}</div>
                <div style={{ fontSize: 10, color: d.time ? COLORS.ink : COLORS.grid, lineHeight: 1.3 }}>{d.label}</div>
                {d.time && <div style={{ fontSize: 9, color: COLORS.gold, marginTop: 3 }}>{d.time}</div>}
                {added.map((e) => {
                  const catMeta = CALENDAR_CATEGORIES.find((c) => c.key === e.category);
                  return (
                    <div key={e.id} onClick={() => removeEvent(e.id)} title="Click to remove" style={{
                      marginTop: 4, fontSize: 8.5, color: catMeta.color, background: `${catMeta.color}1c`,
                      borderRadius: 6, padding: "2px 4px", cursor: "pointer", lineHeight: 1.3,
                    }}>
                      {e.label}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 12, lineHeight: 1.5 }}>
          Each event carries hidden extended-property data (session type, linked goal) that Google
          Calendar doesn't show but Edin reads back — the calendar is the mirror, not the memory.
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 4, letterSpacing: 0.5 }}>
          ADD ANYTHING TO YOUR CALENDAR
        </div>
        <div style={{ fontSize: 11.5, color: COLORS.inkDim, marginBottom: 14, lineHeight: 1.5 }}>
          Health and wellness needs, goals, an incubation prompt for tonight, a journal highlight worth
          revisiting, a microbiome or biofeedback marker — whatever matters to you, on whichever day.
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {CALENDAR_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setNewCategory(c.key)}
              style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 11.5, cursor: "pointer",
                border: `1px solid ${newCategory === c.key ? c.color : COLORS.grid}`,
                background: newCategory === c.key ? `${c.color}22` : "transparent",
                color: newCategory === c.key ? c.color : COLORS.inkDim,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {WEEK_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setNewDay(day)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 11.5, cursor: "pointer",
                border: `1px solid ${newDay === day ? COLORS.gold : COLORS.grid}`,
                background: newDay === day ? `${COLORS.gold}22` : "transparent",
                color: newDay === day ? COLORS.gold : COLORS.inkDim,
              }}
            >
              {day}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="What do you want on the calendar?"
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
          />
          <button
            onClick={addEvent}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 13, cursor: "pointer" }}
          >
            Add
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 10, fontStyle: "italic" }}>
          Click anything you've added, above in the week grid, to remove it.
        </div>
      </div>
    </div>
  );
}
