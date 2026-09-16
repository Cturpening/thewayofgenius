"""SQLAlchemy models mirroring database/schema.sql.

database/schema.sql is the source of truth for the actual database
structure (run it in the Supabase SQL Editor). These models let the FastAPI
app read and write those same tables through the ORM. If you change one,
change the other to match — there's no migration tool wired up yet.
"""

import uuid

from sqlalchemy import ARRAY, Boolean, Column, Integer, Numeric, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class MembershipPlan(Base):
    __tablename__ = "membership_plans"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    price_cents = Column(Integer, nullable=False, default=0)
    billing_period = Column(Text, nullable=False, default="monthly")
    description = Column(Text, nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    display_name = Column(Text, nullable=True)
    is_coach = Column(Boolean, nullable=False, default=False)
    # Membership/billing status -- see database/schema.sql's note on these
    # columns. Set by hand by the coach until real Stripe webhooks write
    # to them instead. membership_plan (free text) is superseded by
    # membership_plan_id, a real reference into membership_plans.
    membership_plan = Column(Text, nullable=True)
    membership_plan_id = Column(UUID(as_uuid=True), nullable=True)
    membership_active = Column(Boolean, nullable=False, default=False)
    membership_note = Column(Text, nullable=True)
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
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


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
    goal_id = Column(UUID(as_uuid=True), nullable=True)
    source = Column(Text, nullable=False)
    intention = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending")
    note = Column(Text, nullable=True)
    emotional_shift = Column(Text, nullable=True)
    edin_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(Text, nullable=False)
    modality = Column(Text, nullable=False)
    progress = Column(Numeric(3, 2), nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    goal_id = Column(UUID(as_uuid=True), nullable=True)
    day = Column(Text, nullable=False)
    label = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class CoachNote(Base):
    __tablename__ = "coach_notes"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coach_id = Column(UUID(as_uuid=True), nullable=False)
    client_id = Column(UUID(as_uuid=True), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class SymbolValidation(Base):
    __tablename__ = "symbol_validations"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), nullable=False)
    tag = Column(Text, nullable=False)
    validated_by = Column(UUID(as_uuid=True), nullable=False)
    validated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(Text, nullable=False)  # "user" | "edin"
    content = Column(Text, nullable=False)
    context_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class NeuronRecord(Base):
    """A user-filled node in the Genius Profile body map -- a real story,
    skill, practice goal, vitals note, and/or dream content attached to one
    node (a whole system, a substructure, or one signal/neuron). See
    database/schema.sql's comment on this table for node_key and
    progress_state."""

    __tablename__ = "neuron_records"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    node_key = Column(Text, nullable=False)
    story = Column(Text, nullable=True)
    skill = Column(Text, nullable=True)
    practice_goal = Column(Text, nullable=True)
    vitals_note = Column(Text, nullable=True)
    dream_content = Column(Text, nullable=True)
    progress_state = Column(Text, nullable=False, default="unformed")
    practice_count = Column(Integer, nullable=False, default=0)
    last_practiced_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


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
