"""Tests for the primary/backup provider selection logic in edin_ai.py.
Pure logic, no real API calls -- see README.md for how to verify an
actual live call once real keys are configured.
"""

from app import edin_ai
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


def test_coach_only_status_fields_never_reach_the_ai_provider(monkeypatch):
    # tag_status can carry coach-only signal (divergence, a coach's own
    # meaning text on a non-current row) that must never be surfaced to
    # the user -- generate_dream_reflection is only supposed to read
    # current_meaning/established off each tag's info dict. This proves
    # that even if a coach's reading text ends up somewhere in the info
    # dict (e.g. a future refactor adds a "coach_meaning" field), it still
    # never reaches the text actually sent to the AI provider.
    captured = {}

    def fake_generate_with_fallback(system_prompt, user_content):
        captured["user_content"] = user_content
        return "a fine reflection"

    monkeypatch.setattr(edin_ai, "_generate_with_fallback", fake_generate_with_fallback)

    tag_status = {
        "water": {
            "current_meaning": "renewal",
            "established": True,
            "divergence": True,
            "coach_meaning": "fear of change -- the coach's own reading, never the user's",
        }
    }
    generate_dream_reflection("dreamt of water again", ["water"], tag_status=tag_status)

    sent = captured["user_content"]
    assert "renewal" in sent
    assert "fear of change" not in sent
    assert "coach" not in sent.lower()
