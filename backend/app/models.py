"""SQLAlchemy models mirroring database/schema.sql.

database/schema.sql is the source of truth for the actual database
structure (run it in the Supabase SQL Editor). These models let the FastAPI
app read and write those same tables through the ORM. If you change one,
change the other to match — there's no migration tool wired up yet.
"""

import uuid

from sqlalchemy import ARRAY, Boolean, Column, Integer, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    display_name = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class DreamJournalEntry(Base):
    __tablename__ = "dream_journal_entries"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(Text, nullable=True)
    lines = Column(JSONB, nullable=False, default=list)
    tags = Column(ARRAY(Text), nullable=False, default=list)
    edin_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class GeniusConstitutionResult(Base):
    __tablename__ = "genius_constitution_results"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    answers = Column(JSONB, nullable=False, default=list)
    shamanic_pct = Column(Integer, nullable=False)
    hermetic_pct = Column(Integer, nullable=False)
    stoic_pct = Column(Integer, nullable=False)
    dominant_orientation = Column(Text, nullable=False)
    focus_answer = Column(Text, nullable=True)
    density_answer = Column(Text, nullable=True)
    touch_answer = Column(Text, nullable=True)
    intention = Column(Text, nullable=True)
    edin_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class FollowThroughLogEntry(Base):
    __tablename__ = "follow_through_log"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    source = Column(Text, nullable=False)
    intention = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending")
    note = Column(Text, nullable=True)
    emotional_shift = Column(Text, nullable=True)
    edin_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class FlaggedEvent(Base):
    """Safety-escalation log — see database/schema.sql and
    app/crisis_detection.py (Track B) for the full explanation. Written
    directly via this ORM model from app/main.py; this backend connects to
    Postgres directly (not through PostgREST), so RLS is not the
    enforcement boundary for this write path."""

    __tablename__ = "flagged_events"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    trigger_phrase_matched = Column(Text, nullable=False)
    timestamp = Column("timestamp", TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    reviewed = Column(Boolean, nullable=False, default=False)
    review_notes = Column(Text, nullable=True)
