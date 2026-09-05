"""Claude (Anthropic API) provider. See ai_providers/base.py for the
interface, and edin_ai.py for how this gets chosen as primary or backup.

Note: this needs an Anthropic API key from console.anthropic.com, which
is a separate account/billing relationship from a claude.ai chat
subscription -- the two aren't the same product.
"""

import anthropic

from app.ai_providers.base import ProviderError
from app.config import get_settings


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.anthropic_api_key and settings.anthropic_model)


def generate(system_prompt: str, user_content: str) -> str:
    settings = get_settings()
    if not is_configured():
        raise ProviderError("ANTHROPIC_API_KEY / ANTHROPIC_MODEL not configured")

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=200,
            temperature=0.7,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
    except Exception as exc:  # pragma: no cover -- network/SDK errors
        raise ProviderError(f"Claude call failed: {exc}") from exc

    text = "".join(block.text for block in response.content if block.type == "text").strip()
    if not text:
        raise ProviderError("Claude returned an empty response")
    return text
