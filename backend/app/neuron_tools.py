"""Real actions on a user's neuron records (see database/schema.sql's
neuron_records table) -- the shared core both app/main.py's plain HTTP
routes and Edin's own tool-calling loop (see app/ai_providers/gemini.py's
generate_with_tools, wired in via app/edin_ai.py) call into. Keeping the
actual database logic here, once, is what makes "Edin edits this
conversationally" and "the user clicks Save in the content box" the exact
same write path rather than two implementations that can quietly drift
apart -- backlog #27 ("give Edin real tool use"), Phase 1, scoped to the
one feature that needs it today.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import NeuronRecord
from app.track_b import run_track_b

_EDITABLE_FIELDS = ("story", "skill", "practice_goal", "vitals_note", "dream_content", "progress_state")

_VALID_PROGRESS_STATES = ("unformed", "practicing", "strengthened", "wounded")


def _get_or_create(db: Session, user_id: UUID, node_key: str) -> NeuronRecord:
    record = db.query(NeuronRecord).filter(NeuronRecord.user_id == user_id, NeuronRecord.node_key == node_key).first()
    if record is None:
        record = NeuronRecord(user_id=user_id, node_key=node_key)
        db.add(record)
    return record


_FREE_TEXT_FIELDS = ("story", "skill", "practice_goal", "vitals_note", "dream_content")


def upsert_neuron_record(db: Session, user_id: UUID, node_key: str, **fields) -> tuple[NeuronRecord, str | None]:
    """fields is whatever subset of _EDITABLE_FIELDS the caller actually
    has -- None values are skipped, not written, same "only what's present
    gets updated" contract as NeuronRecordUpsert in app/schemas.py.

    Runs Track B on the combined free-text fields before writing -- these
    are some of the most personal content in the whole app (a real story,
    a vitals note, dream content, in the user's own words), and every
    other domain module in this app (dream journal, goals, follow-through,
    calendar, the Constitution) already runs this same check on its own
    free text. This module didn't, until a security review caught it --
    see track_b.py's own docstring: this is supposed to be a hard,
    non-bypassable check on every write path that can carry real user
    text, not one with a silent exception. The record still saves either
    way (Track B never blocks a save, same rule everywhere else) --
    returns (record, crisis_response), crisis_response only set when the
    override fired.
    """
    record = _get_or_create(db, user_id, node_key)
    for field in _EDITABLE_FIELDS:
        value = fields.get(field)
        if value is not None:
            setattr(record, field, value)

    combined_text = " ".join(fields[f] for f in _FREE_TEXT_FIELDS if fields.get(f))
    crisis_response = run_track_b(db, user_id, combined_text) if combined_text else None

    db.commit()
    db.refresh(record)
    return record, crisis_response


def log_neuron_practice(db: Session, user_id: UUID, node_key: str) -> NeuronRecord:
    """One practice rep against this node -- see database/schema.sql's
    comment on progress_state for why 'wounded' is never set here."""
    record = _get_or_create(db, user_id, node_key)
    record.practice_count += 1
    record.last_practiced_at = datetime.now(timezone.utc)
    if record.progress_state == "unformed":
        record.progress_state = "practicing"
    elif record.progress_state == "practicing" and record.practice_count >= 5:
        record.progress_state = "strengthened"
    db.commit()
    db.refresh(record)
    return record


def _record_to_dict(record: NeuronRecord) -> dict:
    return {
        "node_key": record.node_key,
        "story": record.story,
        "skill": record.skill,
        "practice_goal": record.practice_goal,
        "vitals_note": record.vitals_note,
        "dream_content": record.dream_content,
        "progress_state": record.progress_state,
        "practice_count": record.practice_count,
    }


# ---------------------------------------------------------------------------
# Tool declarations for Edin's chat -- Gemini function-calling schema (JSON
# Schema-shaped `parameters`), passed to app/ai_providers/gemini.py's
# generate_with_tools. node_key is deliberately NOT free-form here: Edin
# only ever acts on a node the user is actually looking at right now (the
# frontend sends it in as context, see app/main.py's chat route), so she
# can't invent or guess at a node the user never opened.
# ---------------------------------------------------------------------------

NEURON_TOOL_DECLARATIONS = [
    {
        "name": "save_neuron_record",
        "description": (
            "Save or update the real story, skill, practice goal, vitals note, and/or dream content "
            "for the body-map node the user is currently looking at. Only pass the fields the user "
            "actually gave you content for -- never invent or guess at the others."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "story": {"type": "string", "description": "The real personal story or experience this node represents."},
                "skill": {"type": "string", "description": "The skill this story/practice is building."},
                "practice_goal": {"type": "string", "description": "The metacognitive practice or training goal tied to this node."},
                "vitals_note": {"type": "string", "description": "A health record or vitals note, in the user's own words."},
                "dream_content": {"type": "string", "description": "Subconscious or dream content tied to this node."},
            },
        },
    },
    {
        "name": "log_neuron_practice",
        "description": (
            "Record one real practice repetition against the body-map node the user is currently "
            "looking at -- use this when the user says they just practiced, rehearsed, or worked on "
            "whatever this node represents."
        ),
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "get_current_node_record",
        "description": (
            "Read whatever is already saved on the body-map node the user currently has open -- use this "
            "before saving when the user wants to ADD to or build on an existing story/skill/goal rather "
            "than replace it, or when you need to know what's actually there before referencing it."
        ),
        "parameters": {"type": "object", "properties": {}},
    },
]


def make_tool_executor(db: Session, user_id: UUID, node_key: str | None):
    """Returns a (name, args) -> dict callable bound to this request's db
    session, user, and current node -- the node_key the frontend says the
    user has open, never one Edin supplies herself. If no node is open,
    these two tools return an explanatory error instead of silently doing
    nothing, so Edin can tell the user to open a node first rather than
    claiming she saved something she didn't. Returns None for any tool
    name that isn't one of this domain's own -- see app/edin_tools.py's
    aggregator, which tries each domain's executor in turn."""

    def execute(name: str, args: dict) -> dict | None:
        if name not in ("save_neuron_record", "log_neuron_practice", "get_current_node_record"):
            return None

        if not node_key:
            return {"error": "No body-map node is currently open, so there's nothing to save this to yet."}

        if name == "save_neuron_record":
            progress_state = args.get("progress_state")
            if progress_state is not None and progress_state not in _VALID_PROGRESS_STATES:
                args = {**args, "progress_state": None}
            record, crisis_response = upsert_neuron_record(db, user_id, node_key, **args)
            if crisis_response:
                return {"saved": True, "crisis_response": crisis_response}
            return {"saved": True, "record": _record_to_dict(record)}

        if name == "get_current_node_record":
            record = db.query(NeuronRecord).filter(NeuronRecord.user_id == user_id, NeuronRecord.node_key == node_key).first()
            if record is None:
                return {"exists": False}
            return {"exists": True, "record": _record_to_dict(record)}

        record = log_neuron_practice(db, user_id, node_key)
        return {"logged": True, "record": _record_to_dict(record)}

    return execute
