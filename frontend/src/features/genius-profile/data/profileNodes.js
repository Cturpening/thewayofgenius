import { COLORS } from "../../../theme/tokens";

export const PROFILE_NODES = [
  {
    key: "eeg", label: "EEG", angle: -90, color: COLORS.teal, status: "live",
    detail: "Real classifier, tested on held-out real Sleep-EDF data.",
    stat: "67%", statLabel: "real classifier accuracy (held-out night)",
    note: "Plus 99%/94% from your original research deck, and real Welch's-method features from a real clinical recording.",
    subs: [
      { label: "Synthetic Test", detail: "8 of 10 channels matched documented ground-truth frequencies exactly — pipeline correctness check." },
      { label: "Clinical Recording", detail: "Real Welch's-method band powers computed from an actual patient EDF file." },
      { label: "Sleep-EDF Night", detail: "Real technician-scored hypnogram + real 4-feature classifier, 67% on held-out epochs." },
      { label: "Original Research", detail: "99% personalized vs 94% global — from your 45-subject workload study." },
    ],
  },
  {
    key: "biofeedback", label: "Biofeedback", angle: -38, color: COLORS.gold, status: "live",
    detail: "Real 5-step protocol, symbolic-first by design.",
    stat: "5", statLabel: "real protocol steps, already used with real clients",
    note: "Example symbol (a locked door) is invented for illustration — the steps and prompts are real.",
    subs: [
      { label: "1. Design the Room", detail: "Visualize a blank inner space; let the subconscious place symbols there over the week." },
      { label: "2. Alchemize", detail: "Transform a painful symbol into useful meaning — raw material, not rejected." },
      { label: "3. Build the Map", detail: "Document each symbol: emotional tone, story, alchemized meaning, linked psyche-part." },
      { label: "4. Dialogue", detail: "Ask each psyche-part what it wants to be understood, protected, or healed." },
      { label: "5. Intuitional Living", detail: "Notice real-world synchronicity as real-time, device-independent biofeedback." },
    ],
  },
  {
    key: "microbiome", label: "Microbiome", angle: 14, color: COLORS.coral, status: "live",
    detail: "Real human gut-brain-axis data.",
    stat: "4.48 vs 1.91", statLabel: "real GI symptom severity, autism vs neurotypical group",
    note: "44 real people, real named bacterial genera (Kang et al. 2017).",
    subs: [
      { label: "Human Data", detail: "44 real people, real genera (Phocaeicola, Faecalibacterium, Akkermansia), real GI severity finding." },
      { label: "Mouse Data", detail: "675 real samples (Turnbaugh et al.) — kept for pipeline-robustness proof, not human." },
      { label: "Representative Panel", detail: "Phylum-level (Firmicutes/Bacteroidetes) framing, clearly labeled representative." },
    ],
  },
  {
    key: "behavioral", label: "Behavioral", angle: 66, color: COLORS.inkDim, status: "planned",
    detail: "Vanessa's lane — behavioral/environmental tracking via SandboxLife API.",
    stat: "—", statLabel: "no data yet",
    note: "Planned integration, not built. No numbers invented.",
    subs: [
      { label: "Cognitive Load", detail: "Planned field, per Modality 5 spec — no data yet." },
      { label: "Emotional Regulation", detail: "Planned field, per Modality 5 spec — no data yet." },
      { label: "Decision Quality", detail: "Planned field, per Modality 5 spec — no data yet." },
      { label: "Environmental Inputs", detail: "Planned field, per Modality 5 spec — no data yet." },
    ],
  },
  {
    key: "journals", label: "Journals", angle: 118, color: "#8e7ad1", status: "illustrative",
    detail: "AI-guided journaling, pattern + symbol tracking over time.",
    stat: "4", statLabel: "real trigger-phrase categories detected (entry itself still invented)",
    note: "The entry is invented, but the detection logic isn't — real recall-blocker/waking-activation/integration/biofeedback trigger phrases from the Beta Client Workflow Protocol. No journaling engine built yet.",
    subs: [
      { label: "Symbol Tracking", detail: "Real chapter exists (Symbolic Coding and Language) — engine to log symbols over time not built yet." },
      { label: "Pattern Detection", detail: "Real trigger phrases documented (e.g. \"there was more but it's fuzzy\") — not wired to a live journal yet." },
      { label: "Daily Entry", detail: "Illustrative entry only — see the example in this node's detail." },
    ],
  },
  {
    key: "metacog", label: "Metacognitive Training", angle: 152, color: "#e0b15c", status: "live",
    detail: "Real curriculum: \"The Art of Lingering\" — dwelling deliberately in each brainwave state.",
    stat: "4", statLabel: "real states taught: beta, alpha, theta, delta",
    note: "Two real modes from her own book: Passing (Lesson 1, observing the descent without settling) and Lingering (Lesson 2, staying and engaging). Not invented for this demo.",
    subs: [
      { label: "Passing", detail: "Lesson 1 — \"the sliding practice.\" Noticing the descent through states without settling in any one of them." },
      { label: "Lingering — Beta", detail: "\"Talkative... directional... the narrator.\" Lingering here trains noticing the surface mind itself." },
      { label: "Lingering — Alpha", detail: "\"The first exhale after a long held breath.\" Widened, spacious awareness." },
      { label: "Lingering — Theta", detail: "\"Not a passive transit zone. It is a workspace.\" Problem-solving and symbolic cognition live here." },
      { label: "Lingering — Delta", detail: "\"Not loss. Arrival at a different kind of presence.\" The advanced, rarely-sustained practice." },
    ],
  },
  {
    key: "hrv", label: "HRV / ECG", angle: -166, color: COLORS.inkDim, status: "planned",
    detail: "Device-assisted biofeedback — Phase 2 of the Biofeedback Lab.",
    stat: "—", statLabel: "no data yet",
    note: "Waits until real device data exists, cross-referenced against the symbolic map already built.",
    subs: [
      { label: "HRV (rmssd/sdnn)", detail: "Planned field, per Modality 3 spec — no data yet." },
      { label: "ECG", detail: "Planned, later-stage per the two-year roadmap." },
    ],
  },
  {
    key: "genetics", label: "Genetics + Subconscious", angle: -128, color: COLORS.gold, status: "illustrative",
    detail: "Two real sides, no confirmed link yet — built to test the hypothesis honestly, not assume it.",
    stat: "3", statLabel: "real pattern-notes from her own coaching practice",
    note: "DNA panel side is representative (no real genetic data connected). Subconscious side has real pattern-notes. The comparison loop between them is a stated hypothesis, explicitly open to being wrong.",
    subs: [
      { label: "DNA Panel", detail: "Representative marker categories only — no specific genes claimed, no real data yet." },
      { label: "Subconscious Interface", detail: "Real coaching pattern-notes: recurring ancestor figures, inherited-object symbolism, body-location echoes of family health history." },
      { label: "Proposed Loop", detail: "Can't run yet — needs both sides real first. Either outcome (correlation or none) is treated as a real, useful finding." },
    ],
  },
];


