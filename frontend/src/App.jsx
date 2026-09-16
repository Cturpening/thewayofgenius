import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, SLEEP_STATES, WORKLOAD_STATES } from "./theme/tokens";
import { EDIN_ICON } from "./assets/edinIcon";
import ScienceView from "./features/verification/ScienceView";
import PhoneMock from "./features/verification/PhoneMock";
import VerificationHub from "./features/verification/VerificationHub";
import BiofeedbackLabView from "./features/planned/BiofeedbackLabView";
import MicrobiomeView from "./features/planned/MicrobiomeView";
import OtherLanesView from "./features/planned/OtherLanesView";
import GeneticsSubconsciousView from "./features/planned/GeneticsSubconsciousView";
import { fetchDreamEntries } from "./features/dream-journal/api";
import GoalsCalendarView from "./features/goals-calendar/GoalsCalendarView";
import SymbolicLibraryView from "./features/library/SymbolicLibraryView";
import PracticeDojoView from "./features/dojo/PracticeDojoView";
import GeniusProfileHub from "./features/genius-profile/GeniusProfileHub";
import FutureTechView from "./features/planned/FutureTechView";
import EdinChatView from "./features/chat/EdinChatView";
import { EDIN_GREETINGS } from "./features/chat/data/greetings";
import { useAuth } from "./features/auth/useAuth";
import LandingView from "./features/landing/LandingView";
import { supabase } from "./lib/supabaseClient";
import CoachDashboardView from "./features/coach-dashboard/CoachDashboardView";
import { checkIsCoach } from "./features/coach-dashboard/api";

export default function App() {
  const session = useAuth();
  const [mode, setMode] = useState("workload"); // workload | sleep
  const [view, setView] = useState("dojo"); // map | science | user | ...
  const [workloadKey, setWorkloadKey] = useState("rest");
  const [sleepKey, setSleepKey] = useState("deep");
  const [edinOpen, setEdinOpen] = useState(false);
  const [greeting] = useState(() => EDIN_GREETINGS[Math.floor(Math.random() * EDIN_GREETINGS.length)]);
  const [dreamEntries, setDreamEntries] = useState([]);
  const [constitutionAnswers, setConstitutionAnswers] = useState([]);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    if (!session) {
      setDreamEntries([]);
      return;
    }
    fetchDreamEntries()
      .then(setDreamEntries)
      .catch((err) => console.error("Failed to load dream journal entries:", err));
    // Decides whether the "Coach Dashboard" button below even appears --
    // a 403 from /coach/status (i.e. not a coach) is the expected result
    // for almost every account, not an error.
    checkIsCoach().then(setIsCoach);
  }, [session]);

  const states = mode === "workload" ? WORKLOAD_STATES : SLEEP_STATES;
  const activeKey = mode === "workload" ? workloadKey : sleepKey;
  const setActiveKey = mode === "workload" ? setWorkloadKey : setSleepKey;

  if (session === undefined) {
    return <div style={{ padding: 40, color: COLORS.inkDim, fontSize: 13 }}>Loading...</div>;
  }
  if (session === null) {
    return <LandingView />;
  }

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
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: COLORS.inkDim }}>
            Logged in as {session.user.email}
            {isCoach && (
              <button
                onClick={() => setView("coach")}
                style={{
                  padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                  border: `1px solid ${view === "coach" ? COLORS.violet : COLORS.grid}`,
                  background: view === "coach" ? `${COLORS.violet}18` : "transparent",
                  color: view === "coach" ? COLORS.violet : COLORS.inkDim,
                }}
              >
                🧭 Coach Dashboard
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 11, cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["map", "dojo", "goals", "library", "edin", "future"].map((v) => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: `1px solid ${view === v ? COLORS.coral : COLORS.grid}`,
                  background: view === v ? `${COLORS.coral}1a` : "transparent",
                  color: view === v ? COLORS.coral : COLORS.inkDim,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {v === "map" ? "Genius Profile" : v === "dojo" ? "Edin's Psyche Dojo" : v === "goals" ? "Dream Journal & Calendar" : v === "library" ? "Symbolic Library" : v === "edin" ? "Edin" : "The Edin Ecosystem"}
              </motion.button>
            ))}
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

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {view === "map" && (
              <GeniusProfileHub setView={setView} constitutionAnswers={constitutionAnswers} dreamEntries={dreamEntries} />
            )}
            {view === "dojo" && (
              <PracticeDojoView
                constitutionAnswers={constitutionAnswers}
                setConstitutionAnswers={setConstitutionAnswers}
                setView={setView}
              />
            )}
            {view === "goals" && <GoalsCalendarView entries={dreamEntries} setEntries={setDreamEntries} />}
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
            {view === "coach" && isCoach && <CoachDashboardView />}
          </motion.div>
        </AnimatePresence>

        <div style={{ marginTop: 28, fontSize: 11, color: COLORS.inkDim, opacity: 0.7 }}>
          * Waveforms and band values are representative — modeled on the published characteristics of the
          45-subject workload dataset and Sleep-EDF clinical staging literature, not a live data pull.
        </div>
      </div>

      {/* Persistent Edin access — reachable from any tab, not just the Edin tab itself */}
      <AnimatePresence>
        {!edinOpen && (
          <motion.div
            key="edin-bubble"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}
          >
            <div style={{
              background: COLORS.bgPanel, border: `1px solid ${COLORS.gold}55`, borderRadius: 12,
              padding: "8px 14px", fontSize: 12, color: COLORS.ink, boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              fontFamily: "Georgia, serif",
            }}>
              {greeting}
            </div>
            <motion.button
              onClick={() => setEdinOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              animate={{
                y: [0, -6, 0],
                boxShadow: [`0 4px 18px ${COLORS.gold}66`, `0 8px 26px ${COLORS.gold}99`, `0 4px 18px ${COLORS.gold}66`],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
                padding: 0, overflow: "hidden",
              }}
              title="Chat with Edin -- always nearby"
            >
              <img src={EDIN_ICON} alt="Edin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {edinOpen && (
          <motion.div
            key="edin-popup"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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
            <EdinChatView
              dreamEntries={dreamEntries}
              compact
              onOpenFull={() => { setView("edin"); setEdinOpen(false); }}
            />
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
