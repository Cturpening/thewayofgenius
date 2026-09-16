"""Shared Track B crisis-detection helper -- pulled out of app/main.py so
every write path that can carry real user text (the HTTP routes AND
Edin's own tool-calling, see app/edin_tools.py) runs the exact same check.
This must never drift into two implementations: a crisis check that's
slightly different depending on which path saved the text would be a real
safety gap, not a style issue. See app/crisis_detection.py and
protocols/03_Crisis_Escalation_Protocol.md.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.crisis_detection import classify_crisis_tier, override_message, requires_override
from app.models import FlaggedEvent


def run_track_b(db: Session, user_id: UUID, combined_text: str) -> str | None:
    """Classifies `combined_text` and, if it crosses the hard-override
    threshold, writes a flagged_events row and returns the fixed override
    message for the caller to surface. Returns None otherwise. Never
    blocks the caller's save either way.
    """
    tier = classify_crisis_tier(combined_text)
    if not requires_override(tier):
        return None
    db.add(FlaggedEvent(user_id=user_id, trigger_phrase_matched=tier.value))
    return override_message(tier)
