"""Tests for app/user_context.py's real symbol-confirmation logic
(Chelsey's Decoded_Meaning spec -- see database/schema.sql's comment on
symbol_meanings for the full write-rule explanation).

_count_tag_occurrences is pure Python with no DB dependency, so it's
tested thoroughly and directly here. The DB-level partial unique index
(one current row per client+tag) and the real query shapes' interaction
with actual Postgres-specific column types (UUID, timestamptz) still
need a real Postgres session and aren't faked with sqlite here, per this
project's own established convention (see tests/test_main.py's own
note) -- those are verified against the real database instead, per this
session's own manual end-to-end check (log a self-ID meaning in real
chat, confirm the row in Supabase's Table Editor, confirm a second
meaning for the same tag supersedes the first with superseded_by set).

record_symbol_meaning and symbol_confirmation_status themselves ARE
exercised below, though, using hand-built SymbolMeaning/SymbolStatus/
SymbolValidation instances (plain Python object construction -- no
engine, no sqlite dialect, nothing Postgres-specific involved) behind
minimal fake Session objects that route each db.query(...) call to a
preset list and ignore every .filter()/.order_by() condition, since the
test data is already scoped to exactly the client+tag under test. This
is the same style as tests/test_neuron_tools.py's _FakeQuery/_FakeDB.
"""

from app.models import DreamJournalEntry, SymbolMeaning, SymbolStatus, SymbolValidation
from app.user_context import _count_tag_occurrences, record_symbol_meaning, symbol_confirmation_status


def test_counts_across_distinct_entries():
    tag_lists = [["water"], ["water"], ["water"], ["water"], ["water"]]
    assert _count_tag_occurrences(tag_lists) == {"water": 5}


def test_dedupes_within_a_single_entry():
    # "water" appearing twice in one entry's own tag list should only
    # count once toward that entry's contribution -- the 5+ rule is about
    # distinct occasions, not raw mentions.
    tag_lists = [["water", "water"], ["water"]]
    assert _count_tag_occurrences(tag_lists) == {"water": 2}


def test_multiple_tags_counted_independently():
    tag_lists = [["water", "chair"], ["water"], ["chair"], ["chair"]]
    counts = _count_tag_occurrences(tag_lists)
    assert counts["water"] == 2
    assert counts["chair"] == 3


def test_empty_entries_list_is_empty():
    assert _count_tag_occurrences([]) == {}


def test_tag_below_threshold_is_not_established():
    # Mirrors symbol_confirmation_status's own threshold check, without
    # needing a DB -- a tag under RECURRENCE_THRESHOLD (5) never counts
    # as established.
    from app.user_context import RECURRENCE_THRESHOLD

    counts = _count_tag_occurrences([["water"]] * (RECURRENCE_THRESHOLD - 1))
    assert counts["water"] < RECURRENCE_THRESHOLD


class _ListQuery:
    def __init__(self, rows):
        self._rows = rows

    def filter(self, *a, **kw):
        return self

    def order_by(self, *a, **kw):
        return self

    def first(self):
        return self._rows[0] if self._rows else None

    def all(self):
        return list(self._rows)


class _FakeStatusDB:
    """Enough of a Session to run symbol_confirmation_status end-to-end
    against hand-built rows. Routes each db.query(...) call to a preset
    list by inspecting which mapped class the query targets (works the
    same whether it's a whole-model query or a single-column projection
    like SymbolValidation.tag, since InstrumentedAttribute.class_ gives
    the owning model either way) -- no engine, no sqlite involved."""

    def __init__(self, meanings=(), validations=(), statuses=(), dream_entries=()):
        self._meanings = list(meanings)
        self._validations = list(validations)
        self._statuses = list(statuses)
        self._dream_entries = list(dream_entries)

    def query(self, target):
        owner = getattr(target, "class_", target)
        if owner is SymbolMeaning:
            return _ListQuery(self._meanings)
        if owner is SymbolValidation:
            return _ListQuery(self._validations)
        if owner is SymbolStatus:
            return _ListQuery(self._statuses)
        if owner is DreamJournalEntry:
            return _ListQuery(self._dream_entries)
        raise AssertionError(f"unexpected query target in test: {target}")


def test_coach_reading_and_self_meaning_coexist_as_divergence():
    # A coach's own reading and the client's later, different self-ID for
    # the same tag must both stay on record -- neither overwrites the
    # other -- with the client's own meaning surfaced as current and the
    # coach's flagged only as "worth a look", never as an error.
    coach_row = SymbolMeaning(tag="water", source="coach", meaning="fear of change", is_current=False)
    self_row = SymbolMeaning(tag="water", source="self", meaning="renewal", is_current=True)
    db = _FakeStatusDB(meanings=[coach_row, self_row])

    status = symbol_confirmation_status(db, client_id="c1", tags=["water"])
    info = status["water"]

    assert info["confirmed"] is True
    assert info["current_meaning"] == "renewal"
    assert info["divergence"] is True
    # "coach" as a *path* is specifically the legacy symbol_validations
    # signal (see _PATH_PRECEDENCE) -- a source="coach" symbol_meanings
    # row contributes to divergence, not to paths, unless a legacy
    # validation row also exists for this tag.
    assert info["primary_path"] == "self"


def test_coach_only_reading_never_surfaces_as_current_meaning():
    # No user meaning at all yet -- a coach reading alone must never be
    # exposed as the user's own settled meaning, and confirmed stays False.
    coach_row = SymbolMeaning(tag="water", source="coach", meaning="fear of change", is_current=True)
    db = _FakeStatusDB(meanings=[coach_row])

    info = symbol_confirmation_status(db, client_id="c1", tags=["water"])["water"]

    assert info["current_meaning"] is None
    assert info["confirmed"] is False
    assert info["divergence"] is False


class _FakeWriteQuery:
    def filter(self, *a, **kw):
        return self

    def first(self):
        return None  # no existing current row -- every write starts fresh


class _FakeWriteDB:
    """Minimal Session for record_symbol_meaning: no existing rows ever
    match (see _FakeWriteQuery.first), so this only exercises the
    empty-meaning/invalid-source guards and the new row's own fields --
    exactly what the origin_sense tests below need, without needing a
    real supersession scenario."""

    def __init__(self):
        self.added = []
        self._next_id = 1

    def query(self, model):
        return _FakeWriteQuery()

    def add(self, obj):
        self.added.append(obj)

    def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = f"fake-id-{self._next_id}"
                self._next_id += 1

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_origin_sense_defaults_to_none_when_not_given():
    db = _FakeWriteDB()
    record = record_symbol_meaning(db, client_id="c1", tag="water", meaning="peace", source="self", confirmed_by="c1")
    assert record.origin_sense is None


def test_origin_sense_only_set_from_an_explicit_value():
    db = _FakeWriteDB()
    record = record_symbol_meaning(
        db, client_id="c1", tag="water", meaning="peace", source="self", confirmed_by="c1", origin_sense="arrived"
    )
    assert record.origin_sense == "arrived"
