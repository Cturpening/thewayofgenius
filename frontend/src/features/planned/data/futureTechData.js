import { COLORS } from "../../../theme/tokens";

export const FUTURE_TECH = [
  {
    key: "band",
    phase: "PHASE 2 — NOT YET RELEASED",
    name: "The Band",
    tagline: "Not a smartwatch. Built for the edge.",
    color: COLORS.gold,
    body: "A measuring bracelet, purpose-built to hold up in extreme environments — not a repurposed smartwatch chassis. It captures the basic biofeedback signal Edin's Dojo actually needs and feeds it straight back into the same living profile a user's already building through dreamwork, symbols, and training.",
    points: [
      "Band, not watch — easier to manufacture, tougher in the field",
      "Feeds directly into the same Genius Profile already live in the Dojo",
      "Validated preference: both analog-astronaut and elite-sports communities favor this form factor",
    ],
  },
  {
    key: "vr",
    phase: "PHASE 3 — NOT YET RELEASED",
    name: "The VR Training Headset",
    tagline: "Step into your subconscious. Train it in real time.",
    color: "#8e7ad1",
    body: "An Edin-integrated VR headset for actively exploring and training the subconscious mind in immersive environments — guided dream techniques, consciousness-expanding exercises, and skill integration that reinforce neural pathways for focus, creativity, and performance. EEG-based tracking layers in brainwave insight for precision training, turning the mind into a real playground for mastery.",
    points: [
      "Practice in VR what gets applied in dreams and daily life",
      "EEG-based brainwave tracking layered on top for precision",
      "Runs on the same Psyche Dojo protocols already proven in software",
    ],
  },
  {
    key: "eeg",
    phase: "PHASE 4 — THE HONEST FRONTIER",
    name: "True Consumer EEG",
    tagline: "In the research right now. Not in a consumer product yet — and we're saying so.",
    color: COLORS.teal,
    body: "EEG is already real and already in use — it runs today inside the research work (clinical-grade and research-grade hardware, real subject data, real classifiers). What doesn't exist yet is a consumer-grade version worth shipping: today's affordable, wearable EEG headsets are simply too noisy — too much signal artifact, not enough of the clean band-power resolution the real research relies on. Genuinely clean manufacturer-grade rigs run around $32,000, with heavy wiring and software overhead that has no place in a consumer product. So: real research use now, honest 'not yet' on consumer hardware, until the noise floor actually comes down.",
    points: [
      "Used today in research, not a future promise there — the classifiers in this prototype are trained on real data",
      "Consumer-grade EEG hardware is simply too noisy right now — that's the specific, named blocker",
      "Not vaporware — a real cost/engineering constraint, not hand-waved",
      "Slots into the consumer roadmap the moment noise/cost actually come down, not before",
    ],
  },
];


export const RESEARCH_STAGE_1 = [
  { name: "EEG", color: COLORS.teal },
  { name: "ECG", color: "#8e7ad1" },
  { name: "HRV", color: COLORS.gold },
  { name: "Biofeedback", color: COLORS.gold },
  { name: "Microbiome", color: COLORS.coral },
  { name: "Behavioral Sciences", color: "#7fb3a3" },
];
