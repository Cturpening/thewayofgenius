import logging
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.crisis_detection import classify_crisis_tier, override_message, requires_override
from app.database import engine, get_db
from app.edin_ai import EdinAIError, generate_dream_reflection, is_configured as edin_ai_configured
from app.models import DreamJournalEntry, FlaggedEvent, FollowThroughLogEntry, GeniusConstitutionResult
from app.schemas import (
    ConstitutionResultCreate,
    ConstitutionResultOut,
    ConstitutionResultUpdate,
    DreamJournalEntryCreate,
    DreamJournalEntryOut,
    DreamJournalEntryResponse,
    DreamJournalEntryUpdate,
    FollowThroughCreate,
    FollowThroughOut,
    FollowThroughResponse,
    FollowThroughUpdate,
)

logger = logging.getLogger("edin")

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


def _run_track_b(db: Session, user_id: UUID, combined_text: str) -> str | None:
    """Classifies `combined_text` and, if it crosses the hard-override
    threshold, writes a flagged_events row and returns the fixed override
    message for the frontend to surface. Returns None otherwise. Never
    blocks the caller's save either way -- see app/crisis_detection.py and
    protocols/03_Crisis_Escalation_Protocol.md.
    """
    tier = classify_crisis_tier(combined_text)
    if not requires_override(tier):
        return None
    db.add(FlaggedEvent(user_id=user_id, trigger_phrase_matched=tier.value))
    return override_message(tier)


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


@app.get("/health/ai")
def health_ai():
    """Readiness check for Edin's AI layer: is the primary provider actually
    configured and working right now, not just "is a key present." Makes
    one real, tiny live call -- this is the thing to check periodically
    (not on every page load) to catch a deprecated/renamed model before
    it's been silently degrading real reflections for a while. See
    "Edin's AI layer" in README.md.
    """
    if not edin_ai_configured():
        raise HTTPException(status_code=503, detail="No AI provider is configured (GEMINI_API_KEY/ANTHROPIC_API_KEY)")
    try:
        generate_dream_reflection("A short test dream, nothing eventful.", [])
    except EdinAIError as exc:
        raise HTTPException(status_code=503, detail=f"AI provider call failed: {exc}") from exc
    return {"status": "ok", "ai": "connected"}


# ---------------------------------------------------------------------------
# Dream journal
# ---------------------------------------------------------------------------

