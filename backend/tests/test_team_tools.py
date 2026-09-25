"""Tests for the team_tools.py executor's own routing/validation --
the parts safe to exercise with db=None.
"""

from app.schemas import TeamMemberCreate
from app.team_tools import make_executor


def test_returns_none_for_tools_outside_its_domain():
    execute = make_executor(db=None, user_id=None)
    assert execute("create_goal", {}) is None


def test_create_payload_does_not_require_a_color():
    # Regression guard: frontend/src/features/genius-profile/GeniusProfileHub.jsx's
    # addTeamMember never sends a color (create_member's own palette
    # rotation picks one server-side) -- this schema must accept that
    # real request shape, not 422 on it.
    payload = TeamMemberCreate(name="The Spark", mode="front", role="Starts things")
    assert payload.color is None
