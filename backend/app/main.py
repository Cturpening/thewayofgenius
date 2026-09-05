from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crisis_detection import classify_crisis_tier, override_message, requires_override
from app.database import engine, get_db
from app.edin_ai import EdinAIError, generate_dream_reflection, is_configured as edin_ai_configured
from app.models import DreamJournalEntry, FlaggedEvent
from app.schemas import DreamJournalEntryCreate, DreamJournalEntryOut, DreamJournalEntryResponse

app = FastAPI(title="Edin API", version="0.1.0")

# The frontend dev server runs on 5173 by default (see frontend/vite.config.js).
# Add your deployed frontend's URL here too once you have one.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness check: is the API process up at all? Doesn't touch the database."""
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """Readiness check: can the API actually reach the Supabase database?"""
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {exc}") from exc
    return {"status": "ok", "database": "connected"}


@app.post("/journal-entries", response_model=DreamJournalEntryResponse)
def create_journal_entry(payload: DreamJournalEntryCreate, db: Session = Depends(get_db)):
    """Create a dream journal entry, running it through Track B crisis
    detection first (see app/crisis_detection.py). The entry is always
    saved -- Track B never blocks journaling -- but a Tier 2/3 or
    harm-to-others match also writes a flagged_events row and returns
    the fixed crisis-override message for the frontend to surface.
    """
    combined_text = " ".join([payload.title or ""] + [line.text for line in payload.lines])
    tier = classify_crisis_tier(combined_text)

    crisis_response = None
    edin_note = payload.edin_note
    if requires_override(tier):
        # Track B fires. Gemini is never called for this entry -- the
        # crisis response takes over the interaction entirely, per
        # 03_Crisis_Escalation_Protocol.md and 05_Shadow_Encounter_Room.md.
        # Whatever reflection the frontend sent (if any) is discarded.
        edin_note = None
    elif edin_ai_configured():
        # Not a crisis entry, and Gemini is set up -- generate a real
        # reflection instead of using the frontend's canned one. Falls
        # back to whatever was passed in if the call fails, so a Gemini
        # outage never blocks saving a journal entry.
        try:
            edin_note = generate_dream_reflection(combined_text, payload.tags)
        except EdinAIError:
            pass

    entry = DreamJournalEntry(
        user_id=payload.user_id,
        title=payload.title,
        lines=[line.model_dump() for line in payload.lines],
        tags=payload.tags,
        edin_note=edin_note,
    )
    db.add(entry)

    if requires_override(tier):
        db.add(FlaggedEvent(user_id=payload.user_id, trigger_phrase_matched=tier.value))
        crisis_response = override_message(tier)

    try:
        db.commit()
    except IntegrityError as exc:
        # Most likely cause today: user_id doesn't exist in auth.users yet.
        # There's no real sign-up/login wired up (see SETUP.md), so this
        # will happen constantly during dev/testing -- surfacing it as a
        # clear 400 instead of an unhandled 500 matters, because an
        # unhandled exception here loses its CORS headers, which makes
        # the browser report a confusing "blocked by CORS policy" error
        # that has nothing to do with CORS.
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not save entry -- user_id doesn't match a real user.",
        ) from exc

    db.refresh(entry)

    return DreamJournalEntryResponse(
        entry=DreamJournalEntryOut.model_validate(entry),
        crisis_response=crisis_response,
    )


@app.get("/journal-entries", response_model=list[DreamJournalEntryOut])
def list_journal_entries(user_id: UUID, db: Session = Depends(get_db)):
    return (
        db.query(DreamJournalEntry)
        .filter(DreamJournalEntry.user_id == user_id)
        .order_by(DreamJournalEntry.created_at.desc())
        .all()
    )
