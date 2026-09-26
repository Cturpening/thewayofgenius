"""Small, shared per-user lookups used when generating any of Edin's
reflections -- pulled out of app/main.py so the new tool modules
(app/dream_journal_tools.py, etc.) can reuse them without importing from
main.py itself (which would create a circular import, since main.py
imports those tool modules).

Also owns the real symbol-confirmation logic (Chelsey's Decoded_Meaning
spec) -- who confirmed a symbol's meaning, in what words, and whether it
counts as confirmed at all. See database/schema.sql's comments on
symbol_meanings/symbol_status for the full write-rule explanation.
"""

from collections import Counter, defaultdict
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import DreamJournalEntry, Profile, SymbolMeaning, SymbolStatus, SymbolValidation

RECURRENCE_THRESHOLD = 5

# A tag counts as coach_agreed/self/arrived_known's precedence over every
# other applicable path, in order -- Chelsey flagged this as a reasonable
# default she may want to change, not her stated rule. Change this one
# constant if she does; nothing else needs to move.
_PATH_PRECEDENCE = ("coach_agreed", "self", "arrived_known", "coach", "recurrence")

_VALID_MEANING_SOURCES = ("self", "arrived_known", "coach", "coach_agreed")

# Only these sources can ever become a tag's `is_current` meaning. A plain
# "coach" reading is stored for the coach to see, but never treated as the
# user's own settled meaning -- see database/schema.sql's comment on
# symbol_meanings for why.
_USER_OWNED_SOURCES = ("self", "arrived_known", "coach_agreed")


def display_name(db: Session, user_id: UUID) -> str | None:
    """The user's own display_name (Profile), if they've set one -- passed
    into every generate_* reflection call so Edin actually knows who she's
    talking to, on every surface."""
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    return profile.display_name if profile else None


def get_user_dream_tags(db: Session, user_id: UUID) -> list[list[str]]:
    """Every dream entry's tag list for this user, one list per entry --
    thin DB fetch, not unit tested (see tests/test_main.py's own note: no
    sqlite substitute for this project's Postgres-specific column types)."""
    rows = db.query(DreamJournalEntry.tags).filter(DreamJournalEntry.user_id == user_id).all()
    return [row.tags or [] for row in rows]


def _count_tag_occurrences(tag_lists: list[list[str]]) -> Counter:
    """Pure, unit-testable: how many distinct entries each tag appears in.
    Dedupes within a single entry first so a tag repeated twice in one
    entry's own tag list can't inflate its own recurrence count -- the
    protocol's "5+ entries" rule is about distinct occasions, not raw
    mentions. This is v1: literal tag-string matching. Chelsey's actual
    rule (the Fibonacci/thematic recurrence, protocols/11) is that the
    same underlying meaning can recur through DIFFERENT surface symbols --
    that's real, documented future work (a theme/group layer), not
    guessed at here."""
    counter = Counter()
    for tags in tag_lists:
        for tag in set(tags):
            counter[tag] += 1
    return counter


def record_symbol_meaning(
    db: Session,
    client_id: UUID,
    tag: str,
    meaning: str,
    source: str,
    confirmed_by: UUID,
    context_entry_id: UUID | None = None,
    change_kind: str | None = None,
    origin_sense: str | None = None,
    edin_note: str | None = None,
) -> SymbolMeaning:
    """The one write path for Decoded_Meaning -- append-only, never an
    update-in-place. A new user-owned meaning (self/arrived_known/
    coach_agreed) supersedes whatever was previously current for this tag,
    regardless of that previous row's own source, and the old row is kept,
    not deleted, linked via superseded_by. A plain coach reading never
    supersedes an existing user meaning; it only becomes current if there
    isn't one yet, so a coach's later reading can't quietly overwrite what
    the user already said it means to them.

    Raises ValueError on an empty meaning or an invalid/disallowed source
    -- callers (the chat tool, the coach route) are responsible for
    translating that into their own error shape."""
    if not meaning or not meaning.strip():
        raise ValueError("meaning cannot be empty")
    if source not in _VALID_MEANING_SOURCES:
        raise ValueError(f"invalid source: {source}")

    existing_current = (
        db.query(SymbolMeaning)
        .filter(SymbolMeaning.client_id == client_id, SymbolMeaning.tag == tag, SymbolMeaning.is_current.is_(True))
        .first()
    )

    if source in _USER_OWNED_SOURCES:
        is_current = True
    else:  # source == "coach"
        is_current = existing_current is None

    new_row = SymbolMeaning(
        client_id=client_id,
        tag=tag,
        meaning=meaning.strip(),
        source=source,
        confirmed_by=confirmed_by,
        is_current=is_current,
        change_kind=change_kind,
        context_entry_id=context_entry_id,
        origin_sense=origin_sense,
        edin_note=edin_note,
    )
    db.add(new_row)
    db.flush()  # assign new_row.id without committing, so superseded_by can reference it

    if source in _USER_OWNED_SOURCES and existing_current is not None:
        existing_current.is_current = False
        existing_current.superseded_by = new_row.id

    if source == "arrived_known":
        _mark_high_significance(db, client_id, tag)

    db.commit()
    db.refresh(new_row)
    return new_row


