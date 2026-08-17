import { COLORS } from "../../../theme/tokens";

export const FOLLOWTHROUGH_SOURCES = [
  { key: "dream", label: "Dream/Symbol Insight", color: "#8e7ad1" },
  { key: "lesson", label: "A Lesson", color: COLORS.gold },
  { key: "constitution", label: "Constitution Intention", color: COLORS.teal },
  { key: "coaching", label: "Coaching Session", color: COLORS.coral },
  { key: "other", label: "Other", color: COLORS.inkDim },
];


export const STATUS_META = {
  pending: { label: "Too Soon to Tell", color: COLORS.inkDim },
  did: { label: "Followed Through", color: COLORS.teal },
  partial: { label: "Partially", color: COLORS.gold },
  didnt: { label: "Didn't (Yet)", color: COLORS.coral },
};


export const INITIAL_FOLLOWTHROUGHS = [
  {
    id: 1, source: "dream", intention: "Say no to work that isn't mine to carry, calmly, without over-explaining.",
    status: "did", note: "Did it — felt an unfamiliar lightness after, no guilt spiral.", date: "3 weeks ago", emotionalShift: "higher",
  },
  {
    id: 2, source: "constitution", intention: "Let a decision sit longer before acting on it, at least once this week.",
    status: "partial", note: "Caught myself once, still acted fast the other two times.", date: "1 week ago", emotionalShift: "same",
  },
];


export const INITIAL_PATTERNS = [
  { id: 1, name: "Checking phone within 5 min of waking", trend: "decreasing", entries: 4 },
  { id: 2, name: "Journaling before bed", trend: "increasing", entries: 6 },
];
