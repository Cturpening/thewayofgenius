import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolConstellation from "./SymbolConstellation";
import SymbolBodyMapView from "../library/SymbolBodyMapView";
import BodySystemsMapView from "../library/BodySystemsMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";
import { INITIAL_TEAM_MEMBERS } from "../dojo/data/teamMembers";

const FLAT_LENSES = {
  weave: "Architecture",
  symbols: "Your Symbols",
  body: "Body",
  bodySystems: "Body Systems",
  team: "Inner Team",
};

// Flat only -- no 3D/drag-to-orbit mode here anymore. That mode (LivingMap,
// still in the repo, just not wired in here) required dragging the mouse
// to look around, and kept fighting the person actually trying to use it.
// Every piece of content that used to live only inside that 3D map (most
// importantly Body Systems -- see BodySystemsMapView) now has a flat,
// click-only home instead, so there's no reason to route anyone through
// the 3D experience at all. If it's ever wanted back, it's one import away.
export default function GeniusProfileHub({ setView, constitutionAnswers, dreamEntries = [] }) {
  const [tab, setTab] = useState("map");
  const [flatLens, setFlatLens] = useState("weave");
  // Lifted up (not owned by InnerTeamView) so the same real team list
  // would show up anywhere else it's needed later. Still not persisted to
  // a backend -- a real gap, not fixed here.
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_MEMBERS);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["map", "arc"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 8,
              border: `1px solid ${tab === t ? COLORS.coral : COLORS.grid}`,
              background: tab === t ? `${COLORS.coral}1a` : "transparent",
              color: tab === t ? COLORS.coral : COLORS.inkDim,
              fontSize: 13, cursor: "pointer",
            }}
          >
            {t === "map" ? "Map" : "Arc View"}
          </button>
        ))}
      </div>

      {tab === "map" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(FLAT_LENSES).map((l) => (
              <button
                key={l}
                onClick={() => setFlatLens(l)}
                style={{
                  padding: "6px 13px", borderRadius: 8,
                  border: `1px solid ${flatLens === l ? COLORS.gold : COLORS.grid}`,
                  background: flatLens === l ? `${COLORS.gold}22` : "transparent",
                  color: flatLens === l ? COLORS.gold : COLORS.inkDim,
                  fontSize: 11.5, cursor: "pointer",
                }}
              >
                {FLAT_LENSES[l]}
              </button>
            ))}
          </div>

          {flatLens === "weave" && <GeniusProfileMap setView={setView} constitutionAnswers={constitutionAnswers} />}
          {flatLens === "symbols" && <SymbolConstellation dreamEntries={dreamEntries} />}
          {flatLens === "body" && <SymbolBodyMapView />}
          {flatLens === "bodySystems" && <BodySystemsMapView />}
          {flatLens === "team" && <InnerTeamView members={teamMembers} setMembers={setTeamMembers} />}
        </div>
      )}

      {tab === "arc" && <DreamArcView />}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        One lens at a time, click-only throughout -- nothing here needs dragging or a held mouse
        movement. Symbol meanings themselves live in the Symbolic Library tab.
      </div>
    </div>
  );
}
