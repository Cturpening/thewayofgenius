# Edin System Prompt — Changelog

## v11 — the Inner Team joins the toolbox

Adds list_team_members, create_team_member, and update_team_member
(app/team_tools.py): Edin can now list a user's real Inner Team members,
create a new one, or update an existing member's role or current task
conversationally -- the same real write path the Psyche Dojo's Inner Team
tab now uses too (it was pure frontend-only state before this, resetting
on every reload). Two small wording additions to the "Tool use in live
chat" section: the new tools named alongside the rest, and
list_team_members added to the "prefer listing before guessing" paragraph
since member names are just as fuzzy-matchable as goal or follow-through
names. Every actual rule (call only when asked, notice and offer, never
claim success without calling) already covers these tools the same as
every other one. Everything else is unchanged from v10.

## v10 — the Genius Constitution joins the toolbox

Adds set_constitution_intention (app/constitution_tools.py): Edin can now
set or update the real intention on a user's most recent Genius
Constitution result conversationally, the same single editable field the
existing PATCH /genius-constitution-results/{id} route already exposed --
that route now shares the same write path instead of its own inline copy
of the Track B + reflection-generation logic. This closes the last major
real-data surface in the app that had zero tool coverage: neuron records,
dream journal, goals, follow-through, calendar, and now the Constitution
are all reachable conversationally. Only wording addition to the "Tool
use in live chat" list; every actual rule (call only when asked, notice
and offer, never claim success without calling, prefer reading/listing
over guessing) already covers this tool the same as every other one.
Everything else is unchanged from v9.

## v9 — read before you build on top of something

Adds two read-only lookups (app/neuron_tools.py's get_current_node_record,
app/dream_journal_tools.py's list_recent_dreams) and tells Edin to use
them when a user wants to add to or reference something that already
exists rather than replace it or have her guess/invent what's already
there. Closes a real gap the toolbox had until now: she could write to a
body-map node but never read what was already saved on it, so "add more
to that story" had no honest way to work without either overwriting the
existing content or fabricating a merge. Everything else is unchanged
from v8.

## v8 — notice and offer, instead of staying silent

Direct response to a real gap a live test against actual Gemini surfaced:
casual phrasing ("hey, i actually shipped that thing I told you about")
didn't reliably trigger update_follow_through_status the way a direct ask
("mark it as done") did -- she has eyes on real category-shaped content
(a completed intention, a real dream, a body-map story) but the existing
"only call a tool when asked" rule gave her no way to act on noticing it
short of calling a tool nobody asked her to call. Adds a "Notice and
offer, when they haven't asked" paragraph: name what she noticed and
offer the specific real action in plain terms, then wait for a yes before
calling anything. This is a real behavior change, not just a wording
tweak, so it needs live-conversation testing to confirm it actually
closes the gap it was written for, the same way the gap itself was found
by live testing rather than assumed. Everything else is unchanged from
v7.

## v7 — the rest of the toolbox, and look-before-you-guess

Widens the "Tool use in live chat" section for backlog #27 Phase 2's new
tools (`app/goal_tools.py`'s `list_goals`, `app/follow_through_tools.py`'s
`update_follow_through_status` and `list_open_follow_throughs`): Edin can
now mark an existing follow-through intention done/partial/not-done
instead of only ever logging new ones, and is told to call a list tool
first when she isn't sure of a goal's or intention's exact name rather
than guessing at a fuzzy match and hoping the backend resolves it
correctly. Everything else is unchanged from v6.

## v6 — real tool use in live chat

Adds a "Tool use in live chat" section for backlog #27's Phase 1/2 work
(`app/edin_tools.py`, `app/ai_providers/gemini.py`'s `generate_with_tools`):
Edin can now actually save neuron-record fields, log a practice rep, log a
dream journal entry, create/update a goal, log a follow-through intention,
or add a calendar item, instead of only ever talking about doing so. This
section exists specifically to prevent the one new failure mode tool use
introduces — claiming an action happened when it didn't, or acting on a
message that only mentioned a topic in passing — by requiring the same
honesty standard already applied to words to now apply to actions: call a
tool only when actually asked, never invent required content, and report
a tool's real error plainly rather than implying success. Everything else
is unchanged from v5.

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