@app.post("/dream-entries", response_model=DreamJournalEntryResponse, status_code=201)
def create_journal_entry(
    payload: DreamJournalEntryCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    """Create a dream journal entry, running it through Track B crisis
    detection first (see app/crisis_detection.py). The entry is always
    saved -- Track B never blocks journaling -- but a Tier 2/3 or
    harm-to-others match also writes a flagged_events row and returns
    the fixed crisis-override message for the frontend to surface.
    """
    combined_text = " ".join([payload.title or ""] + [line.text for line in payload.lines])

    edin_note = payload.edin_note
    crisis_response = _run_track_b(db, user_id, combined_text)
    if crisis_response:
        # Track B fires. Gemini/Claude is never called for this entry --
        # the crisis response takes over the interaction entirely, per
        # 03_Crisis_Escalation_Protocol.md and 05_Shadow_Encounter_Room.md.
        # Whatever reflection the frontend sent (if any) is discarded.
        edin_note = None
    elif edin_ai_configured():
        try:
            edin_note = generate_dream_reflection(combined_text, payload.tags)
        except EdinAIError as exc:
            logger.warning("AI reflection failed, falling back to canned note: %s", exc)

    entry = DreamJournalEntry(
        user_id=user_id,
        title=payload.title,
        lines=[line.model_dump() for line in payload.lines],
        tags=payload.tags,
        edin_note=edin_note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return DreamJournalEntryResponse(entry=DreamJournalEntryOut.model_validate(entry), crisis_response=crisis_response)


@app.get("/dream-entries", response_model=list[DreamJournalEntryOut])
def list_journal_entries(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(DreamJournalEntry)
        .filter(DreamJournalEntry.user_id == user_id)
        .order_by(DreamJournalEntry.created_at.desc())
        .all()
    )


@app.patch("/dream-entries/{entry_id}", response_model=DreamJournalEntryResponse)
def update_journal_entry(
    entry_id: UUID,
    payload: DreamJournalEntryUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    entry = db.query(DreamJournalEntry).filter(DreamJournalEntry.id == entry_id, DreamJournalEntry.user_id == user_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Dream journal entry not found")

    updates = payload.model_dump(exclude_unset=True)

    # Track B only needs to see genuinely new/changed text -- not, say, a
    # highlight-toggle click, which resends the full (unchanged) lines
    # array every time. Diff against what's already stored before scanning,
    # so an unrelated click never re-fires the crisis banner on old text.
    new_texts: list[str] = []
    if "title" in updates and updates["title"] != entry.title:
        new_texts.append(updates["title"] or "")
    if "lines" in updates:
        prior_lines = entry.lines or []
        for i, line in enumerate(updates["lines"] or []):
            prior_text = prior_lines[i]["text"] if i < len(prior_lines) else None
            if line.get("text") != prior_text:
                new_texts.append(line.get("text") or "")

    crisis_response = _run_track_b(db, user_id, " ".join(new_texts)) if new_texts else None

    for field, value in updates.items():
        setattr(entry, field, [line if isinstance(line, dict) else line.model_dump() for line in value] if field == "lines" else value)

    db.commit()
    db.refresh(entry)

    return DreamJournalEntryResponse(entry=DreamJournalEntryOut.model_validate(entry), crisis_response=crisis_response)


@app.delete("/dream-entries/{entry_id}", status_code=204)
def delete_journal_entry(entry_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    entry = db.query(DreamJournalEntry).filter(DreamJournalEntry.id == entry_id, DreamJournalEntry.user_id == user_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Dream journal entry not found")
    db.delete(entry)
    db.commit()


# ---------------------------------------------------------------------------
# Genius Constitution results
# ---------------------------------------------------------------------------

@app.post("/genius-constitution-results", response_model=ConstitutionResultOut, status_code=201)
def create_constitution_result(
    payload: ConstitutionResultCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    result = GeniusConstitutionResult(user_id=user_id, **payload.model_dump())
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@app.get("/genius-constitution-results", response_model=list[ConstitutionResultOut])
def list_constitution_results(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(GeniusConstitutionResult)
        .filter(GeniusConstitutionResult.user_id == user_id)
        .order_by(GeniusConstitutionResult.created_at.desc())
        .all()
    )


@app.patch("/genius-constitution-results/{result_id}", response_model=ConstitutionResultOut)
def update_constitution_result(
    result_id: UUID,
    payload: ConstitutionResultUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    result = (
        db.query(GeniusConstitutionResult)
        .filter(GeniusConstitutionResult.id == result_id, GeniusConstitutionResult.user_id == user_id)
        .first()
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Genius Constitution result not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(result, field, value)
    db.commit()
    db.refresh(result)
    return result


# ---------------------------------------------------------------------------
# Follow-through log
# ---------------------------------------------------------------------------

@app.post("/follow-through-log", response_model=FollowThroughResponse, status_code=201)
def create_follow_through(
    payload: FollowThroughCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    crisis_response = _run_track_b(db, user_id, payload.intention)
    entry = FollowThroughLogEntry(user_id=user_id, source=payload.source, intention=payload.intention)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return FollowThroughResponse(entry=FollowThroughOut.model_validate(entry), crisis_response=crisis_response)


@app.get("/follow-through-log", response_model=list[FollowThroughOut])
def list_follow_throughs(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(FollowThroughLogEntry)
        .filter(FollowThroughLogEntry.user_id == user_id)
        .order_by(FollowThroughLogEntry.created_at.desc())
        .all()
    )


@app.patch("/follow-through-log/{entry_id}", response_model=FollowThroughResponse)
def update_follow_through(
    entry_id: UUID,
    payload: FollowThroughUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    entry = (
        db.query(FollowThroughLogEntry)
        .filter(FollowThroughLogEntry.id == entry_id, FollowThroughLogEntry.user_id == user_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Follow-through log entry not found")

    updates = payload.model_dump(exclude_unset=True)

    # intention and note are both deliberate, discrete saves here (not
    # resent on every unrelated click), so no diffing needed -- just scan
    # whichever of them is actually present in this update.
    texts = [v for k, v in updates.items() if k in ("note", "intention") and v]
    crisis_response = _run_track_b(db, user_id, " ".join(texts)) if texts else None

    for field, value in updates.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)

    return FollowThroughResponse(entry=FollowThroughOut.model_validate(entry), crisis_response=crisis_response)
