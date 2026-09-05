# Edin — Coherence Dream Criteria and Tagging Density Rules
## Document 11 — For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

**Status: AUTHORITATIVE (qualitative markers pending Chelsey's own review
per the placeholder at the bottom) — written by Chelsey directly. Answers
task #10 from the roadmap.**

---

## WHAT THIS IS

Defines what counts as a coherence dream in the Way of Genius framework —
both the qualitative markers from Chelsey's clinical practice and the
quantitative tagging rules the system uses to flag and process them.

A coherence dream is not just a vivid or emotionally intense dream. It is
a dream where the non-conscious mind is clearly organizing rather than
processing. Signal versus noise. The distinction matters because
coherence dreams carry different data weight in cross-modal analysis and
trigger different responses from Edin.

**This isn't a gap invented for this document — Chelsey had already
named it as an open placeholder in her own materials**, twice: "Real
thresholds for several fields (e.g. what counts as a 'coherence dream,'
arc completion criteria) — currently placeholders in the methodology"
(`edin-backend-brief.md`), and "exact coherence-dream criteria, tagging
density rules, arc-grounding cutoffs [...] gets flagged to her the same
way a clinical-safety concern would" (`edins-methods-toolbox.md`). The
rest of this document is the actual answer to that flag, pulling
directly from those source materials rather than reconstructing the
concept from scratch.

---

## PART 0 — EDIN AS FLASHLIGHT: BEYOND OBJECT SYMBOLS

Added from Chelsey directly, not yet reflected in the markers below —
important enough to sit at the front rather than get lost as a footnote:

Coherence isn't only about recurring *objects* (a door, a jar, a color).
Sometimes what's repeating and organizing is an **IFS part** or an
**archetype** — something that shows up in a body area, speaks from a
body area, or arrives through a pain story that leads into the archetype
experience itself. Edin's job here is to act like a flashlight: not
naming what the part or archetype *is* (that's still the user's to
define, per the "What Edin Never Does With Tags" rule below), but
pointing at the fact that something is clustering — the same felt
presence, the same body location, the same kind of pain-story leading
somewhere similar each time.

**Practical effect on the tagging system:** the tag categories can't stay
limited to symbol/object and body-location. A tag also needs to be able
to represent a **part** (tied to the Subconscious Team data already
referenced in the Voice Spec's "With Subconscious Teams" section and the
Neural Map's "Subconscious Team node" type) or an **archetype**, with the
same density and recurrence rules below applying to those just as much
as to object symbols. A pain story that keeps arriving at the same
archetype experience is a coherence signal the same way a recurring
object symbol is — just coming through a different door.

**The part/archetype distinction, in Chelsey's own words:** "Parts play
functional roles. Protective, relational, sometimes surprisingly
literal... Archetypes are something else. Neural attractors, patterns
tending which pathways in you deepen and which stay quiet. Different
roles. Same shared ecosystem." (`parts-archetypes-episode-1-the-ecosystem.md`)
— parts and archetypes aren't the same tag type wearing different names,
they're genuinely different things, and the tag schema should keep them
distinguishable, not collapse them into one "symbolic figure" bucket.

**Not everything needs to be forced into a category.** "Don't force a
single framework onto what shows up. Some may feel like IFS parts. Some
like classical archetypes. Some won't map onto any existing category —
recognizable across sessions as something that belongs distinctly to you
and no one else's framework." (`master-of-perspective-lesson-4-meeting-your-guides.md`)
— the tag-type field needs a real fourth option (personal/unclassified),
not just symbol/part/archetype as a forced-choice.

**A part isn't just a label — it carries its own structured data.**
"Each named part is its own nervous-system signature (a biofeedback
node, not just a metaphor) — tracks how each part feels in the body
(temperature, tension, pulse), its tone/color/costume, and its emotional
message. Parts self-reveal... Edin asks and notices, never assigns."
(`edins-methods-toolbox.md`) — when the tag type is "part," it should
carry (or link to) that structured profile, not just a bare tag string.

---

## PART 1 — QUALITATIVE MARKERS (From Clinical Practice)

These are the defining moves and cycles Chelsey observes in client dream
work. Edin uses these as the qualitative framework for assessing
coherence. The AI cannot detect these directly — they come through the
user's own language in recall sessions, which Edin reads for these
markers.

