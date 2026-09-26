"""Tests for dream_journal_tools.py's executor routing -- the parts safe
to exercise with db=None. See tests/test_user_context.py for why the real
confirm_symbol_meaning write path isn't unit tested here (needs a real
Postgres session)."""

from app.dream_journal_tools import make_executor


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
