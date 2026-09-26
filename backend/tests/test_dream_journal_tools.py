"""Tests for dream_journal_tools.py's executor routing -- the parts safe
to exercise with db=None or a minimal fake. See tests/test_user_context.py
for why record_symbol_meaning's real supersession behavior isn't unit
tested here (needs a real Postgres session)."""

from app.dream_journal_tools import make_executor
from app.models import SymbolMeaning


def test_returns_none_for_tools_outside_its_domain():
    execute = make_executor(db=None, user_id=None)
    assert execute("create_goal", {}) is None


def test_confirm_symbol_meaning_rejects_coach_source():
    # The chat tool must never be used to record a coach's own reading --
    # that path is coach-dashboard-only (see app/main.py's
    # coach_validate_symbol). No DB access needed to catch this: it's
    # rejected before any query runs.
    execute = make_executor(db=None, user_id=None)
    result = execute("confirm_symbol_meaning", {"tag": "water", "meaning": "transition", "source": "coach"})
    assert "error" in result


class _NoRowsQuery:
    def filter(self, *a, **kw):
        return self

    def order_by(self, *a, **kw):
        return self

    def first(self):
        return None  # no coach reading exists for this client+tag


class _NoRowsDB:
    def query(self, model):
        return _NoRowsQuery()


def test_confirm_symbol_meaning_rejects_coach_agreed_with_no_prior_coach_reading():
    # coach_agreed can only ever promote an EXISTING coach reading -- with
    # none on record, a bare self-identification can't slip in under this
    # label, so this must be rejected before record_symbol_meaning is ever
    # called (there's nothing to look up an id for).
    execute = make_executor(db=_NoRowsDB(), user_id="u1")
    result = execute("confirm_symbol_meaning", {"tag": "water", "meaning": "renewal", "source": "coach_agreed"})
    assert "error" in result
    assert "coach" in result["error"].lower()


class _OneCoachReadingQuery:
    def __init__(self, row):
        self._row = row

    def filter(self, *a, **kw):
        return self

    def order_by(self, *a, **kw):
        return self

    def first(self):
        return self._row


class _OneCoachReadingDB:
    """Just enough of a Session for the coach_agreed happy path. Two
    separate SymbolMeaning queries happen in sequence for this one call --
    the executor's own lookup for an existing coach reading (must find
    coach_row), then record_symbol_meaning's existing_current lookup
    (must find nothing, since a coach reading is never `is_current` once
    a user-owned meaning exists) -- so this counts calls rather than
    matching on model alone, since both queries target SymbolMeaning."""

    def __init__(self, coach_row):
        self._coach_row = coach_row
        self._symbol_meaning_calls = 0
        self.added = []
        self._next_id = 1

    def query(self, model):
        if model is SymbolMeaning:
            self._symbol_meaning_calls += 1
            row = self._coach_row if self._symbol_meaning_calls == 1 else None
            return _OneCoachReadingQuery(row)
        return _OneCoachReadingQuery(None)

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


def test_confirm_symbol_meaning_accepts_coach_agreed_when_a_coach_reading_exists():
    coach_row = SymbolMeaning(id="coach-row-1", tag="water", source="coach", meaning="fear of change")
    execute = make_executor(db=_OneCoachReadingDB(coach_row), user_id="u1")
    result = execute("confirm_symbol_meaning", {"tag": "water", "meaning": "renewal", "source": "coach_agreed"})
    assert result.get("saved") is True
    assert result["source"] == "coach_agreed"
