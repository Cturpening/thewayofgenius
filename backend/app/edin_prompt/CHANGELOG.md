# Edin System Prompt — Changelog

Versioning discipline per `protocols/11_Coherence_Dream_Criteria_Tagging_Density.md`'s
grounding notes: a redefinition doesn't retroactively rewrite what a past
response was generated under. Each version is its own file
(`v1.md`, `v2.md`, ...); nothing is edited in place once a version has
been used in production. `CURRENT_VERSION` in `__init__.py` is the only
thing that changes when a new version ships.

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
