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


def find_goal_by_name(db: Session, user_id: UUID, name: str) -> Goal | None:
    """Case-insensitive substring match -- a chat tool call names a goal
    by what the user actually calls it, never its id. Ambiguity (more than
    one match) is resolved by taking the most recently created one rather
    than guessing further; if the user meant a different one, they'll say
    so and it can be corrected."""
    return (
        db.query(Goal)
        .filter(Goal.user_id == user_id, Goal.name.ilike(f"%{name}%"))
        .order_by(Goal.created_at.desc())
        .first()
    )


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
            goal = find_goal_by_name(db, user_id, args["goal_name"])
            if goal is None:
                return {"error": f"No goal matching '{args['goal_name']}' was found -- ask the user to confirm the exact goal."}
            goal = update_goal_progress(db, user_id, goal=goal, progress=float(args["progress"]))
            return {"updated": True, "goal_id": str(goal.id), "name": goal.name, "progress": float(goal.progress)}

        return None

    return execute
