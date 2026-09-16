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
//
// Each system also carries real anatomical substructures (not generic
// "Cell 1..6" placeholders) -- the actual named divisions a coach would
// recognize, each with its own function/symbolicParallel just like the
// system level. LivingMap renders these as the first drill-down layer;
// signalLabel names whatever sits one layer below that (a real cell/
// neuron for the nervous system, a pulse for cardiovascular, etc) since
// "neuron" doesn't literally apply to every system. commonlyTracked is
// real vocabulary for what a coach or clinician might actually monitor
// for that system -- reference, not a live per-client reading.

export const BODY_SYSTEMS = [
  {
    key: "nervous", label: "Nervous System", heightFrac: 0.03, color: "#8e7ad1",
    function: "Signal relay -- the body's own wiring, carrying information end to end.",
    symbolicParallel: "Electricity, wires, static, lightning, signals cutting in and out.",
    signalLabel: "Neuron",
    commonlyTracked: ["Heart rate variability", "Sleep latency & stages", "Stress/startle response", "Reaction time"],
    substructures: [
      { key: "cns", label: "Central Nervous System", function: "Brain and spinal cord -- where signals are actually interpreted, not just carried.", symbolicParallel: "A command center, a control room, the source a story keeps returning to." },
      { key: "pns", label: "Peripheral Nervous System", function: "Every nerve outside the brain and spinal cord -- the wiring that reaches the rest of the body.", symbolicParallel: "Branches, roads out from a hub, the long way information has to travel." },
      { key: "sympathetic", label: "Sympathetic Branch", function: "The fight-or-flight branch -- mobilizes the body fast when something reads as a threat.", symbolicParallel: "Alarms, chases, something coming that has to be outrun or fought." },
      { key: "parasympathetic", label: "Parasympathetic Branch", function: "The rest-and-digest branch -- brings the body back down once the threat has passed.", symbolicParallel: "A held breath finally released, coming back down to earth, safety." },
      { key: "sensory", label: "Sensory Pathways", function: "Carries information in -- what the body notices before the mind names it.", symbolicParallel: "Antennae, messengers arriving, something noticed before it's understood." },
      { key: "motor", label: "Motor Pathways", function: "Carries commands out -- what turns a decision into an actual movement.", symbolicParallel: "Orders sent down the line, a hand finally moving after hesitating." },
    ],
  },
  {
    key: "integumentary", label: "Integumentary System", heightFrac: 0.12, color: "#d8a48f",
    function: "The boundary between inside and outside -- what everyone else actually meets first.",
    symbolicParallel: "Skin, walls, thresholds, something exposed or finally protected.",
    signalLabel: "Skin Cell",
    commonlyTracked: ["Skin conductance (stress response)", "Wound healing time", "Temperature regulation", "Rashes/flare patterns"],
    substructures: [
      { key: "epidermis", label: "Epidermis", function: "The outer barrier -- what's actually visible, first to show wear.", symbolicParallel: "A surface, a face shown to the world, the first thing anyone reads." },
      { key: "dermis", label: "Dermis", function: "The structural layer underneath -- less visible, doing more of the real work.", symbolicParallel: "Foundations under a surface, what holds shape from behind the scenes." },
      { key: "sweat-glands", label: "Sweat Glands", function: "Temperature and release -- one of the body's few visible pressure valves.", symbolicParallel: "Steam, pressure venting, something finally letting off heat." },
      { key: "sensory-receptors", label: "Sensory Receptors", function: "Touch, pain, temperature -- the boundary's own early-warning system.", symbolicParallel: "Trip wires, feelers, the first alert before anything's confirmed." },
      { key: "hair-nails", label: "Hair & Nails", function: "Protective growth -- slow, visible, easy to track change over time.", symbolicParallel: "Armor plates, growth rings, evidence of time passing." },
    ],
  },
  {
    key: "endocrine", label: "Endocrine System", heightFrac: 0.22, color: "#e0b15c",
    function: "Hormonal messaging -- slower, broader signals than the nervous system, timing and mood.",
    symbolicParallel: "Keys and locks, messengers, letters that arrive late or get lost.",
    signalLabel: "Hormone Signal",
    commonlyTracked: ["Cortisol rhythm", "Thyroid panel", "Blood sugar / insulin response", "Sleep-wake hormone timing"],
    substructures: [
      { key: "hypothalamus", label: "Hypothalamus", function: "The command center -- decides what the rest of the system needs to respond to.", symbolicParallel: "A dispatcher, the first decision-maker before anything is sent out." },
      { key: "pituitary", label: "Pituitary Gland", function: "The 'master gland' -- relays the hypothalamus's decisions to everywhere else.", symbolicParallel: "A relay station, the middle link a message has to pass through." },
      { key: "thyroid", label: "Thyroid", function: "Sets the body's overall pace -- metabolism, energy, how fast things run.", symbolicParallel: "A throttle, a metronome, something running too fast or too slow." },
      { key: "adrenal", label: "Adrenal Glands", function: "The stress-response glands -- quick, forceful, built for the short term.", symbolicParallel: "An emergency broadcast, a surge, something sudden taking over." },
      { key: "pancreas-endocrine", label: "Pancreas", function: "Blood sugar regulation -- steady supply and demand, easy to overlook until it's not.", symbolicParallel: "A supply line, rationing, something running short or overflowing." },
      { key: "gonads", label: "Gonads", function: "Sex hormone production -- ties into growth, cycle, and drive.", symbolicParallel: "Seeds, seasons, cycles that return on their own timeline." },
    ],
  },
  {
    key: "respiratory", label: "Respiratory System", heightFrac: 0.33, color: COLORS.teal,
    function: "Breath -- the most automatic system, and the one most tied to felt urgency or calm.",
    symbolicParallel: "Wind, air, suffocation, a window finally opening, being able to exhale.",
    signalLabel: "Molecule",
    commonlyTracked: ["Breathing rate", "SpO2 (blood oxygen)", "Breath-holding pattern", "Sighing/yawning frequency"],
    substructures: [
      { key: "upper-airway", label: "Upper Airway", function: "Nose and throat -- the entry point, where air is filtered and warmed first.", symbolicParallel: "A doorway, a threshold air has to pass through before it counts." },
      { key: "trachea", label: "Trachea", function: "The main passage -- a single shared route everything has to move through.", symbolicParallel: "A tunnel, a narrow pass, one way in and one way out." },
      { key: "bronchi", label: "Bronchi", function: "The branching paths -- where one route splits into many smaller ones.", symbolicParallel: "A fork in the road, a tree's branches, one thing becoming many." },
      { key: "lungs-alveoli", label: "Lungs & Alveoli", function: "The exchange surface -- where the actual trade of oxygen for carbon dioxide happens.", symbolicParallel: "A marketplace, a trade, something given up in exchange for something needed." },
      { key: "diaphragm", label: "Diaphragm", function: "The driving muscle -- does the actual work of pulling breath in.", symbolicParallel: "An engine, a bellows, the effort behind something that looks effortless." },
    ],
  },
  {
    key: "cardiovascular", label: "Cardiovascular System", heightFrac: 0.42, color: COLORS.coral,
    function: "Circulation -- the pump and the rivers, carrying everything else to where it's needed.",
    symbolicParallel: "Rivers, pumps, red imagery, something finally flowing after being blocked.",
    signalLabel: "Pulse",
    commonlyTracked: ["Resting heart rate", "Blood pressure", "Heart rate recovery", "Circulation / extremity temperature"],
    substructures: [
      { key: "heart-chambers", label: "Heart Chambers", function: "The pump itself -- four rooms working in sequence, never out of rhythm on their own terms.", symbolicParallel: "A drumbeat, a rhythm section, the thing everything else moves in time with." },
      { key: "coronary-vessels", label: "Coronary Vessels", function: "The heart's own supply lines -- even the pump needs to be fed.", symbolicParallel: "A source feeding its own source, something that has to take care of itself first." },
      { key: "arteries", label: "Arteries", function: "Outbound flow -- carrying what's needed away from the center, under real pressure.", symbolicParallel: "Rivers rushing outward, pressure, urgency moving away from the source." },
      { key: "veins", label: "Veins", function: "Return flow -- slower, quieter, bringing everything back to be recirculated.", symbolicParallel: "A tide coming back in, the slow return trip after the rush." },
      { key: "capillary-beds", label: "Capillary Beds", function: "The exchange points -- where circulation actually reaches the smallest scale of tissue.", symbolicParallel: "Fine threads, a delta, where a big river breaks into everything it feeds." },
    ],
  },
  {
    key: "lymphatic", label: "Lymphatic & Immune System", heightFrac: 0.5, color: COLORS.violet,
    function: "Drainage, cleanup, and defense -- the quiet system that decides self versus threat, and clears what's already been dealt with.",
    symbolicParallel: "Walls, armor, invaders, clogged drains, a boundary finally held or finally clearing.",
    signalLabel: "Immune Cell",
    commonlyTracked: ["Frequency of illness", "Inflammation markers", "Recovery time from illness", "Allergy/sensitivity flare pattern"],
    substructures: [
      { key: "lymph-nodes", label: "Lymph Nodes", function: "Checkpoints -- where the body actually screens for threats along the way.", symbolicParallel: "Guard posts, checkpoints, something being screened before it's allowed through." },
      { key: "spleen", label: "Spleen", function: "Filtration -- clears out what's already been used up or worn out.", symbolicParallel: "A filter, a sieve, sorting what's still useful from what isn't." },
      { key: "thymus", label: "Thymus", function: "The training ground -- where immune cells learn to tell self from threat.", symbolicParallel: "A school, a training camp, learning the difference before it matters." },
      { key: "white-blood-cells", label: "White Blood Cells", function: "The responders -- the ones that actually show up when something's wrong.", symbolicParallel: "First responders, a called-in team, something arriving right when it's needed." },
      { key: "lymphatic-vessels", label: "Lymphatic Vessels", function: "The drainage network -- quiet, easy to ignore, essential when it backs up.", symbolicParallel: "Drains, gutters, something meant to just quietly keep clearing." },
    ],
  },
  {
    key: "digestive", label: "Digestive System", heightFrac: 0.58, color: "#7fb3a3",
    function: "Processing and breaking down -- what gets absorbed, what gets released.",
    symbolicParallel: "Roots, soil, something being digested or not, gut feelings taken literally.",
    signalLabel: "Enzyme",
    commonlyTracked: ["Digestive regularity", "Bloating/discomfort pattern", "Appetite changes", "Gut-symptom-to-stress correlation"],
    substructures: [
      { key: "stomach", label: "Stomach", function: "Initial breakdown -- where things first get taken apart before anything's absorbed.", symbolicParallel: "A furnace, a first pass, something being broken down before it can be used." },
      { key: "small-intestine", label: "Small Intestine", function: "Absorption -- the real work of actually taking in what the body needs.", symbolicParallel: "Roots drawing nutrients, a long hallway lined with doors that let things in." },
      { key: "large-intestine", label: "Large Intestine", function: "Processing what's left -- deciding what's still usable and what needs to go.", symbolicParallel: "A final sort, a last chance, deciding what's kept and what's released." },
      { key: "liver", label: "Liver", function: "Filtering and processing -- handles more of the body's cleanup than almost anything else.", symbolicParallel: "A refinery, a processing plant, quietly doing more than it gets credit for." },
      { key: "gut-microbiome", label: "Gut Microbiome", function: "The ecosystem within -- an entire community that shapes digestion and mood alike.", symbolicParallel: "An ecosystem, a hidden community, an entire world working underneath." },
    ],
  },
  {
    key: "urinary", label: "Urinary System", heightFrac: 0.67, color: "#6a95c9",
    function: "Filtration -- what gets kept and what gets released, on a schedule the body doesn't negotiate on.",
    symbolicParallel: "Filters, release, letting go of what's no longer needed, holding on too long.",
    signalLabel: "Filtration Unit",
    commonlyTracked: ["Hydration level", "Frequency/urgency pattern", "Kidney function markers", "Fluid retention"],
    substructures: [
      { key: "kidneys", label: "Kidneys", function: "The filters -- constantly deciding what stays in circulation and what doesn't.", symbolicParallel: "A filter, a sieve running nonstop, deciding what's kept and what's let go." },
      { key: "ureters", label: "Ureters", function: "The transport -- carrying what's been filtered onward, no shortcuts.", symbolicParallel: "A pipeline, a one-way route, no way to skip the trip." },
      { key: "bladder", label: "Bladder", function: "The holding -- storage with a real limit, and a clear signal when it's reached.", symbolicParallel: "A reservoir, a limit, something that can only hold so much before it says so." },
      { key: "urethra", label: "Urethra", function: "The release -- the final, deliberate step of letting go.", symbolicParallel: "An exit, a release valve, the actual moment of letting something go." },
    ],
  },
  {
    key: "reproductive", label: "Reproductive System", heightFrac: 0.74, color: "#c97fa8",
    function: "Creation and continuation -- what the body builds toward beyond just itself.",
    symbolicParallel: "Seeds, growth, creation, something new taking shape or waiting to.",
    signalLabel: "Cell",
    commonlyTracked: ["Cycle regularity", "Hormonal shifts across the cycle", "Libido/energy shifts", "Fertility markers"],
    substructures: [
      { key: "hormonal-drivers", label: "Hormonal Drivers", function: "The signals that set the whole system's rhythm in motion.", symbolicParallel: "A conductor, a season changing, something that sets a rhythm without asking." },
      { key: "cycle-rhythm", label: "Cycle & Rhythm Regulation", function: "The recurring pattern -- rarely identical twice, but rarely random either.", symbolicParallel: "Tides, moons, a pattern that returns but is never quite the same twice." },
      { key: "growth-capacity", label: "Growth & Creation Capacity", function: "What the system is actually built toward -- creation, continuation, potential.", symbolicParallel: "Seeds, soil, potential waiting for the right season." },
      { key: "connection-pathways", label: "Intimacy & Connection Pathways", function: "The relational side of this system -- rarely just physical, rarely just private.", symbolicParallel: "Bridges, open doors, something meant to be shared rather than held alone." },
    ],
  },
  {
    key: "muscular", label: "Muscular System", heightFrac: 0.83, color: COLORS.inkDim,
    function: "Movement and effort -- what actually does the work of carrying, pushing, holding.",
    symbolicParallel: "Straining, carrying, holding something up, finally able to move or finally collapsing.",
    signalLabel: "Fiber",
    commonlyTracked: ["Tension/tightness pattern", "Grip strength", "Recovery time after exertion", "Chronic bracing areas"],
    substructures: [
      { key: "skeletal-muscle", label: "Skeletal Muscle", function: "Voluntary movement -- the muscle you actually choose to use.", symbolicParallel: "A chosen effort, deliberate carrying, something done on purpose." },
      { key: "smooth-muscle", label: "Smooth Muscle", function: "Involuntary movement in organs -- working constantly without ever being asked to.", symbolicParallel: "Background labor, something running without anyone noticing it's working." },
      { key: "cardiac-muscle", label: "Cardiac Muscle", function: "The heart's own muscle -- built to never stop, never asked to rest.", symbolicParallel: "An engine that can't be turned off, effort with no scheduled break." },
      { key: "tendons", label: "Tendons", function: "Muscle-to-bone connectors -- where effort actually gets transferred into motion.", symbolicParallel: "A hinge, a coupling, the link where intention finally becomes movement." },
    ],
  },
  {
    key: "skeletal", label: "Skeletal System", heightFrac: 0.92, color: "#c9a86a",
    function: "The rigid framework -- what everything else is hung on, quite literally.",
    symbolicParallel: "Bones, scaffolding, foundations, something finally able to bear weight.",
    signalLabel: "Osteocyte",
    commonlyTracked: ["Bone density", "Joint mobility/stiffness", "Posture patterns", "Old injury flare-ups"],
    substructures: [
      { key: "axial-skeleton", label: "Axial Skeleton", function: "The core structure -- skull, spine, ribs -- what everything else is built around.", symbolicParallel: "A spine, a central pillar, the thing everything else leans on." },
      { key: "appendicular-skeleton", label: "Appendicular Skeleton", function: "The limbs -- built for reach and movement, not just support.", symbolicParallel: "Branches, reach, the parts that go out and bring things back." },
      { key: "joints", label: "Joints", function: "Points of movement -- where rigid structure is allowed to bend.", symbolicParallel: "Hinges, flexibility built into something otherwise rigid." },
      { key: "bone-marrow", label: "Bone Marrow", function: "Where blood cells are actually made -- structure doubling as a factory.", symbolicParallel: "A hidden factory, something generative inside what looks purely structural." },
      { key: "ligaments", label: "Ligaments", function: "Bone-to-bone connectors -- keep the whole structure from coming apart under load.", symbolicParallel: "Bindings, the quiet connections that keep a structure from falling apart." },
    ],
  },
];
