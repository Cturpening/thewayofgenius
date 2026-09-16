"""Tests for the calendar_tools.py executor's own validation -- the
parts that reject bad input before ever touching the database.
"""

from app.calendar_tools import make_executor


def test_rejects_invalid_day_without_touching_db():
    execute = make_executor(db=None, user_id=None)
    result = execute("add_calendar_event", {"day": "Someday", "label": "a thing"})
    assert "error" in result


def test_returns_none_for_tools_outside_its_domain():
    execute = make_executor(db=None, user_id=None)
    assert execute("create_goal", {}) is None
