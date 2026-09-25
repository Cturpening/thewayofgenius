"""Tests for app/neuron_tools.py. Most of the ORM logic needs a real
Postgres instance (no sqlite-compatible substitute since NeuronRecord
uses Postgres-specific column types) and is exercised through the
/neuron-records routes there instead -- but upsert_neuron_record's Track B
call is cheap to verify with a minimal fake db, and worth it: this exact
function shipped for a while with NO crisis-detection call at all (caught
by a security review, not by design), the one domain module that skipped
it while every sibling module ran it. These tests exist so that gap can't
silently reappear.
"""

from app import neuron_tools
from app.neuron_tools import make_tool_executor


def test_executor_refuses_to_act_with_no_open_node():
    execute = make_tool_executor(db=None, user_id=None, node_key=None)
    result = execute("save_neuron_record", {"story": "something"})
    assert "error" in result
    assert "no body-map node" in result["error"].lower()


def test_executor_returns_none_for_tools_outside_its_domain():
    # None (not an error) is the "not my tool" signal the aggregator in
    # app/edin_tools.py relies on to try the next domain's executor.
    execute = make_tool_executor(db=None, user_id=None, node_key="body-signal:nervous__cns__0")
    assert execute("create_goal", {"name": "x"}) is None


class _FakeQuery:
    def filter(self, *a, **kw):
        return self

    def first(self):
        return None  # always "no existing record" -- _get_or_create makes a fresh one


class _FakeDB:
    def __init__(self):
        self.added = []

    def query(self, model):
        return _FakeQuery()

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_upsert_neuron_record_runs_track_b_on_free_text(monkeypatch):
    calls = []

    def fake_run_track_b(db, user_id, text):
        calls.append(text)
        return "CRISIS OVERRIDE MESSAGE" if "trigger phrase" in text else None

    monkeypatch.setattr(neuron_tools, "run_track_b", fake_run_track_b)

    db = _FakeDB()
    record, crisis_response = neuron_tools.upsert_neuron_record(
        db, user_id="u1", node_key="body-signal:nervous__cns__0", story="contains a trigger phrase"
    )
    assert calls == ["contains a trigger phrase"]
    assert crisis_response == "CRISIS OVERRIDE MESSAGE"
    # The record still saves either way -- Track B never blocks a write,
    # same rule as every other domain.
    assert record.story == "contains a trigger phrase"


def test_upsert_neuron_record_checks_every_free_text_field_together(monkeypatch):
    seen = []
    monkeypatch.setattr(neuron_tools, "run_track_b", lambda db, user_id, text: seen.append(text) or None)

    db = _FakeDB()
    neuron_tools.upsert_neuron_record(
        db, user_id="u1", node_key="k", story="a", skill="b", vitals_note="c"
    )
    # All three free-text fields present get checked together, not skipped.
    assert seen == ["a b c"]


def test_upsert_neuron_record_skips_track_b_when_no_free_text(monkeypatch):
    calls = []
    monkeypatch.setattr(neuron_tools, "run_track_b", lambda db, user_id, text: calls.append(text))

    db = _FakeDB()
    neuron_tools.upsert_neuron_record(db, user_id="u1", node_key="k", progress_state="practicing")
    # progress_state isn't free text -- nothing to screen, so no call at all.
    assert calls == []
