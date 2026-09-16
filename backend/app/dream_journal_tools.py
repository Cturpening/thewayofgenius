"""Shared dream journal write logic -- both app/main.py's /dream-entries
route and Edin's own tool-calling (app/edin_tools.py, backlog #27) call
into create_entry() below, so a journal entry Edin writes on the user's
behalf gets the exact same Track B crisis check and the exact same real
Gemini/Claude reflection as one typed directly into the journal UI. No
shortcut version for the conversational path.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.edin_ai import EdinAIError, generate_dream_reflection, is_configured as edin_ai_configured
from app.models import DreamJournalEntry
from app.track_b import run_track_b
from app.user_context import confirmed_tags, display_name


def create_entry(
    db: Session, user_id: UUID, *, title: str | None, entry_text: str, tags: list[str] | None = None
) -> tuple[DreamJournalEntry, str | None]:
    """entry_text is split on newlines into the same {text, highlighted}
    line shape the journal UI stores -- see database/schema.sql's
    dream_journal_entries.lines. Returns (entry, crisis_response); the
    entry is always saved, crisis_response is only set when Track B's
    override fired (see app/track_b.py)."""
    tags = tags or []
    lines = [{"text": t, "highlighted": False} for t in entry_text.splitlines() if t.strip()] or [
        {"text": entry_text, "highlighted": False}
    ]
    combined_text = " ".join([title or ""] + [line["text"] for line in lines])

    crisis_response = run_track_b(db, user_id, combined_text)
    edin_note = None
    if not crisis_response and edin_ai_configured():
        try:
            edin_note = generate_dream_reflection(
                combined_text,
                tags,
                confirmed_tags=confirmed_tags(db, user_id, tags),
                user_name=display_name(db, user_id),
            )
        except EdinAIError:
            edin_note = "Edin's reflection isn't available right now — it'll pick this up next time."

    entry = DreamJournalEntry(user_id=user_id, title=title, lines=lines, tags=tags, edin_note=edin_note)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry, crisis_response


TOOL_DECLARATIONS = [
    {
        "name": "log_dream_journal_entry",
        "description": (
            "Save a real dream journal entry on the user's behalf -- use this when the user is "
            "actually describing a dream and asks you to log it, not for casual mentions of dreaming."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "entry_text": {"type": "string", "description": "The dream itself, in the user's own words."},
                "title": {"type": "string", "description": "A short title for the entry, if the user gave or implied one."},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Symbol/theme tags for this entry, if any are obvious from what the user said."},
            },
            "required": ["entry_text"],
        },
    },
    {
        "name": "list_recent_dreams",
        "description": (
            "List the user's real recent dream journal entries (title, date, tags) -- use this when the "
            "user references a past dream you need to check details on, rather than guessing at what it said."
        ),
        "parameters": {"type": "object", "properties": {}},
    },
]


def make_executor(db: Session, user_id: UUID):
    def execute(name: str, args: dict) -> dict | None:
        if name == "log_dream_journal_entry":
            entry, crisis_response = create_entry(
                db, user_id, title=args.get("title"), entry_text=args["entry_text"], tags=args.get("tags")
            )
            if crisis_response:
                return {"saved": True, "crisis_response": crisis_response}
            return {"saved": True, "entry_id": str(entry.id), "edin_note": entry.edin_note}

        if name == "list_recent_dreams":
            entries = (
                db.query(DreamJournalEntry)
                .filter(DreamJournalEntry.user_id == user_id)
                .order_by(DreamJournalEntry.created_at.desc())
                .limit(10)
                .all()
            )
            return {
                "entries": [
                    {"title": e.title, "date": e.created_at.isoformat(), "tags": e.tags}
                    for e in entries
                ]
            }

        return None  # not this domain's tool -- let the aggregator try the next one

    return execute
