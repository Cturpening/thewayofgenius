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
from datetime import datetime

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


def _name_line(user_name: str | None) -> str:
    """Shared prefix for every generate_* wrapper below -- Edin previously
    had no way to know who she was talking to at all, on any surface,
    since none of these call sites were ever given the user's own
    display_name (see app/models.py's Profile). Empty string when the
    user hasn't set one (display_name is optional), so nothing is invented."""
    return f"The user's name is {user_name}.\n\n" if user_name else ""


def generate_dream_reflection(
    entry_text: str,
    tags: list[str],
    confirmed_tags: list[str] | None = None,
    logged_at: datetime | None = None,
    user_name: str | None = None,
) -> str:
    """Edin's reflective note on a dream journal entry.

    `confirmed_tags` -- the subset of `tags` a coach has validated (see
    app/main.py's /coach/clients/{id}/symbol-validations and
    protocols/11_Coherence_Dream_Criteria_Tagging_Density.md's confirmation
    rule) -- are named explicitly as confirmed; everything else stays
    tentative, per that rule and the "Tags, symbols, parts, and archetypes"
    section of the system prompt. Only the coach-validation confirmation
    path is wired in yet, not self-ID or 5+ recurrence.

    `logged_at` -- when the entry was actually saved (UTC; the backend has
    no way to know the user's local time without the frontend sending its
    offset, which isn't wired up yet, so this is intentionally UTC, not a
    claim about local time of day). Real context for Edin regardless --
    day of week and roughly how long after waking an entry landed is
    genuine information, not decoration.
    """
    confirmed_tags = confirmed_tags or []
    tag_lines = []
    if tags:
        for tag in tags:
            status = "confirmed by a coach" if tag in confirmed_tags else "not yet confirmed"
            tag_lines.append(f"{tag} ({status})")
    logged_line = f"Logged: {logged_at.strftime('%A %I:%M %p UTC')}\n\n" if logged_at else ""
    return generate_reflection(
        f"{_name_line(user_name)}{logged_line}Dream journal entry:\n{entry_text}\n\n"
        f"Tags on this entry: {', '.join(tag_lines) if tag_lines else '(none)'}\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )


def generate_follow_through_reflection(
    intention: str, source: str, status: str, user_name: str | None = None
) -> str:
    """Edin's reflective note on a follow-through log entry -- did the
    user act on an intention, and what actually happened."""
    return generate_reflection(
        f"{_name_line(user_name)}Follow-through log entry. Source: {source}. Intention: {intention}. "
        f"Status: {status}.\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )


def generate_constitution_reflection(
    dominant_orientation: str, intention: str, user_name: str | None = None
) -> str:
    """Edin's reflective note on the intention a user set after completing
    (or revisiting) their Genius Constitution."""
    return generate_reflection(
        f"{_name_line(user_name)}Genius Constitution result. Dominant orientation: {dominant_orientation}. "
        f"The user's stated intention for where this goes next: {intention}\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )


def generate_chat_reply_with_tools(
    history: list[dict],
    context_summary: str,
    tool_declarations: list[dict],
    tool_executor,
    user_name: str | None = None,
) -> tuple[str, list[dict]]:
    """Like generate_chat_reply below, but gives Edin real tool-use for this
    one call -- backlog #27 ("give Edin real tool use"), Phase 1, scoped to
    app/neuron_tools.py's neuron-record actions. Returns (reply_text,
    calls_made) -- calls_made is every tool Edin actually invoked, so the
    caller (app/main.py's chat route) can log what she did, not just what
    she said.

    Only Gemini has a tool-calling implementation today (see
    ai_providers/gemini.py's generate_with_tools) -- Claude's provider here
    doesn't yet. If Gemini isn't configured or the call fails, this falls
    back to a plain, tool-less reply via generate_chat_reply rather than
    raising: Edin staying able to talk matters more than her being able to
    act on any one message.
    """
    system_prompt = load_system_prompt()
    transcript = "\n".join(f"{'User' if m['role'] == 'user' else 'Edin'}: {m['content']}" for m in history)
    user_content = (
        f"{_name_line(user_name)}Real context about this account right now: {context_summary}\n\n"
        f"Conversation so far:\n{transcript}\n\n"
        "Write Edin's next reply in this conversation, per your instructions. This is real "
        "back-and-forth dialogue, not a one-shot reflection. You have real tools available -- "
        "use them when the user is actually asking you to save or log something for the body-map "
        "node they currently have open, not speculatively."
    )

    if gemini.is_configured():
        try:
            text, calls_made = gemini.generate_with_tools(system_prompt, user_content, tool_declarations, tool_executor)
            if passes_language_line(text):
                return text, calls_made
            # Same one-retry-then-fallback contract as generate_reflection below,
            # but tools stay live on the retry too -- a corrected reply might
            # still need to act.
            retry_content = (
                f"{user_content}\n\nYour previous draft used clinical/diagnostic language, which "
                "you must never do. Rewrite it without naming any condition or using diagnostic "
                "language, describing the pattern in the data instead."
            )
            retry_text, more_calls = gemini.generate_with_tools(system_prompt, retry_content, tool_declarations, tool_executor)
            if passes_language_line(retry_text):
                return retry_text, calls_made + more_calls
        except ProviderError as exc:
            logger.warning("Gemini tool-use call failed, falling back to a plain reply: %s", exc)

    return generate_chat_reply(history, context_summary, user_name=user_name), []


def generate_chat_reply(history: list[dict], context_summary: str, user_name: str | None = None) -> str:
    """Edin's next reply in the real, persisted live chat -- the one
    surface where actual back-and-forth conversation happens, so the
    third technique from protocols/12_Ericksonian_Technique_Library.md
    (isomorphic/interspersal metaphor) is available here, unlike the
    one-shot reflection surfaces above, which explicitly reserve it.

    `history` -- ordered list of {"role": "user"|"edin", "content": str}
    turns, oldest first (see app/main.py's chat endpoint for how much
    history it actually sends). `context_summary` -- a short, real
    summary of the account's actual data (recent dreams, active goals,
    last follow-through) built in app/main.py's _chat_context_summary;
    not full tool use, just enough that Edin isn't blind to what's
    already in the account.
    """
    transcript = "\n".join(f"{'User' if m['role'] == 'user' else 'Edin'}: {m['content']}" for m in history)
    return generate_reflection(
        f"{_name_line(user_name)}Real context about this account right now: {context_summary}\n\n"
        f"Conversation so far:\n{transcript}\n\n"
        "Write Edin's next reply in this conversation, per your instructions. "
        "This is real back-and-forth dialogue, not a one-shot reflection."
    )
