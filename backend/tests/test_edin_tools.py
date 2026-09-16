"""Tests for the edin_tools.py aggregator -- the part that combines every
domain's tool declarations and chains their executors. Doesn't touch a
real database: every domain executor here early-returns None (or the
final "unknown tool" dict) without ever calling into db, since none of
these tool names match its own.
"""

from app import edin_tools


def test_all_tool_names_are_unique():
    names = [d["name"] for d in edin_tools.ALL_TOOL_DECLARATIONS]
    assert len(names) == len(set(names))


def test_every_declaration_has_the_gemini_shape():
    for decl in edin_tools.ALL_TOOL_DECLARATIONS:
        assert set(decl.keys()) >= {"name", "description", "parameters"}
        assert decl["parameters"]["type"] == "object"


def test_unrecognized_tool_name_falls_through_every_domain():
    execute = edin_tools.build_tool_executor(db=None, user_id=None, node_key=None)
    assert execute("not_a_real_tool", {}) == {"error": "Unknown tool: not_a_real_tool"}


def test_the_whole_toolbox_is_registered():
    # Locks the full tool roster so a future refactor that accidentally
    # drops a domain's import in edin_tools.py fails loudly here instead
    # of silently shrinking what Edin can do.
    names = {d["name"] for d in edin_tools.ALL_TOOL_DECLARATIONS}
    assert names == {
        "save_neuron_record",
        "log_neuron_practice",
        "get_current_node_record",
        "log_dream_journal_entry",
        "list_recent_dreams",
        "create_goal",
        "update_goal_progress",
        "list_goals",
        "log_follow_through",
        "update_follow_through_status",
        "list_open_follow_throughs",
        "add_calendar_event",
        "set_constitution_intention",
    }
