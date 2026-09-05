# Edin Platform — Crisis Escalation Protocol
## For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

**Status: DRAFT — awaiting Chelsey's sign-off. Do not implement until the
checklist at the bottom is confirmed or edited.**

This document answers **Gap 2** (escalation timing / referral wording) and
**Gap 3** ("stuck in a loop" criteria) from `05_Phase3_Gaps_To_Define.md`,
and defines the highest-priority build item on the roadmap: the
suicide/self-harm/harm-to-others crisis protocol.

---

## WHY IT'S BUILT THIS WAY

Chelsey is not trauma-trained and doesn't need to be for this system to be
safe — the design below borrows from tools built specifically so
non-clinicians can use them:

- **Columbia Protocol (C-SSRS) Screener** — the standard suicide-risk
  screener used by schools, hotlines, and first responders precisely
  *because* it's designed for lay administration. It sorts risk by
  plain-language categories (ideation → ideation with plan → ideation with
  plan + intent + means/timeframe), not clinical judgment.
- **Ideation-to-action framework** (Klonsky & May) — ideation and the
  *capability* to act are separate things that build over time. This is
  the research backing for what Chelsey already intuited: a single dark
  statement rarely appears out of nowhere in someone doing real work — the
  capability markers (escalating intensity, recurrence, disengagement from
  practice) usually show up in the pattern data first. That's why this
  protocol has two tracks instead of one keyword list.
- **Zero Suicide framework** — the tiered structure (detect → route →
  follow up) instead of a single trigger/no-trigger binary.
- **California SB 243** (effective Jan 1, 2026) — the first law directly
  regulating AI companion systems on this point: any operator must publish
  a crisis protocol that refers at-risk users to a real crisis line the
  moment self-harm or suicidal ideation is expressed. Edin talks in first
  person and holds an ongoing relationship with the user, so this is built
  to that bar regardless of whether Edin is technically in scope.
