"""Gemini provider. See ai_providers/base.py for the interface, and
edin_ai.py for how this gets chosen as primary or backup.
"""

import time

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
    # Gemini's flash-tier models occasionally return a transient 503
    # ("model is currently experiencing high demand") that clears within a
    # couple seconds -- without a retry here, one bad moment permanently
    # falls back to the generic canned note for that entry, which reads as
    # Edin being dumb rather than as what it actually was: a dropped call.
    attempts = 3
    for attempt in range(attempts):
        try:
            try:
                response = _call(client, settings.gemini_model, system_prompt, user_content, minimal_thinking=True)
            except Exception:
                response = _call(client, settings.gemini_model, system_prompt, user_content, minimal_thinking=False)
            break
        except Exception as exc:  # pragma: no cover -- network/SDK errors
            if attempt == attempts - 1:
                raise ProviderError(f"Gemini call failed: {exc}") from exc
            time.sleep(1.5 * (attempt + 1))

    text = (response.text or "").strip()
    if not text:
        raise ProviderError("Gemini returned an empty response")
    return text


def _declaration_to_function_declaration(decl: dict) -> "types.FunctionDeclaration":
    return types.FunctionDeclaration(name=decl["name"], description=decl["description"], parameters=decl["parameters"])


def generate_with_tools(
    system_prompt: str,
    user_content: str,
    tool_declarations: list[dict],
    tool_executor,
    *,
    max_rounds: int = 4,
) -> tuple[str, list[dict]]:
    """Like generate(), but lets the model call real functions mid-reply --
    the actual mechanism behind "Edin can edit this conversationally" (see
    app/neuron_tools.py and app/edin_ai.py's generate_chat_reply_with_tools).

    tool_declarations: Gemini function-calling schema, [{"name", "description",
    "parameters"}, ...] -- JSON-Schema-shaped `parameters`, same shape
    app/neuron_tools.py's NEURON_TOOL_DECLARATIONS already uses.
    tool_executor: (name: str, args: dict) -> dict, called for real for every
    function call the model makes -- see app/neuron_tools.py's
    make_tool_executor for the one real implementation today.

    Returns (final_text, calls_made) -- calls_made is every {"name", "args"}
    the model actually invoked, in order, so the caller can log what Edin
    did into chat_messages.context_note rather than that being invisible.
    Tool use isn't retried against the backup provider on failure (see
    edin_ai.py) -- Claude's provider here has no matching implementation
    yet, so a Gemini outage falls back to a plain, tool-less reply instead
    of silently losing the ability to act.
    """
    settings = get_settings()
    if not is_configured():
        raise ProviderError("GEMINI_API_KEY / GEMINI_MODEL not configured")

    client = genai.Client(api_key=settings.gemini_api_key)
    tool = types.Tool(function_declarations=[_declaration_to_function_declaration(d) for d in tool_declarations])

    def build_config(*, minimal_thinking: bool) -> types.GenerateContentConfig:
        kwargs = dict(
            system_instruction=system_prompt,
            # Higher than generate()'s 500 -- with tools attached, the model
            # spends part of its budget reasoning about whether/which tool
            # to call before it ever writes the visible reply, on top of
            # that reply itself. Without minimal_thinking below this was
            # silently truncating mid-sentence on real live-tested replies.
            max_output_tokens=800,
            temperature=0.7,
            tools=[tool],
        )
        if minimal_thinking:
            kwargs["thinking_config"] = types.ThinkingConfig(thinking_level=types.ThinkingLevel.MINIMAL)
        return types.GenerateContentConfig(**kwargs)

    contents = [types.Content(role="user", parts=[types.Part(text=user_content)])]
    calls_made: list[dict] = []
    # Discovered on the first real call below, then reused for every
    # subsequent round -- same "try MINIMAL, fall back if the model
    # doesn't support the field" contract as generate() above, but without
    # wasting a whole extra round-trip just to probe for it.
    minimal_thinking = True

    for _ in range(max_rounds):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model, contents=contents, config=build_config(minimal_thinking=minimal_thinking)
            )
        except Exception as exc:
            if minimal_thinking:
                # This model doesn't support thinking_config -- retry this
                # same round without it, and stop trying it on later rounds.
                minimal_thinking = False
                try:
                    response = client.models.generate_content(
                        model=settings.gemini_model, contents=contents, config=build_config(minimal_thinking=False)
                    )
                except Exception as retry_exc:  # pragma: no cover -- network/SDK errors
                    raise ProviderError(f"Gemini call failed: {retry_exc}") from retry_exc
            else:
                raise ProviderError(f"Gemini call failed: {exc}") from exc  # pragma: no cover -- network/SDK errors

        calls = response.function_calls or []
        if not calls:
            text = (response.text or "").strip()
            if not text:
                raise ProviderError("Gemini returned an empty response")
            return text, calls_made

        # The model wants to act before it finishes replying: keep its own
        # turn (the function-call parts) in the transcript, actually run
        # each tool, and feed the real result back before asking again.
        contents.append(response.candidates[0].content)
        response_parts = []
        for call in calls:
            args = dict(call.args or {})
            result = tool_executor(call.name, args)
            calls_made.append({"name": call.name, "args": args})
            response_parts.append(types.Part.from_function_response(name=call.name, response=result))
        contents.append(types.Content(role="user", parts=response_parts))

    raise ProviderError("Gemini kept calling tools without ever finishing a reply")