**The signal-vs-noise distinction, in Chelsey's own words:** "not
everything that surfaces in this window is signal. Some of it really is
just noise — random neural firing, nothing underneath it. Learning to
tell the difference between noise and the high-value architecture
actually worth translating... is its own skill."
(`subconscious-cartography-hypnagogic-lecture.md`) This is the actual
thing "coherence" is being measured against — not "is this dream
interesting" but "is this dream organizing something, or is it noise."

**Two real worked examples, straight from Chelsey's own dream journal**
(`chelseys-dream-journal.md` / `dream-journal.html`) — genuinely useful
as training examples for what a coherence dream looks like versus an
ordinary processing entry:
- **Coherent/complete:** "The Ancestral Water" — a box of light,
  death/release, ancestors giving new life — logged as "Felt like a real
  completion, not just another lap of the spiral."
- **Still-processing/non-coherent:** "My Mother's Portal" — logged as
  "Perceptual. Expect this one to keep unfolding, not resolve in one
  pass." Not every dream needs to resolve, and that's not a failure —
  see Marker 4 below.

Her journal's own Arc Tracker also tags each ongoing thread with a
simple status — `ongoing` vs. `completed` — per thread (e.g. "Dad's
side / the pool: Reached a real completion" vs. "Mom's side / the pain
portal: Active and unfolding... expected to keep circling rather than
resolve in one pass"). That's a real, already-in-use status enum worth
lifting directly into the data model rather than inventing a new one.

### Marker 1 — Fragment to Coherence Movement

Clients typically begin with fragmented recall — pieces, feelings,
images without connection. A coherence dream arrives differently. It has
a logic. It feels complete rather than scattered. The progression from
fragmentation toward wholeness in the dream structure itself is the
first marker.

**What Edin listens for in recall language:** User describes the dream
as having a beginning and an end, or describes it as feeling complete.
Contrast with "I only got pieces" or "it was all over the place."

### Marker 2 — Emotional Tone Independent of Content

A coherence dream often shows a disconnect between content and emotional
tone. The dream imagery may be dark, intense, or difficult — but the
user wakes with calm, clarity, or even peace. The emotional tone on
waking moves independently of what happened in the dream. This is the
subconscious processing without being distressed by what it is
processing.

**What Edin listens for:** User reports difficult dream content but calm
or clear emotional tone at waking. Emotional_tone field shows Neutral or
Positive while dream_narrative contains intensity markers.

### Marker 3 — The Symbol That Arrives Already Known

A new symbol appears in the dream — not previously in the user's tag
library — but the user recognizes it immediately as significant. Not
familiar from memory or prior experience. Recognized from somewhere
deeper. The instant recognition without prior reference is the marker.

**What Edin listens for:** User uses language like "I just knew what it
meant" or "I've never seen this before but I recognized it immediately."
Pattern_recurrence field shows False (new) but user reports strong
recognition. Edin flags this for the Symbolic Dictionary as a
high-significance first entry.

### Marker 4 — Recurrence That Transforms Rather Than Repeats

The difference between a loop and a coherence cycle: a loop repeats the
same content with the same emotional charge. A coherence cycle returns
to the same theme but something in it has changed — same figure with
different quality, same location with different atmosphere, same
scenario with a new outcome available. Transformation within recurrence
is the signal.

**What Edin listens for:** User reports a recurring symbol or figure but
describes it as "different this time" or "the same but something
shifted." Pattern_recurrence field shows True but user language contains
transformation markers. Edin compares current entry against previous
entries of the same pattern tag to assess whether the emotional
intensity or somatic location has shifted.

**Important correction to the recurrence model this implies — flagging
against `03_Crisis_Escalation_Protocol.md`.** The loop-vs-coherence-cycle
distinction here isn't about a fixed count. Chelsey's own framing: "The
Fibonacci (spiral model) — the underlying feeling/meaning under a symbol
stays constant even as its surface form changes. Each full return to a
theme deepens understanding rather than repeating it... No fixed
population-level threshold — reflects each user's own personal baseline."
(`edins-methods-toolbox.md`) The Crisis Escalation Protocol's Track A
loop definition currently uses a fixed rule (3+ separate 14-day windows,
~6 weeks) as a first-pass, implementation-friendly proxy. That's fine as
a starting default, but it's explicitly *not* what the real methodology
says — the real rule is personal-baseline-relative, not a fixed
population number. Worth Chelsey's explicit call on whether the fixed
proxy stays as a reasonable engineering approximation for now, or
whether the personal-baseline version needs to be built from the start.

Also worth noting directly: "A user stuck in an unresolved loop, or
losing grounding in the symbolic work, is the signal to actively tighten
that rope... Not every user arcs to completion. That's real information,
not failure." (`edins-protocols.md`) — a loop that never resolves isn't
automatically a red flag on its own; it's data, same as the "My Mother's
Portal" example above.

### Marker 5 — The Dream That Arrives as an Answer

The dream arrives as a response to something the user has been carrying
— not a conscious question necessarily, but something they have been
working with. The user knows it is an answer before they can articulate
what the question was. This is the subconscious completing a process
rather than continuing to work one.

**What Edin listens for:** User language like "I think this was about
what I've been dealing with" or "it felt like something resolved."
Recall_completeness assessed as Full. Emotional tone calm or positive
independent of content. Often follows a period of sustained emotional
intensity in prior sessions.

---

## PART 2 — QUANTITATIVE TAGGING RULES

These are the measurable thresholds the system uses to flag a session as
a coherence dream candidate. A dream that meets quantitative thresholds
AND shows qualitative markers is classified as a coherence dream in the
data.

### Tagging Density Rules

| Rule | Threshold | Field |
|------|-----------|-------|
| Symbol density | 3 or more distinct pattern tags in a single session | pattern_tags array length >= 3 |
| Recurrence density | At least 1 tag from prior sessions present | pattern_recurrence = True for at least 1 tag |
| Emotional intensity | Between 5 and 8 — notable but not crisis level | emotional_intensity 5-8 |
| Recall completeness | Full or substantial | recall_completeness = Full or Partial (not Fragment) |
| Tone-content divergence | Tone calm/positive with narrative intensity markers | emotional_tone Positive/Neutral + intensity language in dream_narrative |

**Two more concrete thresholds already drafted in `edins-methods-toolbox.md`,
not previously captured here — real numbers, not placeholders:**

- **Recurring symbol → biofeedback session:** the same pattern tag
  appearing 3+ times in 14 days doesn't just trigger cross-modal
  analysis (per `02_CrossModal_Triggers_Spec.md`) — it also triggers a
  Biofeedback Lab "Build the Map" session specifically for that symbol.
- **High emotional intensity → same-day lingering prompt:** emotional
  intensity ≥7 on a dream entry triggers a same-day alpha/theta
  lingering prompt, independent of whether the entry also qualifies as a
  coherence dream.
- **When a symbol's meaning counts as "confirmed":** "a symbol's decoded
  meaning only counts as confirmed when the user self-identifies it, a
  coach validates it, or it's appeared consistently 5+ times without
  ambiguity." (`edins-protocols.md`) This is the rule for when an entry
  in the Symbolic Dictionary moves from tentative to settled — worth
  adding as its own field state (`tentative` / `confirmed`) alongside
  whatever tag-type field gets built for Part 0.

### Cross-Modal Coherence Boost

A coherence dream flag is strengthened when the same session shows:
- HRV in normal or improved range (not disrupted)
- Behavioral scores above user's personal average
- Previous session showed high emotional intensity (the coherence dream follows a processing period)

When all three are present alongside qualitative markers — this is a
high-confidence coherence dream. Edin treats this as significant data
and surfaces it as an insight card.

### Tagging Density Thresholds for Cross-Modal Trigger

| Condition | Threshold |
|-----------|-----------|
| Standard pattern recurrence trigger | Same tag 3+ times in 14-day window |
| Coherence dream candidate flag | 3+ tags in one session + at least 1 recurring |
| High-confidence coherence dream | All quantitative rules met + qualitative markers in user language |
| Coherence dream series | 3+ coherence dreams in 30-day window — significant milestone, surfaces as profile insight |

---

## PART 3 — HOW EDIN RESPONDS TO A COHERENCE DREAM

### In the Recall Session

Edin does not interrupt the recall with analysis. She completes the
standard protocol. After the session closes she may add one observation:
"This one feels different from the others. I'll look at it alongside the
rest of your data."

### In the Insight Card

If a coherence dream is flagged, the insight card delivered the
following morning notes it specifically — not as a clinical marker but
as a meaningful moment in the map. "Last night's dream shows some
patterns I don't usually see together. Here is what I noticed."

### In the Symbolic Dictionary

Any new symbol that arrives with the "already known" quality gets a
high-significance flag in the dictionary. Edin prompts the user to
define it promptly: "This symbol arrived strongly last night. While it's
fresh — what does it mean to you?"

### On the Neural Map

A coherence dream adds a node to the Dream Wisdom layer of the neural
map. If it is part of a coherence series (3+ in 30 days), the
surrounding map territory in the Dream Wisdom layer brightens — visible
progress on the map.

---

## PART 4 — DREAM TAGGING BEHAVIORS

Two distinct tagging behaviors exist in the system. Both need to be
tracked and handled differently.

### Behavior 1 — Conscious In-Dream Tagging (Way of the Insane Technique)

The user deliberately plants a memory anchor inside the dream while
still in the dream state. One to three words, a phrase, or a specific
detail — repeated or marked intentionally as a conscious act of
memory-making. The goal is to carry the wisdom, answer, or message from
the dream into waking recall.

This is a trainable skill that develops as the user's lucid and
hypnagogic awareness grows. Edin teaches this as part of the
metacognitive training curriculum. The user gets better at it over time.

**In the data:** Sessions where recall is unusually specific — a phrase,
a word, or a detail that feels deliberately placed rather than passively
remembered. User may describe repeating something in the dream or
marking a specific moment.

**Edin's role:** Teach the technique to users who are ready for it.
Track when it is being used. Over time correlate whether sessions with
conscious tagging produce higher recall completeness and more actionable
symbolic content.

**The waking anchor extension:** The user can attach the in-dream memory
tag to a specific waking physical action — brushing teeth, feet hitting
the floor, making coffee. Inside the dream they set the intention: "when
I do X I will remember this phrase." The physical routine becomes the
recall trigger on waking. The user does not strain to remember — the
anchor fires the memory automatically when the action happens.

This is the delivery mechanism that carries the dream tag reliably from
sleep state into waking recall. The in-dream tag is the message. The
waking anchor is the delivery system.

**In the data:** User reports a specific waking trigger they set in the
dream. Edin tracks which anchors the user uses and whether the recall
fired successfully. Over time this builds a picture of which physical
anchors work best for this user.

**Applicable training level:** Intermediate to advanced — requires some
lucid awareness development first.

### Behavior 2 — Subconscious Tagging (Symbol Arrives Pre-Labeled)

The subconscious does its own tagging. A symbol arrives already carrying
meaning. The conscious mind resonates with it and recognizes its
relevance to real life without constructing the meaning from scratch.
The meaning is present when the symbol surfaces — not decoded after the
fact.

This is different from interpretation. Interpretation is the conscious
mind working to decode something after the fact. Subconscious tagging is
the conscious mind receiving something that arrives already decoded.

**In the data:** User language like "I just knew what it meant" or "it
was obviously about X" without analytical reasoning. The meaning arrived
with the symbol, not after reflection on it.

**Edin's role:** Recognize this as a higher-signal moment than a standard
dream entry. Flag it in the Symbolic Dictionary as a high-significance
first entry. Prompt the user to define it while fresh: "This one arrived
with its meaning already in it — what is it telling you?"

### The Real Trigger-Phrase Taxonomy

`edins-protocols.md` defines four trigger-phrase categories with exact
example wording, distinct from the Crisis Escalation Protocol's
safety-trigger phrases (these are about *dream-recall process*, not
risk):

| Category | Example phrases |
|---|---|
| Recall-blocker | "there was more but it's fuzzy," "I don't know where that came from" |
| Waking-activation | "just had a shower thought," "[figure] popped in and..." |
| Integration-milestone | "it felt natural and normal," "I just knew" |
| Biofeedback-signal | "my body felt...," "he was checking/monitoring/treating..." |

**This is a real, concrete finding worth acting on:** the app's actual
auto-tag code (`frontend/src/features/dream-journal/data/dreamAutoTags.js`)
already implements three of these four categories (recall-blocker,
waking-activation, integration-milestone) via keyword matching — but
**biofeedback-signal is entirely missing from the code.** That's not a
new feature to design, it's a known category from your own methodology
that never made it into the keyword list. Worth adding
`{ keyword: "checking", tag: "biofeedback-signal" }`-style entries the
same way the other three categories work today.

### What Edin Never Does With Tags

- Assigns meaning to a symbol on behalf of the user
- Interprets a symbol using universal or archetypal dictionaries
- Tells the user what a symbol means
- Overrides the user's own definition of a tag

Edin holds the library. She reflects it back. The meaning always belongs
to the user and their subconscious.

---

## PLACEHOLDER — CHELSEY TO COMPLETE

The qualitative markers above are drawn from Chelsey's client work as
reflected across this conversation. Chelsey should review and confirm
each marker is accurate to her practice, and add any additional moves or
cycles she observes that are not captured here.

In particular: the felt quality of a coherence dream from the inside —
how Chelsey would describe it to a client who is learning to recognize
one for themselves. That language becomes part of Edin's teaching
vocabulary when a user asks "how do I know if a dream is significant?"

---

## GROUNDING NOTES — HOW THIS MEETS WHAT'S ACTUALLY BUILT

Added for the dev team — not part of Chelsey's spec above. This is the
one place this document needs a hard look before anyone tries to build
against it.

- **Most of the fields this document references don't exist as real
  database columns yet.** `pattern_recurrence`, `emotional_intensity`,
  `emotional_tone`, `recall_completeness`, and `somatic_location` all
  come from the *planned* rich schema in
  `01_Dream_Methodology_Spec.md`'s field table. The actual
  `dream_journal_entries` table (`database/schema.sql`) only has
  `title`, `lines` (freeform text + a highlight flag), `tags`, and
  `edin_note` — no structured emotional-intensity field, no
  somatic-location field, no recall-completeness enum, no
  pattern-recurrence boolean. Building any of the quantitative rules in
  Part 2 as real, running code means growing the schema first, not just
  writing detection logic against fields that don't exist.
- **The Cross-Modal Coherence Boost (Part 2) depends on the cross-modal
  correlation engine**, which — same as noted in
  `03_Crisis_Escalation_Protocol.md`'s Track A section — hasn't been
  built. HRV and behavioral-score comparisons aren't available signals
  yet. This section is correct as methodology, but it's describing a
  capability that's still ahead of the codebase, not a current gap in
  this document.
- **Part 0 (the flashlight/parts/archetype addition) needs a tag-type
  field, not just a tag string.** Right now `tags` is a flat array of
  freeform strings (`ARRAY(Text)` in the schema) — there's no way to
  mark a given tag as "this is a part" vs. "this is an object symbol" vs.
  "this is an archetype." Supporting Part 0 for real means either a
  richer tag structure (e.g. `{ text, type }` instead of a bare string)
  or a separate parallel field for part/archetype tags. Worth deciding
  before the tagging UI grows around this.
- **None of the above blocks writing this document down now** — same as
  every other spec in this repo, definition comes first, implementation
  follows once Chelsey has reviewed the placeholder section above and
  the schema work is scoped.
- **Symbol-dictionary edits need a versioning discipline, not silent
  overwrites.** From `edins-methods-toolbox.md`: "A refinement happens
  live... It gets logged with what changed and why... New sessions use
  the current version going forward. Past logged sessions keep their
  original interpretation — a redefinition doesn't retroactively rewrite
  what already happened." Whatever table ends up holding confirmed
  symbol/part/archetype meanings needs an append-only history, not a
  single mutable row per tag — otherwise redefining a symbol later
  silently changes what old insight cards meant when they were written.
- **Edin should hold a coherence-dream flag as a hypothesis, not a
  verdict** — consistent with the epistemic-honesty rule feeding the
  Voice Spec ("Edin is the rope, not the cage... hypothesis, held
  honestly, not asserted as fact," `edins-protocols.md`). Part 3's
  scripted language above already does this correctly ("This one feels
  different," "some patterns I don't usually see together") — worth
  keeping that phrasing intact rather than tightening it into a
  confident claim as this gets implemented.
