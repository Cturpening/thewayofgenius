"""Tests for the primary/backup provider selection logic in edin_ai.py.
Pure logic, no real API calls -- see README.md for how to verify an
actual live call once real keys are configured.
"""

from app.config import get_settings
from app.edin_ai import EdinAIError, _primary_and_backup, generate_dream_reflection, is_configured


def _clear_settings_cache():
    get_settings.cache_clear()


def test_defaults_to_gemini_primary_claude_backup(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    _clear_settings_cache()
    primary, backup = _primary_and_backup()
    assert primary.__name__.endswith("gemini")
    assert backup.__name__.endswith("claude")
    _clear_settings_cache()


def test_ai_provider_claude_swaps_primary_and_backup(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "claude")
    _clear_settings_cache()
    primary, backup = _primary_and_backup()
    assert primary.__name__.endswith("claude")
    assert backup.__name__.endswith("gemini")
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    _clear_settings_cache()


def test_unconfigured_raises_edin_ai_error(monkeypatch):
    # Explicitly set to "" rather than delenv: an OS env var (even empty)
    # takes priority over a value loaded from a real backend/.env file, so
    # this stays correct for a dev machine with real keys configured, not
    # just a fresh clone with no .env at all.
    for var in ["GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"]:
        monkeypatch.setenv(var, "")
    _clear_settings_cache()
    assert is_configured() is False
    try:
        generate_dream_reflection("a test dream", ["test"])
        assert False, "should have raised EdinAIError"
    except EdinAIError:
        pass
    _clear_settings_cache()
