import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import GoalsAndCalendarLens from "./GoalsAndCalendarLens";
import DreamJournalView from "../dream-journal/DreamJournalView";

export default function GoalsCalendarView({ entries, setEntries }) {
  const [lens, setLens] = useState("journal");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        { ["journal", "goals"].map((l) => (
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
            {l === "journal" ? "Dream Journal" : "Goals & Calendar"}
          </button>
        )) }
      </div>
      {lens === "journal" ? <DreamJournalView entries={entries} setEntries={setEntries} /> : <GoalsAndCalendarLens />}
    </div>
  );
}
