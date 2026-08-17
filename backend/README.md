# Edin backend

A FastAPI service. Right now it only proves connectivity to the Supabase
Postgres database — no real endpoints for dream journal entries, Constitution
results, etc. exist yet. See the root [`SETUP.md`](../SETUP.md) for how to
get a database to connect to.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

- `GET /health` — liveness check, no database required.
- `GET /health/db` — readiness check; confirms the app can reach Supabase.
- `GET /docs` — interactive API docs (Swagger UI).

## Structure

```
app/
  main.py        FastAPI app + routes
  config.py       settings, read from .env
  database.py     SQLAlchemy engine/session setup
  models.py       ORM models mirroring database/schema.sql
```

`database/schema.sql` (in the repo root) is the source of truth for the
actual table structure — `app/models.py` mirrors it by hand. There's no
migration tool (like Alembic) wired up yet.