export const NODE_EXTRAS = {
  journals: {
    entry: "\"There was more but it's fuzzy — the door again, I think. Didn't write it down fast enough and now it's mostly gone. Just the feeling of standing in front of it, waiting.\"",
    reflection: "Edin flags this as a recall-blocker marker (\"there was more but it's fuzzy\" — a real, documented trigger phrase, not a generic AI guess) and notes this is the third week the same symbol has shown up, tied to your Biofeedback Lab thread. Want to look at them side by side?",
  },
  metacog: {
    prompt: "\"Choose a state. Choose a location in the descent — usually alpha or theta... If you are bringing a problem or a question, name it to yourself now... touch it, feel the shape of it, and then set it down gently, like placing something on a shelf.\" — from The Art of Lingering",
    debrief: "\"Which state did you linger in, and how long did it feel like before you moved? What was the texture of it? Did the practice feel like holding on or like lingering?\" — real reflection questions from the lesson's close",
  },
};


export const CROSS_LINKS = [
  { from: "eeg", to: "metacog", label: "brainwave states", color: COLORS.teal },
  { from: "biofeedback", to: "microbiome", label: "gut-brain axis", color: COLORS.coral },
  { from: "biofeedback", to: "journals", label: "symbol tracking", color: "#8e7ad1" },
  { from: "biofeedback", to: "hrv", label: "same lane, later phase", color: COLORS.inkDim },
  { from: "genetics", to: "biofeedback", label: "ancestral symbol work", color: COLORS.gold },
  { from: "genetics", to: "journals", label: "ancestral tag tracking", color: COLORS.gold },
];
