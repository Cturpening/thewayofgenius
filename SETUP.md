# Setting up Edin — step by step

This guide assumes no prior developer experience. It walks through creating
the free cloud database (Supabase), connecting the backend to it, and
running everything on your own computer.

The project has three parts:

- **`frontend/`** — the app itself (what a user sees and clicks), built with React.
- **`backend/`** — a small Python server (FastAPI) that will eventually be the
  only thing allowed to talk to the database directly.
- **`database/`** — the schema (table definitions) for a Postgres database
  hosted by Supabase.

Right now the frontend and backend are scaffolded but not yet wired
together — the frontend still uses its original in-memory demo data, and
the backend only proves it can reach the database. Connecting real user
data end-to-end is the next phase of work, not part of this setup.

---

## Step 1 — Create a Supabase account and project

[Supabase](https://supabase.com) gives you a free, hosted Postgres database
plus built-in user accounts (sign-up/login), so you don't have to run or
manage a database server yourself.

1. Go to https://supabase.com and click **Start your project**.
2. Sign up (GitHub login is the fastest option, but email works too).
3. Click **New project**.
   - **Name**: anything, e.g. `edin`.
   - **Database Password**: click "Generate a password" or make your own —
     **save this somewhere** (a password manager, a note). You'll need it
     in Step 3 and Supabase will not show it to you again.
   - **Region**: pick whichever is closest to you.
   - Click **Create new project**. It takes a minute or two to provision —
     that's normal, just wait for it.

---

## Step 2 — Create the database tables

Once the project is ready:

1. In the left sidebar, click the **SQL Editor** icon.
2. Click **New query**.
3. Open `database/schema.sql` from this repo, select everything, and copy it.
4. Paste it into the SQL Editor and click **Run** (bottom right).
5. You should see "Success. No rows returned." That means the tables were created.
6. To double-check: click **Table Editor** in the sidebar. You should see
   `profiles`, `dream_journal_entries`, `genius_constitution_results`,
   `follow_through_log`, and `flagged_events` listed.

If you ever need to re-run this (e.g. after editing `schema.sql`), be aware
the script will fail if a table already exists — that's a safety feature,
not a bug. Ask for help before dropping/recreating tables that might have
real data in them.

---

## Step 3 — Get your database connection string

1. In Supabase, go to **Project Settings** (gear icon) → **Database**.
2. Find **Connection string** and select the **URI** tab.
3. Choose **Session pooler** mode (this works better than "Direct
   connection" from most laptops/networks).
4. Copy the string shown. It looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-x.pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the database password you saved in Step 1.
6. Change the very start of the string from `postgresql://` to
   `postgresql+psycopg://` (the backend needs that prefix to know which
   Python database driver to use). The final string should look like:
   ```
   postgresql+psycopg://postgres.xxxxxxxxxxxx:your-actual-password@aws-0-xx-xxxx-x.pooler.supabase.com:5432/postgres
   ```

Keep this string handy for the next step. **Never commit it to git or share
it publicly** — it's effectively the password to your entire database.

---

## Step 4 — Run the backend

Requires [Python 3.11+](https://www.python.org/downloads/) installed.

```bash
cd backend
cp .env.example .env
```

Open the new `backend/.env` file in any text editor and paste your
connection string from Step 3 as the value of `DATABASE_URL`, e.g.:

```
DATABASE_URL=postgresql+psycopg://postgres.xxxxxxxxxxxx:your-actual-password@aws-0-xx-xxxx-x.pooler.supabase.com:5432/postgres
```

Then, still inside `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

You should see `Uvicorn running on http://127.0.0.1:8000`. Leave this
running, and in a browser visit:

- http://127.0.0.1:8000/health — should show `{"status":"ok"}` (the server is alive)
- http://127.0.0.1:8000/health/db — should show `{"status":"ok","database":"connected"}`
  (the server can reach your Supabase database)
- http://127.0.0.1:8000/docs — an interactive page listing the API's endpoints

If `/health/db` shows an error instead, see Troubleshooting below.

---

## Step 5 — Run the frontend

Requires [Node.js 18+](https://nodejs.org) installed. In a **new** terminal
window (leave the backend running in the first one):

```bash
cd frontend
npm install
npm run dev
```

Visit the URL it prints (usually http://localhost:5173) to see the app.

---

## Troubleshooting

**`/health/db` says "Database connection failed"**
- Double check `DATABASE_URL` in `backend/.env` — a common mistake is
  leaving `[YOUR-PASSWORD]` in the string instead of your real password.
- Make sure it starts with `postgresql+psycopg://`, not `postgresql://`.
- Make sure there are no extra spaces or quote marks around the value.

**"Password authentication failed"**
- Your database password has a typo, or you're using an old password from
  before resetting it. You can reset it in Supabase under Project Settings
  → Database → "Reset database password".

**`pip install` or `npm install` fails**
- Confirm you have Python 3.11+ (`python3 --version`) and Node 18+
  (`node --version`) installed.

**Port already in use**
- Something else on your machine is using port 8000 or 5173. Stop that
  process, or run the backend with `--port 8001` / frontend with
  `npm run dev -- --port 5174` instead.

---

## What's next (not built yet)

- The frontend doesn't call the backend yet — it still runs on the demo
  data baked into the React components. Wiring up real sign-up/login and
  real reads/writes to the database is future work.
- `flagged_events` exists as a table only. There's no code yet that
  detects a trigger phrase and writes a row — that's the safety-escalation
  feature mentioned in the schema, planned for later.
