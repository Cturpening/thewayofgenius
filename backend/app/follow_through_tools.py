"""Shared follow-through log write logic -- both app/main.py's
/follow-through-log routes and Edin's own tool-calling (app/edin_tools.py)
call into log_entry()/update_status() below.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.edin_ai import EdinAIError, generate_follow_through_reflection, is_configured as edin_ai_configured
from app.goal_tools import find_goal_for_linking
from app.models import FollowThroughLogEntry
from app.track_b import run_track_b
from app.user_context import display_name

_VALID_SOURCES = ("dream", "lesson", "constitution", "coaching", "other")
_VALID_STATUSES = ("pending", "did", "partial", "didnt")


def log_entry(
    db: Session, user_id: UUID, *, intention: str, source: str = "other", goal_id=None
) -> tuple[FollowThroughLogEntry, str | None]:
    crisis_response = run_track_b(db, user_id, intention)
    entry = FollowThroughLogEntry(user_id=user_id, goal_id=goal_id, source=source, intention=intention)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry, crisis_response


def find_open_entries(db: Session, user_id: UUID, query: str | None = None, limit: int = 10) -> list[FollowThroughLogEntry]:
    """Pending (not yet resolved) entries, most recent first -- optionally
    narrowed by a substring match on the intention text. Used both to let
    Edin list what's actually open and to find the one entry a status
    update is actually about."""
    q = db.query(FollowThroughLogEntry).filter(
        FollowThroughLogEntry.user_id == user_id, FollowThroughLogEntry.status == "pending"
    )
    if query:
        q = q.filter(FollowThroughLogEntry.intention.ilike(f"%{query}%"))
    return q.order_by(FollowThroughLogEntry.created_at.desc()).limit(limit).all()


def update_status(
    db: Session, user_id: UUID, *, entry: FollowThroughLogEntry, status: str, note: str | None = None
) -> tuple[FollowThroughLogEntry, str | None]:
    """Marks an existing entry did/partial/didnt -- the same real
    reflection-generation path as app/main.py's PATCH /follow-through-log
    route, so an update Edin makes conversationally gets the identical
    Edin note a manual status change would."""
    crisis_response = run_track_b(db, user_id, note) if note else None
    entry.status = status
    if note:
        entry.note = note

    if crisis_response:
        entry.edin_note = None
    elif status != "pending" and edin_ai_configured():
        try:
            entry.edin_note = generate_follow_through_reflection(
                entry.intention, entry.source, status, user_name=display_name(db, user_id)
            )
        except EdinAIError:
            entry.edin_note = "Edin's reflection isn't available right now — it'll pick this up on the next status change."

    db.commit()
    db.refresh(entry)
    return entry, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "log_follow_through",
        "description": (
            "Log a real NEW intention to follow through on -- use when the user states something they intend "
            "to actually do, coming out of a dream, a lesson, a Constitution session, or coaching. For "
            "reporting back on something already logged, use update_follow_through_status instead."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "intention": {"type": "string", "description": "The real intention, in the user's own words."},
                "source": {"type": "string", "enum": list(_VALID_SOURCES), "description": "Where this intention came from; use 'other' if unclear."},
                "goal_name": {"type": "string", "description": "An existing goal this intention relates to, if the user names one."},
            },
            "required": ["intention"],
        },
    },
    {
        "name": "update_follow_through_status",
        "description": (
            "Mark an existing, already-logged intention as done, partially done, or not done -- use when the "
            "user reports back on something they previously said they'd do. Never use this to log something "
            "new; use log_follow_through for that."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "intention_query": {"type": "string", "description": "Words from the original intention, to find which open entry this is about."},
                "status": {"type": "string", "enum": ["did", "partial", "didnt"], "description": "What actually happened."},
                "note": {"type": "string", "description": "Any real detail the user gave about what happened."},
            },
            "required": ["intention_query", "status"],
        },
    },
    {
        "name": "list_open_follow_throughs",
        "description": "List the user's still-pending follow-through intentions -- use before update_follow_through_status whenever you're not sure which open entry the user means.",
        "parameters": {"type": "object", "properties": {}},
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict:
        if name == "log_follow_through":
            source = args.get("source") if args.get("source") in _VALID_SOURCES else "other"
            goal_id = None
            if args.get("goal_name"):
                goal = find_goal_for_linking(db, user_id, args["goal_name"])
                goal_id = goal.id if goal else None
            entry, crisis_response = log_entry(db, user_id, intention=args["intention"], source=source, goal_id=goal_id)
            if crisis_response:
                return {"saved": True, "crisis_response": crisis_response}
            return {"saved": True, "entry_id": str(entry.id)}

        if name == "update_follow_through_status":
            status = args.get("status")
            if status not in ("did", "partial", "didnt"):
                return {"error": f"'{status}' isn't a real status -- use did, partial, or didnt."}
            matches = find_open_entries(db, user_id, query=args["intention_query"])
            if len(matches) == 0:
                return {"error": f"No open intention matching '{args['intention_query']}' was found -- ask the user, or call list_open_follow_throughs."}
            if len(matches) > 1:
                return {
                    "error": f"More than one open intention matches '{args['intention_query']}' -- ask the user which one they mean.",
                    "candidates": [e.intention for e in matches],
                }
            entry, crisis_response = update_status(db, user_id, entry=matches[0], status=status, note=args.get("note"))
            if crisis_response:
                return {"updated": True, "crisis_response": crisis_response}
            return {"updated": True, "entry_id": str(entry.id), "intention": entry.intention, "status": entry.status}

        if name == "list_open_follow_throughs":
            entries = find_open_entries(db, user_id)
            return {"open_intentions": [{"intention": e.intention, "source": e.source} for e in entries]}

        return None

    return execute
