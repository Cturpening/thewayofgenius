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
