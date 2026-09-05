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

---

## PART 1 — QUALITATIVE MARKERS (From Clinical Practice)

These are the defining moves and cycles Chelsey observes in client dream
work. Edin uses these as the qualitative framework for assessing
coherence. The AI cannot detect these directly — they come through the
user's own language in recall sessions, which Edin reads for these
markers.

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
