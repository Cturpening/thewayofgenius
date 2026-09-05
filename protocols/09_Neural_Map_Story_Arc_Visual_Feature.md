# Edin — Neural Map / Story Arc Visual Feature
## Document 09 — For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

---

## WHAT THIS IS

A living visual map that fills in over time as the user moves through
their actual experience and arc. It lives inside or as a layer of the
Tapestry Web on the Genius Profile. Not a dashboard. Not a progress bar.
Something closer to a video game map that reveals itself as the player
explores — except the territory being revealed is the user's own
subconscious storylines and process arc.

The map layout is generated from the user's actual data — their symbolic
patterns, dream arcs, and training progression. Edin builds it in the
backend as data accumulates. The user does not design the map structure.
Their subconscious data generates it.

---

## HOW IT FITS INTO THE EXISTING ARCHITECTURE

The Tapestry Web already exists as the primary data visualization on the
Genius Profile. The neural map is a layer within or on top of that
canvas — not a separate screen.

Two possible approaches for the tech team to explore:

**Option A — Same canvas, different zoom state**
The neural map is what the Tapestry Web looks like when zoomed out
further. At the closest zoom you see individual nodes and threads. Pull
back further and the zone structure of the map becomes visible — arc
zones, process regions, the overall shape of the user's journey.

**Option B — Overlay toggle**
The user can toggle a map view on top of the Tapestry Web that shows the
arc zone structure and node states without replacing the thread
visualization.

Either approach is acceptable. This is a design conversation for the
tech team — the IP is in the data architecture and zone classification
system underneath.

---

## ZONE STRUCTURE — THE ARC CODING SYSTEM

The map is divided into zones that correspond to arc types and process
phases. Edin classifies each data entry and session into a zone in the
backend. The map renders based on that classification.

### Primary Zone Layer — The Three Dimensions

The three foundational zones correspond to the Trifecta layers:

| Zone | Layer | Color coding suggestion |
|------|-------|------------------------|
| Soul Zone | Soul / inspiration / reception | Deep gold / amber |
| Subconscious Zone | Subconscious Mind / body / belief / dream | Teal / bioluminescent |
| Conscious Mind Zone | Conscious action / integration / output | Warm white / silver |

These are not rigid territories. The zones bleed into each other at the
edges — the map should reflect that the three layers are always in
conversation.

### Secondary Zone Layer — The Three-Layer Process Arc

The process arc runs as three horizontal layers across the map — styled
as luminous thresholds, not flat lines. Crossing from one layer into the
next feels like moving into different territory. The user can always see
which layer their active nodes are sitting in.

| Layer | What it represents | Visual |
|-------|-------------------|--------|
| Problem | The presenting pattern — what brought the user here, what is recurring, what is stuck | Lower map region, denser fog, cooler tones |
| Dream Wisdom | The subconscious communication layer — dreams, symbols, body signals, internal parts speaking | Middle region, most luminous zone, where most nodes are active |
| Identity Shift | Integration and transformation — who the user is becoming as the pattern resolves | Upper region, warmer tones, nodes here settled and stable |

These three layers apply within each primary zone. A user can be in the
Problem layer of the Subconscious Zone and the Dream Wisdom layer of the
Conscious Mind Zone simultaneously — different patterns move at different
rates.

### Mini-Arcs Within the Layers

Within each of the three layers, mini-arcs represent smaller process
cycles — individual patterns, symbols, or subconscious team threads
moving through their own micro version of Problem → Dream Wisdom →
Identity Shift.

Each mini-arc has its own node cluster on the map. A user might have
several mini-arcs active at once, each at a different stage. The map
makes this visible — clusters of nodes at different stages across the
three layers.

### The Blocker / Crisis View — Perspective Tool

When a user is in a blocker or crisis — overwhelmed, stuck, feeling like
they have hit a wall — the map serves a specific function: perspective.

The user can see exactly where they are. Not stuck forever. Not at a
wall. Just at a specific spot in a specific layer on a specific mini-arc.
The stuck-ness becomes legible and bounded.

Edin responds as a rope — not pulling the user out, but giving them
something to hold. She can say: "I can see where you are on the map.
This is a known spot. Here is what this territory usually asks for."

**Blocker visual state:**
- Active node cluster shows a slow cool pulse — different from warm
  active glow
- Surrounding map territory is visible — user can see there is more map
  ahead
- Edin surfaces the nearest forward path — next mini-arc step, next
  practice, the rope

The blocker is not the wall. It is the place on the map just before the
next layer opens.

> **Naming note:** this section's title uses "crisis" in the everyday
> sense (a stuck point, a wall) — it is not the same "crisis" as the
> Crisis Escalation Protocol (`03_Crisis_Escalation_Protocol.md`). If
> real Track B crisis language appears while a user is in this Blocker
> view, Track B's override still applies exactly as it does everywhere
> else — the map does not soften or delay that response.

