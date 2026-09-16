import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import neuron_tools
from app.auth import get_current_coach_id, get_current_user_id
from app.crisis_detection import classify_crisis_tier, override_message, requires_override
from app.config import get_settings
from app.database import engine, get_db
from app.edin_ai import (
    EdinAIError,
    generate_chat_reply_with_tools,
    generate_constitution_reflection,
    generate_dream_reflection,
    generate_follow_through_reflection,
    is_configured as edin_ai_configured,
)
from app.models import (
    CalendarEvent,
    ChatMessage,
    CoachNote,
    DreamJournalEntry,
    FlaggedEvent,
    FollowThroughLogEntry,
    GeniusConstitutionResult,
    Goal,
    MembershipPlan,
    NeuronRecord,
    Profile,
    SymbolValidation,
)
from app.schemas import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventResponse,
    ChatMessageCreate,
    ChatMessageOut,
    ChatMessageSendResponse,
    CheckInResponse,
    CheckInSuggestion,
    ClientMembershipUpdate,
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
    MembershipPlanCreate,
    MembershipPlanOut,
    MembershipPlanUpdate,
    NeuronRecordOut,
    NeuronRecordUpsert,
    SymbolValidationCreate,
    SymbolValidationOut,
    ToolCallOut,
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


def _display_name(db: Session, user_id: UUID) -> str | None:
    """The user's own display_name (Profile), if they've set one -- passed
    into every generate_* reflection call below so Edin actually knows who
    she's talking to, on every surface, not just the coach dashboard's
    client list (the only place this column was read before)."""
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    return profile.display_name if profile else None


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


def _supabase_project_ref() -> str | None:
    """Pulls the project ref (the xxxxxxxx in https://xxxxxxxx.supabase.co)
    out of SUPABASE_URL -- surfaced in /health so which Supabase project
    this backend is actually talking to is a one-second check, not
    something that requires cross-referencing .env files and running SQL
    to reverse-engineer (see the "two different Supabase projects" saga
    this was built after)."""
    url = get_settings().supabase_url
    if not url:
        return None
    host = url.removeprefix("https://").removeprefix("http://").split("/")[0]
    return host.removesuffix(".supabase.co") or None


@app.get("/health")
def health():
    """Liveness check: is the API process up at all? Doesn't touch the
    database. Also reports which Supabase project this backend is
    configured for -- check this first whenever something looks like it's
    "not saving" or "not showing up," before assuming a code bug."""
    return {"status": "ok", "supabase_project": _supabase_project_ref()}


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
            edin_note = generate_dream_reflection(
                combined_text,
                payload.tags,
                confirmed_tags=confirmed,
                logged_at=datetime.now(timezone.utc),
                user_name=_display_name(db, user_id),
            )
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
            updates["edin_note"] = generate_constitution_reflection(
                result.dominant_orientation, updates["intention"], user_name=_display_name(db, user_id)
            )
        except EdinAIError as exc:
            logger.warning("AI reflection failed: %s", exc)
            updates["edin_note"] = "Edin's reflection isn't available right now — try saving this intention again in a bit."

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
                updates.get("intention", entry.intention),
                entry.source,
                new_status,
                user_name=_display_name(db, user_id),
            )
        except EdinAIError as exc:
            logger.warning("AI reflection failed: %s", exc)
            updates["edin_note"] = "Edin's reflection isn't available right now — it'll pick this up on the next status change."

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
# Neuron records (Genius Profile -> Body / Hologram, deepest layer)
#
# Keyed by node_key, not a UUID passed to the caller -- the frontend already
# knows exactly which node it's looking at (LivingMap.jsx / BodySystemsMapView.jsx
# build the same selection string used here), so there's no separate id to
# round-trip. GET returns every record the account has at once: a body map
# has dozens of nodes, and fetching them one at a time as each is opened
# would mean a network round-trip on every click -- the opposite of the
# calm, click-only feel the rest of this feature is built around.
# ---------------------------------------------------------------------------

