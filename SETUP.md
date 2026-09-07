# Setting up Edin — step by step

This guide assumes no prior developer experience. It walks through creating
the free cloud database (Supabase), getting a Gemini API key so Edin's
reflections are real instead of canned, and running everything on your own
computer.

The project has three parts:

- **`frontend/`** — the app itself (what a user sees and clicks), built with React.
- **`backend/`** — a small Python server (FastAPI) that's the only thing
  allowed to talk to the database directly.
- **`database/`** — the schema (table definitions) for a Postgres database
  hosted by Supabase.

---

## Step 1 — Create a Supabase account and project

[Supabase](https://supabase.com) gives you a free, hosted Postgres database
plus built-in user accounts (sign-up/login), so you don't have to run or
manage a database server yourself. (The Free plan works for this setup
walkthrough; see `backend/README.md`'s "Coach dashboard" section and your
own notes on why Pro is worth it before a real client is on this.)

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
   `follow_through_log`, `goals`, `calendar_events`, `coach_notes`,
   `symbol_validations`, and `flagged_events` listed.

If you ever need to re-run this (e.g. after editing `schema.sql`), be aware
the script will fail if a table already exists — that's a safety feature,
not a bug. Ask for help before dropping/recreating tables that might have
real data in them.

---

## Step 3 — Get your Supabase connection details

You need three things from this one project, for two different `.env`
files (Step 5 and Step 6 below).

**3a. Database connection string** (backend only):

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

**3b. Project URL and anon key** (needed by *both* the backend and the
frontend — this is what actually lets someone log in):

1. In Supabase, go to **Project Settings** → **API**.
2. Copy the **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`).
3. Under **Project API keys**, copy the **anon** / **public** key — a long
   string starting with `eyJ...`. Do **not** use the `service_role` key
   anywhere in this app; it bypasses all access control.

Keep all three values handy. **Never commit them to git or share them
publicly** — the database connection string in particular is effectively
the password to your entire database.

---

## Step 4 — Get a Gemini API key

This is what makes Edin's reflections real instead of the canned
placeholder text. Separate account from Supabase, separate from Anthropic/
Claude too — a Google-specific credential.

1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key**. Free to start, with its own free usage tier.
3. Copy the key.
4. Pick a model name for `GEMINI_MODEL` — check
   https://ai.google.dev/gemini-api/docs/models for the current list and
   pick a "flash" tier model (a short reflective note doesn't need the
   largest model). This isn't hardcoded anywhere in the code on purpose,
   since model names get deprecated and replaced over time — whatever's
   current when you set this up is the right answer, not whatever's
   written here.

---

## Step 5 — Run the backend

Requires [Python 3.11+](https://www.python.org/downloads/) installed.

```bash
cd backend
cp .env.example .env
```

Open the new `backend/.env` file in any text editor and fill in, at minimum:

```
DATABASE_URL=<the connection string from Step 3a>
SUPABASE_URL=<the Project URL from Step 3b>
SUPABASE_ANON_KEY=<the anon key from Step 3b>
AI_PROVIDER=gemini
GEMINI_API_KEY=<the key from Step 4>
GEMINI_MODEL=<the model name you picked in Step 4>
```

(`ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` can stay blank — those are only
needed if you ever want Claude as a backup or primary provider instead of
Gemini.)

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
- http://127.0.0.1:8000/health/ai — should show `{"status":"ok","ai":"connected"}`
  (a real, live call to Gemini succeeded)
- http://127.0.0.1:8000/docs — an interactive page listing the API's endpoints

If any of these show an error instead, see Troubleshooting below.

---

## Step 6 — Run the frontend

Requires [Node.js 18+](https://nodejs.org) installed. In a **new** terminal
window (leave the backend running in the first one):

```bash
cd frontend
cp .env.example .env
```

Open the new `frontend/.env` and fill in:

```
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=<the same Project URL from Step 3b>
VITE_SUPABASE_ANON_KEY=<the same anon key from Step 3b>
```

Then:

```bash
npm install
npm run dev
```

Visit the URL it prints (usually http://localhost:5173) — you should land
on the real landing page, and "Get Started" drops into a real sign-up
form. Signing up creates a real Supabase Auth account and a matching
`profiles` row automatically.

---

## Step 7 — Make yourself a coach (optional)

If you want access to the coach dashboard (tracking/validating symbols
across client accounts — see `backend/README.md`'s "Coach dashboard"
section), find your own user id in Supabase (**Authentication** → **Users**
in the sidebar), then in the **SQL Editor**:

```sql
update public.profiles set is_coach = true where id = '<your-user-id>';
```

Log out and back in on the frontend afterward — a "🧭 Coach Dashboard"
button should appear next to your email in the top bar.

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

**`/health/ai` says "No AI provider is configured"**
- `GEMINI_API_KEY` or `GEMINI_MODEL` is blank in `backend/.env`.

**`/health/ai` says "AI provider call failed"**
- The Gemini key is wrong, or the model name in `GEMINI_MODEL` doesn't
  exist (deprecated/renamed) — check the current list at
  https://ai.google.dev/gemini-api/docs/models.

**Frontend shows "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set"**
- `frontend/.env` doesn't exist yet, or is missing those two values — see
  Step 6. Restart `npm run dev` after editing it; Vite only reads `.env`
  at startup.

**Sign-up says "check your email" and the email never arrives**
- Normal for a fresh Supabase project on the default email settings — see
  `backend/README.md` / ask about setting up custom SMTP before inviting
  real clients, so confirmation emails actually land reliably.

**`pip install` or `npm install` fails**
- Confirm you have Python 3.11+ (`python3 --version`) and Node 18+
  (`node --version`) installed.

**Port already in use**
- Something else on your machine is using port 8000 or 5173. Stop that
  process, or run the backend with `--port 8001` / frontend with
  `npm run dev -- --port 5174` instead.

---

## What's next

Once this is running locally against your real Supabase project and a
real Gemini key, the remaining step to make it live for anyone besides
you is deployment — putting the backend and frontend on real hosted URLs
instead of `127.0.0.1`. That's a separate step from this guide (ask
about it directly) since it involves a hosting provider account and a
few production-specific settings (`ALLOWED_ORIGINS` in particular — see
`backend/app/config.py`).

Not built yet, regardless of deployment: Track A of the Crisis Escalation
Protocol (the softer, pattern-recurrence-based referral prompt, as
opposed to Track B's hard override — see
`protocols/03_Crisis_Escalation_Protocol.md`) depends on a cross-modal
correlation engine that doesn't exist; and two of the three symbol-
confirmation paths from `protocols/11_Coherence_Dream_Criteria_Tagging_Density.md`
(self-identification, five-plus recurrence) — only coach validation is
real code so far (see the coach dashboard).
