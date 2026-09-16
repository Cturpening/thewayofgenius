"""Tests for the pure helper functions in app/main.py that don't need a
database -- see backend/README.md for why DB-touching routes in this file
aren't unit-tested directly (no sqlite-compatible substitute for the
Postgres-specific column types the models use).
"""

from app.main import _describe_node_key


def test_describes_a_signal_node():
    assert _describe_node_key("body-signal:nervous__cns__2") == "nervous > cns > signal 3"


def test_describes_a_substructure_node():
    assert _describe_node_key("body-sub:nervous__cns") == "nervous > cns"


def test_describes_a_system_node():
    assert _describe_node_key("body-system:nervous") == "nervous"


def test_falls_back_to_the_raw_key_for_anything_unexpected():
    assert _describe_node_key("some-other-key") == "some-other-key"
