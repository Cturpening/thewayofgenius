import logging
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_coach_id, get_current_user_id
from app.crisis_detection import classify_crisis_tier, override_message, requires_override
from app.config import get_settings
from app.database import engine, get_db
from app.edin_ai import (
    EdinAIError,
    generate_constitution_reflection,
    generate_dream_reflection,
    generate_follow_through_reflection,
    is_configured as edin_ai_configured,
)
from app.models import (
    CalendarEvent,
    CoachNote,
    DreamJournalEntry,
    FlaggedEvent,
    FollowThroughLogEntry,
    GeniusConstitutionResult,
    Goal,
    Profile,
    SymbolValidation,
)
from app.schemas import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventResponse,
    ChatMessageScan,
    ChatMessageScanResponse,
    ClientOut,
    CoachNoteCreate,
    CoachNoteOut,
    ConstitutionResultCreate,
    ConstitutionResultOut,
    ConstitutionResultUpdate,
    ConstitutionResultUpdateResponse,
    DreamJournalEntryCreate,
    DreamJournalEntryOut,
    DreamJournalEntryResponse,
    DreamJournalEntryUpdate,
    FollowThroughCreate,
    FollowThroughOut,
    FollowThroughResponse,
    FollowThroughUpdate,
    GoalCreate,
    GoalOut,
    GoalResponse,
    GoalUpdate,
    SymbolValidationCreate,
    SymbolValidationOut,
)

logger = logging.getLogger("edin")

app = FastAPI(title="Edin API", version="0.1.0")

# The frontend dev server (localhost:5173) is always allowed; set
# ALLOWED_ORIGINS in .env to your deployed frontend's real URL(s) --
# see app/config.py's cors_origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
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


def _verify_goal_ownership(db: Session, user_id: UUID, goal_id: UUID) -> None:
    """Raises 404 if goal_id doesn't exist or isn't the caller's -- used
    wherever a follow-through entry or calendar event links itself to a
    goal, so a user can never link to (or discover the existence of)
    another user's goal."""
    exists = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="Goal not found")


def _confirmed_tags(db: Session, client_id: UUID, tags: list[str]) -> list[str]:
    """Which of `tags` a coach has validated for this user -- see
    app/models.py's SymbolValidation and the /coach/clients/{id}/
    symbol-validations routes below. Passed into generate_dream_reflection
    so Edin is told, per-tag, what's actually confirmed vs. still
    tentative (protocols/11_Coherence_Dream_Criteria_Tagging_Density.md)."""
    if not tags:
        return []
    rows = (
        db.query(SymbolValidation.tag)
        .filter(SymbolValidation.client_id == client_id, SymbolValidation.tag.in_(tags))
        .all()
    )
    return [row.tag for row in rows]


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
            confirmed = _confirmed_tags(db, user_id, payload.tags)
            edin_note = generate_dream_reflection(combined_text, payload.tags, confirmed_tags=confirmed)
        except EdinAIError as exc:
            logger.warning("AI reflection failed: %s", exc)
            # Don't silently keep whatever canned placeholder the frontend
            # sent along -- that reads as a real, personalized reflection
            # when it isn't one. Say plainly that it's unavailable instead.
            edin_note = "Edin's reflection isn't available right now — try re-saving this entry in a bit."

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


@app.patch("/genius-constitution-results/{result_id}", response_model=ConstitutionResultUpdateResponse)
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

    updates = payload.model_dump(exclude_unset=True)
    # `intention` is freeform text (see schemas.ConstitutionResultUpdate) --
    # same as every other freeform field in this app, it goes through
    # Track B before being saved. This was previously missed entirely.
    crisis_response = _run_track_b(db, user_id, updates["intention"]) if updates.get("intention") else None

    if crisis_response:
        # Track B fires -- no AI call, same rule as everywhere else in this app.
        updates["edin_note"] = None
    elif updates.get("intention") and edin_ai_configured():
        try:
            updates["edin_note"] = generate_constitution_reflection(result.dominant_orientation, updates["intention"])
        except EdinAIError as exc:
            logger.warning("AI reflection failed, leaving prior edin_note in place: %s", exc)

    for field, value in updates.items():
        setattr(result, field, value)
    db.commit()
    db.refresh(result)
    return ConstitutionResultUpdateResponse(result=ConstitutionResultOut.model_validate(result), crisis_response=crisis_response)


# ---------------------------------------------------------------------------
# Follow-through log
# ---------------------------------------------------------------------------

