import { COLORS } from "../../../theme/tokens";

export const CONSTITUTION_SCENARIOS = [
  {
    orientation: "Shamanic",
    subtitle: "The Abstractive / Interpretive Connector",
    color: "#8e7ad1",
    dim: "orientation",
    scenario: "You find a locked door in a recurring dream, with no visible key. Before analyzing it, what's your first instinct?",
    options: [
      { text: "Sit with the feeling it gives me — what does it want to say?", value: "shamanic" },
      { text: "Look for the pattern — when else has this shown up?", value: "hermetic" },
      { text: "Decide what to actually do about it in waking life.", value: "stoic" },
    ],
  },
  {
    orientation: "Hermetic",
    subtitle: "The Principle Seeker / Synthesizer",
    color: COLORS.teal,
    dim: "orientation",
    scenario: "A system you rely on breaks in a way that seems random. What matters most to you in that moment?",
    options: [
      { text: "Finding the underlying rule that explains why this always happens.", value: "hermetic" },
      { text: "The felt sense that something deeper is trying to get my attention.", value: "shamanic" },
      { text: "Fixing it efficiently so the disruption stops.", value: "stoic" },
    ],
  },
  {
    orientation: "Stoic",
    subtitle: "The Agent of Will & Action / Architect",
    color: COLORS.coral,
    dim: "orientation",
    scenario: "You know a hard truth that would disrupt a peaceful but fragile situation for people you care about. Do you say it?",
    options: [
      { text: "Yes — duty to the truth outweighs short-term comfort, delivered with care.", value: "stoic" },
      { text: "I'd look for the principle that resolves the tension without forcing a choice.", value: "hermetic" },
      { text: "I'd sit with the symbolic weight of the decision before acting at all.", value: "shamanic" },
    ],
  },
  {
    orientation: "Focus",
    subtitle: "Which Door Actually Pulls You",
    color: COLORS.gold,
    dim: "focus",
    scenario: "Every door down the hallway is unlocked tonight, for the first time. Which one do you actually walk through first?",
    options: [
      { text: "The one marked SLEEP — I haven't really rested in longer than I'd like to admit.", value: "sleep" },
      { text: "The one marked MAKE — there's something in me that needs to get out.", value: "creativity" },
      { text: "The one marked BODY — it's been trying to tell me something for a while now.", value: "health" },
      { text: "The one marked WHO I AM — I think I've been someone else's version of me.", value: "identity" },
    ],
  },
  {
    orientation: "Density",
    subtitle: "How Much Light You Actually Want",
    color: "#e0b15c",
    dim: "density",
    scenario: "You're handed a lantern in a pitch-black hallway that keeps quietly rearranging itself. What do you want the lantern to do?",
    options: [
      { text: "Light the whole hallway at once — I'll navigate from there.", value: "full" },
      { text: "Light just the next few steps. Nothing more, nothing less.", value: "guided" },
      { text: "Stay dim until I actually ask it to shine.", value: "minimal" },
    ],
  },
  {
    orientation: "Touch",
    subtitle: "How Help Actually Feels Like Help",
    color: COLORS.teal,
    dim: "touch",
    scenario: "Something has clearly been quietly rearranging your furniture while you sleep, and it's clearly trying to help. What's your honest reaction?",
    options: [
      { text: "I want to meet it. Face to face, right now.", value: "front" },
      { text: "Let it keep working — I'll notice the results when I need to.", value: "background" },
      { text: "I'd rather learn to rearrange it myself, eventually.", value: "self" },
    ],
  },
];


export const DAY1_PATHS = {
  sleep: { label: "Sleep", color: COLORS.gold, lesson: "Insomnia Starts in the Daytime", script: "The Slide", note: "Dream Journal opens first, tuned toward bedtime incubation." },
  creativity: { label: "Creativity", color: "#8e7ad1", lesson: "The 7-Day Trifecta Challenge for Real Innovation", script: "Build and Release", note: "Conscious/Subconscious Imagination pairing leads, aimed at unlocking a stuck project." },
  health: { label: "Body / Health", color: COLORS.teal, lesson: "Your Subconscious Already Has Your Health Data", script: null, note: "Biofeedback Lab opens first, with denser bio-symbolic tagging from day one." },
  identity: { label: "Identity", color: COLORS.coral, lesson: "Talk to the Part of Your Mind You Can't Usually Reach", script: "Ask and Listen", note: "Meet the Parts Behind Your Own Story leads, ahead of any dream-symbol work." },
};


export const DENSITY_NOTES = {
  full: "Edin shows the full Genius Profile, all tabs, from day one — you'll navigate it yourself.",
  guided: "Edin surfaces one thing at a time — today's lesson, tonight's prompt — and reveals more as you go.",
  minimal: "Edin stays quiet by default. You'll see almost nothing until you ask for it.",
};


export const TOUCH_NOTES = {
  front: "Edin shows up front-space, actively, checking in and present in the work with you.",
  background: "Edin runs mostly in the background, organizing and ready, not constantly visible.",
  self: "Edin leans hard into 'dojo teacher' mode — encouraging you to try first, stepping in only when you actually falter.",
};


export const DOMINANT_LABEL = { shamanic: "Shamanic — Abstractive/Interpretive Connector", hermetic: "Hermetic — Principle Seeker/Synthesizer", stoic: "Stoic — Agent of Will & Action/Architect" };


export const DOMINANT_COLOR = { shamanic: "#8e7ad1", hermetic: COLORS.teal, stoic: COLORS.coral };


export const TRIFECTA_LAYER = { shamanic: "Soul", hermetic: "Subconscious", stoic: "Consciousness" };


export const CHALLENGE_PROMPTS = {
  shamanic: [
    "What would it feel like to just decide and act, before you've fully found the deeper meaning in it?",
    "Is this really a pattern — or are you finding meaning here because you're looking for one?",
  ],
  hermetic: [
    "What if this isn't a pattern to solve — what if it's just a feeling worth sitting with, unresolved?",
    "When's the last time you let something stay a mystery instead of finding the rule behind it?",
  ],
  stoic: [
    "What would it look like to let a decision sit a while longer before acting on it?",
    "Is there a feeling underneath this you've moved past too quickly to actually feel?",
  ],
};


export const DAILY_LIFE_NOTE = {
  shamanic: "day to day, that can look like noticing meaning and emotional undertone quickly — sometimes before there's a clear next action",
  hermetic: "day to day, that can look like spotting the pattern or the underlying rule fast — sometimes before it's been fully felt",
  stoic: "day to day, that can look like moving to action quickly — sometimes before the meaning or the pattern has fully landed",
};