@app.get("/neuron-records", response_model=list[NeuronRecordOut])
def list_neuron_records(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return db.query(NeuronRecord).filter(NeuronRecord.user_id == user_id).all()


@app.put("/neuron-records/{node_key}", response_model=NeuronRecordOut)
def put_neuron_record(
    node_key: str,
    payload: NeuronRecordUpsert,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return neuron_tools.upsert_neuron_record(db, user_id, node_key, **payload.model_dump(exclude_unset=True))


@app.post("/neuron-records/{node_key}/log-practice", response_model=NeuronRecordOut)
def post_neuron_practice(node_key: str, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    """Records one practice session against this node -- the "watching a
    backflip get better in real time" idea made real: each call is one more
    rep, and the pathway visibly builds from it instead of needing a manual
    status change every time. 'wounded' is left alone here on purpose (see
    schemas.py's NeuronRecordUpsert) -- only an explicit edit clears it,
    since a few good reps don't erase what made a pathway weak in the
    first place. Shared with Edin's own tool-calling (see app/neuron_tools.py)
    so a user's manual click and Edin doing it conversationally are the
    exact same write path."""
    return neuron_tools.log_neuron_practice(db, user_id, node_key)


@app.delete("/neuron-records/{node_key}", status_code=204)
def delete_neuron_record(node_key: str, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    record = (
        db.query(NeuronRecord)
        .filter(NeuronRecord.user_id == user_id, NeuronRecord.node_key == node_key)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Neuron record not found")
    db.delete(record)
    db.commit()


# ---------------------------------------------------------------------------
# Chat (Edin — Available Anywhere)
# ---------------------------------------------------------------------------

def _chat_context_summary(db: Session, user_id: UUID) -> str:
    """Brief, real context about this account for Edin's live chat --
    not full tool use (that's a bigger future project, see task #27 in
    the project's own tracking), just enough that the chat isn't blind
    to what's already in the account. Every piece here is real data,
    never invented.
    """
    parts = []
    recent_dreams = (
        db.query(DreamJournalEntry)
        .filter(DreamJournalEntry.user_id == user_id)
        .order_by(DreamJournalEntry.created_at.desc())
        .limit(5)
        .all()
    )
    if recent_dreams:
        dream_lines = [
            f"{d.created_at.strftime('%b %d')}: \"{d.title or 'untitled'}\", tags: {', '.join(d.tags) or 'none'}"
            for d in recent_dreams
        ]
        parts.append(f"Recent dream journal entries, most recent first ({len(recent_dreams)} total): " + "; ".join(dream_lines) + ".")

    active_goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).limit(5).all()
    if active_goals:
        goal_lines = [f"{g.name} ({g.modality}, {int(g.progress * 100)}% progress)" for g in active_goals]
        parts.append("Active goals: " + "; ".join(goal_lines) + ".")

    latest_follow_through = (
        db.query(FollowThroughLogEntry)
        .filter(FollowThroughLogEntry.user_id == user_id)
        .order_by(FollowThroughLogEntry.created_at.desc())
        .first()
    )
    if latest_follow_through:
        parts.append(
            f"Most recent follow-through entry: \"{latest_follow_through.intention}\" "
            f"— status: {latest_follow_through.status}."
        )

    return " ".join(parts) if parts else "No real account data logged yet for this user."


@app.get("/chat-messages", response_model=list[ChatMessageOut])
def list_chat_messages(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@app.post("/chat-messages", response_model=ChatMessageSendResponse, status_code=201)
def send_chat_message(
    payload: ChatMessageCreate, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    """Real, persisted conversation with Edin -- see database/schema.sql's
    chat_messages table and app/edin_prompt/'s v5 "Live chat conversation"
    context type. Every message goes through Track B first, same rule as
    everywhere else in this app; a crisis hit never reaches Gemini and
    the fixed override message is persisted as Edin's turn instead.
    """
    user_message = ChatMessage(user_id=user_id, role="user", content=payload.text)
    db.add(user_message)
    db.flush()

    crisis_response = _run_track_b(db, user_id, payload.text)
    if crisis_response:
        edin_message = ChatMessage(user_id=user_id, role="edin", content=crisis_response)
        db.add(edin_message)
        db.commit()
        db.refresh(user_message)
        db.refresh(edin_message)
        return ChatMessageSendResponse(
            user_message=ChatMessageOut.model_validate(user_message),
            edin_message=ChatMessageOut.model_validate(edin_message),
            crisis_response=crisis_response,
        )

    context = _chat_context_summary(db, user_id)
    tool_calls: list[dict] = []
    if edin_ai_configured():
        history = (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(21)  # last 20 turns of context, plus the one just added
            .all()
        )
        history.reverse()
        try:
            # Real tool-use (backlog #27, Phase 1) only when the frontend says a
            # body-map node is actually open -- see neuron_tools.make_tool_executor's
            # own guard against Edin acting on a node nobody has open.
            reply_text, tool_calls = generate_chat_reply_with_tools(
                [{"role": m.role, "content": m.content} for m in history],
                context,
                neuron_tools.NEURON_TOOL_DECLARATIONS,
                neuron_tools.make_tool_executor(db, user_id, payload.node_key),
                user_name=_display_name(db, user_id),
            )
        except EdinAIError as exc:
            logger.warning("AI reflection failed: %s", exc)
            reply_text = "Edin's reflection isn't available right now — try sending that again in a bit."
    else:
        reply_text = "Edin's real conversation isn't configured yet — no AI provider is set up (GEMINI_API_KEY/ANTHROPIC_API_KEY)."

    note = context if not tool_calls else f"{context} Tool calls made: {tool_calls}"
    edin_message = ChatMessage(user_id=user_id, role="edin", content=reply_text, context_note=note)
    db.add(edin_message)
    db.commit()
    db.refresh(user_message)
    db.refresh(edin_message)
    return ChatMessageSendResponse(
        user_message=ChatMessageOut.model_validate(user_message),
        edin_message=ChatMessageOut.model_validate(edin_message),
        crisis_response=None,
        tool_calls=[ToolCallOut(**c) for c in tool_calls],
    )


# ---------------------------------------------------------------------------
# Edin's check-in (Practice Dojo)
# ---------------------------------------------------------------------------

# How long since real activity in each area before Edin calls it stale
# enough to nudge about. Different areas have different natural rhythms --
# dream journaling is meant to be near-daily, the Constitution is meant to
# be revisited occasionally, not daily.
_CHECKIN_STALE_AFTER_DAYS = {
    "dream_journal": 2,
    "follow_through": 4,
    "goals": 7,
    "constitution": 14,
}


@app.get("/edin/checkin", response_model=CheckInResponse)
def edin_checkin(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    """Real recency across the areas that actually have persisted,
    timestamped data -- deterministic, not an AI call, so this is free to
    show on every visit to the Practice Dojo with no quota cost and no
    wait. Biofeedback Lab and Microbiome aren't included here: neither is
    backed by a real table yet (see frontend/src/features/planned), so
    there's no honest "last visited" to report for them.
    """
    now = datetime.now(timezone.utc)

    latest_dream = (
        db.query(DreamJournalEntry).filter(DreamJournalEntry.user_id == user_id).order_by(DreamJournalEntry.created_at.desc()).first()
    )
    latest_follow_through = (
        db.query(FollowThroughLogEntry)
        .filter(FollowThroughLogEntry.user_id == user_id)
        .order_by(FollowThroughLogEntry.created_at.desc())
        .first()
    )
    # Goal.updated_at now actually bumps on edit (see app/models.py), so
    # ordering by it catches both a brand-new goal and a recent progress
    # update to an existing one -- whichever happened more recently.
    latest_goal = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.updated_at.desc()).first()
    latest_constitution = (
        db.query(GeniusConstitutionResult)
        .filter(GeniusConstitutionResult.user_id == user_id)
        .order_by(GeniusConstitutionResult.created_at.desc())
        .first()
    )

    areas = [
        ("dream_journal", "Dream Journal", latest_dream.created_at if latest_dream else None),
        ("follow_through", "Follow-Through Log", latest_follow_through.created_at if latest_follow_through else None),
        ("goals", "Goals & Calendar", latest_goal.updated_at if latest_goal else None),
        ("constitution", "Genius Constitution", latest_constitution.created_at if latest_constitution else None),
    ]

    suggestions = []
    for area, label, last_at in areas:
        stale_after_days = _CHECKIN_STALE_AFTER_DAYS[area]
        days_since = (now - last_at).days if last_at else None
        is_stale = days_since is None or days_since > stale_after_days
        suggestions.append(
            CheckInSuggestion(
                area=area,
                label=label,
                last_at=last_at,
                days_since=days_since,
                is_stale=is_stale,
                stale_after_days=stale_after_days,
            )
        )

    return CheckInResponse(suggestions=suggestions)


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


def _client_out(db: Session, client: Profile, coach_id: UUID) -> ClientOut:
    resolved = (
        db.query(FollowThroughLogEntry)
        .filter(FollowThroughLogEntry.user_id == client.id, FollowThroughLogEntry.status != "pending")
        .all()
    )
    rate = round(sum(1 for f in resolved if f.status == "did") / len(resolved) * 100) if resolved else None
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == client.membership_plan_id).first() if client.membership_plan_id else None
    return ClientOut(
        id=client.id,
        display_name=client.display_name,
        is_self=(client.id == coach_id),
        dream_entry_count=db.query(DreamJournalEntry).filter(DreamJournalEntry.user_id == client.id).count(),
        constitution_count=db.query(GeniusConstitutionResult).filter(GeniusConstitutionResult.user_id == client.id).count(),
        goal_count=db.query(Goal).filter(Goal.user_id == client.id).count(),
        follow_through_rate=rate,
        membership_plan_id=client.membership_plan_id,
        membership_plan=MembershipPlanOut.model_validate(plan) if plan else None,
        membership_active=client.membership_active,
        membership_note=client.membership_note,
    )


@app.get("/coach/status")
def coach_status(coach_id: UUID = Depends(get_current_coach_id)):
    """Lets the frontend probe whether the caller is a coach at all, to
    decide whether to show the dashboard nav item -- a 403 here means
    "hide it," not an error to surface to the user."""
    return {"is_coach": True}


@app.get("/coach/clients", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)):
    clients = db.query(Profile).order_by(Profile.created_at.asc()).all()
    return [_client_out(db, client, coach_id) for client in clients]


@app.patch("/coach/clients/{client_id}/membership", response_model=ClientOut)
def update_client_membership(
    client_id: UUID,
    payload: ClientMembershipUpdate,
    db: Session = Depends(get_db),
    coach_id: UUID = Depends(get_current_coach_id),
):
    """Manual membership/billing tracking -- Phase 1: payment happens
    outside the app for now (Zelle, wire, invoice), and the coach flips
    this by hand. Same columns a real Stripe webhook will write to
    automatically later, once that's built, without any schema change.
    """
    client = _client_or_404(db, client_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return _client_out(db, client, coach_id)


# ---------------------------------------------------------------------------
# Membership plan catalog -- real, editable plans instead of a retyped
# free-text label per client (see database/schema.sql's note on
# membership_plans). Coach-only, same access boundary as the rest of
# /coach/*.
# ---------------------------------------------------------------------------

@app.get("/coach/plans", response_model=list[MembershipPlanOut])
def list_plans(db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)):
    return db.query(MembershipPlan).order_by(MembershipPlan.created_at.asc()).all()


@app.post("/coach/plans", response_model=MembershipPlanOut, status_code=201)
def create_plan(
    payload: MembershipPlanCreate, db: Session = Depends(get_db), coach_id: UUID = Depends(get_current_coach_id)
):
    if db.query(MembershipPlan).filter(MembershipPlan.key == payload.key).first():
        raise HTTPException(status_code=409, detail=f"A plan with key '{payload.key}' already exists")
    plan = MembershipPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.patch("/coach/plans/{plan_id}", response_model=MembershipPlanOut)
def update_plan(
    plan_id: UUID,
    payload: MembershipPlanUpdate,
    db: Session = Depends(get_db),
    coach_id: UUID = Depends(get_current_coach_id),
):
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


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
