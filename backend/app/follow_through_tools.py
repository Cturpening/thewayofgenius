"""Shared follow-through log write logic -- both app/main.py's
/follow-through-log route and Edin's own tool-calling (app/edin_tools.py)
call into log_entry() below.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.goal_tools import find_goal_by_name
from app.models import FollowThroughLogEntry
from app.track_b import run_track_b

_VALID_SOURCES = ("dream", "lesson", "constitution", "coaching", "other")


def log_entry(
    db: Session, user_id: UUID, *, intention: str, source: str = "other", goal_id=None
) -> tuple[FollowThroughLogEntry, str | None]:
    crisis_response = run_track_b(db, user_id, intention)
    entry = FollowThroughLogEntry(user_id=user_id, goal_id=goal_id, source=source, intention=intention)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "log_follow_through",
        "description": (
            "Log a real intention to follow through on -- use when the user states something they intend "
            "to actually do, coming out of a dream, a lesson, a Constitution session, or coaching."
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
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict:
        if name != "log_follow_through":
            return None
        source = args.get("source") if args.get("source") in _VALID_SOURCES else "other"
        goal_id = None
        if args.get("goal_name"):
            goal = find_goal_by_name(db, user_id, args["goal_name"])
            goal_id = goal.id if goal else None
        entry, crisis_response = log_entry(db, user_id, intention=args["intention"], source=source, goal_id=goal_id)
        if crisis_response:
            return {"saved": True, "crisis_response": crisis_response}
        return {"saved": True, "entry_id": str(entry.id)}

    return execute
