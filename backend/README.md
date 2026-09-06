# Edin backend

A FastAPI service, connected to Supabase Postgres. Dream journal entries,
Genius Constitution results, and the follow-through log are all real,
persisted endpoints. See the root [`SETUP.md`](../SETUP.md) for how to
get a database to connect to.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL, and Gemini and/or Claude keys if you want real reflections
uvicorn app.main:app --reload --port 8000
```

- `GET /health` — liveness check, no database required.
- `GET /health/db` — readiness check; confirms the app can reach Supabase.
- `GET /health/ai` — readiness check for Edin's AI layer; makes one
  real, tiny live call through whichever provider is primary to confirm
  it actually works right now, not just that keys are set. This is the
  thing to check periodically (not on every page load — it's a real API
  call each time) so a deprecated or renamed model gets caught quickly
  instead of silently degrading real reflections to the canned fallback
  for a while before anyone notices. See "Edin's AI layer" below.
- `POST /journal-entries` — create a dream journal entry. Runs the text
  through Track B crisis detection first (see
  `../protocols/03_Crisis_Escalation_Protocol.md`) — a Tier 2/3 or
  harm-to-others match writes a `flagged_events` row and the response
  includes a `crisis_response` field with the fixed override message for
  the frontend to show, and no AI provider is called for that entry. For
  a non-crisis entry, if at least one provider is configured, Edin's
  reflection (`edin_note`) is generated for real instead of using
  whatever canned note the frontend sent — see "Edin's AI layer" below.
  The entry is always saved either way.
- `GET /journal-entries?user_id=<uuid>` — list a user's entries.
- `GET /docs` — interactive API docs (Swagger UI).

## Edin's AI layer

`app/edin_ai.py` generates Edin's reflections across all three surfaces
that call it — a dream journal entry's `edin_note`, a follow-through log
entry's `edin_note` once its status moves past "pending", and a Genius
Constitution result's `edin_note` once an `intention` is set — using the
versioned system prompt in `app/edin_prompt/` (see that directory's
`CHANGELOG.md` for what's in the current version and why). It supports
two providers — Gemini and Claude (the Anthropic API) — each in its own
module under `app/ai_providers/`, behind one shared interface.

**Primary/backup, not an either-or choice.** `AI_PROVIDER` in `.env`
picks which one is primary (`gemini` by default — it has a real free
tier, useful for an early private beta). Whichever provider isn't
primary is used as an automatic backup if it's configured too, so a
primary-provider outage or a deprecated model falls over to the other
provider instead of straight to the canned fallback. To move off Gemini
entirely later (e.g. once beta usage outgrows its free tier), set
`AI_PROVIDER=claude` — no code change needed, both provider modules
already exist.

Note: a Claude **API** key (console.anthropic.com) is a separate
account and billing relationship from a claude.ai chat subscription —
having one doesn't give you the other.

Three things worth knowing before touching this:

- **It's optional, not required.** With no provider configured at all,
  or if every configured provider's call fails, the entry still saves
  fine — it just keeps whatever reflection the frontend already sent
  instead of a generated one. An AI outage should never block journaling.
- **The AI itself holds no memory between calls, on either provider.**
  Every reflection is a fresh, one-shot call — system prompt + this
  entry's text in, one response out. All real memory (every entry, tag,
  pattern) lives in Supabase, not with Gemini or Claude. Switching
  `AI_PROVIDER`, or losing a provider to deprecation, loses zero user
  data for exactly this reason.
- **Every generated response is checked before it reaches a user**,
  regardless of which provider produced it. `app/language_safety.py`
  scans the output against the banned-term list from
  `protocols/04_DSM5_Jungian_Language_Line.md` and forces one
  regeneration attempt if it fails, falling back to a generic safe note
  if it still fails. This hasn't been exercised against a real model
  response yet in this environment (no API keys here) — worth confirming
  live once you've got keys in `backend/.env`.

Get a free Gemini API key at https://aistudio.google.com/apikey and
check https://ai.google.dev/gemini-api/docs/models for its current model
list. Get a Claude API key at https://console.anthropic.com and check
https://docs.anthropic.com/en/docs/about-claude/models for its current
model list. Neither `GEMINI_MODEL` nor `ANTHROPIC_MODEL` is hardcoded
anywhere in the code — model names change often enough on both sides
that a hardcoded default risks quietly pointing at a deprecated one.

### If a model gets deprecated

This does **not** take the app down, on either provider. Journal entries
still save, and crisis detection (Track B) is completely unaffected —
it's pure pattern-matching code with zero AI-provider dependency. If
only your primary provider's model gets deprecated and a backup is
configured, the backup just takes over automatically. If both are
affected (or only one provider is configured at all), Edin's
reflections quietly revert to the old canned note, via the same
fallback path used when nothing's configured.

Two things make this manageable rather than a surprise either way:

- **Both providers give real advance notice** for a named/pinned model
  (what `GEMINI_MODEL`/`ANTHROPIC_MODEL` should be set to — avoid a
  `-latest`-style alias, it's less safe, not more: it auto-swaps with
  only two weeks' email notice and fails with a confusing generic error
  instead of a clear one). Deprecation notices get emailed to the
  account that owns the API key — make sure that's an inbox someone
  actually reads, for both accounts if both are set up.
- **Check `GET /health/ai` periodically** (weekly is plenty) rather than
  waiting to notice a reflection "sounds off." A failing check means the
  fix is just picking a current model name from the relevant models page
  and updating the env var — not a rebuild.

## Running the tests

```bash
pytest
```

`tests/test_crisis_detection.py` covers the crisis-tier classifier —
pure logic, no database needed. It's the thing to run after editing the
phrase lists in `app/crisis_detection.py`. Testing the actual
`/journal-entries` endpoint end-to-end (real write to Supabase, checking
`flagged_events` for a real row) needs a configured `DATABASE_URL` and a
manual request — there's no integration-test setup against a live
Postgres yet.

## Structure

```
app/
  main.py             FastAPI app + routes
  config.py           settings, read from .env
  database.py         SQLAlchemy engine/session setup
  models.py           ORM models mirroring database/schema.sql
  schemas.py          Pydantic request/response models
  crisis_detection.py Track B crisis-language classifier (see protocols/03)
  language_safety.py  Output-side check against the language line (protocols/04)
  edin_ai.py           Orchestrates primary/backup AI providers for Edin's reflections
  ai_providers/         gemini.py and claude.py, one shared interface (base.py)
  edin_prompt/         Versioned system prompt Edin runs on (see its CHANGELOG.md)
tests/
  test_crisis_detection.py
  test_language_safety.py
  test_edin_ai.py
```

`database/schema.sql` (in the repo root) is the source of truth for the
actual table structure — `app/models.py` mirrors it by hand. There's no
migration tool (like Alembic) wired up yet.
