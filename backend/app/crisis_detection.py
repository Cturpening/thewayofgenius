"""Track B crisis-language detection.

See protocols/03_Crisis_Escalation_Protocol.md and
protocols/04_DSM5_Jungian_Language_Line.md for the methodology this
implements. This is a conservative, scope-limited first pass:

- Only Track B (the hard override for explicit self-harm/suicide/
  harm-to-others language) is implemented here. Track A (soft referral
  prompts based on recurring pattern data) depends on the cross-modal
  correlation engine, which doesn't exist yet -- that's separate,
  larger, future work.
- Matches are whole first-person phrases, not bare keywords, so idiom
  ("kill some time", "this deadline is killing me") doesn't false
  match -- this is a hard requirement from the Crisis Escalation
  Protocol, not a nice-to-have.
- The phrase lists below are a starting point, not a finished clinical
  instrument. Per the protocol, this needs to stay a living, editable
  list as real sessions surface edge cases -- expect to add to it.

Tier 1 (passive ideation) is detected but intentionally not persisted
anywhere yet: it was designed to accumulate into Track A's pattern data,
which doesn't exist yet. Writing it into `flagged_events` -- a table
meant for reviewed safety events -- would misuse that table for a
category that's supposed to stay quiet unless it recurs. That wiring is
future work once the cross-modal engine exists, not an oversight.
"""

import re
from enum import Enum


class CrisisTier(str, Enum):
    NONE = "none"
    TIER_1_PASSIVE = "tier_1_passive_ideation"
    TIER_2_ACTIVE = "tier_2_active_ideation"
    TIER_3_ACTIVE_WITH_PLAN = "tier_3_active_ideation_with_plan"
    HARM_TO_OTHERS = "harm_to_others"


def _compile(patterns: list[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


_TIER_2_PATTERNS = _compile([
    r"\bi\s*(?:'m|am)?\s*(?:want|wanna|going)\s+to\s+(?:kill myself|end my life|end it all)\b",
    r"\bi\s*(?:'m|am)\s+going to kill myself\b",
    r"\bi\s+want\s+to\s+die\b",
    r"\bi\s+wish\s+i\s+(?:was|were)\s+dead\b",
    r"\bi\s+want\s+to\s+be\s+dead\b",
    r"\bi\s+don'?t\s+want\s+to\s+(?:be alive|live anymore|exist anymore)\b",
    r"\bi'?m\s+better\s+off\s+dead\b",
    r"\beveryone\s+(?:would be|is)\s+better\s+off\s+without\s+me\b",
])

_TIER_1_PATTERNS = _compile([
    r"\bi\s+don'?t\s+want\s+to\s+be\s+here\s+anymore\b",
    r"\bwhat'?s\s+the\s+point\s+of\s+(?:living|anything anymore|it all anymore)\b",
    r"\bi\s+wish\s+i\s+could\s+just\s+not\s+wake\s+up\b",
    r"\bi\s+wish\s+i\s+could\s+disappear\s+forever\b",
])

_PLAN_MEANS_TIMEFRAME_PATTERNS = _compile([
    r"\bmy plan is\b",
    r"\bi have a plan\b",
    r"\bi'?ve decided how\b",
    r"\bi know how i'?m going to do it\b",
    r"\btonight\b",
    r"\bthis weekend\b",
    r"\bright now\b",
    r"\b(pills|overdose|the gun|a gun|jump off|hang myself|cut my wrists|the bridge)\b",
])

_HARM_TO_OTHERS_PATTERNS = _compile([
    r"\bi\s*(?:'m|am)?\s*(?:want|going)\s+to\s+(?:kill|hurt|murder)\s+(?:him|her|them)\b",
    r"\bi'?m\s+going\s+to\s+make\s+(?:him|her|them)\s+pay\b",
])


def classify_crisis_tier(text: str) -> CrisisTier:
    """Classify free text into a crisis tier. Pure function, no I/O."""
    if not text:
        return CrisisTier.NONE

    for pattern in _HARM_TO_OTHERS_PATTERNS:
        if pattern.search(text):
            return CrisisTier.HARM_TO_OTHERS

    for pattern in _TIER_2_PATTERNS:
        if pattern.search(text):
            has_plan_signal = any(p.search(text) for p in _PLAN_MEANS_TIMEFRAME_PATTERNS)
            return CrisisTier.TIER_3_ACTIVE_WITH_PLAN if has_plan_signal else CrisisTier.TIER_2_ACTIVE

    for pattern in _TIER_1_PATTERNS:
        if pattern.search(text):
            return CrisisTier.TIER_1_PASSIVE

    return CrisisTier.NONE


def requires_override(tier: CrisisTier) -> bool:
    """Tier 2/3 and harm-to-others fire the hard override; Tier 1 does not."""
    return tier in (
        CrisisTier.TIER_2_ACTIVE,
        CrisisTier.TIER_3_ACTIVE_WITH_PLAN,
        CrisisTier.HARM_TO_OTHERS,
    )


SELF_HARM_OVERRIDE_MESSAGE = (
    "I want to pause here. What you just shared matters, and I want to "
    "make sure you have real support right now — not just me. If you're "
    "in the US, you can call or text 988 (Suicide & Crisis Lifeline) any "
    "time, day or night, or text HOME to 741741 (Crisis Text Line). If "
    "you're in immediate danger, please call 911 or go to your nearest "
    "emergency room. I'm still here, but I'd rather you have a person on "
    "the line with you right now too."
)

HARM_TO_OTHERS_OVERRIDE_MESSAGE = (
    "I want to pause here. What you just shared matters, and it involves "
    "someone else's safety, not just yours. Please reach out to a crisis "
    "line — 988 (Suicide & Crisis Lifeline) or text HOME to 741741 "
    "(Crisis Text Line) — or call 911 if anyone is in immediate danger. "
    "I'm still here, but this needs a real person on the line right now."
)


def override_message(tier: CrisisTier) -> str:
    if tier == CrisisTier.HARM_TO_OTHERS:
        return HARM_TO_OTHERS_OVERRIDE_MESSAGE
    return SELF_HARM_OVERRIDE_MESSAGE
