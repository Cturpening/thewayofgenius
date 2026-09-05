# Edin Platform — Dream Methodology Spec
## For Claude Code / Development Team
**Owner: Chelsey Turpening Coxsey, The Way of Genius™ — Confidential**

---

## WHAT THIS IS

The dream methodology is the primary data collection protocol for Edin. It captures the non-conscious mind's nightly output and converts it into structured, analyzable variables. This is proprietary IP — do not replace with standard sleep questionnaires.

---

## TWO-PHASE RECALL PROTOCOL

### Phase 1 — Immediate Morning Recall
- Triggered within 5–10 minutes of waking
- Time-sensitive — dream recall degrades rapidly
- Edin delivers prompts conversationally, one at a time
- User types responses — not multiple choice

**Prompt sequence:**
1. "Before you move — what is the first thing you remember from sleep? Just the feeling or image, nothing needs to be complete."
2. "What was happening? Describe it as if you are still there — not as a story about it."
3. "What was the emotional quality — not the story, the feeling underneath it?"
4. "On a scale of 1–10 how strong was that feeling?"
5. "Have you seen this image, feeling, or theme before? Yes / No / Feels familiar"
6. "Where in your body do you feel this now as you recall it?"
7. "Anything else — a fragment, an image, a word — before it fades?"

### Phase 2 — Delayed Recall
- Mid-morning check-in, same day
- Reopens the morning record
- Two prompts only:
  1. "Anything from last night come back to you since this morning?"
  2. "Has anything happened today that feels connected to what you recalled?"

---

## DATA FIELDS

| Field | Type | Source | Notes |
|-------|------|---------|-------|
| session_id | UUID | System | Unique per sleep session |
| user_id | UUID | System | Links to user profile |
| session_date | Date | System | Date of sleep night |
| recall_timestamp | DateTime | System | Time of morning recall |
| recall_phase | Enum | System | IMMEDIATE or DELAYED |
| dream_narrative | Text | User | Full free-text recall — unedited |
| emotional_tone | Enum | AI + User | Positive / Neutral / Negative / Mixed |
| emotional_intensity | Integer 1–10 | User | Self-reported intensity at recall |
| pattern_tags | Array[String] | User + AI | User-generated recurring symbols/themes |
| somatic_location | Text | User | Body location of felt sense during recall |
| pattern_recurrence | Boolean + Text | User | Has this appeared before? |
| recall_completeness | Enum | AI | Full / Partial / Fragment |
| delayed_additions | Text | User | Content added in Phase 2 |
| waking_integration | Text | User | Connections noticed in waking life |

---

## PATTERN TAG SYSTEM

- Tags are always user-generated — never assigned by the system
- Edin surfaces previously used tags from the user's history during tagging
- Prompt: "You've used [tag] before — is this the same or different?"
- Tags are subject-specific — no universal symbol dictionary
- Each user's tag library is their own symbolic vocabulary

**Recurrence flag:** Same tag appearing 3 or more times in any 14-day window triggers cross-modal correlation analysis.

---

## EMOTIONAL INTENSITY — PRE-NARRATIVE DETECTION

This is a distinct and critical variable. The emotional quality that arises BEFORE the user constructs a narrative from the dream is captured separately. This is not the emotion in the story — it is the felt sense that precedes the story.

- Captured in prompt 3 and 4 above
- Stored as emotional_tone + emotional_intensity
- Cross-modal trigger: emotional_intensity >= 7

---

## AI BEHAVIORS IN THIS MODULE

- Adaptive prompting — AI reads length and emotional content of each response and adapts next prompt
- Pattern tag memory — surfaces previously used tags from user history
- Emotional intensity baseline — tracks user's personal average, flags deviations
- Recurrence flagging — 3+ same tag in 14 days triggers cross-modal analysis
- Latency tracking — time between wake and recall logged (longer = reduced recall quality)

---

## IMPORTANT

This protocol is Chelsey Turpening Coxsey's proprietary IP. The specific prompt wording, the two-phase structure, the pre-narrative emotional detection, and the subject-specific tagging system are all protected. Implement exactly as specified. Do not substitute with generic journaling or sleep questionnaire approaches.
