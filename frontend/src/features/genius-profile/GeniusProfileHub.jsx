import { lazy, Suspense, useState } from "react";
import { COLORS } from "../../theme/tokens";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolConstellation from "./SymbolConstellation";

// Three.js pulls in a real chunk of weight -- lazy-loaded so it only
// downloads when someone actually opens this lens, not on every app load.
const HologramMap = lazy(() => import("./HologramMap"));
import SymbolBodyMapView from "../library/SymbolBodyMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";

const LENS_LABELS = {
  weave: "Weave View",
  hologram: "Hologram (3D)",
  constellation: "Your Constellation",
  body: "Body View",
  arc: "Arc View",
  team: "Inner Team",
};

export default function GeniusProfileHub({ setView, constitutionAnswers, dreamEntries = [] }) {
  const [lens, setLens] = useState("weave");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.keys(LENS_LABELS).map((l) => (
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
            {LENS_LABELS[l]}
          </button>
        ))}
      </div>
      {lens === "weave" && <GeniusProfileMap setView={setView} constitutionAnswers={constitutionAnswers} />}
      {lens === "hologram" && (
        <Suspense fallback={<div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Loading the hologram…</div>}>
          <HologramMap />
        </Suspense>
      )}
      {lens === "constellation" && <SymbolConstellation dreamEntries={dreamEntries} />}
      {lens === "body" && <SymbolBodyMapView />}
      {lens === "arc" && <DreamArcView />}
      {lens === "team" && <InnerTeamView />}
      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Same Genius Profile, six lenses — thread-by-thread, a real 3D hologram of the same data, your
        own real symbol constellation, body-by-location, arc-by-time, and your Inner Team. Symbol
        meanings themselves live in the Symbolic Library tab.
      </div>
    </div>
  );
}
