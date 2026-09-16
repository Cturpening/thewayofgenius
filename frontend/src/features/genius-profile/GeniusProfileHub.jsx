import { lazy, Suspense, useState } from "react";
import { COLORS } from "../../theme/tokens";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolConstellation from "./SymbolConstellation";
import DimensionToggle from "./DimensionToggle";
import SymbolBodyMapView from "../library/SymbolBodyMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";

// Three.js pulls in a real chunk of weight -- both lazy-loaded so it only
// downloads when someone actually switches a lens into Hologram mode, not
// on every app load or even on every visit to this hub.
const HologramMap = lazy(() => import("./HologramMap"));
const YourUniverse = lazy(() => import("./YourUniverse"));

const LENS_LABELS = {
  weave: "Genius Weave",
  symbols: "Your Symbols",
  body: "Body View",
  arc: "Arc View",
  team: "Inner Team",
};

const LOADING = (label) => (
  <div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Loading {label}…</div>
);

export default function GeniusProfileHub({ setView, constitutionAnswers, dreamEntries = [] }) {
  const [lens, setLens] = useState("weave");
  // Two dimensions per lens that has a 3D counterpart -- kept as a toggle
  // inside the lens (see DimensionToggle) rather than as its own separate
  // tab, so "this is the same data as a hologram" is obvious and one
  // click away instead of something you'd only find by trying every tab.
  const [weaveDim, setWeaveDim] = useState("2d");
  const [symbolsDim, setSymbolsDim] = useState("2d");

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

      {lens === "weave" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <DimensionToggle value={weaveDim} onChange={setWeaveDim} />
          </div>
          {weaveDim === "2d" ? (
            <GeniusProfileMap setView={setView} constitutionAnswers={constitutionAnswers} />
          ) : (
            <Suspense fallback={LOADING("the hologram")}>
              <HologramMap />
            </Suspense>
          )}
        </div>
      )}

      {lens === "symbols" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <DimensionToggle value={symbolsDim} onChange={setSymbolsDim} />
          </div>
          {symbolsDim === "2d" ? (
            <SymbolConstellation dreamEntries={dreamEntries} />
          ) : (
            <Suspense fallback={LOADING("your universe")}>
              <YourUniverse dreamEntries={dreamEntries} />
            </Suspense>
          )}
        </div>
      )}

      {lens === "body" && <SymbolBodyMapView />}
      {lens === "arc" && <DreamArcView />}
      {lens === "team" && <InnerTeamView />}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Same Genius Profile, five lenses — the architecture thread and your own real symbols each come
        in a flat view and a real 3D hologram of the same data, plus body-by-location, arc-by-time, and
        your Inner Team. Symbol meanings themselves live in the Symbolic Library tab.
      </div>
    </div>
  );
}
