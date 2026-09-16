"""Tests for the constitution_tools.py executor's own routing --
the part that's safe to exercise with db=None.
"""

from app.constitution_tools import make_executor


def test_returns_none_for_tools_outside_its_domain():
    execute = make_executor(db=None, user_id=None)
    assert execute("create_goal", {}) is None
