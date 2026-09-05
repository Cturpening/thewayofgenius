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


def generate(system_prompt: str, user_content: str) -> str:
    settings = get_settings()
    if not is_configured():
        raise ProviderError("GEMINI_API_KEY / GEMINI_MODEL not configured")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=200,
                temperature=0.7,
            ),
        )
    except Exception as exc:  # pragma: no cover -- network/SDK errors
        raise ProviderError(f"Gemini call failed: {exc}") from exc

    text = (response.text or "").strip()
    if not text:
        raise ProviderError("Gemini returned an empty response")
    return text
