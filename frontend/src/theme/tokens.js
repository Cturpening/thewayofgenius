export const COLORS = {
  bg: "#FDFEFC",
  bgPanel: "#EEF3F0",
  bgPanelAlt: "#E1E9E3",
  teal: "#3F6B57",
  tealDim: "#B9CFC0",
  coral: "#C1704F",
  coralDim: "#E9CBBC",
  ink: "#1C2E24",
  inkDim: "#647169",
  grid: "#D7E0DA",
  gold: "#AD8A3E",
  violet: "#6F5C93",
};


export const BANDS = [
  { key: "delta", label: "Delta", range: "0–4 Hz" },
  { key: "theta", label: "Theta", range: "4–8 Hz" },
  { key: "alpha", label: "Alpha", range: "8–12 Hz" },
  { key: "beta", label: "Beta", range: "12–30 Hz" },
];

// Representative band-power profiles, modeled on the published characteristics
// of the workload dataset (45-subject Emotiv EPOC study) and the Sleep-EDF
// clinical sleep-staging literature. Not a live pull from PhysioNet.


export const WORKLOAD_STATES = {
  rest: { label: "Rest State", delta: 0.3, theta: 0.35, alpha: 0.75, beta: 0.25, accent: COLORS.teal },
  test: { label: "Test State (High Load)", delta: 0.2, theta: 0.55, alpha: 0.3, beta: 0.85, accent: COLORS.coral },
};


export const SLEEP_STATES = {
  awake: { label: "Awake in Bed", delta: 0.15, theta: 0.25, alpha: 0.7, beta: 0.6, accent: COLORS.coral },
  light: { label: "Light Sleep (N1/N2)", delta: 0.4, theta: 0.75, alpha: 0.3, beta: 0.15, accent: "#c9a86a" },
  deep: { label: "Deep Sleep (Slow-Wave)", delta: 0.9, theta: 0.35, alpha: 0.1, beta: 0.05, accent: COLORS.teal },
  rem: { label: "REM", delta: 0.25, theta: 0.6, alpha: 0.4, beta: 0.45, accent: "#8e7ad1" },
};


export const STAGE_COLORS = { Awake: COLORS.coral, Light: "#c9a86a", Deep: COLORS.teal, REM: "#8e7ad1" };


export const STAGE_ORDER = { Awake: 3, REM: 2, Light: 1, Deep: 0 };
