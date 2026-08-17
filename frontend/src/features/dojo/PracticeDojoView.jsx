import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import LessonsLibraryView from "../library/LessonsLibraryView";
import GeniusConstitutionView from "../genius-constitution/GeniusConstitutionView";

export default function PracticeDojoView({ constitutionAnswers, setConstitutionAnswers }) {
  const [lens, setLens] = useState("constitution");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["constitution", "lessons"].map((l) => (
          <button
            key={l}
            onClick={() => setLens(l)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${lens === l ? COLORS.gold : COLORS.grid}`,
              background: lens === l ? `${COLORS.gold}22` : "transparent",
              color: lens === l ? COLORS.gold : COLORS.inkDim,
              fontSize: 12, cursor: "pointer",
            }}
          >
            {l === "constitution" ? "Genius Constitution" : "Lessons Library"}
          </button>
        ))}
      </div>
      {lens === "constitution" ? <GeniusConstitutionView answers={constitutionAnswers} setAnswers={setConstitutionAnswers} /> : <LessonsLibraryView />}
      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Edin's Psyche Dojo — live assessment and curriculum, in one place. The Constitution is fed
        continuously through Edin using the user's own accumulating symbolic realm, not a one-time quiz.
      </div>
    </div>
  );
}
