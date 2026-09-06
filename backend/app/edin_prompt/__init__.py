"""Edin's system prompt, versioned. See CHANGELOG.md in this directory.

Each version is its own file, never edited in place once used -- the
same append-only discipline as the symbol dictionary described in
protocols/11_Coherence_Dream_Criteria_Tagging_Density.md. A generated
response should be logged against the version that produced it, so a
later prompt change never silently reinterprets an old response.
"""

from pathlib import Path

CURRENT_VERSION = "v2"

_PROMPT_DIR = Path(__file__).parent


def load_system_prompt(version: str = CURRENT_VERSION) -> str:
    path = _PROMPT_DIR / f"{version}.md"
    return path.read_text(encoding="utf-8")
