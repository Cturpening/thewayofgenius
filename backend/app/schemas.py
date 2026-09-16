"""Pydantic request/response models for the API.

Real auth is wired up (see app/auth.py): user_id is never accepted from the
request body -- it's derived from the caller's verified Supabase session
token on every route, via `Depends(get_current_user_id)`. None of the
Create schemas below carry a user_id field on purpose.
"""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Dream journal
# ---------------------------------------------------------------------------

class DreamLine(BaseModel):
    text: str
    highlighted: bool = False


class DreamJournalEntryCreate(BaseModel):
    title: Optional[str] = None
    lines: List[DreamLine] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    # Generated client-side today (see frontend/src/features/dream-journal/dreamUtils.js)
    # as a fallback -- overwritten server-side by a real Gemini/Claude
    # reflection when Edin's AI layer is configured. See app/edin_ai.py.
    edin_note: Optional[str] = None


class DreamJournalEntryUpdate(BaseModel):
    """All fields optional — only what's present gets updated. Re-running
    Track B / the AI reflection on an edit is handled in the route, not here."""

    title: Optional[str] = None
    lines: Optional[List[DreamLine]] = None
    tags: Optional[List[str]] = None
    edin_note: Optional[str] = None


class DreamJournalEntryOut(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    lines: List[DreamLine]
    tags: List[str]
    edin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DreamJournalEntryResponse(BaseModel):
    entry: DreamJournalEntryOut
    # Present only when Track B's crisis override fired for this save.
    # See protocols/03_Crisis_Escalation_Protocol.md.
    crisis_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Genius Constitution results
# ---------------------------------------------------------------------------

class ConstitutionResultCreate(BaseModel):
    answers: List[str]
    shamanic_pct: int
    hermetic_pct: int
    stoic_pct: int
    dominant_orientation: Literal["shamanic", "hermetic", "stoic"]
    focus_answer: Optional[Literal["sleep", "creativity", "health", "identity"]] = None
    density_answer: Optional[Literal["full", "guided", "minimal"]] = None
    touch_answer: Optional[Literal["front", "background", "self"]] = None


class ConstitutionResultUpdate(BaseModel):
    """Only `intention` is editable after the fact — everything else is fixed at completion time."""

    intention: Optional[str] = None


class ConstitutionResultOut(BaseModel):
    id: UUID
    user_id: UUID
    answers: List[str]
    shamanic_pct: int
    hermetic_pct: int
    stoic_pct: int
    dominant_orientation: str
    focus_answer: Optional[str] = None
    density_answer: Optional[str] = None
    touch_answer: Optional[str] = None
    intention: Optional[str] = None
    # Generated once `intention` is set/edited -- see app/edin_ai.py's
    # generate_constitution_reflection. Null before then; nothing to
    # reflect on until the user has stated where this goes next.
    edin_note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConstitutionResultUpdateResponse(BaseModel):
    result: ConstitutionResultOut
    # Present only when Track B's crisis override fired on this save's
    # intention text. See protocols/03_Crisis_Escalation_Protocol.md.
    crisis_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Follow-through log
# ---------------------------------------------------------------------------

class FollowThroughCreate(BaseModel):
    source: Literal["dream", "lesson", "constitution", "coaching", "other"]
    intention: str
    # Optional -- ties this entry into a goal's own track record. Must
    # already belong to the caller; see app/main.py's ownership check.
    goal_id: Optional[UUID] = None


class FollowThroughUpdate(BaseModel):
    """All fields optional — intention, status, note, emotional_shift, and
    goal_id can all be edited after creation."""

    intention: Optional[str] = None
    status: Optional[Literal["pending", "did", "partial", "didnt"]] = None
    note: Optional[str] = None
    emotional_shift: Optional[Literal["higher", "same", "lower"]] = None
    goal_id: Optional[UUID] = None


class FollowThroughOut(BaseModel):
    id: UUID
    user_id: UUID
    goal_id: Optional[UUID] = None
    source: str
    intention: str
    status: str
    note: Optional[str] = None
    emotional_shift: Optional[str] = None
    # Generated once `status` moves past "pending" -- see app/edin_ai.py's
    # generate_follow_through_reflection. Null while still pending; there's
    # nothing to reflect on until something has actually happened.
    edin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowThroughResponse(BaseModel):
    entry: FollowThroughOut
    # Present only when Track B's crisis override fired on this save's
    # intention/note text. See protocols/03_Crisis_Escalation_Protocol.md.
    crisis_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Goals & Calendar
# ---------------------------------------------------------------------------

class GoalCreate(BaseModel):
    name: str
    modality: Literal["sleep", "biofeedback", "microbiome", "career", "other"]


class GoalUpdate(BaseModel):
    """Only name and progress are editable after creation -- modality is fixed at creation time."""

    name: Optional[str] = None
    progress: Optional[float] = Field(default=None, ge=0, le=1)


class GoalOut(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    modality: str
    progress: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GoalResponse(BaseModel):
    goal: GoalOut
    # Present only when Track B's crisis override fired on this save's name text.
    crisis_response: Optional[str] = None


class CalendarEventCreate(BaseModel):
    day: Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    label: str
    category: Literal["health", "goal", "incubation", "journal", "biofeedback", "other"]
    # Optional -- must already belong to the caller; see app/main.py's ownership check.
    goal_id: Optional[UUID] = None


class CalendarEventOut(BaseModel):
    id: UUID
    user_id: UUID
    goal_id: Optional[UUID] = None
    day: str
    label: str
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CalendarEventResponse(BaseModel):
    event: CalendarEventOut
    # Present only when Track B's crisis override fired on this save's label text.
    crisis_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Coach dashboard
#
# Single-coach model (see database/schema.sql's note on profiles.is_coach):
# any account can be a "client" here, including the coach's own -- there's
# no separate coach-client assignment table for this private-beta phase.
# ---------------------------------------------------------------------------

class MembershipPlanOut(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    key: str
    name: str
    price_cents: int
    billing_period: Literal["monthly", "annual", "one_time"]
    description: Optional[str] = None
    active: bool
    created_at: datetime


class MembershipPlanCreate(BaseModel):
    key: str
    name: str
    price_cents: int = Field(ge=0)
    billing_period: Literal["monthly", "annual", "one_time"]
    description: Optional[str] = None


class MembershipPlanUpdate(BaseModel):
    # All optional -- exclude_unset in the endpoint means only fields
    # actually sent get touched, same pattern as every other PATCH here.
    name: Optional[str] = None
    price_cents: Optional[int] = Field(default=None, ge=0)
    billing_period: Optional[Literal["monthly", "annual", "one_time"]] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class ClientOut(BaseModel):
    id: UUID
    display_name: Optional[str] = None
    is_self: bool  # true when this row is the coach's own account
    dream_entry_count: int
    constitution_count: int
    goal_count: int
    # None means nothing has moved past "pending" yet -- distinct from 0%.
    follow_through_rate: Optional[int] = None
    # Membership/billing status -- see database/schema.sql's note on these.
    # membership_plan is the embedded catalog row (None if unassigned),
    # not the deprecated free-text column of the same name on the model.
    membership_plan_id: Optional[UUID] = None
    membership_plan: Optional[MembershipPlanOut] = None
    membership_active: bool
    membership_note: Optional[str] = None


class ClientMembershipUpdate(BaseModel):
    # All optional -- combined with model_dump(exclude_unset=True) in the
    # endpoint, only the fields actually present in the request get
    # touched, same pattern as every other PATCH in this app. Send
    # membership_plan_id: null explicitly to unassign a plan.
    membership_plan_id: Optional[UUID] = None
    membership_active: Optional[bool] = None
    membership_note: Optional[str] = None


class CoachNoteCreate(BaseModel):
    note: str


class CoachNoteOut(BaseModel):
    id: UUID
    coach_id: UUID
    client_id: UUID
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SymbolValidationCreate(BaseModel):
    tag: str


class SymbolValidationOut(BaseModel):
    tag: str
    validated_by: UUID
    validated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Chat (Edin — Available Anywhere)
#
# Real, persisted conversation -- superseded the old scan-only endpoint,
# which only ran Track B against the (illustrative, client-side-only)
# chat's messages without ever actually generating or storing a real
# reply. See database/schema.sql's chat_messages table.
# ---------------------------------------------------------------------------

class ChatMessageOut(BaseModel):
    id: UUID
    role: Literal["user", "edin"]
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    text: str
    # The body-map node the user currently has open, if any (see
    # genius-profile/NeuronRecordEditor.jsx's node_key format) -- lets Edin's
    # real tool-use (app/neuron_tools.py, backlog #27 Phase 1) act on "this
    # node" without guessing which one that is. None for every chat message
    # that has nothing to do with the body map.
    node_key: Optional[str] = None


class ToolCallOut(BaseModel):
    name: str
    args: dict


class ChatMessageSendResponse(BaseModel):
    user_message: ChatMessageOut
    edin_message: ChatMessageOut
    # Present only when Track B's crisis override fired on this message
    # -- edin_message.content is the same text in that case, surfaced
    # separately too so the frontend can style it distinctly, same
    # contract as every other crisis_response in this app.
    crisis_response: Optional[str] = None
    # Every real tool Edin actually invoked while generating this reply --
    # empty unless node_key was set and she chose to act. Never invented:
    # this is the literal record from app/ai_providers/gemini.py's
    # generate_with_tools, not a guess at what she "probably" did.
    tool_calls: List[ToolCallOut] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Edin's check-in (Practice Dojo)
#
# Deterministic, not AI-generated -- real recency across the four areas
# that actually have timestamped, persisted data. Biofeedback Lab and
# Microbiome aren't included: neither one is backed by a real table yet
# (see frontend/src/features/planned), so there's no honest "last visited"
# to report for them.
# ---------------------------------------------------------------------------

class CheckInSuggestion(BaseModel):
    area: Literal["dream_journal", "goals", "follow_through", "constitution"]
    label: str
    last_at: Optional[datetime] = None
    days_since: Optional[int] = None
    is_stale: bool
    # How many days of inactivity this area's own natural rhythm tolerates
    # before it counts as stale -- sent so the frontend can rank multiple
    # stale areas by how overdue each is relative to its own cadence,
    # without needing its own copy of this app's threshold config.
    stale_after_days: int


class CheckInResponse(BaseModel):
    suggestions: List[CheckInSuggestion]


# ---------------------------------------------------------------------------
# Neuron records (Genius Profile -> Body / Hologram, deepest layer)
# ---------------------------------------------------------------------------

class NeuronRecordUpsert(BaseModel):
    """All fields optional -- a save from the content-box form only sends
    what that form actually shows. progress_state is here too so a user
    (or later, Edin) can explicitly mark a pathway 'wounded' -- the one
    state log-practice below never sets on its own."""

    story: Optional[str] = None
    skill: Optional[str] = None
    practice_goal: Optional[str] = None
    vitals_note: Optional[str] = None
    dream_content: Optional[str] = None
    progress_state: Optional[Literal["unformed", "practicing", "strengthened", "wounded"]] = None


class NeuronRecordOut(BaseModel):
    id: UUID
    user_id: UUID
    node_key: str
    story: Optional[str] = None
    skill: Optional[str] = None
    practice_goal: Optional[str] = None
    vitals_note: Optional[str] = None
    dream_content: Optional[str] = None
    progress_state: str
    practice_count: int
    last_practiced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
