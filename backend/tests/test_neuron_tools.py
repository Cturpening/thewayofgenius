"""Tests for the parts of app/neuron_tools.py that don't need a real
database -- the executor's guard rails. The actual upsert/log-practice
ORM logic is exercised through the /neuron-records routes against a real
Postgres instance (see backend/README.md); there's no sqlite-compatible
substitute since NeuronRecord uses Postgres-specific column types.
"""

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
