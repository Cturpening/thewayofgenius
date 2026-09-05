"""Pydantic request/response models for the API.

No auth is wired up yet (see SETUP.md), so user_id is passed directly in
the request body for now rather than derived from a session. That's a
temporary shape, not a design decision -- it goes away once real
sign-up/login exists.
"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DreamLine(BaseModel):
    text: str
    highlighted: bool = False


class DreamJournalEntryCreate(BaseModel):
    user_id: UUID
    title: Optional[str] = None
    lines: List[DreamLine] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class DreamJournalEntryOut(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    lines: List[DreamLine]
    tags: List[str]
    edin_note: Optional[str] = None

    model_config = {"from_attributes": True}


class DreamJournalEntryResponse(BaseModel):
    entry: DreamJournalEntryOut
    # Present only when Track B's crisis override fired for this entry.
    # See protocols/03_Crisis_Escalation_Protocol.md.
    crisis_response: Optional[str] = None