---

## NODE SYSTEM

Individual nodes represent significant events, patterns, or moments in
the user's data. They are the same nodes as the Tapestry Web — just
rendered differently when the map view is active.

### Node States

| State | Trigger | Visual |
|-------|---------|--------|
| Dormant | Pattern tag exists but not recently active | Small, dim |
| Active | Pattern tag appearing in current 14-day window | Glowing, full size |
| Glowing | Cross-modal correlation detected — this node is significant right now | Bright pulse, slightly larger |
| Connected | This node has known connections to other active nodes — Edin has detected a cross-modal link | Threads visible between connected nodes |
| Resolved | Pattern has resolved or transformed | Settled, stable, visible as part of the map history |
| Loop flagged | Node in loop detection state | Slow cool pulse, flagged color |

### Node Types

| Type | Source |
|------|--------|
| Dream symbol node | Recurring pattern tag from dream recall module |
| Somatic node | Body location marker from biofeedback or dream somatic data |
| Subconscious Team node | Active internal part with current data contributions |
| Training milestone node | Skill progression threshold crossed |
| Insight node | Cross-modal pattern detected and delivered as insight card |
| Wisdom arc node | Narrative phasing event — a significant rewrite moment |

---

## PROGRESSIVE REVEAL MECHANIC

The map fills in over time. New territory does not appear until the data
density crosses a threshold.

**Reveal thresholds:**
- A zone edge becomes visible when 3 or more data entries have been
  tagged to that zone
- A node appears when a pattern tag has appeared 2 or more times
- A node becomes active when a pattern tag appears in the current
  14-day window
- Zone interior fills in (fog of war clears) when 7 or more data
  entries exist in that zone
- Connected threads between nodes appear when Edin detects cross-modal
  correlation between the two nodes

**Visual metaphor:** The unrevealed areas of the map are not blank —
they are present but obscured, like fog or deep water. The user can
sense that something is there without being able to see it yet. As data
accumulates the fog lifts and the territory becomes visible.

---

## WHAT EDIN DOES IN THE BACKEND

For every data entry — dream recall, training session, biofeedback log,
gut-brain check-in, behavioral entry — Edin assigns:

- **Primary zone** — which Trifecta layer this data belongs to
- **Process arc phase** — where in the user's journey this data sits
- **Node association** — which pattern tag, subconscious team member, or
  symbolic element this data connects to
- **Node state update** — does this entry change any node's state
  (dormant → active, active → glowing, etc.)
- **Reveal trigger check** — does this entry push any zone or node past
  a reveal threshold

This classification happens automatically after each session sync. The
map updates overnight along with the Tapestry Web thread additions.

---

## DATA SCHEMA ADDITIONS NEEDED

The following fields need to be added to the session data schema to
support this feature:

```
arc_zone          Enum    SOUL / SUBCONSCIOUS / CONSCIOUS
process_phase     Enum    ENTRY / ACTIVE / DEEPENING / INTEGRATION / RESOLUTION / LOOP
node_ids          Array   Which map nodes this session contributes to
node_state_delta  Object  Any node state changes triggered by this session
map_reveal_delta  Object  Any new zones or nodes revealed by this session
```

---

## VISUAL DESIGN NOTES FOR THE TECH TEAM

The map should feel like the user's own inner world rendered as
territory — not a generic RPG map, not a clinical brain diagram. The
aesthetic should match the Tapestry Web: dark background, warm luminous
nodes, breathing motion, gold and teal color language.

The shape of the map itself should emerge from the data — not be a fixed
template. If a user has rich dream data and minimal behavioral data, the
Subconscious Zone should be larger and more detailed than the Conscious
Mind Zone. The map reflects the actual distribution of the user's
experience.

**Suggested creative direction for the tech team:**

Think bioluminescent deep ocean floor meets constellation map meets
hand-drawn explorer's chart. The zones have soft, organic edges — not
hard boundaries. Nodes glow like organisms, not like UI buttons. The fog
of unrevealed territory has texture and depth — it does not look like a
grey mask.

This is a creative design conversation. The data architecture is the IP.
The visual execution is a collaboration.

---

## PLACEHOLDER — CHELSEY TO DEFINE

The specific symbolic imagery that populates the map backgrounds within
each zone — what does the Soul Zone look like visually, what does the
Subconscious Zone feel like, what imagery belongs in the Conscious Mind
Zone — comes from Chelsey's own practice and symbolic language.

The tech team builds the zone structure and node system. Chelsey defines
the visual language and symbolic content that gives each zone its
character. That definition comes from the same place as the rest of the
methodology — from the work itself, not from generic design choices.

---

## A REAL PRECEDENT ALREADY BUILT

Added from Chelsey's own materials, verified directly — not part of the
original spec above, but worth the tech team looking at before designing
from scratch. `chelseys-dream-journal.md` / `dream-journal.html` contains
an actual, working spiral visualization that does a version of this
feature already:

