# Edin System Prompt — Changelog

## v5 — live chat conversation, and isomorphic/interspersal metaphor unlocked

Adds a fourth context type -- live chat conversation -- alongside the
three one-shot reflection surfaces. This is the real conversational
surface `app/main.py`'s new `/chat-messages` endpoint calls
`generate_chat_reply` for. Isomorphic/interspersal metaphor (the third
technique from `protocols/12_Ericksonian_Technique_Library.md`, noted
as reserved in v4) is unlocked here specifically, since it needs real
back-and-forth to work -- along with the doc's explicit transparency
stance: Edin may name the move itself in plain language, never the
technique's name or origin. Reply-length cap (one to three sentences)
is lifted for this context type only; the three reflection-note types
are otherwise unchanged from v4.

## v4 — utilization and reframing named as standing techniques

Adds `protocols/12_Ericksonian_Technique_Library.md`'s two techniques
that fit the one-shot reflection surface (utilization, reframing) as an
explicit section. Both were already present in v3 implicitly — "It's
completely normal for your conscious mind to push back on this" is
utilization, "Real, not a failure" is reframing — this version just
names them and gives Edin permission to use them deliberately rather
than by accident. The doc's third technique (isomorphic/interspersal
metaphor) is explicitly noted as reserved for a real conversational
surface, not used here, since it needs back-and-forth to work. Everything
else is unchanged from v3.

Versioning discipline per `protocols/11_Coherence_Dream_Criteria_Tagging_Density.md`'s
grounding notes: a redefinition doesn't retroactively rewrite what a past
response was generated under. Each version is its own file
(`v1.md`, `v2.md`, ...); nothing is edited in place once a version has
been used in production. `CURRENT_VERSION` in `__init__.py` is the only
thing that changes when a new version ships.

## v3 — coach-validated symbols now change what Edin is told

The coach dashboard added a real implementation of one of the three
symbol-confirmation paths from `protocols/11_Coherence_Dream_Criteria_Tagging_Density.md`
(coach validation) -- `generate_dream_reflection` now accepts which of a
dream entry's tags a coach has validated, and marks each tag in the
prompt as "(confirmed by a coach)" or "(not yet confirmed)". v2's "Tags,
symbols, parts, and archetypes" section stated the confirmation rule but
never told Edin how to act differently once something actually met it;
this version adds that instruction -- confirmed tags can be spoken of as
settled ground, unmarked ones stay tentative regardless, since the other
two confirmation paths (self-ID, five-plus recurrence) aren't tracked
yet. Everything else is unchanged from v2.

## v2 — generalized beyond the dream journal

`app/edin_ai.py` grew two new call sites beyond the dream journal's Edin
note: a follow-through log reflection (did the user act on an intention,
and what happened) and a Genius Constitution reflection (dominant
orientation plus the user's stated intention). v1's "Context for this
response" section only described the dream journal case, so it's
rewritten here to name all three input shapes explicitly and say how to
handle each — dream journal entry, follow-through log entry, Genius
Constitution result — while leaving every other section (core essence,
voice, epistemic stance, language rules, tags/symbols) unchanged from
v1. Nothing else about the persona changes; this is purely widening the
"what am I reflecting on right now" framing to match the code that calls
it.

## v1 — initial version

Curated from the protocol library as it stood after the first research
pass through Chelsey's uploaded methodology materials:

- `01_Dream_Methodology_Spec.md`
- `03_Crisis_Escalation_Protocol.md`
- `04_DSM5_Jungian_Language_Line.md`
- `05_Shadow_Encounter_Room.md`
- `10_Edin_Voice_Coaching_Presence_Spec.md`
- `11_Coherence_Dream_Criteria_Tagging_Density.md`

Scoped for a single use case: generating the "Edin note" on a dream
journal entry. Does not yet cover Genius Rooms, training-session
presence, or the full range of contexts in the Voice Spec — those get
added to a later version as those features get built out.

Not included: `06_Private_Beta_Participant_Agreement.md` (legal/consent,
not behavioral), `09_Neural_Map_Story_Arc_Visual_Feature.md` (UI/data
architecture, not conversational behavior), and every doc's own
"Grounding Notes" sections (dev-facing implementation commentary, not
instructions for Edin to reason over).
