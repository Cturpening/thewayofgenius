"""Shared calendar write logic -- both app/main.py's /calendar-events
route and Edin's own tool-calling (app/edin_tools.py) call into
add_event() below.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.goal_tools import find_goal_by_name
from app.models import CalendarEvent
from app.track_b import run_track_b

_VALID_DAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
_VALID_CATEGORIES = ("health", "goal", "incubation", "journal", "biofeedback", "other")


def add_event(
    db: Session, user_id: UUID, *, day: str, label: str, category: str = "other", goal_id=None
) -> tuple[CalendarEvent, str | None]:
    crisis_response = run_track_b(db, user_id, label)
    event = CalendarEvent(user_id=user_id, goal_id=goal_id, day=day, label=label, category=category)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "add_calendar_event",
        "description": "Add a real item to the user's weekly calendar -- use when they ask you to schedule or note something for a specific day.",
        "parameters": {
            "type": "object",
            "properties": {
                "day": {"type": "string", "enum": list(_VALID_DAYS), "description": "Day of the week."},
                "label": {"type": "string", "description": "What this calendar item is, in the user's own words."},
                "category": {"type": "string", "enum": list(_VALID_CATEGORIES), "description": "Use 'other' if none clearly fit."},
                "goal_name": {"type": "string", "description": "An existing goal this event relates to, if the user names one."},
            },
            "required": ["day", "label"],
        },
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict:
        if name != "add_calendar_event":
            return None
        if args.get("day") not in _VALID_DAYS:
            return {"error": f"'{args.get('day')}' isn't a real day of the week -- use the user's actual answer, e.g. 'Tue'."}
        category = args.get("category") if args.get("category") in _VALID_CATEGORIES else "other"
        goal_id = None
        if args.get("goal_name"):
            goal = find_goal_by_name(db, user_id, args["goal_name"])
            goal_id = goal.id if goal else None
        event, crisis_response = add_event(db, user_id, day=args["day"], label=args["label"], category=category, goal_id=goal_id)
        if crisis_response:
            return {"saved": True, "crisis_response": crisis_response}
        return {"saved": True, "event_id": str(event.id)}

    return execute
