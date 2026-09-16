"""Shared goal write logic -- both app/main.py's /goals routes and Edin's
own tool-calling (app/edin_tools.py) call into these, so a goal Edin
creates or updates conversationally is the exact same write path as one
made by hand in Goals & Calendar.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Goal
from app.track_b import run_track_b

_VALID_MODALITIES = ("sleep", "biofeedback", "microbiome", "career", "other")


def create_goal(db: Session, user_id: UUID, *, name: str, modality: str) -> tuple[Goal, str | None]:
    crisis_response = run_track_b(db, user_id, name)
    goal = Goal(user_id=user_id, name=name, modality=modality)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal, crisis_response


def find_goals_by_name(db: Session, user_id: UUID, name: str) -> list[Goal]:
    """Case-insensitive substring match -- a chat tool call names a goal by
    what the user actually calls it, never its id. Returns every match,
    most recent first, so a caller can tell "not found," "one clear
    match," and "ambiguous, more than one" apart instead of silently
    guessing on the last case -- see make_executor below for how
    update_goal_progress uses this."""
    return (
        db.query(Goal)
        .filter(Goal.user_id == user_id, Goal.name.ilike(f"%{name}%"))
        .order_by(Goal.created_at.desc())
        .all()
    )


def find_goal_for_linking(db: Session, user_id: UUID, name: str) -> Goal | None:
    """For the optional 'link this to a goal' field on follow-through
    entries and calendar events -- linking is secondary metadata, not the
    action itself, so this only links when there's exactly one confident
    match and silently skips linking otherwise (no match, or more than one
    -- never guesses which goal was meant). Unlike update_goal_progress
    below, an unlinked entry is a fine, honest outcome; a wrongly-linked
    one isn't."""
    matches = find_goals_by_name(db, user_id, name)
    return matches[0] if len(matches) == 1 else None


def update_goal_progress(db: Session, user_id: UUID, *, goal: Goal, progress: float) -> Goal:
    goal.progress = max(0.0, min(1.0, progress))
    db.commit()
    db.refresh(goal)
    return goal


TOOL_DECLARATIONS = [
    {
        "name": "create_goal",
        "description": "Create a new real goal for the user -- use when they describe something they actually want to track progress on.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "The goal, in the user's own words."},
                "modality": {
                    "type": "string",
                    "enum": list(_VALID_MODALITIES),
                    "description": "Which real data lane this goal is tracked by; use 'other' if none clearly fit.",
                },
            },
            "required": ["name", "modality"],
        },
    },
    {
        "name": "update_goal_progress",
        "description": "Update how far along an existing goal is -- use when the user reports real progress on a goal they already have.",
        "parameters": {
            "type": "object",
            "properties": {
                "goal_name": {"type": "string", "description": "The goal's name (or a close match), as the user refers to it."},
                "progress": {"type": "number", "description": "New progress from 0.0 (not started) to 1.0 (done)."},
            },
            "required": ["goal_name", "progress"],
        },
    },
    {
        "name": "list_goals",
        "description": (
            "List the user's real goals with their exact names and current progress -- use this before "
            "update_goal_progress whenever you're not certain of a goal's exact name, so you reference the "
            "right one instead of guessing."
        ),
        "parameters": {"type": "object", "properties": {}},
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict:
        if name == "create_goal":
            modality = args.get("modality") if args.get("modality") in _VALID_MODALITIES else "other"
            goal, crisis_response = create_goal(db, user_id, name=args["name"], modality=modality)
            if crisis_response:
                return {"saved": True, "crisis_response": crisis_response}
            return {"saved": True, "goal_id": str(goal.id), "name": goal.name}

        if name == "update_goal_progress":
            matches = find_goals_by_name(db, user_id, args["goal_name"])
            if len(matches) == 0:
                return {"error": f"No goal matching '{args['goal_name']}' was found -- ask the user to confirm the exact goal, or call list_goals."}
            if len(matches) > 1:
                return {
                    "error": f"More than one goal matches '{args['goal_name']}' -- ask the user which one they mean.",
                    "candidates": [g.name for g in matches],
                }
            goal = update_goal_progress(db, user_id, goal=matches[0], progress=float(args["progress"]))
            return {"updated": True, "goal_id": str(goal.id), "name": goal.name, "progress": float(goal.progress)}

        if name == "list_goals":
            goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).all()
            return {"goals": [{"name": g.name, "modality": g.modality, "progress": float(g.progress)} for g in goals]}

        return None

    return execute
