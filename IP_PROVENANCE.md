# IP Provenance Log

A living record of who conceived what, kept for Charles's IP review — not
a legal determination itself. Started 2026-09-07 at Charles's suggestion,
after a conversation about needing to separate (a) what's Chelsey's
creative/conceptual work from (b) what's implementation written by
Claude under her direction, and (c) flag anything that looks like it
could be an independently patentable *method*, as distinct from the code
that carries it out.

## Two things this is not

- **Not legal advice.** Whether any of this is actually patentable,
  who the legal inventor is, and how ownership of AI-assisted code
  works are all questions for Charles, not this log.
- **Not a copyright statement.** Every line of code in this repo is
  written by Claude under Chelsey's direction and instruction — that's
  a separate, simpler question (commercial terms generally treat
  directed AI output as the directing party's work product) from
  patent inventorship, which is what this log is actually tracking:
  *where did the underlying idea come from*, independent of who typed
  the implementing code.

## How to read an entry

- **Conceptual origin** — the idea, rule, framework, or decision. This
  is Chelsey's, almost always traceable to a `protocols/*.md` doc she
  authored or a specific instruction she gave in conversation.
- **Implementation** — the code that reduces the concept to a working
  system. Written by Claude, under Chelsey's direction, per the
  conceptual origin above. Implementation of a well-known technique
  (a CRUD endpoint, an API call, a retry loop) isn't independently
  patentable regardless of who wrote it — it's covered by copyright,
  not patent.
- **Novelty flag** — my own non-expert read on whether the *method*
  itself (not the code) looks like it might be a non-obvious technical
  approach worth Charles's attention, separate from being "well-crafted
  software." Flagged items are candidates to raise, not conclusions.

---

## 1. Track B crisis escalation (deterministic override)

- **Conceptual origin:** Chelsey — the tiering scheme for crisis
  language (explicit self-harm/suicide/harm-to-others triggers a fixed,
  non-AI override message) and the hard rule that this must be
  deterministic pattern-matching, never routed through an LLM. See
  `protocols/03_Crisis_Escalation_Protocol.md`.
- **Implementation:** Claude — `backend/app/crisis_detection.py` (the
  tier classifier), the `flagged_events` table, and the `_run_track_b`
  call wired into every free-text save path (dream journal, follow-through,
  Constitution intention, chat).
- **Novelty flag:** Possibly worth raising — the specific design
  decision to hard-block LLM involvement entirely for this tier (rather
  than the more common approach of asking the LLM itself to detect and
  handle crisis language) is a deliberate safety-architecture choice,
  not just an implementation detail. That choice is Chelsey's.

## 2. DSM-5/Jungian language line + forced regeneration

- **Conceptual origin:** Chelsey — the standing rule that Edin never
  uses clinical/diagnostic language, the specific banned-term list, and
  the four terminology reframes (subconscious as translator, archetypes
  as neural patterns, etc). See `protocols/04_DSM5_Jungian_Language_Line.md`.
- **Implementation:** Claude — `backend/app/language_safety.py` (the
  output-side scanner) and the one-retry-then-fallback loop in
  `backend/app/edin_ai.py::generate_reflection`.
- **Novelty flag:** Possibly worth raising — an output-side safety net
  that forces a full regeneration (not a silent edit/redaction) when a
  generated response crosses a defined clinical-language line, specific
  to a coaching/wellness AI, is a distinct method from the underlying
  code (which is a fairly ordinary retry loop).

## 3. Coherence dream criteria / symbol confirmation threshold

- **Conceptual origin:** Chelsey — the rule that a symbol's meaning is
  only "confirmed" via user self-identification, coach validation, or
  five-plus unambiguous recurrences, and the tagging-density criteria
  around it. See `protocols/11_Coherence_Dream_Criteria_Tagging_Density.md`.
- **Implementation:** Not yet built in code as an enforced mechanism —
  currently lives only as a prompt instruction to Edin (see `v1.md`/`v2.md`'s
  "Tags, symbols, parts, and archetypes" section). Worth its own log entry
  once/if it becomes real backend logic (e.g. actually counting
  recurrences server-side) rather than an LLM-held instruction.
- **Novelty flag:** The confirmation-threshold *rule itself* (self-ID OR
  coach validation OR 5+ recurrences) is Chelsey's methodological
  invention regardless of how it's eventually implemented.

## 4. Genius Constitution (Trifecta orientation model)

- **Conceptual origin:** Chelsey — the shamanic/hermetic/stoic Trifecta
  framework, the scenario-based scoring approach, and the
  focus/density/touch personalization axes.
- **Implementation:** Claude — `frontend/.../constitutionUtils.js`
  (scoring), the `genius_constitution_results` table/schema, and the
  CRUD endpoints in `backend/app/main.py`.
- **Novelty flag:** The Trifecta scoring *methodology* is Chelsey's; the
  code that tallies percentages from quiz answers is standard
  implementation, not independently novel.

## 5. Edin's versioned system prompt + primary/backup AI provider fallback

- **Conceptual origin:** Chelsey — Edin's voice, epistemic stance, and
  behavioral rules (`protocols/10_Edin_Voice_Coaching_Presence_Spec.md`
  and the docs curated into `v1.md`); the requirement that a prompt
  version never be edited in place once used, so a later change can't
  silently reinterpret a past response.
- **Implementation:** Claude — `backend/app/edin_prompt/` (the
  versioning scheme itself, `v1.md`/`v2.md`'s exact wording),
  `backend/app/edin_ai.py` (provider selection, retry/fallback,
  language-safety gate), `backend/app/ai_providers/` (Gemini/Claude
  adapters).
- **Novelty flag:** The append-only prompt versioning discipline (never
  mutate a version once in production, log which version generated
  which response) is a system-design decision, likely joint — Chelsey
  set the requirement, Claude designed the specific mechanism. The
  primary/backup provider fallback with an automatic language-safety
  retry is closer to conventional engineering.

## 6. Follow-through log + Constitution `edin_note` wiring (2026-09-07)

- **Conceptual origin:** Chelsey — that a follow-through entry's
  reflection should only be generated once there's something to reflect
  on (status past "pending"), and that a Constitution result's
  reflection should connect the dominant orientation to the user's own
  stated intention, not assert meaning onto it. Both follow directly
  from the epistemic-stance rules already in the Edin voice spec.
- **Implementation:** Claude — `edin_note` columns on
  `genius_constitution_results`/`follow_through_log`, the
  `generate_constitution_reflection`/`generate_follow_through_reflection`
  wrappers in `edin_ai.py`, the trigger conditions in `main.py`, v2 of
  the system prompt, and the frontend display in both views.
- **Novelty flag:** No — this is implementation of rules already
  established in entries above, applied to two new surfaces. Ordinary
  engineering extension, not a new method.

## 7. Goals & Calendar wired to a real database (2026-09-07)

- **Conceptual origin:** Chelsey — the "goal modality" model itself: a
  goal is honestly tagged to whichever real lane of the app (sleep/dream
  training, biofeedback, microbiome) actually produces the data behind
  it, with "career"/"other" as the explicit, honest case of no real
  modality backing it yet. Also hers: the architecture note that Edin's
  own data model is the record and a Google Calendar sync would be a
  mirror on top of it, not the other way around.
- **Implementation:** Claude — the `goals`/`calendar_events` tables and
  their constrained-enum columns, the CRUD endpoints in `main.py`, and
  the frontend rewrite (real fetch/persist instead of hardcoded/
  client-only state, the add-goal and progress-step UI, which didn't
  exist in any form before this).
- **Novelty flag:** No — this is ordinary CRUD engineering in service of
  a modeling decision (the modality tagging) that's really a restatement
  of entry 4's Trifecta-adjacent thinking applied to goals, not a new
  method of its own.

**Also surfaced while wiring this in:** smoke-testing calendar events
against Track B (entry 1) turned up a real gap, unrelated to this
feature — `crisis_detection.py`'s Tier 2 patterns don't match phrasing
like "I want to hurt myself," only more specific phrases ("kill myself,"
"end my life," "want to die," etc). Flagged to Chelsey directly rather
than patched here — the crisis-language pattern list is safety-critical
and was deliberately hand-built (see protocol 03 and the "exact
escalation timing" work), so it deserves the same care, not a drive-by
edit inside an unrelated feature's diff.

## 8. Goals linked into follow-through and calendar (2026-09-07)

- **Conceptual origin:** Chelsey — the decision (made explicitly in this
  session, in response to entry 7's flagged gap) that a goal should
  aggregate its own real track record rather than sit disconnected from
  follow-through and the calendar, and that this should reuse the
  existing "linked goal" concept the calendar UI's own copy already
  described but never implemented.
- **Implementation:** Claude — the nullable `goal_id` foreign keys on
  `follow_through_log` and `calendar_events` (`on delete set null`, so
  deleting a goal keeps the historical record rather than erasing it),
  the cross-user ownership check (`_verify_goal_ownership` in
  `main.py`), and the frontend goal-picker UI plus the per-goal
  follow-through rollup ("N entries · X% followed through").
- **Novelty flag:** No — standard relational modeling (a nullable FK
  plus an ownership check) in service of a product decision, not a new
  method.

---

## Running list flagged for Charles

1. Hard architectural separation of deterministic crisis detection from
   the LLM layer (entry 1).
2. Forced-regeneration output safety net keyed to a defined clinical-
   language boundary (entry 2).
3. The symbol-confirmation threshold rule — self-ID OR coach validation
   OR 5+ unambiguous recurrences (entry 3) — once it's real code, not
   just a prompt instruction.
4. The append-only, response-tagged prompt versioning discipline (entry 5).

*(Add to this log as we build. Each new feature gets an entry before or
right after it ships, not retroactively in bulk — that's the only way
this stays trustworthy as a record.)*
