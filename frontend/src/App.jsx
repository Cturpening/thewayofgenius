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

export default function App() {
  const [mode, setMode] = useState("workload"); // workload | sleep
  const [view, setView] = useState("dojo"); // map | science | user | ...
  const [workloadKey, setWorkloadKey] = useState("rest");
  const [sleepKey, setSleepKey] = useState("deep");
  const [edinOpen, setEdinOpen] = useState(false);
  const [greeting] = useState(() => EDIN_GREETINGS[Math.floor(Math.random() * EDIN_GREETINGS.length)]);
  const [dreamEntries, setDreamEntries] = useState(INITIAL_DREAM_ENTRIES);
  const [constitutionAnswers, setConstitutionAnswers] = useState([]);
  const [newUserMode, setNewUserMode] = useState(true);
  const [simulatedDay, setSimulatedDay] = useState(1);

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

          {[