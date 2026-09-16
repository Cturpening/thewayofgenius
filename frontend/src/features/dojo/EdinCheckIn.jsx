import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { fetchCheckIn } from "./api";

// Real recency across the app's four persisted, timestamped areas -- see
// backend/app/main.py's /edin/checkin. Deterministic, not an AI call, so
// this loads instantly and costs nothing every time the Dojo opens.
// Biofeedback Lab and Microbiome aren't included; neither has a real
// table behind it yet, so there's no honest "last visited" for them.

const DESTINATIONS = {
  dream_journal: { label: "Open Goals & Calendar", go: (setView) => setView("goals") },
  goals: { label: "Open Goals & Calendar", go: (setView) => setView("goals") },
  follow_through: { label: "Open Follow-Through", go: (setView) => setView("other") },
  constitution: { label: "Open the Constitution", go: (_setView, setLens) => setLens("constitution") },
};

function messageFor(s) {
  if (s.daysSince === null) {
    return s.area === "constitution"
      ? "You haven't taken your Genius Constitution yet -- want to start there?"
      : `You haven't logged anything in ${s.label} yet -- want to start?`;
  }
  const days = s.daysSince === 1 ? "1 day" : `${s.daysSince} days`;
  return `It's been ${days} since your last ${s.label.toLowerCase()} entry -- want to pick that back up?`;
}

export default function EdinCheckIn({ setView, setLens }) {
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCheckIn()
      .then(setSuggestions)
      .catch((err) => { console.error("Failed to load Edin's check-in:", err); setError(err.message); });
  }, []);

  if (error || !suggestions) return null;

  const stale = suggestions.filter((s) => s.isStale);
  if (stale.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ display: "flex", alignItems: "center", gap: 10, background: `${COLORS.teal}12`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: COLORS.ink }}
      >
        <img src={EDIN_ICON} alt="Edin" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        You've touched every part of your practice recently -- good rhythm.
      </motion.div>
    );
  }

  // Rank by how overdue each area is relative to its own cadence, not raw
  // days -- a dream journal (expected near-daily) 3 days stale matters
  // more than goals (expected weekly) 8 days stale, even though 8 > 3.
  const top = stale.reduce((worst, s) => {
    const ratio = s.daysSince === null ? Infinity : s.daysSince / s.staleAfterDays;
    const worstRatio = worst.daysSince === null ? Infinity : worst.daysSince / worst.staleAfterDays;
    return ratio > worstRatio ? s : worst;
  });

  const dest = DESTINATIONS[top.area];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "10px 14px" }}
    >
      <motion.img
        src={EDIN_ICON}
        alt="Edin"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
      <div style={{ fontSize: 12.5, color: COLORS.ink, flex: 1, minWidth: 200 }}>{messageFor(top)}</div>
      {dest && (
        <motion.button
          onClick={() => dest.go(setView, setLens)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: COLORS.gold, color: "#FDFEFC", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {dest.label}
        </motion.button>
      )}
    </motion.div>
  );
}
