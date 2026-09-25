import { lazy, Suspense, useEffect, useState } from "react";
import { COLORS } from "../../theme/tokens";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import GeniusProfileMap from "./GeniusProfileMap";
import SymbolConstellation from "./SymbolConstellation";
import BodySystemsMapView from "../library/BodySystemsMapView";
import DreamArcView from "../library/DreamArcView";
import InnerTeamView from "../dojo/InnerTeamView";
import { INITIAL_TEAM_MEMBERS } from "../dojo/data/teamMembers";
import { fetchNeuronRecords, saveNeuronRecord, logNeuronPractice } from "./neuronRecordsApi";

// Three.js pulls in a real chunk of weight -- lazy-loaded so it only
// downloads when someone actually switches into Hologram mode.
const LivingMap = lazy(() => import("./LivingMap"));

// "Body" and "Body Systems" used to be two separate tabs -- one showing
// invented illustrative dream-body symbols, the other real physiology.
// They're the same body, so they're one tab now: BodySystemsMapView shows
// both together, linking each symbol to the real system nearest where it
// sits (see bodySymbols.js's relatedSystem field). SymbolBodyMapView (the
// old symbols-only version) stays in the repo, just no longer wired in
// here.
const FLAT_LENSES = {
  weave: "Architecture",
  symbols: "Your Symbols",
  body: "Body",
  team: "Inner Team",
};

// Flat is the default and the safe fallback -- click-only throughout, no
// exceptions. Hologram (LivingMap) is back after being pulled entirely:
// its old drag-to-orbit camera is gone, replaced with the same click-only
// philosophy -- tap something and the camera moves there on its own, then
// six on-screen buttons (turn/zoom/reset) are the *only* thing that ever
// moves the view afterward. See LivingMap's own CameraRig for how that
// works.
export default function GeniusProfileHub({ setView, constitutionAnswers, dreamEntries = [], onActiveNodeChange }) {
  const [tab, setTab] = useState("map");
  const [mode, setMode] = useState("flat"); // flat | hologram
  const [flatLens, setFlatLens] = useState("weave");
  // Lifted up (not owned by InnerTeamView) so the same real team list
  // shows up in both Flat's Inner Team tab and the Hologram's Inner Team
  // region. Still not persisted to a backend -- a real gap, not fixed here.
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_MEMBERS);

  // Real per-node story/skill/practice-goal/vitals/dream data (see
  // neuronRecordsApi.js) -- lifted up here, not owned by BodySystemsMapView
  // or LivingMap individually, so the same record shows up identically in
  // both Flat and Hologram mode for the same node. Keyed by node_key, e.g.
  // "body-signal:nervous__cerebrum__2".
  const [neuronRecords, setNeuronRecords] = useState({});

  useEffect(() => {
    fetchNeuronRecords().then(setNeuronRecords).catch((err) => console.error("Failed to load neuron records:", err));
  }, []);

  // Returns a promise resolving to crisisResponse (or null) so
  // NeuronRecordEditor can show Track B's override message when it fires
  // -- see neuronRecordsApi.js's saveNeuronRecord.
  const saveRecord = (nodeKey, fields) => {
    setNeuronRecords((cur) => ({ ...cur, [nodeKey]: { ...cur[nodeKey], nodeKey, ...fields } }));
    return saveNeuronRecord(nodeKey, fields)
      .then(({ record, crisisResponse }) => {
        setNeuronRecords((cur) => ({ ...cur, [nodeKey]: record }));
        return crisisResponse;
      })
      .catch((err) => { console.error("Failed to save neuron record:", err); return null; });
  };

  const logPractice = (nodeKey) => {
    logNeuronPractice(nodeKey)
      .then((record) => setNeuronRecords((cur) => ({ ...cur, [nodeKey]: record })))
      .catch((err) => console.error("Failed to log practice:", err));
  };

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
              {flatLens === "body" && (
                <BodySystemsMapView
                  neuronRecords={neuronRecords}
                  onSaveRecord={saveRecord}
                  onLogPractice={logPractice}
                  onActiveNodeChange={onActiveNodeChange}
                />
              )}
              {flatLens === "team" && <InnerTeamView members={teamMembers} setMembers={setTeamMembers} />}
            </>
          ) : (
            // Its own boundary, not just the app-level one in main.jsx --
            // this is the newest, least-battle-tested surface (real
            // Three.js/WebGL), so a crash here shouldn't take out chat,
            // goals, the journal, everything else. Flat mode stays
            // reachable via the toggle above even if Hologram is broken.
            <ErrorBoundary label="The Hologram" compact>
              <Suspense fallback={<div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Loading the map…</div>}>
                <LivingMap
                  dreamEntries={dreamEntries}
                  teamMembers={teamMembers}
                  neuronRecords={neuronRecords}
                  onSaveRecord={saveRecord}
                  onLogPractice={logPractice}
                  onActiveNodeChange={onActiveNodeChange}
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      )}

      {tab === "arc" && <DreamArcView />}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Flat is calm and click-only, one lens at a time. Hologram is the same real data as one living 3D
        space -- also click-only now, with on-screen turn/zoom buttons instead of any dragging. Symbol
        meanings themselves live in the Symbolic Library tab.
      </div>
    </div>
  );
}
