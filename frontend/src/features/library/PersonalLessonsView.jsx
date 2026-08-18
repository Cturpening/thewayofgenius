import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import SpeakButton from "../../components/common/SpeakButton";
import { EDIN_JOURNAL_NOTE, generatePersonalLesson } from "./lessonUtils";

export default function PersonalLessonsView() {
  const [topic, setTopic] = useState("");
  const [lessons, setLessons] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const createLesson = () => {
    if (!topic.trim()) return;
    const generated = generatePersonalLesson(topic.trim());
    const lesson = {
      id: Date.now(),
      prompt: topic.trim(),
      created: "Just now",
      ...generated,
      journal: [],
    };
    setLessons([lesson, ...lessons]);
    setOpenId(lesson.id);
    setTopic("");
  };

  const addJournalEntry = (id) => {
    const text = (noteDrafts[id] || "").trim();
    if (!text) return;
    setLessons(lessons.map((l) =>
      l.id === id
        ? { ...l, journal: [...l.journal, { text, edinNote: EDIN_JOURNAL_NOTE(text) }] }
        : l
    ));
    setNoteDrafts({ ...noteDrafts, [id]: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Your own lessons, built with Edin around whatever you're actually working on right now — not
        picked from a fixed list. Tell Edin the topic, it drafts a real lesson from your existing
        methods, and you can journal your experience with it afterward. Edin keeps the notes so the
        pattern is there next time, not lost.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createLesson()}
          placeholder="What do you want a lesson on? (e.g. sleep, feeling stuck, a relationship...)"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.grid}`,
            background: COLORS.bgPanel, color: COLORS.ink, fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={createLesson}
          style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Ask Edin
        </button>
      </div>

      {lessons.length === 0 && (
        <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>
          No personal lessons yet — ask Edin for one above, and it'll show up here.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lessons.map((lesson) => (
          <div key={lesson.id} style={{ background: COLORS.bgPanel, borderRadius: 12, overflow: "hidden" }}>
            <div
              onClick={() => setOpenId(openId === lesson.id ? null : lesson.id)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: lesson.color, marginBottom: 3 }}>{lesson.title}</div>
                <div style={{ fontSize: 11, color: COLORS.inkDim }}>Built {lesson.created} · from: "{lesson.prompt}"</div>
              </div>
              <div style={{ fontSize: 14, color: COLORS.inkDim, flexShrink: 0, marginLeft: 12 }}>{openId === lesson.id ? "−" : "+"}</div>
            </div>
            {openId === lesson.id && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <SpeakButton text={`${lesson.title}. ${lesson.body} Connect it to your goal: ${lesson.goalPrompt}`} small />
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6, marginBottom: 12 }}>
                  {lesson.body}
                </div>
                <div style={{ background: `${lesson.color}18`, borderRadius: 8, padding: "10px 14px", fontSize: 11.5, color: COLORS.ink, fontStyle: "italic", marginBottom: 14 }}>
                  <span style={{ color: lesson.color, fontStyle: "normal" }}>Connect it to your goal: </span>
                  {lesson.goalPrompt}
                </div>

                <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
                  YOUR JOURNAL ON THIS LESSON
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  {lesson.journal.map((entry, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ alignSelf: "flex-end", maxWidth: "85%", background: COLORS.teal, color: "#FDFEFC", borderRadius: 12, padding: "8px 12px", fontSize: 12.5 }}>
                        {entry.text}
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, maxWidth: "85%" }}>
                        <img src={EDIN_ICON} alt="Edin" style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
                        <div style={{ background: COLORS.bgPanelAlt, borderRadius: 12, padding: "8px 12px", fontSize: 11.5, color: COLORS.inkDim, fontStyle: "italic" }}>
                          {entry.edinNote}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={noteDrafts[lesson.id] || ""}
                    onChange={(e) => setNoteDrafts({ ...noteDrafts, [lesson.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addJournalEntry(lesson.id)}
                    placeholder="How did this lesson land for you?"
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`,
                      background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => addJournalEntry(lesson.id)}
                    style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Illustrative generation, not a live model — but the journal-tagging logic (recall-blocker,
        waking-activation, integration-milestone, biofeedback-signal) is real, from the Beta Client
        Workflow Protocol.
      </div>
    </div>
  );
}
