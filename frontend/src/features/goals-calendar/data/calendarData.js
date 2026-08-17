import { COLORS } from "../../../theme/tokens";

export const GOALS = [
  { name: "Fall asleep without racing thoughts", modality: "Metacognitive Training", color: COLORS.gold, progress: 0.6 },
  { name: "Notice the locked-door symbol before it recurs", modality: "Biofeedback", color: COLORS.coral, progress: 0.35 },
  { name: "Ship the Q3 proposal", modality: "Career (no modality link)", color: COLORS.inkDim, progress: 0.8 },
  { name: "Reduce gut tension before big meetings", modality: "Microbiome + Biofeedback", color: COLORS.teal, progress: 0.2 },
];


export const WEEK_SESSIONS = [
  { day: "Mon", label: "Lingering — Theta", time: "9:40pm" },
  { day: "Tue", label: "—", time: null },
  { day: "Wed", label: "Biofeedback Lab check-in", time: "7:00am" },
  { day: "Thu", label: "Lingering — Alpha", time: "9:40pm" },
  { day: "Fri", label: "—", time: null },
  { day: "Sat", label: "Weekly Magic Loop Review", time: "10:00am" },
  { day: "Sun", label: "—", time: null },
];


export const CALENDAR_CATEGORIES = [
  { key: "health", label: "Health & Wellness", color: COLORS.coral },
  { key: "goal", label: "Goal", color: COLORS.gold },
  { key: "incubation", label: "Incubation Prompt", color: "#8e7ad1" },
  { key: "journal", label: "Journal Highlight", color: COLORS.violet },
  { key: "biofeedback", label: "Microbiome / Biofeedback", color: COLORS.teal },
  { key: "other", label: "Other", color: COLORS.inkDim },
];


export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
