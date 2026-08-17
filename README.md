# Edin

Edin is a coaching / self-development app: a dream journal, a "Genius
Constitution" self-assessment, a follow-through log for tracking whether
intentions actually turn into action, and an AI coaching companion ("Edin")
tying it together.

This repo is structured as three pieces:

```
frontend/   React app (the product itself)
backend/    FastAPI server (Python) — currently just proves it can reach the database
database/   Supabase Postgres schema (SQL)
```

**New here and not a developer?** Start with [`SETUP.md`](./SETUP.md) — it
walks through creating a free Supabase account and getting everything
running on your computer, in plain English.

## Quick reference (once already set up)

```bash
# frontend
cd frontend && npm install && npm run dev

# backend
cd backend && python3 -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
```

See each folder's own README for more detail:
[`frontend/`](./frontend), [`backend/`](./backend), [`database/README.md`](./database/README.md).