@app.post("/follow-through-log", response_model=FollowThroughResponse, status_code=201)
def create_follow_through(
    payload: FollowThroughCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    if payload.goal_id:
        _verify_goal_ownership(db, user_id, payload.goal_id)
    crisis_response = _run_track_b(db, user_id, payload.intention)
    entry = FollowThroughLogEntry(
        user_id=user_id, goal_id=payload.goal_id, source=payload.source, intention=payload.intention
    )
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

    # A goal_id of None here means an explicit unlink (allowed with no
    # ownership check needed) -- only a real value needs verifying.
    if updates.get("goal_id"):
        _verify_goal_ownership(db, user_id, updates["goal_id"])

    # intention and note are both deliberate, discrete saves here (not
    # resent on every unrelated click), so no diffing needed -- just scan
    # whichever of them is actually present in this update.
    texts = [v for k, v in updates.items() if k in ("note", "intention") and v]
    crisis_response = _run_track_b(db, user_id, " ".join(texts)) if texts else None

    # Edin's reflection only makes sense once there's something to reflect
    # on -- i.e. once status has actually moved past "pending". Regenerates
    # on every subsequent status change (e.g. "partial" -> "did" later) so
    # the note always matches what's currently on record.
    new_status = updates.get("status")
    if crisis_response:
        updates["edin_note"] = None
    elif new_status and new_status != "pending" and edin_ai_configured():
        try:
            updates["edin_note"] = generate_follow_through_reflection(
                updates.get("intention", entry.intention), entry.source, new_status
            )
        except EdinAIError as exc:
            logger.warning("AI reflection failed, leaving prior edin_note in place: %s", exc)

    for field, value in updates.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)

    return FollowThroughResponse(entry=FollowThroughOut.model_validate(entry), crisis_response=crisis_response)


# ---------------------------------------------------------------------------
# Goals & Calendar
# ---------------------------------------------------------------------------

