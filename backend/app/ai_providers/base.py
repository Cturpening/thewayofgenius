"""Shared interface every AI provider implements.

Each provider module exposes:
- is_configured() -> bool
- generate(system_prompt: str, user_content: str) -> str  (raises ProviderError)

Keeping this interface tiny and identical across providers is what makes
the primary/backup switch in app/edin_ai.py a config change, not a
rewrite -- see that module for how providers get chosen and combined.
"""


class ProviderError(RuntimeError):
    """Raised by a provider when it isn't configured or a call fails."""
