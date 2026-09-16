"""Tests for generate_with_tools' control flow (app/ai_providers/gemini.py)
-- the manual function-calling loop behind Edin's real tool-use (backlog
#27, Phase 1). Mocks the genai.Client entirely; no real network call.
"""

from types import SimpleNamespace

import pytest

from app.ai_providers import gemini
from app.ai_providers.base import ProviderError
from app.config import get_settings


def _clear_settings_cache():
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def configured_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "test-model")
    _clear_settings_cache()
    yield
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    _clear_settings_cache()


class _FakeCall:
    def __init__(self, name, args):
        self.name = name
        self.args = args


class _FakeResponse:
    def __init__(self, *, text=None, calls=None):
        self.text = text
        self.function_calls = calls or []
        # Only accessed when there are function_calls, matching the real
        # SDK's shape closely enough for this loop's purposes.
        self.candidates = [SimpleNamespace(content=SimpleNamespace(role="model", parts=[]))]


def _patch_client(monkeypatch, responses):
    calls_log = []

    class FakeModels:
        def generate_content(self, *, model, contents, config):
            calls_log.append((model, len(contents)))
            return responses.pop(0)

    class FakeClient:
        def __init__(self, api_key):
            self.models = FakeModels()

    monkeypatch.setattr(gemini.genai, "Client", FakeClient)
    return calls_log


TOOL_DECLARATIONS = [{"name": "do_thing", "description": "does a thing", "parameters": {"type": "object", "properties": {}}}]


def test_no_tool_call_returns_text_immediately(monkeypatch):
    _patch_client(monkeypatch, [_FakeResponse(text="just a reply")])
    text, calls_made = gemini.generate_with_tools("sys", "hi", TOOL_DECLARATIONS, tool_executor=lambda n, a: {})
    assert text == "just a reply"
    assert calls_made == []


def test_tool_call_is_executed_and_result_fed_back(monkeypatch):
    responses = [
        _FakeResponse(calls=[_FakeCall("do_thing", {"x": 1})]),
        _FakeResponse(text="done, here's the reply"),
    ]
    _patch_client(monkeypatch, responses)

    executed = []

    def executor(name, args):
        executed.append((name, args))
        return {"ok": True}

    text, calls_made = gemini.generate_with_tools("sys", "please do the thing", TOOL_DECLARATIONS, executor)
    assert text == "done, here's the reply"
    assert calls_made == [{"name": "do_thing", "args": {"x": 1}}]
    assert executed == [("do_thing", {"x": 1})]


def test_gives_up_after_max_rounds_of_tool_calls(monkeypatch):
    # The model keeps calling tools forever and never actually replies.
    responses = [_FakeResponse(calls=[_FakeCall("do_thing", {})]) for _ in range(5)]
    _patch_client(monkeypatch, responses)

    with pytest.raises(ProviderError):
        gemini.generate_with_tools("sys", "loop forever", TOOL_DECLARATIONS, lambda n, a: {}, max_rounds=3)


def test_raises_when_not_configured(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    _clear_settings_cache()
    with pytest.raises(ProviderError):
        gemini.generate_with_tools("sys", "hi", TOOL_DECLARATIONS, lambda n, a: {})
    _clear_settings_cache()
