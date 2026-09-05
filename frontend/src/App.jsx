import { useState, useEffect } from "react";
import { COLORS, SLEEP_STATES, WORKLOAD_STATES } from "./theme/tokens";
import { EDIN_ICON } from "./assets/edinIcon";
import ScienceView from "./features/verification/ScienceView";
import PhoneMock from "./features/verification/PhoneMock";
import VerificationHub from "./features/verification/VerificationHub";
import BiofeedbackLabView from "./features/planned/BiofeedbackLabView";
import MicrobiomeView from "./features/planned/MicrobiomeView";
import OtherLanesView from "./features/planned/OtherLanesView";
import GeneticsSubconsciousView from "./features/planned/GeneticsSubconsciousView";
import { INITIAL_DREAM_ENTRIES } from "./features/dream-journal/data/initialDreamEntries";
import GoalsCalendarView from "./features/goals-calendar/GoalsCalendarView";
import SymbolicLibraryView from "./features/library/SymbolicLibraryView";
import { CONSTITUTION_SCENARIOS } from "./features/genius-constitution/data/constitutionData";
import PracticeDojoView from "./features/dojo/PracticeDojoView";
import GeniusProfileHub from "./features/genius-profile/GeniusProfileHub";
import FutureTechView from "./features/planned/FutureTechView";
import EdinChatView from "./features/chat/EdinChatView";
import { EDIN_GREETINGS } from "./features/chat/data/greetings";
import { fetchJournalEntries, getOrCreateUserId } from "./lib/api";