@app.post("/goals", response_model=GoalResponse, status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    crisis_response = _run_track_b(db, user_id, payload.name)
    goal = Goal(user_id=user_id, name=payload.name, modality=payload.modality)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return GoalResponse(goal=GoalOut.model_validate(goal), crisis_response=crisis_response)


@app.get("/goals", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
        .all()
    )


@app.patch("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: UUID, payload: GoalUpdate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    updates = payload.model_dump(exclude_unset=True)
    crisis_response = _run_track_b(db, user_id, updates["name"]) if updates.get("name") else None

    for field, value in updates.items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return GoalResponse(goal=GoalOut.model_validate(goal), crisis_response=crisis_response)


@app.delete("/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


@app.post("/calendar-events", response_model=CalendarEventResponse, status_code=201)
def create_calendar_event(
    payload: CalendarEventCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    if payload.goal_id:
        _verify_goal_ownership(db, user_id, payload.goal_id)
    crisis_response = _run_track_b(db, user_id, payload.label)
    event = CalendarEvent(
        user_id=user_id, goal_id=payload.goal_id, day=payload.day, label=payload.label, category=payload.category
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return CalendarEventResponse(event=CalendarEventOut.model_validate(event), crisis_response=crisis_response)


@app.get("/calendar-events", response_model=list[CalendarEventOut])
def list_calendar_events(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(CalendarEvent)
        .filter(CalendarEvent.user_id == user_id)
        .order_by(CalendarEvent.created_at.desc())
        .all()
    )


@app.delete("/calendar-events/{event_id}", status_code=204)
def delete_calendar_event(event_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    db.delete(event)
    db.commit()


# ---------------------------------------------------------------------------
# Chat (Edin — Available Anywhere)
# ---------------------------------------------------------------------------

@app.post("/chat-messages/scan", response_model=ChatMessageScanResponse)
def scan_chat_message(
    payload: ChatMessageScan, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    """The chat widget's replies are illustrative/client-side (see
    frontend/src/features/chat/chatUtils.js) -- it doesn't persist
    messages or call an AI provider. But it's a free-text surface a real
    user could absolutely type crisis language into, so every message
    still goes through Track B here before the frontend shows its canned
    reply. Found missing entirely on 2026-09-05 -- see
    protocols/03_Crisis_Escalation_Protocol.md.
    """
    crisis_response = _run_track_b(db, user_id, payload.text)
    db.commit()
    return ChatMessageScanResponse(crisis_response=crisis_response)


# ---------------------------------------------------------------------------
# Coach dashboard
#
# Every route below requires get_current_coach_id, not get_current_user_id
# -- that's the real access-control boundary letting one account read
# another's data at all. Single-coach model: any profile is a valid
# "client" here, including the coach's own account, since there's no
# separate coach-client assignment table yet (see database/schema.sql's
# note on profiles.is_coach). None of this touches the chat widget --
# it's illustrative/client-side and was never persisted server-side to
# begin with, so there's nothing here to surface even if asked to.
# ---------------------------------------------------------------------------

def _client_or_404(db: Session, client_id: UUID) -> Profile:
    client = db.query(Profile).filter(Profile.id == client_id).first()
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@app.get("/coach/status")
def coach_status(coach_id: UUID = Depends(get_current_coach_id)):
    """Lets the frontend probe whether the caller is a coach at all, to
    decide whether to show the dashboard nav item -- a 403 here means
    "hide it," not an error to surface to the user."""
    return {"is_coach": True}


@app.get("/coach/clients", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)):
    clients = db.query(Profile).order_by(Profile.created_at.asc()).all()
    out = []
    for client in clients:
        resolved = (
            db.query(FollowThroughLogEntry)
            .filter(FollowThroughLogEntry.user_id == client.id, FollowThroughLogEntry.status != "pending")
            .all()
        )
        rate = round(sum(1 for f in resolved if f.status == "did") / len(resolved) * 100) if resolved else None
        out.append(ClientOut(
            id=client.id,
            display_name=client.display_name,
            is_self=(client.id == coach_id),
            dream_entry_count=db.query(DreamJournalEntry).filter(DreamJournalEntry.user_id == client.id).count(),
            constitution_count=db.query(GeniusConstitutionResult).filter(GeniusConstitutionResult.user_id == client.id).count(),
            goal_count=db.query(Goal).filter(Goal.user_id == client.id).count(),
            follow_through_rate=rate,
        ))
    return out


@app.get("/coach/clients/{client_id}/dream-entries", response_model=list[DreamJournalEntryOut])
def coach_list_dream_entries(
    client_id: UUID, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)
):
    _client_or_404(db, client_id)
    return (
        db.query(DreamJournalEntry)
        .filter(DreamJournalEntry.user_id == client_id)
        .order_by(DreamJournalEntry.created_at.desc())
        .all()
    )


@app.get("/coach/clients/{client_id}/constitution-results", response_model=list[ConstitutionResultOut])
def coach_list_constitution_results(
    client_id: UUID, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)
):
    _client_or_404(db, client_id)
    return (
        db.query(GeniusConstitutionResult)
        .filter(GeniusConstitutionResult.user_id == client_id)
        .order_by(GeniusConstitutionResult.created_at.desc())
        .all()
    )


@app.get("/coach/clients/{client_id}/notes", response_model=list[CoachNoteOut])
def coach_list_notes(client_id: UUID, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)):
    _client_or_404(db, client_id)
    return (
        db.query(CoachNote)
        .filter(CoachNote.client_id == client_id)
        .order_by(CoachNote.created_at.desc())
        .all()
    )


@app.post("/coach/clients/{client_id}/notes", response_model=CoachNoteOut, status_code=201)
def coach_add_note(
    client_id: UUID,
    payload: CoachNoteCreate,
    db: Session = Depends(get_db),
    coach_id: UUID = Depends(get_current_coach_id),
):
    _client_or_404(db, client_id)
    note = CoachNote(coach_id=coach_id, client_id=client_id, note=payload.note)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.get("/coach/clients/{client_id}/symbol-validations", response_model=list[SymbolValidationOut])
def coach_list_symbol_validations(
    client_id: UUID, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)
):
    _client_or_404(db, client_id)
    return db.query(SymbolValidation).filter(SymbolValidation.client_id == client_id).all()


@app.post("/coach/clients/{client_id}/symbol-validations", response_model=SymbolValidationOut, status_code=201)
def coach_validate_symbol(
    client_id: UUID,
    payload: SymbolValidationCreate,
    db: Session = Depends(get_db),
    coach_id: UUID = Depends(get_current_coach_id),
):
    """Implements the coach-validation path from
    protocols/11_Coherence_Dream_Criteria_Tagging_Density.md's symbol-
    confirmation rule. Upserts on (client_id, tag) -- re-validating just
    refreshes who validated it and when, rather than erroring."""
    _client_or_404(db, client_id)
    existing = (
        db.query(SymbolValidation)
        .filter(SymbolValidation.client_id == client_id, SymbolValidation.tag == payload.tag)
        .first()
    )
    if existing:
        existing.validated_by = coach_id
        db.commit()
        db.refresh(existing)
        return existing
    validation = SymbolValidation(client_id=client_id, tag=payload.tag, validated_by=coach_id)
    db.add(validation)
    db.commit()
    db.refresh(validation)
    return validation


@app.delete("/coach/clients/{client_id}/symbol-validations/{tag}", status_code=204)
def coach_unvalidate_symbol(
    client_id: UUID, tag: str, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)
):
    validation = (
        db.query(SymbolValidation)
        .filter(SymbolValidation.client_id == client_id, SymbolValidation.tag == tag)
        .first()
    )
    if validation is None:
        raise HTTPException(status_code=404, detail="Symbol validation not found")
    db.delete(validation)
    db.commit()
