"""Shared Genius Constitution write logic -- both app/main.py's PATCH
/genius-constitution-results/{id} route and Edin's own tool-calling
(app/edin_tools.py) call into set_intention() below. Only `intention` is
ever editable after a Constitution result is completed (see
schemas.ConstitutionResultUpdate) -- the orientation percentages and
answers are fixed at completion time, so there's nothing else here for
either path to write.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.edin_ai import EdinAIError, generate_constitution_reflection, is_configured as edin_ai_configured
from app.models import GeniusConstitutionResult
from app.track_b import run_track_b
from app.user_context import display_name


def latest_result(db: Session, user_id: UUID) -> GeniusConstitutionResult | None:
    return (
        db.query(GeniusConstitutionResult)
        .filter(GeniusConstitutionResult.user_id == user_id)
        .order_by(GeniusConstitutionResult.created_at.desc())
        .first()
    )


def set_intention(
    db: Session, user_id: UUID, *, result: GeniusConstitutionResult, intention: str
) -> tuple[GeniusConstitutionResult, str | None]:
    crisis_response = run_track_b(db, user_id, intention)
    result.intention = intention
    if crisis_response:
        result.edin_note = None
    elif edin_ai_configured():
        try:
            result.edin_note = generate_constitution_reflection(
                result.dominant_orientation, intention, user_name=display_name(db, user_id)
            )
        except EdinAIError:
            result.edin_note = "Edin's reflection isn't available right now — it'll pick this up next time."
    db.commit()
    db.refresh(result)
    return result, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "set_constitution_intention",
        "description": (
            "Set or update the real intention on the user's most recent Genius Constitution result -- use "
            "this when the user states what they want to do with where their Constitution result points, "
            "not for casual mentions of their orientation."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "intention": {"type": "string", "description": "The real intention, in the user's own words."},
            },
            "required": ["intention"],
        },
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict | None:
        if name != "set_constitution_intention":
            return None
        result = latest_result(db, user_id)
        if result is None:
            return {"error": "The user hasn't completed a Genius Constitution yet, so there's nothing to set an intention on."}
        result, crisis_response = set_intention(db, user_id, result=result, intention=args["intention"])
        if crisis_response:
            return {"saved": True, "crisis_response": crisis_response}
        return {"saved": True, "result_id": str(result.id), "intention": result.intention}

    return execute
