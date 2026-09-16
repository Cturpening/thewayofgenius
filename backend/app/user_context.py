"""Small, shared per-user lookups used when generating any of Edin's
reflections -- pulled out of app/main.py so the new tool modules
(app/dream_journal_tools.py, etc.) can reuse them without importing from
main.py itself (which would create a circular import, since main.py
imports those tool modules)."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Profile, SymbolValidation


def display_name(db: Session, user_id: UUID) -> str | None:
    """The user's own display_name (Profile), if they've set one -- passed
    into every generate_* reflection call so Edin actually knows who she's
    talking to, on every surface."""
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    return profile.display_name if profile else None


def confirmed_tags(db: Session, client_id: UUID, tags: list[str]) -> list[str]:
    """Which of `tags` a coach has validated for this user -- see
    app/models.py's SymbolValidation. Passed into generate_dream_reflection
    so Edin is told, per-tag, what's actually confirmed vs. still tentative
    (protocols/11_Coherence_Dream_Criteria_Tagging_Density.md)."""
    if not tags:
        return []
    rows = (
        db.query(SymbolValidation.tag)
        .filter(SymbolValidation.client_id == client_id, SymbolValidation.tag.in_(tags))
        .all()
    )
    return [row.tag for row in rows]
