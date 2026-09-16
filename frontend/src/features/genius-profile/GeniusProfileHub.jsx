import { lazy, Suspense, useState } from "react";
import { COLORS } from "../../theme/tokens";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolConstellation from "./SymbolConstellation";
import SymbolBodyMapView from "../library/SymbolBodyMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";
import { INITIAL_TEAM_MEMBERS } from "../dojo/data/teamMembers";

// Three.js pulls in a real chunk of weight -- lazy-loaded so it only
// downloads when someone actually switches into Hologram mode.
const LivingMap = lazy(() => import("./LivingMap"));

const FLAT_LENSES = {
  weave: "Architecture",
  symbols: "Your Symbols",
  body: "Body",
  team: "Inner Team",
};

// Two real top-level destinations, not seven: the Map (everything
// spatial, with its own Flat/Hologram mode -- see LivingMap for why 2D/3D
// became a mode instead of separate tabs) and Arc View, which is a
// timeline, not a spatial network, so it doesn't belong inside the Map's
// layer system no matter how it's framed.
export default function GeniusProfileHub({ setView, constitutionAnswers, dreamEntries = [] }) {
  const [tab, setTab] = useState("map");
  const [mode, setMode] = useState("flat"); // flat | hologram
  const [flatLens, setFlatLens] = useState("weave");
  // Lifted up (not owned by InnerTeamView) so the same real team list
  // shows up in both the flat Inner Team tab and the Map's Inner Team
  // layer. Still not persisted to a backend -- a real gap, not fixed here.
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["flat", "hologram"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "6px 16px", borderRadius: 999,
                    border: `1px solid ${mode === m ? COLORS.teal : COLORS.grid}`,
                    background: mode === m ? `${COLORS.teal}22` : "transparent",
                    color: mode === m ? COLORS.teal : COLORS.inkDim,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {m === "flat" ? "Flat" : "Hologram"}
                </button>
              ))}
            </div>
            {mode === "flat" && (
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
            )}
          </div>

          {mode === "flat" ? (
            <>
              {flatLens === "weave" && <GeniusProfileMap setView={setView} constitutionAnswers={constitutionAnswers} />}
              {flatLens === "symbols" && <SymbolConstellation dreamEntries={dreamEntries} />}
              {flatLens === "body" && <SymbolBodyMapView />}
              {flatLens === "team" && <InnerTeamView members={teamMembers} setMembers={setTeamMembers} />}
            </>
          ) : (
            <Suspense fallback={<div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Loading the map…</div>}>
              <LivingMap dreamEntries={dreamEntries} teamMembers={teamMembers} />
            </Suspense>
          )}
        </div>
      )}

      {tab === "arc" && <DreamArcView />}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Flat mode is calm, one lens at a time. Hologram mode is the same real data as one living 3D
        space with toggleable layers -- pick whichever fits the moment. Symbol meanings themselves live
        in the Symbolic Library tab.
      </div>
    </div>
  );
}
