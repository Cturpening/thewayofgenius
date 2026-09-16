"""Edin's whole toolbox -- the single place app/main.py's chat route
reaches into for "what can she actually do." Each domain (neuron records,
dream journal, goals, follow-through, calendar, constitution) owns its
own real write logic and its own tool declarations in its own module;
this file only combines them, so adding a new tool later means writing
one new small domain module and adding two lines here, not touching the
chat route or the Gemini-calling loop at all.

Every domain executor follows the same contract: (name, args) -> dict on
a tool it recognizes, or None to mean "not mine, try the next one." A
name no domain recognizes is a real error (see ALL_TOOL_DECLARATIONS
below driving what Gemini is even allowed to call), not something that
should happen in practice.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app import calendar_tools, constitution_tools, dream_journal_tools, follow_through_tools, goal_tools, neuron_tools

ALL_TOOL_DECLARATIONS = [
    *neuron_tools.NEURON_TOOL_DECLARATIONS,
    *dream_journal_tools.TOOL_DECLARATIONS,
    *goal_tools.TOOL_DECLARATIONS,
    *follow_through_tools.TOOL_DECLARATIONS,
    *calendar_tools.TOOL_DECLARATIONS,
    *constitution_tools.TOOL_DECLARATIONS,
]


def build_tool_executor(db: Session, user_id: UUID, node_key: str | None):
    """node_key is only meaningful to neuron_tools (the body-map node
    currently open, if any) -- every other domain ignores it. Returns a
    single (name, args) -> dict callable for app/ai_providers/gemini.py's
    generate_with_tools to call."""
    executors = [
        neuron_tools.make_tool_executor(db, user_id, node_key),
        dream_journal_tools.make_executor(db, user_id),
        goal_tools.make_executor(db, user_id),
        follow_through_tools.make_executor(db, user_id),
        calendar_tools.make_executor(db, user_id),
        constitution_tools.make_executor(db, user_id),
    ]

    def execute(name: str, args: dict) -> dict:
        for domain_execute in executors:
            result = domain_execute(name, args)
            if result is not None:
                return result
        return {"error": f"Unknown tool: {name}"}

    return execute
