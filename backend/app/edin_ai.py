"""Generation for Edin's conversational responses, with a primary/backup
provider setup.

`AI_PROVIDER` (config) picks the primary -- "gemini" by default. Whichever
provider isn't primary is used as an automatic backup if it's configured,
so a primary-provider outage or model deprecation doesn't immediately
fall all the way back to the canned reflection. To switch primaries
entirely (e.g. moving off Gemini's free tier onto Claude later), change
`AI_PROVIDER` -- no code change needed.

See app/edin_prompt/ for the versioned system prompt this runs on, and
app/language_safety.py for the output-side check every generated
response goes through before it reaches a user.

This is never called for a Track B crisis event -- see
app/crisis_detection.py and protocols/03_Crisis_Escalation_Protocol.md.
That's a deterministic override, not something an LLM call should be
anywhere near.
"""

import logging

from app.ai_providers import claude, gemini
from app.ai_providers.base import ProviderError
from app.config import get_settings
from app.edin_prompt import load_system_prompt
from app.language_safety import passes_language_line

logger = logging.getLogger("edin")

# A generic, safe fallback if every provider fails, or Gemini's output
# fails the language-line check even after a retry. Never blocks the
# entry from saving -- this only affects the reflection text.
_FALLBACK_NOTE = "Logged. I'll look at this alongside the rest of your data."

_PROVIDERS = {"gemini": gemini, "claude": claude}


class EdinAIError(RuntimeError):
    """Raised when no configured provider is available or every call fails."""


def _primary_and_backup():
    settings = get_settings()
    primary_name = settings.ai_provider if settings.ai_provider in _PROVIDERS else "gemini"
    backup_name = "claude" if primary_name == "gemini" else "gemini"
    return _PROVIDERS[primary_name], _PROVIDERS[backup_name]


def is_configured() -> bool:
    primary, backup = _primary_and_backup()
    return primary.is_configured() or backup.is_configured()


def _generate_with_fallback(system_prompt: str, user_content: str) -> str:
    primary, backup = _primary_and_backup()

    if primary.is_configured():
        try:
            return primary.generate(system_prompt, user_content)
        except ProviderError as exc:
            logger.warning("Primary AI provider failed, trying backup: %s", exc)

    if backup.is_configured():
        try:
            return backup.generate(system_prompt, user_content)
        except ProviderError as exc:
            logger.warning("Backup AI provider also failed: %s", exc)

    raise EdinAIError("No configured AI provider produced a response")


def generate_reflection(user_content: str) -> str:
    """Generates one of Edin's short reflective notes from a fully-formed
    description of what's being reflected on (see the wrappers below for
    the three real call sites -- dream journal, follow-through, Genius
    Constitution). Shared retry/fallback/language-safety logic lives here
    so each wrapper only needs to build its own context text.

    Raises EdinAIError if no provider is configured or every call fails
    -- callers should catch this and fall back to whatever reflection
    they'd otherwise use (see app/main.py).
    """
    system_prompt = load_system_prompt()
    note = _generate_with_fallback(system_prompt, user_content)

    if passes_language_line(note):
        return note

    # One retry with an explicit correction, per 04_DSM5_Jungian_Language_Line.md:
    # "A match forces a regeneration, not a silent pass-through."
    retry_content = (
        f"{user_content}\n\n"
        "Your previous draft used clinical/diagnostic language, which "
        "you must never do. Rewrite it without naming any condition or "
        "using diagnostic language, describing the pattern in the data "
        "instead."
    )
    try:
        retry_note = _generate_with_fallback(system_prompt, retry_content)
    except EdinAIError:
        retry_note = ""

    if retry_note and passes_language_line(retry_note):
        return retry_note

    return _FALLBACK_NOTE


def generate_dream_reflection(entry_text: str, tags: list[str]) -> str:
    """Edin's reflective note on a dream journal entry."""
    return generate_reflection(
        f"Dream journal entry:\n{entry_text}\n\n"
        f"Tags on this entry: {', '.join(tags) if tags else '(none)'}\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )


def generate_follow_through_reflection(intention: str, source: str, status: str) -> str:
    """Edin's reflective note on a follow-through log entry -- did the
    user act on an intention, and what actually happened."""
    return generate_reflection(
        f"Follow-through log entry. Source: {source}. Intention: {intention}. "
        f"Status: {status}.\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )


def generate_constitution_reflection(dominant_orientation: str, intention: str) -> str:
    """Edin's reflective note on the intention a user set after completing
    (or revisiting) their Genius Constitution."""
    return generate_reflection(
        f"Genius Constitution result. Dominant orientation: {dominant_orientation}. "
        f"The user's stated intention for where this goes next: {intention}\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )
