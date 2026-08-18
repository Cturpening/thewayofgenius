import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import SpeakButton from "../../components/common/SpeakButton";
import { CURRICULUM_LESSONS } from "./data/curriculumLessons";
import PersonalLessonsView from "./PersonalLessonsView";
import MeditationsView from "./MeditationsView";

export default function LessonsLibraryView() {
  const [open, setOpen] = useState(0);
  const [tab, setTab] = useState("curriculum");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        The Lessons Library — real curriculum a new user would actually read: why this work matters, how
        it works, and what to expect. Different from the Symbolic Library (which catalogs the book's
        chapters) — this is the practical "why do I need this" layer. Every lesson ends with a way to
        connect it to your own current goal or intention, not just read it passively.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["curriculum", "personal", "meditations"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${tab === t ? COLORS.gold : COLORS.grid}`,
              background: tab === t ? `${COLORS.gold}22` : "transparent",
              color: tab === t ? COLORS.gold : COLORS.inkDim,
              fontSize: 12, cursor: "pointer",
            }}
          >
            {t === "curriculum" ? "Curriculum" : t === "personal" ? "My Lessons" : "Meditations"}
          </button>
        ))}
      </div>

      {tab === "curriculum" ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CURRICULUM_LESSONS.map((lesson, i) => (
              <div key={lesson.title} style={{ background: COLORS.bgPanel, borderRadius: 12, overflow: "hidden" }}>
                <div
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: lesson.color, marginBottom: 3 }}>{lesson.title}</div>
                    <div style={{ fontSize: 11, color: COLORS.inkDim }}>{lesson.summary}</div>
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.inkDim, flexShrink: 0, marginLeft: 12 }}>{open === i ? "−" : "+"}</div>
                </div>
                {open === i && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                      <SpeakButton text={`${lesson.title}. ${lesson.body} Connect it to your goal: ${lesson.goalPrompt}`} small />
                    </div>
                    <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6, marginBottom: 12 }}>
                      {lesson.body}
                    </div>
                    <div style={{ background: `${lesson.color}18`, borderRadius: 8, padding: "10px 14px", fontSize: 11.5, color: COLORS.ink, fontStyle: "italic" }}>
                      <span style={{ color: lesson.color, fontStyle: "normal" }}>Connect it to your goal: </span>
                      {lesson.goalPrompt}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
            This library grows as more real coaching lessons get developed through rehearsal — each one
            real curriculum, not filler, same as everything else here.
          </div>
        </>
      ) : tab === "personal" ? (
        <PersonalLessonsView />
      ) : (
        <MeditationsView />
      )}
    </div>
  );
}