def _mark_high_significance(db: Session, client_id: UUID, tag: str) -> None:
    status = db.query(SymbolStatus).filter(SymbolStatus.client_id == client_id, SymbolStatus.tag == tag).first()
    if status is None:
        db.add(SymbolStatus(client_id=client_id, tag=tag, high_significance=True))
    else:
        status.high_significance = True


def symbol_confirmation_status(db: Session, client_id: UUID, tags: list[str]) -> dict[str, dict]:
    """Per-tag confirmation status across every real path: self-ID,
    arrived-already-known, coach validation (legacy symbol_validations
    table), coach-agreed, and 5+ recurrence. Returns, for each tag:

        confirmed            -- a current user-owned meaning exists, OR a
                                 legacy coach validation exists (so nothing
                                 already validated before this feature
                                 regresses)
        paths                -- every path that applies, most-significant
                                 first (see _PATH_PRECEDENCE)
        primary_path         -- the single highest-precedence path, or
                                 None -- for the dashboard's one-per-tag
                                 counting
        current_meaning      -- the user's own words, or None. A coach's
                                 reading is NEVER returned here even when
                                 it's technically the current row (that
                                 only happens when no user meaning exists
                                 yet) -- it is not the user's settled
                                 meaning and must never be surfaced as such
        meaning_history_count-- how many meanings have ever been logged
                                 for this tag (2+ means it's evolved)
        established          -- appeared in 5+ distinct dream entries.
                                 Proves the symbol matters -- never implies
                                 a meaning; the meaning still has to come
                                 from the user
        high_significance    -- arrived already known on first appearance
        resolved             -- the user has released this symbol
        divergence           -- a coach reading exists AND the current
                                 meaning is the user's own and differs from
                                 it -- real coaching signal, not an error;
                                 never surfaced in the user-facing reflection
    """
    if not tags:
        return {}
    unique_tags = list(dict.fromkeys(tags))

    all_meanings = (
        db.query(SymbolMeaning)
        .filter(SymbolMeaning.client_id == client_id, SymbolMeaning.tag.in_(unique_tags))
        .order_by(SymbolMeaning.created_at.asc())
        .all()
    )
    meanings_by_tag: dict[str, list[SymbolMeaning]] = defaultdict(list)
    for row in all_meanings:
        meanings_by_tag[row.tag].append(row)

    legacy_coach_tags = {
        row.tag
        for row in db.query(SymbolValidation.tag)
        .filter(SymbolValidation.client_id == client_id, SymbolValidation.tag.in_(unique_tags))
        .all()
    }

    status_by_tag = {
        row.tag: row
        for row in db.query(SymbolStatus)
        .filter(SymbolStatus.client_id == client_id, SymbolStatus.tag.in_(unique_tags))
        .all()
    }

    occurrence_counts = _count_tag_occurrences(get_user_dream_tags(db, client_id))

    result = {}
    for tag in unique_tags:
        rows = meanings_by_tag.get(tag, [])
        current = next((r for r in rows if r.is_current), None)
        # Divergence can only ever be detected against a source="coach"
        # symbol_meanings row -- legacy symbol_validations rows have no
        # meaning text at all, so there's nothing to compare there. This is
        # also exact-string comparison, not semantic: two readings that say
        # the same thing in different words will still show as "divergent."
        # That's an acceptable v1 simplification because divergence is only
        # ever a "worth a look" flag for the coach, never a hard gate on
        # anything -- a false positive here just means the coach glances at
        # two rows that already agree.
        has_coach_reading = any(r.source == "coach" for r in rows)
        established = occurrence_counts.get(tag, 0) >= RECURRENCE_THRESHOLD

        applicable = set()
        if current is not None and current.source in _USER_OWNED_SOURCES:
            applicable.add(current.source)
        if tag in legacy_coach_tags:
            applicable.add("coach")
        if established:
            applicable.add("recurrence")

        paths = [p for p in _PATH_PRECEDENCE if p in applicable]
        primary_path = paths[0] if paths else None

        status = status_by_tag.get(tag)
        current_is_user_owned = current is not None and current.source in _USER_OWNED_SOURCES

        result[tag] = {
            "confirmed": current_is_user_owned or tag in legacy_coach_tags,
            "paths": paths,
            "primary_path": primary_path,
            "current_meaning": current.meaning if current_is_user_owned else None,
            "meaning_history_count": len(rows),
            "established": established,
            "high_significance": bool(status and status.high_significance),
            "resolved": bool(status and status.resolved),
            "divergence": has_coach_reading and current_is_user_owned,
        }
    return result


def confirmed_tags(db: Session, client_id: UUID, tags: list[str]) -> list[str]:
    """Thin backward-compat wrapper over symbol_confirmation_status --
    returns which of `tags` are confirmed via ANY real path now, not just
    coach validation. Kept so nothing calling the old name breaks."""
    status = symbol_confirmation_status(db, client_id, tags)
    return [tag for tag, info in status.items() if info["confirmed"]]
