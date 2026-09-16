import { COLORS } from "../../../theme/tokens";

// Real physiological systems, distinct from BODY_SYMBOLS (the existing
// chakra-style points, which track where a specific dream symbol has
// shown up in the body). This is the other half of the same real idea:
// when a coach is tracking which of a client's actual body systems seem
// to be implicated, dream/symbol imagery often clusters by system, not
// just by a single point -- a recurring "wall" or "invader" image tends
// to cluster with immune-system concerns, a "drowning" or "suffocating"
// image with respiratory. This is reference/illustrative content (no
// per-client tracking is wired up yet -- see LivingMap's own note) meant
// to give a coach real vocabulary to work with, not invented client data.

export const BODY_SYSTEMS = [
  {
    key: "nervous", label: "Nervous System", heightFrac: 0.05, color: "#8e7ad1",
    function: "Signal relay -- the body's own wiring, carrying information end to end.",
    symbolicParallel: "Electricity, wires, static, lightning, signals cutting in and out.",
  },
  {
    key: "endocrine", label: "Endocrine System", heightFrac: 0.18, color: "#e0b15c",
    function: "Hormonal messaging -- slower, broader signals than the nervous system, timing and mood.",
    symbolicParallel: "Keys and locks, messengers, letters that arrive late or get lost.",
  },
  {
    key: "respiratory", label: "Respiratory System", heightFrac: 0.32, color: COLORS.teal,
    function: "Breath -- the most automatic system, and the one most tied to felt urgency or calm.",
    symbolicParallel: "Wind, air, suffocation, a window finally opening, being able to exhale.",
  },
  {
    key: "cardiovascular", label: "Cardiovascular System", heightFrac: 0.4, color: COLORS.coral,
    function: "Circulation -- the pump and the rivers, carrying everything else to where it's needed.",
    symbolicParallel: "Rivers, pumps, red imagery, something finally flowing after being blocked.",
  },
  {
    key: "digestive", label: "Digestive System", heightFrac: 0.55, color: "#7fb3a3",
    function: "Processing and breaking down -- what gets absorbed, what gets released.",
    symbolicParallel: "Roots, soil, something being digested or not, gut feelings taken literally.",
  },
  {
    key: "immune", label: "Immune System", heightFrac: 0.5, color: COLORS.violet,
    function: "Defense -- what the body treats as self versus threat.",
    symbolicParallel: "Walls, armor, invaders, a boundary being tested or finally held.",
  },
  {
    key: "musculoskeletal", label: "Musculoskeletal System", heightFrac: 0.75, color: COLORS.inkDim,
    function: "Structure and support -- what the rest of the body is actually built on.",
    symbolicParallel: "Scaffolding, bones, foundations, something finally able to bear weight.",
  },
  {
    key: "lymphatic", label: "Lymphatic System", heightFrac: 0.62, color: "#c9a86a",
    function: "Drainage and cleanup -- the quiet system, easy to overlook until it backs up.",
    symbolicParallel: "Cleanup crews, clogged drains, something finally clearing.",
  },
];
