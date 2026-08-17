import { COLORS } from "../../../theme/tokens";

export const INITIAL_TEAM_MEMBERS = [
  {
    id: "spark", name: "The Spark", mode: "front", color: COLORS.coral,
    role: "Shows up when a new idea is needed — brainstorming, reframing a stuck problem.",
    task: "Currently helping reframe the Q3 proposal angle.",
  },
  {
    id: "organizer", name: "The Organizer", mode: "background", color: COLORS.gold,
    role: "Runs quietly, keeping files, notes, and data threads sorted without being asked.",
    task: "Currently keeping the dream-symbol dictionary cross-referenced in the background.",
  },
  {
    id: "calmer", name: "The Calmer", mode: "front", color: COLORS.teal,
    role: "Shows up for regulation — slowing things down, lingering in alpha when asked.",
    task: "Currently on call for pre-sleep wind-down practice.",
  },
];