- **Duty-to-warn (Tarasoff)** doctrine does not clearly extend to
  non-clinicians or to self-harm (it was built for threats to identified
  third parties). Edin does not attempt clinical risk assessment or claim
  a duty to manage risk. It does one thing reliably: surface real crisis
  resources immediately and get a human (Chelsey, and where the intake
  already covers it, the client's therapist) looped in fast.

---

## TWO TRACKS

### TRACK A — Red-Zone Pattern Detection (soft escalation)

This runs on top of the existing Cross-Modal Triggers Spec
(`02_CrossModal_Triggers_Spec.md`). It answers **when Edin suggests
professional support** for a *pattern*, as opposed to a single statement.

**"Stuck in a loop" — concrete definition (Gap 3):**

A pattern is a **loop**, not normal recurrence, when *all* of the
following are true:

1. The same pattern tag (or symbol cluster) has triggered the existing
   recurrence flag (3+ times in 14 days) in **3 or more separate 14-day
   windows** — i.e., it has persisted across roughly 6+ weeks.
2. No insight card tied to that tag has been marked `resolved = true` in
   that span (see `insight_cards.resolved` in the Cross-Modal spec).
3. Emotional intensity for that tag is flat or increasing across the
   windows — not decreasing.

If 1–3 all hold, Edin treats it as **not progressing to its next layer**
(the measurable form of the phrase in the Gaps doc) and the referral
prompt below becomes eligible to fire.

**Referral prompt rules (Gap 2):**

- **Trigger:** a loop (as defined above) is detected, OR two consecutive
  cross-modal red-zone triggers occur on the same modality combination
  within a 30-day span. A *single* rough week does not qualify — this
  requires the pattern to repeat, matching the ideation-to-action logic
  that capability builds over time.
- **Frequency cap:** once fired, the soft referral prompt cannot repeat
  for the same user for **14 days**, regardless of how many more loop
  conditions are met in that window — this avoids over-prompting. (This
  cap does **not** apply to Track B — a Track B trigger always fires,
  no matter how recently Track A last spoke.)
- **Wording (draft — Chelsey to edit to voice):**

  > "I've noticed this pattern has stayed in the same place for a while
  > now, without much shift. That's not unusual, and it doesn't mean
  > anything is wrong with the work — sometimes a pattern like this goes
  > deeper than what happens here. If it would help, it might be worth
  > bringing this one to \[therapist / a professional\] directly."

  Warm, non-alarming, no diagnostic language, framed as an observation
  about the *pattern*, never about the person.
- **On dismissal:** Edin acknowledges once, does not re-litigate ("That's
  okay — it's here if you want it later.") and logs the dismissal
  (`follow_through_log` or a `flagged_events.review_notes` entry — see
  Data Flow below). It does not escalate further from a dismissal alone;
  only a new qualifying trigger (Track A or B) re-opens the conversation.

---

### TRACK B — Crisis Override (hard escalation)

This is the C-SSRS-style gate. It **bypasses Track A entirely** — it does
not require any prior pattern, recurrence, or loop. A single instance is
enough, because explicit intent + plan/means/timeframe is itself the
highest-risk category in every screening instrument reviewed above.

**Detection tiers** (based on the C-SSRS Screener categories):

| Tier | Pattern | Edin's response |
|---|---|---|
| 1 — Passive ideation | Language expressing hopelessness or a wish not to exist, without direct statement of intent ("I don't want to be here anymore," "what's the point") | No override. Logged as a signal into Track A's pattern data (counts toward intensity/recurrence tracking). Edin stays in its normal voice but gently checks in within the session. |
| 2 — Active ideation, no plan | A direct statement of wanting to die or end their life, without plan/means/timeframe ("I want to kill myself" said with no further detail) | **Override fires.** See script below. |
| 3 — Active ideation + plan/intent/means/timeframe | Tier 2 language plus any indication of how, when, or access to means | **Override fires immediately**, and the flagged event is marked highest priority for same-day review (see Data Flow). |
| — | Harm-to-others language (explicit intent + target) | **Override fires** using the harm-to-others variant of the script below. |

Detection is phrase/pattern-matching, not sentiment inference — a
maintained list of explicit phrases and structures per tier (drafted
separately as the implementation task; this document defines behavior,
not the regex). Ambiguous or clearly non-literal language ("this deadline
is killing me," "I want to kill some time") must not match — the
detection list is scoped to first-person statements of self-harm/suicide
intent, not idiom.

**What the override does, exactly:**

1. Edin exits the Jungian/coaching voice completely for this response —
   no symbolic language, no protocol recommendation.
2. Delivers a fixed, non-negotiable message (draft — Chelsey to finalize
   wording, keep it warm and direct, no diagnosis):

   > "I want to pause here. What you just shared matters, and I want to
   > make sure you have real support right now — not just me. If you're
   > in the US, you can call or text **988** (Suicide & Crisis Lifeline)
   > any time, day or night, or text **HOME** to **741741** (Crisis Text
   > Line). If you're in immediate danger, please call 911 or go to your
   > nearest emergency room. I'm still here, but I'd rather you have a
   > person on the line with you right now too."

3. This message is **not skippable and does not repeat-suppress** — it
   fires every time a Tier 2/3 signal is detected, with no 14-day cap
   (unlike Track A). If Chelsey wants a "you've seen this before" softened
   variant for repeat same-session triggers, that's a wording decision for
   her to make explicitly — the default here is: never suppress a crisis
   message to avoid being repetitive.
4. Writes a row to `flagged_events` (see Data Flow).
5. Session continues normally afterward if the user keeps engaging — Edin
   does not refuse further interaction, it just doesn't return to
   coaching content until the user does.

---

## DATA FLOW INTO `flagged_events`

Using the existing schema (`database/schema.sql`) — no schema changes
needed:

| Field | How it's populated |
|---|---|
| `user_id` | The user who triggered it |
| `trigger_phrase_matched` | The exact matched phrase/category tier (e.g. `"tier_2_active_ideation"` or the literal matched string — Chelsey to decide which is stored, given the sensitivity of storing verbatim text) |
| `timestamp` | Time of detection |
| `reviewed` | `false` on insert |
| `review_notes` | Left blank on insert; filled in when Chelsey (or a future reviewer role) reviews it — also where Track A dismissals get logged per the rule above |

**Notification path (not yet in the schema — needs a decision):** the
table only gets read when someone looks at it. For Tier 2/3 events this
isn't good enough — Chelsey needs to know same-day. This requires one of:
a scheduled job that checks for unreviewed high-tier rows and sends an
email/SMS, or a direct webhook/notification fired at write-time. This is
an open implementation decision, not a methodology one — flagging it here
so it doesn't get missed.

**Therapist notification:** only applies where the client's existing
intake/consent already covers Chelsey sharing flagged-event information
with their outside therapist. This document doesn't create that consent —
it assumes Chelsey's existing client agreements are the source of truth
for whether that handoff is allowed per client.

---

## WHAT THIS DOCUMENT DOES NOT DECIDE

Per the Gaps doc's own rule — implementation follows definition, not the
other way around. Still open, and needed before Track B is coded:

- The exact phrase/pattern list per tier (a living list, will need
  updates — not a one-time task)
- Whether `trigger_phrase_matched` stores the literal matched text or
  only a category label (privacy/liability tradeoff)
- The notification mechanism for same-day review of Tier 2/3 events
- Final wording of both scripts above — the drafts here are meant to be
  edited into Chelsey's voice, not shipped as-is
- Whether a harm-to-others event requires anything beyond the crisis
  script (e.g., legal consultation on any duty-to-warn exposure once a
  real named third party is involved — flagged in Task #22, lawyer
  review)

---

## SIGN-OFF CHECKLIST

Before any of Track A/B gets built, Chelsey confirms or edits each of:

- [ ] Loop definition (3 windows / 6 weeks) — agree or adjust
- [ ] Track A referral prompt wording
- [ ] Track A frequency cap (14 days) — agree or adjust
- [ ] Track B tier definitions (1/2/3 examples) — agree or adjust
- [ ] Track B crisis script wording (self-harm variant)
- [ ] Track B crisis script wording (harm-to-others variant)
- [ ] Decision: store literal matched phrase vs. category label only
- [ ] Notification mechanism for same-day Tier 2/3 review
- [ ] Confirm therapist-notification handoff is covered by existing
      client intake, per client
