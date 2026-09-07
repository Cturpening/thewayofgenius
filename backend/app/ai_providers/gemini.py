"""Gemini provider. See ai_providers/base.py for the interface, and
edin_ai.py for how this gets chosen as primary or backup.
"""

from google import genai
from google.genai import types

from app.ai_providers.base import ProviderError
from app.config import get_settings


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.gemini_api_key and settings.gemini_model)


def _call(client, model: str, system_prompt: str, user_content: str, *, minimal_thinking: bool):
    config_kwargs = dict(
        system_instruction=system_prompt,
        # A "thinking" model (the current default on Gemini's flash tier)
        # spends part of its token budget reasoning before it ever writes
        # the visible answer -- 500 leaves real room for that on top of a
        # short 1-3 sentence reflective note, where 200 left nothing and
        # silently truncated to a few words. See GEMINI_MODEL note below.
        max_output_tokens=500,
        temperature=0.7,
    )
    if minimal_thinking:
        # Edin's notes don't need chain-of-thought reasoning -- MINIMAL
        # keeps latency/cost down on models that support this field at
        # all. Not every model does (and GEMINI_MODEL is deliberately
        # never hardcoded here, so this call site can't know in advance),
        # so the caller below falls back to a plain call if this raises.
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_level=types.ThinkingLevel.MINIMAL)
    return client.models.generate_content(
        model=model,
        contents=user_content,
        config=types.GenerateContentConfig(**config_kwargs),
    )


def generate(system_prompt: str, user_content: str) -> str:
    settings = get_settings()
    if not is_configured():
        raise ProviderError("GEMINI_API_KEY / GEMINI_MODEL not configured")

    client = genai.Client(api_key=settings.gemini_api_key)
    try:
        try:
            response = _call(client, settings.gemini_model, system_prompt, user_content, minimal_thinking=True)
        except Exception:
            response = _call(client, settings.gemini_model, system_prompt, user_content, minimal_thinking=False)
    except Exception as exc:  # pragma: no cover -- network/SDK errors
        raise ProviderError(f"Gemini call failed: {exc}") from exc

    text = (response.text or "").strip()
    if not text:
        raise ProviderError("Gemini returned an empty response")
    return text