export default function App() {
  const [mode, setMode] = useState("workload"); // workload | sleep
  const [view, setView] = useState("dojo"); // map | science | user | ...
  const [workloadKey, setWorkloadKey] = useState("rest");
  const [sleepKey, setSleepKey] = useState("deep");
  const [edinOpen, setEdinOpen] = useState(false);
  const [greeting] = useState(() => EDIN_GREETINGS[Math.floor(Math.random() * EDIN_GREETINGS.length)]);
  const [dreamEntries, setDreamEntries] = useState(INITIAL_DREAM_ENTRIES);
  const [backendConnected, setBackendConnected] = useState(false);
  const [constitutionAnswers, setConstitutionAnswers] = useState([]);
  const [newUserMode, setNewUserMode] = useState(true);
  const [simulatedDay, setSimulatedDay] = useState(1);

  // If the backend is up, real journal entries replace the illustrative
  // demo ones (even if that's an empty list for a brand-new user) so
  // there's no mixing of real and fake data. If it's not running --
  // which is fine, the app is still fully usable as a demo -- the
  // hardcoded INITIAL_DREAM_ENTRIES stay as they were.
  useEffect(() => {
    const userId = getOrCreateUserId();
    fetchJournalEntries(userId)
      .then((entries) => {
        setDreamEntries(entries);
        setBackendConnected(true);
      })
      .catch(() => {
        setBackendConnected(false);
      });
  }, []);

  const constitutionTaken = constitutionAnswers.length >= CONSTITUTION_SCENARIOS.length;
  const TAB_UNLOCK_DAY = { dojo: 1, edin: 1, map: 1, goals: 8, library: 22, future: 30 };
  const isLocked = (tabKey) => {
    if (!newUserMode) return false;
    if (!constitutionTaken) return tabKey !== "dojo";
    return simulatedDay < TAB_UNLOCK_DAY[tabKey];
  };

  useEffect(() => {
    if (isLocked(view)) setView("dojo");
  }, [newUserMode, constitutionTaken, simulatedDay]);

  const states = mode === "workload" ? WORKLOAD_STATES : SLEEP_STATES;
  const activeKey = mode === "workload" ? workloadKey : sleepKey;
  const setActiveKey = mode === "workload" ? setWorkloadKey : setSleepKey;

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100%",
        padding: "28px 24px 40px",
        fontFamily: "Inter, sans-serif",
        color: COLORS.ink,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.teal, marginBottom: 6 }}>
            EDIN · PHASE 1 · EEG
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, marginBottom: 4 }}>
            Decoding the Neural Blueprint
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkDim }}>
            Same 168-feature engine, two states of mind. Cognitive workload and sleep architecture,
            side by side.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          {["science", "user"].includes(view) && (
            <div style={{ display: "flex", gap: 8 }}>
              {["workload", "sleep"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: mode === m ? COLORS.teal : COLORS.bgPanel,
                    color: mode === m ? "#0f151b" : COLORS.inkDim,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {m === "workload" ? "Cognitive Workload" : "Sleep Stages"}
                </button>
              ))}
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
            marginBottom: 4, padding: "10px 14px", borderRadius: 10, background: COLORS.bgPanelAlt,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setNewUserMode(!newUserMode)}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: `1px solid ${newUserMode ? COLORS.gold : COLORS.grid}`,
                  background: newUserMode ? `${COLORS.gold}22` : "transparent",
                  color: newUserMode ? COLORS.gold : COLORS.inkDim, fontSize: 11.5, cursor: "pointer",
                }}
              >
                {newUserMode ? "🌱 New User Mode" : "🔓 Full Access (Demo)"}
              </button>
              {newUserMode && (
                <span style={{ fontSize: 11, color: COLORS.inkDim }}>
                  {!constitutionTaken
                    ? "Start with the Constitution — everything else unlocks from there."
                    : `Day ${simulatedDay} of their journey`}
                </span>
              )}
            </div>
            {newUserMode && constitutionTaken && (
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 8, 22, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSimulatedDay(d)}
                    style={{
                      padding: "5px 10px", borderRadius: 6, fontSize: 10.5, cursor: "pointer",
                      border: `1px solid ${simulatedDay === d ? COLORS.teal : COLORS.grid}`,
                      background: simulatedDay === d ? `${COLORS.teal}22` : "transparent",
                      color: simulatedDay === d ? COLORS.teal : COLORS.inkDim,
                    }}
                  >
                    Day {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["map", "dojo", "goals", "library", "edin", "future"].map((v) => {
              const locked = isLocked(v);
              return (
                <button
                  key={v}
                  onClick={() => !locked && setView(v)}
                  disabled={locked}
                  title={locked ? `Unlocks Day ${TAB_UNLOCK_DAY[v]}` : undefined}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: `1px solid ${locked ? COLORS.grid : view === v ? COLORS.coral : COLORS.grid}`,
                    background: locked ? "transparent" : view === v ? `${COLORS.coral}1a` : "transparent",
                    color: locked ? COLORS.grid : view === v ? COLORS.coral : COLORS.inkDim,
                    fontSize: 13,
                    cursor: locked ? "default" : "pointer",
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  {locked && "🔒 "}
                  {v === "map" ? "Genius Profile" : v === "dojo" ? "Edin's Psyche Dojo" : v === "goals" ? "Dream Journal & Calendar" : v === "library" ? "Symbolic Library" : v === "edin" ? "Edin" : "The Edin Ecosystem"}
                </button>
              );
            })}
          </div>

          {["genetics", "biofeedback", "microbiome", "other"].includes(view) && (
            <button
              onClick={() => setView("map")}
              style={{ marginTop: 10, padding: "6px 14px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer" }}
            >
              ← Back to Genius Profile
            </button>
          )}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${COLORS.grid}` }}>
            <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
              TECHNICAL PROOF — FOR TECH REVIEWERS, NOT PART OF THE CONSUMER EXPERIENCE
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["science", "user", "edf"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: `1px solid ${view === v ? COLORS.inkDim : COLORS.grid}`,
                    background: view === v ? `${COLORS.inkDim}22` : "transparent",
                    color: view === v ? COLORS.ink : COLORS.inkDim,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {v === "science" ? "Science View" : v === "user" ? "App View" : "Verified on Your File"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "map" && <GeniusProfileHub setView={setView} constitutionAnswers={constitutionAnswers} />}
        {view === "dojo" && <PracticeDojoView constitutionAnswers={constitutionAnswers} setConstitutionAnswers={setConstitutionAnswers} />}
        {view === "goals" && <GoalsCalendarView entries={dreamEntries} setEntries={setDreamEntries} backendConnected={backendConnected} />}
        {view === "genetics" && <GeneticsSubconsciousView />}
        {view === "library" && <SymbolicLibraryView />}
        {view === "science" && (
          <ScienceView mode={mode} states={states} activeKey={activeKey} setActiveKey={setActiveKey} />
        )}
        {view === "user" && (
          <PhoneMock mode={mode} states={states} activeKey={activeKey} setActiveKey={setActiveKey} />
        )}
        {view === "edin" && <EdinChatView dreamEntries={dreamEntries} />}
        {view === "future" && <FutureTechView />}
        {view === "biofeedback" && <BiofeedbackLabView />}
        {view === "microbiome" && <MicrobiomeView />}
        {view === "other" && <OtherLanesView />}
        {view === "edf" && <VerificationHub />}

        <div style={{ marginTop: 28, fontSize: 11, color: COLORS.inkDim, opacity: 0.7 }}>
          * Waveforms and band values are representative — modeled on the published characteristics of the
          45-subject workload dataset and Sleep-EDF clinical staging literature, not a live data pull.
        </div>
      </div>

      {/* Persistent Edin access — reachable from any tab, not just the Edin tab itself */}
      {!edinOpen && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{
            background: COLORS.bgPanel, border: `1px solid ${COLORS.gold}55`, borderRadius: 12,
            padding: "8px 14px", fontSize: 12, color: COLORS.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
            fontFamily: "Georgia, serif",
          }}>
            {greeting}
          </div>
          <button
            onClick={() => setEdinOpen(true)}
            style={{
              width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
              padding: 0, overflow: "hidden",
              boxShadow: `0 4px 18px ${COLORS.gold}66`,
            }}
            title="Chat with Edin"
          >
            <img src={EDIN_ICON} alt="Edin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        </div>
      )}
      {edinOpen && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 360, maxWidth: "90vw", maxHeight: "70vh",
            background: COLORS.bg, border: `1px solid ${COLORS.grid}`, borderRadius: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${COLORS.grid}` }}>
            <div style={{ fontSize: 12, color: COLORS.teal, letterSpacing: 0.5 }}>EDIN — AVAILABLE ANYWHERE</div>
            <button onClick={() => setEdinOpen(false)} style={{ border: "none", background: "transparent", color: COLORS.inkDim, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
          <div style={{ padding: "14px", overflowY: "auto" }}>
            <EdinChatView dreamEntries={dreamEntries} />
          </div>
        </div>
      )}
    </div>
  );
}
