"""Tests for the follow_through_tools.py executor's own validation --
the parts that reject bad input before ever touching the database, so
they're safe to exercise with db=None.
"""

from app.follow_through_tools import make_executor


def test_rejects_invalid_status_without_touching_db():
    execute = make_executor(db=None, user_id=None)
    result = execute("update_follow_through_status", {"intention_query": "ship the thing", "status": "yolo"})
    assert "error" in result
    assert "yolo" in result["error"]


def test_returns_none_for_tools_outside_its_domain():
    execute = make_executor(db=None, user_id=None)
    assert execute("create_goal", {}) is None
