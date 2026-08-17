import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { CALENDAR_CATEGORIES, GOALS, WEEK_DAYS, WEEK_SESSIONS } from "./data/calendarData";

export default function GoalsAndCalendarLens() {
  const [customEvents, setCustomEvents] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("health");
  const [newDay, setNewDay] = useState("Mon");

  const addEvent = () => {
    if (!newLabel.trim()) return;
    const cat = CALENDAR_CATEGORIES.find((c) => c.key === newCategory);
    setCustomEvents([...customEvents, { id: Date.now(), day: newDay, label: newLabel.trim(), category: cat.key, color: cat.color }]);
    setNewLabel("");
  };

  const removeEvent = (id) => setCustomEvents(customEvents.filter((e) => e.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Illustrative — invented for this demo. Shows the intended architecture: Edin's own data model is
        the real record (goals tagged to whichever modality actually feeds them), Google Calendar is
        just the visible reminder surface synced on top of it.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          GOALS — TAGGED TO THE MODALITY THAT ACTUALLY FEEDS THEM
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {GOALS.map((g) => (
            <div key={g.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: COLORS.ink }}>{g.name}</span>
                <span style={{ fontSize: 10.5, color: g.color }}>{g.modality}</span>
              </div>
              <div style={{ height: 7, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${g.progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${g.color}66, ${g.color})` }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 12, lineHeight: 1.5 }}>
          Note the career goal: honestly tagged "no modality link" — Edin doesn't pretend to have real
          data behind every goal type. Feedback on that one would stay generic; feedback on the others
          can draw on the modality's real or representative data.
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          THIS WEEK — SYNCED TO GOOGLE CALENDAR
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {WEEK_SESSIONS.map((d) => {
            const added = customEvents.filter((e) => e.day === d.day);
            return (
              <div key={d.day} style={{ background: d.time || added.length ? COLORS.bgPanelAlt : "transparent", borderRadius: 8, padding: "8px 6px", textAlign: "center", minHeight: 64 }}>
                <div style={{ fontSize: 10, color: COLORS.inkDim, marginBottom: 4 }}>{d.day}</div>
                <div style={{ fontSize: 10, color: d.time ? COLORS.ink : COLORS.grid, lineHeight: 1.3 }}>{d.label}</div>
                {d.time && <div style={{ fontSize: 9, color: COLORS.gold, marginTop: 3 }}>{d.time}</div>}
                {added.map((e) => (
                  <div key={e.id} onClick={() => removeEvent(e.id)} title="Click to remove" style={{
                    marginTop: 4, fontSize: 8.5, color: e.color, background: `${e.color}1c`,
                    borderRadius: 6, padding: "2px 4px", cursor: "pointer", lineHeight: 1.3,
                  }}>
                    {e.label}
                  </div>
                ))}
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
