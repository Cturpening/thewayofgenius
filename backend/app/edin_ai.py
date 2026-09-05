"""Gemini-backed generation for Edin's conversational responses.

Scope today: one use case only -- generating the "Edin note" on a dream
journal entry. See app/edin_prompt/ for the versioned system prompt this
runs on, and app/language_safety.py for the output-side check every
generated response goes through before it reaches a user.

This is never called for a Track B crisis event -- see
app/crisis_detection.py and protocols/03_Crisis_Escalation_Protocol.md.
That's a deterministic override, not something an LLM call should be
anywhere near.
"""

from google import genai
from google.genai import types

from app.config import get_settings
from app.edin_prompt import CURRENT_VERSION, load_system_prompt
from app.language_safety import passes_language_line

# A generic, safe fallback if Gemini's output fails the language-line
# check even after a retry. Never blocks the entry from saving -- this
# only affects the reflection text.
_FALLBACK_NOTE = "Logged. I'll look at this alongside the rest of your data."


class EdinAIError(RuntimeError):
    """Raised when Gemini isn't configured or the call itself fails."""


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.gemini_api_key and settings.gemini_model)


def generate_dream_reflection(entry_text: str, tags: list[str]) -> str:
    """Generates Edin's reflective note on a dream journal entry.

    Raises EdinAIError if Gemini isn't configured or the call fails --
    callers should catch this and fall back to whatever reflection
    they'd otherwise use (see app/main.py).
    """
    settings = get_settings()
    if not is_configured():
        raise EdinAIError("GEMINI_API_KEY / GEMINI_MODEL not configured")

    client = genai.Client(api_key=settings.gemini_api_key)
    system_prompt = load_system_prompt()
    user_content = (
        f"Dream journal entry:\n{entry_text}\n\n"
        f"Tags on this entry: {', '.join(tags) if tags else '(none)'}\n\n"
        "Write Edin's reflective note for this entry, per your instructions."
    )

    def _call() -> str:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=200,
                temperature=0.7,
            ),
        )
        text = (response.text or "").strip()
        if not text:
            raise EdinAIError("Gemini returned an empty response")
        return text

    try:
        note = _call()
    except EdinAIError:
        raise
    except Exception as exc:  # pragma: no cover -- network/SDK errors
        raise EdinAIError(f"Gemini call failed: {exc}") from exc

    if passes_language_line(note):
        return note

    # One retry with an explicit correction, per 04_DSM5_Jungian_Language_Line.md:
    # "A match forces a regeneration, not a silent pass-through."
    try:
        retry_content = (
            f"{user_content}\n\n"
            "Your previous draft used clinical/diagnostic language, which "
            "you must never do. Rewrite it without naming any condition or "
            "using diagnostic language, describing the pattern in the data "
            "instead."
        )
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=retry_content,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=200,
                temperature=0.5,
            ),
        )
        retry_note = (response.text or "").strip()
    except Exception:  # pragma: no cover -- network/SDK errors
        retry_note = ""

    if retry_note and passes_language_line(retry_note):
        return retry_note

    return _FALLBACK_NOTE
