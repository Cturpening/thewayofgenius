import { COLORS } from "../../../theme/tokens";

// Real physiological systems, distinct from BODY_SYMBOLS (the existing
// chakra-style points, which track where a specific dream symbol has
// shown up in the body). This is the other half of the same real idea:
// when a coach is tracking which of a client's actual body systems seem
// to be implicated, dream/symbol imagery often clusters by system, not
// just by a single point -- a recurring "wall" or "invader" image tends
// to cluster with immune/lymphatic concerns, a "drowning" or
// "suffocating" image with respiratory. This is reference/illustrative
// content (no per-client tracking is wired up yet -- see LivingMap's own
// note) meant to give a coach real vocabulary to work with, not invented
// client data.
//
// The standard 11-system model (not an 8-system shortcut): integumentary,
// skeletal, muscular, nervous, endocrine, cardiovascular, lymphatic
// (immune folded in here rather than listed separately), respiratory,
// digestive, urinary, reproductive. heightFrac spreads them head-to-foot
// along the same spine BODY_SYMBOLS uses, in LivingMap.

export const BODY_SYSTEMS = [
  {
    key: "nervous", label: "Nervous System", heightFrac: 0.03, color: "#8e7ad1",
    function: "Signal relay -- the body's own wiring, carrying information end to end.",
    symbolicParallel: "Electricity, wires, static, lightning, signals cutting in and out.",
  },
  {
    key: "integumentary", label: "Integumentary System", heightFrac: 0.12, color: "#d8a48f",
    function: "The boundary between inside and outside -- what everyone else actually meets first.",
    symbolicParallel: "Skin, walls, thresholds, something exposed or finally protected.",
  },
  {
    key: "endocrine", label: "Endocrine System", heightFrac: 0.22, color: "#e0b15c",
    function: "Hormonal messaging -- slower, broader signals than the nervous system, timing and mood.",
    symbolicParallel: "Keys and locks, messengers, letters that arrive late or get lost.",
  },
  {
    key: "respiratory", label: "Respiratory System", heightFrac: 0.33, color: COLORS.teal,
    function: "Breath -- the most automatic system, and the one most tied to felt urgency or calm.",
    symbolicParallel: "Wind, air, suffocation, a window finally opening, being able to exhale.",
  },
  {
    key: "cardiovascular", label: "Cardiovascular System", heightFrac: 0.42, color: COLORS.coral,
    function: "Circulation -- the pump and the rivers, carrying everything else to where it's needed.",
    symbolicParallel: "Rivers, pumps, red imagery, something finally flowing after being blocked.",
  },
  {
    key: "lymphatic", label: "Lymphatic & Immune System", heightFrac: 0.5, color: COLORS.violet,
    function: "Drainage, cleanup, and defense -- the quiet system that decides self versus threat, and clears what's already been dealt with.",
    symbolicParallel: "Walls, armor, invaders, clogged drains, a boundary finally held or finally clearing.",
  },
  {
    key: "digestive", label: "Digestive System", heightFrac: 0.58, color: "#7fb3a3",
    function: "Processing and breaking down -- what gets absorbed, what gets released.",
    symbolicParallel: "Roots, soil, something being digested or not, gut feelings taken literally.",
  },
  {
    key: "urinary", label: "Urinary System", heightFrac: 0.67, color: "#6a95c9",
    function: "Filtration -- what gets kept and what gets released, on a schedule the body doesn't negotiate on.",
    symbolicParallel: "Filters, release, letting go of what's no longer needed, holding on too long.",
  },
  {
    key: "reproductive", label: "Reproductive System", heightFrac: 0.74, color: "#c97fa8",
    function: "Creation and continuation -- what the body builds toward beyond just itself.",
    symbolicParallel: "Seeds, growth, creation, something new taking shape or waiting to.",
  },
  {
    key: "muscular", label: "Muscular System", heightFrac: 0.83, color: COLORS.inkDim,
    function: "Movement and effort -- what actually does the work of carrying, pushing, holding.",
    symbolicParallel: "Straining, carrying, holding something up, finally able to move or finally collapsing.",
  },
  {
    key: "skeletal", label: "Skeletal System", heightFrac: 0.92, color: "#c9a86a",
    function: "The rigid framework -- what everything else is hung on, quite literally.",
    symbolicParallel: "Bones, scaffolding, foundations, something finally able to bear weight.",
  },
];
