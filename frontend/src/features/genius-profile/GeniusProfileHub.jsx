import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolBodyMapView from "../library/SymbolBodyMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";

export default function GeniusProfileHub({ setView, constitutionAnswers }) {
  const [lens, setLens] = useState("weave");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["weave", "body", "arc", "team"].map((l) => (
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
            {l === "weave" ? "Weave View" : l === "body" ? "Body View" : l === "arc" ? "Arc View" : "Inner Team"}
          </button>
        ))}
      </div>
      {lens === "weave" && <GeniusProfileMap setView={setView} constitutionAnswers={constitutionAnswers} />}
      {lens === "body" && <SymbolBodyMapView />}
      {lens === "arc" && <DreamArcView />}
      {lens === "team" && <InnerTeamView />}
      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Same Genius Profile, four lenses — thread-by-thread, body-by-location, arc-by-time, and now your
        own Inner Team. Symbol meanings themselves live in the Symbolic Library tab.
      </div>
    </div>
  );
}
