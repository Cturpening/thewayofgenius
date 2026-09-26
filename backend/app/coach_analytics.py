"""The "Genius Profile" platform health aggregation -- the first
cross-user analytics in this codebase. Every other query in this app is
scoped to one user; these are deliberately unfiltered, coach-only reads
across the whole platform. See app/main.py's GET /coach/analytics/health
for the route, and app/edin_ai.py's generate_platform_reflection for how
this feeds Edin's own first-person self-reflection.

Every number here is real -- with only a couple of real accounts today,
most of these will honestly show small numbers or zeros, which is
correct, not a bug. Never backfill a placeholder.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DreamJournalEntry, FlaggedEvent, FollowThroughLogEntry, GeniusConstitutionResult, Profile
from app.user_context import symbol_confirmation_status

_FOLLOW_THROUGH_STATUSES = ("pending", "did", "partial", "didnt")
_ORIENTATIONS = ("shamanic", "hermetic", "stoic")


def _engagement(db: Session) -> dict:
    return {
        "total_users": db.query(Profile).count(),
        "total_dream_entries": db.query(DreamJournalEntry).count(),
        "total_follow_throughs": db.query(FollowThroughLogEntry).count(),
        "total_constitution_results": db.query(GeniusConstitutionResult).count(),
    }


def _follow_through(db: Session) -> dict:
    rows = (
        db.query(FollowThroughLogEntry.status, func.count(FollowThroughLogEntry.id))
        .group_by(FollowThroughLogEntry.status)
        .all()
    )
    counts = {status: 0 for status in _FOLLOW_THROUGH_STATUSES}
    for status, count in rows:
        counts[status] = count
    resolved_total = counts["did"] + counts["partial"] + counts["didnt"]
    completion_rate = round(counts["did"] / resolved_total, 4) if resolved_total else None
    return {**counts, "completion_rate": completion_rate}


def _track_b_safety(db: Session) -> dict:
    total = db.query(FlaggedEvent).count()
    reviewed = db.query(FlaggedEvent).filter(FlaggedEvent.reviewed.is_(True)).count()
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    last_30_days = db.query(FlaggedEvent).filter(FlaggedEvent.timestamp >= cutoff).count()
    return {"total_flagged": total, "reviewed": reviewed, "unreviewed": total - reviewed, "flagged_last_30_days": last_30_days}


def _constitution_orientation(db: Session) -> dict:
    """Latest result per user only -- a user retaking the Constitution
    shouldn't count twice. Joins each user's own max(created_at) rather
    than Postgres's DISTINCT ON, so this stays portable standard SQL."""
    latest_per_user = (
        db.query(GeniusConstitutionResult.user_id, func.max(GeniusConstitutionResult.created_at).label("max_created_at"))
        .group_by(GeniusConstitutionResult.user_id)
        .subquery()
    )
    rows = (
        db.query(GeniusConstitutionResult.dominant_orientation)
        .join(
            latest_per_user,
            (GeniusConstitutionResult.user_id == latest_per_user.c.user_id)
            & (GeniusConstitutionResult.created_at == latest_per_user.c.max_created_at),
        )
        .all()
    )
    counts = {orientation: 0 for orientation in _ORIENTATIONS}
    for (orientation,) in rows:
        counts[orientation] = counts.get(orientation, 0) + 1
    return counts


def _symbol_confirmation(db: Session) -> dict:
    """Every real confirmation path, counted by each tag's primary_path
    (see app/user_context.py's symbol_confirmation_status for precedence)
    -- one bucket per tag, no double-counting. Computed per-user since a
    tag's confirmation status is never meaningful across different users'
    own symbol histories."""
    counts = {
        "confirmed_self": 0,
        "confirmed_arrived_known": 0,
        "confirmed_coach_agreed": 0,
        "confirmed_coach_legacy": 0,
        "established_recurrence_only": 0,
        "unconfirmed": 0,
        "resolved": 0,
        "meanings_with_history": 0,
        "high_significance_count": 0,
    }
    _PRIMARY_TO_BUCKET = {
        "self": "confirmed_self",
        "arrived_known": "confirmed_arrived_known",
        "coach_agreed": "confirmed_coach_agreed",
        "coach": "confirmed_coach_legacy",
        "recurrence": "established_recurrence_only",
    }

    tags_by_user: dict = defaultdict(set)
    for user_id, tags in db.query(DreamJournalEntry.user_id, DreamJournalEntry.tags).all():
        for tag in tags or []:
            tags_by_user[user_id].add(tag)

    for user_id, tags in tags_by_user.items():
        status = symbol_confirmation_status(db, user_id, list(tags))
        for info in status.values():
            bucket = _PRIMARY_TO_BUCKET.get(info["primary_path"], "unconfirmed")
            counts[bucket] += 1
            if info["resolved"]:
                counts["resolved"] += 1
            if info["meaning_history_count"] >= 2:
                counts["meanings_with_history"] += 1
            if info["high_significance"]:
                counts["high_significance_count"] += 1
    return counts


def get_platform_health(db: Session) -> dict:
    """The full 'Genius Profile' dashboard payload -- see
    app/main.py's GET /coach/analytics/health."""
    return {
        "engagement": _engagement(db),
        "follow_through": _follow_through(db),
        "symbol_confirmation": _symbol_confirmation(db),
        "track_b_safety": _track_b_safety(db),
        "constitution_orientation": _constitution_orientation(db),
    }
