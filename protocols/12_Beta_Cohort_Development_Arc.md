# Edin Platform — Beta-Cohort Development Arc
## Document 12 — For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

**Status: DRAFT — a planning scaffold pulled together from what's already
been decided across this project, not new methodology. Every open
decision is flagged explicitly at the end.**

---

## WHAT THIS IS

Answers task #13: the shape of the private beta before any public
launch. This isn't new ground — it pulls together decisions already
made in `04_Infrastructure_Notes.md`'s original deployment plan and
`06_Private_Beta_Participant_Agreement.md`, and lines them up against
what's actually built now, so there's one place that says where things
stand and what's still a blocker.

**The original framing, still standing:** private use only for the next
two years — beta clients in year one, analog missions in year two, no
public launch until an LLC is formed, IP is protected, and funding is
secured. This document is about year one specifically: how the beta
cohort actually runs.

---

## COHORT SHAPE

- **Hand-picked, not open signup.** Per `06_Private_Beta_Participant_Agreement.md`
  — Chelsey personally selects each participant. This document assumes
  that stays true for all of year one, not just the first few people.
- **Adults only, for now.** The participant agreement was explicitly
  drafted assuming adult participants — no minors in the cohort until
  that document gets a real minors/guardian-consent addendum, which
  hasn't been written.
- **Existing clients first.** The natural starting pool is people
  Chelsey already coaches — the dream methodology and Constitution
  framework are things she already uses live; Edin is additive to that
  relationship, not a replacement for it (per the Voice Spec: "not a
  therapist, though she holds therapeutic space").
- **Cohort size stays small enough that Chelsey can personally review
  every flagged event.** This isn't a number — it's a constraint: growth
  is gated by her actual capacity to review `flagged_events` rows
  promptly, not by how many people want in. If that review starts
  lagging, that's the signal to stop adding people, not a metric to push
  through.

---

## THE THREE-PHASE ARC (BORROWED FROM THE VOICE SPEC)

`10_Edin_Voice_Coaching_Presence_Spec.md`'s progression philosophy
(Beginner → Developing → Skilled → Mastery) was written for how Edin
adjusts her presence to one user over time. The same shape applies to
the cohort as a whole, at the platform level:

### Stage 1 — Foundation (where the platform is right now)

- Core loop works end to end: real auth, dream journal, follow-through
  log, Genius Constitution, all backed by a real database
- Track B crisis detection covers every free-text surface (dream
  journal, follow-through, Constitution intention, and — as of the
  2026-09-05 fix — the chat widget)
- Edin's AI layer is live (Gemini primary, Claude backup)
- Methodology is documented: language line, crisis protocol, coherence
  dream criteria, voice spec

**This stage is essentially done.** What's left before moving to Stage 2
is the launch-readiness checklist below, not new building.

### Stage 2 — Supervised Beta (first cohort members, close review)

- Small number of participants (Chelsey's own capacity sets the ceiling)
- Chelsey reviews every `flagged_events` row same-day, not just
  eventually — this is the working assumption behind Track B's design
  (`03_Crisis_Escalation_Protocol.md`) and needs to actually hold in
  practice, not just on paper
- UX feedback loop is tight and direct — task #25 ("UX fixes from
  Chelsey's own daily use") is exactly this: the first real signal on
  what needs fixing comes from Chelsey and the earliest participants
  using it for real, not from more building in isolation
- No public mention of the platform yet — this stage is invitation-only
  in every sense, including marketing silence

### Stage 3 — Expanded Beta (cohort grows within capacity limits)

- Cohort grows only as fast as review capacity allows (see Cohort Shape
  above)
- Patterns from Stage 2 feedback get built into real features — this is
  where something like Track A (the cross-modal, pattern-recurrence
  engine) becomes worth building, once there's enough real usage data to
  build it against instead of guessing
- Analog missions (year two, per the original deployment plan) start
  getting designed once Stage 3 is stable — not before

---

## WHAT'S ACTUALLY BLOCKING STAGE 2 RIGHT NOW

A concrete checklist, not a vague "more testing needed":

- [ ] **Charles's legal review** (task #22, in progress) — the
      participant agreement and protocol docs are with him
- [ ] **Real email confirmation re-enabled** (task #19) — currently
      disabled for dev/auth testing; needs to be back on before a real
      participant signs up
- [ ] **Real SMTP configured** (task #20) — auth emails need to reliably
      arrive, not depend on Supabase's default sending limits
- [ ] **Dev test account secured or deleted** (tasks #14/#15) — cleanup
      before real user data exists alongside it
- [ ] **Live confirmation that Track B actually fires** through a real
      Supabase-authenticated session, not just passing unit tests — the
      2026-09-05 finding (the chat widget had zero crisis detection)
      is exactly the kind of gap that only shows up when someone
      actually uses the real thing, not when code review says it should
      work
- [ ] **Each participant's therapist-coordination choice actually
      gets asked and recorded** (per `06_Private_Beta_Participant_Agreement.md`
      Section 3) — this needs an actual place to live; right now
      there's no field for it anywhere in the schema. Worth deciding
      whether that's a real database column or handled entirely outside
      the app (e.g., a paper/verbal agreement Chelsey keeps track of
      herself) before the first real participant signs up.

Nothing above requires new methodology decisions — they're operational
steps, mostly outside this codebase (Supabase dashboard settings,
Charles's calendar, Chelsey's own tracking), except the last one, which
is a real open question.

---

## WHAT THIS DOCUMENT DOES NOT DECIDE

- Exact cohort size or a target date for Stage 2 — deliberately not
  numbered; capacity-gated per Cohort Shape above, Chelsey's call
- The minors/guardian-consent addendum, if the cohort ever needs one
- Whether therapist-coordination consent gets its own database field or
  stays outside the app entirely
- When Track A (cross-modal engine) becomes worth building — flagged
  above as "once Stage 3 has real usage data," not a scheduled task
- Analog missions (year two) — explicitly out of scope for this
  document, which only covers year one

---

## SIGN-OFF CHECKLIST

- [ ] Confirm the three-stage arc matches how Chelsey is actually
      thinking about rollout, or adjust it
- [ ] Confirm cohort-shape assumptions (existing clients first, adults
      only for now, capacity-gated growth)
- [ ] Decide: therapist-coordination consent — real database field, or
      handled outside the app
- [ ] Work through the Stage 2 blocker checklist above as items
      actually get done
