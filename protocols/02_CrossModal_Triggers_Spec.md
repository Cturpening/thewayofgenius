# Edin Platform — Cross-Modal Triggers Spec
## For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

---

## WHAT THIS IS

Cross-modal analysis runs when data across multiple streams shows a pattern that no single stream could reveal alone. This document defines exactly what triggers that analysis and what the pipeline does with it.

---

## TRIGGER CONDITIONS

Analysis initiates automatically when ANY of the following are met:

| Trigger | Threshold | Data Source |
|---------|-----------|-------------|
| Emotional intensity | >= 7 | Sleep-state module |
| HRV deviation | > 15% below user's 14-day rolling average | Biofeedback module |
| Pattern tag recurrence | Same tag 3+ times in any 14-day window | Dream recall module |
| Gut-brain coherence | < 4 for two or more consecutive days | Gut-brain module |
| Behavioral scores | < 4 for two or more consecutive days | Behavioral module |
| EEG anomaly | Flagged by EEG processing layer | EEG module |
| Manual flag | User flags a session as significant | Any module |

---

## ANALYSIS PIPELINE

```
TRIGGER DETECTED
→ PULL all modality data from ±3 day window around trigger
→ PATTERN DETECTION across all six streams
→ RECURRENCE CHECK — has this combination appeared before?
→ GENERATE INSIGHT — plain language, no clinical language
→ PROTOCOL RECOMMENDATION — specific practice from curriculum
→ DELIVER TO USER — insight card
→ LOG OUTCOME — user response and post-intervention data
→ ADAPT — future protocol recommendations updated based on outcome
```

---

## PATTERN TYPES EDIN LOOKS FOR

| Pattern | Description |
|---------|-------------|
| Emotional-physiological loop | Dream emotional intensity >= 7 correlating with HRV disruption same night or next day |
| Behavioral-sleep lag | Performance dips 1–2 days after identified sleep disruption |
| Gut-neural coherence | Gut score drops correlating with EEG changes and emotional intensity shifts |
| Training breakthrough | Skill progression score increase alongside EEG theta power increase |
| Recurrence escalation | Same symbolic pattern with increasing emotional intensity over time |
| Regulation improvement | HRV regulation speed decreasing + internalization milestone approached |

---

## INSIGHT CARD STRUCTURE

When a pattern is detected the insight delivered to the user follows this structure:

1. **What Edin noticed** — plain language, no jargon: "Over the last three nights your emotional intensity in recall has been above your average. In the same window your HRV has dropped."
2. **What this might mean** — framed as observation not diagnosis: "This pattern in your data often appears when something is working through your system at a deeper level."
3. **What to do** — specific recommended practice: "Tonight's practice is [specific protocol]."
4. **What Edin will track** — closes the loop: "I'll check whether the pattern shifts in the next few nights after the practice."

---

## IMPORTANT LANGUAGE RULES

- Never use clinical diagnostic language in insight cards
- Never name a condition (depression, anxiety, PTSD etc.)
- Describe what is happening in the data — not what it means clinically
- "This pattern has been intensifying" — correct
- "This looks like depression" — never
- If pattern data suggests distress requiring professional support — escalation protocol applies (see Phase 3 Gaps document)

---

## DATA SCHEMA — INSIGHT CARDS

| Field | Type | Notes |
|-------|------|-------|
| insight_id | UUID | Unique per insight |
| user_id | UUID | Links to user |
| timestamp | DateTime | When generated |
| type | Enum | PATTERN_DETECTED / MILESTONE / CORRELATION / RECOMMENDATION |
| modalities_involved | Array | Which streams triggered this |
| plain_language_description | Text | What Edin tells the user |
| recommended_action | Text | Specific protocol |
| user_response | Text | User's reply or note |
| resolved | Boolean | Whether pattern has shifted |