- An Archimedean-spiral SVG path, with entry dots placed manually along
  it — **oldest entry innermost, most recent outermost**
- Each dot color-coded by thread (five real threads in her own journal:
  Dad's side/the pool, Mom's side/the pain portal, The Way of
  Genius/space training, relational patterns, wealth/worth/partnership),
  with a legend mapping color to thread name
- A caption stating the state plainly: "Seven entries logged so far, five
  threads active. A new one just surfaced — wealth, worth, and
  partnership, felt in the gut as the middle of the ocean."
- Paired with an "Arc Tracker" section below it, one entry per thread,
  each stating plainly whether that thread reached "a real completion" or
  is "active and unfolding... expected to keep circling rather than
  resolve in one pass"

This is a simpler, flatter shape than the zone/layer/fog-of-war system
in the spec above, but it's real, already-designed, and uses the exact
oldest-to-newest spatial logic (center to edge) that a spiral-style
alternative to the zone map could reuse directly — worth a look before
committing fully to the zone/fog-of-war approach as the only option.

**The visual language for "well-worn vs. faded" pathways is also already
written**, from a meditation script: "Picture the self as golden lines,
running through you, each one carrying a story. Some will glow
brighter — well-traveled, strong, alive with use. Some dimmer, quieter,
less visited. Some may even feel broken, or frayed... Pathways used
often genuinely do strengthen (Hebbian plasticity)."
(`master-of-perspective-lesson-4-meeting-your-guides.md`) This maps
directly onto the spec's node-glow states above (dormant/active/glowing)
and gives real, tested phrasing for how Edin should talk about a dim or
dormant node without it reading as a judgment on the user.

**Arc-completion trigger language**, relevant to when a zone/node should
re-render as resolved rather than on a fixed schedule: "The Constitution
is meant to be reviewed and pivot at real milestones (an arc completing,
a wisdom moment landing), not on a fixed schedule."
(`edins-methods-toolbox.md`) Same principle likely applies to the map's
reveal mechanic — worth checking that the reveal thresholds in this doc
aren't accidentally schedule-based rather than milestone-based.

---

## GROUNDING NOTES — HOW THIS MEETS THE CURRENT CODEBASE

Added for the dev team, checked against what's actually built as of this
commit — not part of Chelsey's original spec above.

- **`TapestryWeb.jsx`** (`frontend/src/features/genius-profile/`) is the
  existing Tapestry Web. Right now it's a static demo: six hardcoded
  threads (EEG, Behavioral, Biofeedback, Journals, Symbolic Coding,
  Growth Arc) at fixed angles with hardcoded active/inactive flags — not
  data-driven yet. This feature is what turns it from a fixed diagram
  into something that actually renders from real session data. Building
  this means building the data-driven version of the Tapestry Web itself,
  not just adding a layer on top of a static one.
- **`GeniusProfileMap.jsx` + `data/profileNodes.js`** is a *different*
  existing node-map concept on the same Genius Profile screen — it maps
  each data modality (EEG, Biofeedback, Microbiome, Behavioral, Journals)
  with a `status` of `live` / `illustrative` / `planned`, showing what's
  real vs. invented in the current build. That's a **build-honesty map**
  for internal/stakeholder use, not the user-facing subconscious-journey
  map this document describes. Same visual language (radial nodes,
  angles, colors), different purpose. Worth naming clearly to the tech
  team so "the map" doesn't get ambiguous in conversation — these are two
  separate features that happen to share a screen and a look.
- **Trifecta layer terminology already exists**, in
  `features/genius-constitution/data/constitutionData.js`:
  `TRIFECTA_LAYER = { shamanic: "Soul", hermetic: "Subconscious", stoic:
  "Consciousness" }`, with existing colors `DOMINANT_COLOR = { shamanic:
  "#8e7ad1" (violet), hermetic: teal, stoic: coral }`. This document's
  suggested zone colors (gold/amber for Soul, teal for Subconscious,
  warm white/silver for Consciousness) **only agree on teal for
  Subconscious** — Soul and Consciousness are different colors than
  what's already live elsewhere in the app for the same three layers.
  Worth a decision before build: reconcile to one palette, or explain why
  the map intentionally uses a different one than the Constitution result
  screen.
- **No single "session" table exists to add these fields to.** The
  schema has separate tables per data type (`dream_journal_entries`,
  `genius_constitution_results`, `follow_through_log`, etc.), not one
  unified "session" row. `arc_zone` / `process_phase` / `node_ids` /
  `node_state_delta` / `map_reveal_delta` need a home — either a new
  shared table (e.g. `map_events`, one row per classified entry,
  referencing whichever source table it came from) or these fields get
  added individually to each existing table. This is an implementation
  decision for whoever builds it, not a methodology one, but it's a real
  fork the schema doc will need to make explicit before this gets built.
