# Edin backend

A FastAPI service, connected to Supabase Postgres. Dream journal entries
are the first real endpoint; everything else (Constitution results,
follow-through log, etc.) still doesn't have one yet. See the root
[`SETUP.md`](../SETUP.md) for how to get a database to connect to.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

- `GET /health` — liveness check, no database required.
- `GET /health/db` — readiness check; confirms the app can reach Supabase.
- `POST /journal-entries` — create a dream journal entry. Runs the text
  through Track B crisis detection first (see
  `../protocols/03_Crisis_Escalation_Protocol.md`) — a Tier 2/3 or
  harm-to-others match writes a `flagged_events` row and the response
  includes a `crisis_response` field with the fixed override message for
  the frontend to show. The entry is always saved either way.
- `GET /journal-entries?user_id=<uuid>` — list a user's entries.
- `GET /docs` — interactive API docs (Swagger UI).

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
tests/
  test_crisis_detection.py
```

`database/schema.sql` (in the repo root) is the source of truth for the
actual table structure — `app/models.py` mirrors it by hand. There's no
migration tool (like Alembic) wired up yet.
