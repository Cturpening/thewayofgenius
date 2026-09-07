import { COLORS } from "../../../theme/tokens";

// A goal's `modality` names which lane of the app actually feeds progress on
// it -- a real constrained type in the database (see database/schema.sql),
// not a decorative label. "career" and "other" are the honest case of no
// real modality behind it yet.
export const GOAL_MODALITIES = [
  { key: "sleep", label: "Metacognitive Training", color: COLORS.gold },
  { key: "biofeedback", label: "Biofeedback", color: COLORS.coral },
  { key: "microbiome", label: "Microbiome + Biofeedback", color: COLORS.teal },
  { key: "career", label: "Career (no modality link)", color: COLORS.inkDim },
  { key: "other", label: "Other", color: COLORS.violet },
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
