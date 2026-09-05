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
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Follow-through log
# ---------------------------------------------------------------------------

class FollowThroughCreate(BaseModel):
    source: Literal["dream", "lesson", "constitution", "coaching", "other"]
    intention: str


class FollowThroughUpdate(BaseModel):
    """All fields optional — intention, status, note, and emotional_shift can all be edited after creation."""

    intention: Optional[str] = None
    status: Optional[Literal["pending", "did", "partial", "didnt"]] = None
    note: Optional[str] = None
    emotional_shift: Optional[Literal["higher", "same", "lower"]] = None


class FollowThroughOut(BaseModel):
    id: UUID
    user_id: UUID
    source: str
    intention: str
    status: str
    note: Optional[str] = None
    emotional_shift: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowThroughResponse(BaseModel):
    entry: FollowThroughOut
    # Present only when Track B's crisis override fired on this save's
    # intention/note text. See protocols/03_Crisis_Escalation_Protocol.md.
    crisis_response: Optional[str] = None
