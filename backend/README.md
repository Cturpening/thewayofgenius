# Edin backend

A FastAPI service, connected to Supabase Postgres. Dream journal entries
are the first real endpoint; everything else (Constitution results,
follow-through log, etc.) still doesn't have one yet. See the root
[`SETUP.md`](../SETUP.md) for how to get a database to connect to.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL, and GEMINI_API_KEY/GEMINI_MODEL if you want real reflections
uvicorn app.main:app --reload --port 8000
```

- `GET /health` — liveness check, no database required.
- `GET /health/db` — readiness check; confirms the app can reach Supabase.
- `GET /health/ai` — readiness check for Gemini; makes one real, tiny
  live call to confirm `GEMINI_API_KEY`/`GEMINI_MODEL` actually work
  right now, not just that they're set. This is the thing to check
  periodically (not on every page load — it's a real API call each
  time) so a deprecated or renamed model gets caught quickly instead of
  silently degrading real reflections to the canned fallback for a
  while before anyone notices. See "If a Gemini model gets deprecated"
  below.
- `POST /journal-entries` — create a dream journal entry. Runs the text
  through Track B crisis detection first (see
  `../protocols/03_Crisis_Escalation_Protocol.md`) — a Tier 2/3 or
  harm-to-others match writes a `flagged_events` row and the response
  includes a `crisis_response` field with the fixed override message for
  the frontend to show, and Gemini is never called for that entry. For a
  non-crisis entry, if `GEMINI_API_KEY`/`GEMINI_MODEL` are set, Edin's
  reflection (`edin_note`) is generated for real via Gemini instead of
  using whatever canned note the frontend sent — see "Edin's AI layer"
  below. The entry is always saved either way.
- `GET /journal-entries?user_id=<uuid>` — list a user's entries.
- `GET /docs` — interactive API docs (Swagger UI).

## Edin's AI layer

`app/edin_ai.py` calls Gemini to generate Edin's dream-journal
reflections, using the versioned system prompt in `app/edin_prompt/`
(see that directory's `CHANGELOG.md` for what's in the current version
and why). Two things worth knowing before touching this:

- **It's optional, not required.** With no `GEMINI_API_KEY`/`GEMINI_MODEL`
  set, or if the Gemini call fails for any reason, the entry still saves
  fine — it just keeps whatever reflection the frontend already sent
  instead of a generated one. A Gemini outage should never block
  journaling.
- **Every generated response is checked before it reaches a user.**
  `app/language_safety.py` scans Gemini's output against the banned-term
  list from `protocols/04_DSM5_Jungian_Language_Line.md` and forces one
  regeneration attempt if it fails, falling back to a generic safe note
  if it still fails. This hasn't been exercised against a real Gemini
  response yet in this environment (no API key here) — worth confirming
  live once you've got a key in `backend/.env`.

Get a free Gemini API key at https://aistudio.google.com/apikey, and
check https://ai.google.dev/gemini-api/docs/models for the current model
list before setting `GEMINI_MODEL` — that's deliberately not hardcoded
anywhere in the code, since model names change often enough that a
hardcoded default risks quietly pointing at a deprecated one.

### If a Gemini model gets deprecated

This does **not** take the app down. Journal entries still save, and
crisis detection (Track B) is completely unaffected — it's pure
pattern-matching code with zero Gemini dependency. The only thing that
degrades is Edin's reflections quietly reverting to the old canned note
instead of a real generated one, via the same fallback path used when
Gemini isn't configured at all.

Two things make this manageable rather than a surprise:

- **Google gives real advance notice.** A `-latest`-style alias swaps
  with only two weeks' email notice, but a named/pinned model (what
  `GEMINI_MODEL` should be set to — see the note above about not using
  `-latest`, it's less safe, not more) gets a much longer deprecation
  window, announced on https://ai.google.dev/gemini-api/docs/deprecations
  and emailed to the account that owns the API key. Make sure that's an
  inbox someone actually reads.
- **Check `GET /health/ai` periodically** (weekly is plenty) rather than
  waiting to notice a reflection "sounds off." A failing check means the
  fix is just picking a current model name from the models page and
  updating `GEMINI_MODEL` — not a rebuild.

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
  edin_ai.py           Gemini call for Edin's dream-journal reflections
  edin_prompt/         Versioned system prompt Edin runs on (see its CHANGELOG.md)
tests/
  test_crisis_detection.py
  test_language_safety.py
```

`database/schema.sql` (in the repo root) is the source of truth for the
actual table structure — `app/models.py` mirrors it by hand. There's no
migration tool (like Alembic) wired up yet.
