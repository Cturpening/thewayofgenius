# Deploying Edin — step by step

This is the "go live" version of `SETUP.md`. It assumes `SETUP.md` is
already done (real Supabase project, schema loaded, a Gemini key) and
walks through putting the app somewhere other than your own laptop, so
someone else can actually open a link and use it.

Two separate pieces get deployed, to two separate free/cheap services:

- **The backend** (the FastAPI server) → **Render** — chosen because it
  reads a config file already sitting in this repo (`backend/render.yaml`)
  and does the rest for you; no command-line deploy tooling to install.
- **The frontend** (the React app) → **Vercel** — chosen because it's
  built specifically for exactly this kind of app (Vite/React, no server
  needed) and deploying is close to "click connect, done."

Neither choice is locked in forever — moving either one later, or to a
paid tier once real usage shows up, doesn't require rewriting anything
here.

---

## The ordering problem, and why it's not actually a problem

The backend needs to know the frontend's real web address (to allow it
through CORS — see `backend/app/config.py`'s `ALLOWED_ORIGINS`). The
frontend needs to know the backend's real web address (`VITE_API_URL`) to
call it. Neither exists yet before you deploy the first one. That's fine —
deploy the backend first, note its URL, deploy the frontend pointed at
that URL, then come back and add the frontend's URL to the backend's
settings. Two short passes, not a deadlock.

---

## Step 1 — Deploy the backend to Render

1. Go to [render.com](https://render.com) and sign up (GitHub login is
   fastest).
2. Click **New** → **Blueprint**.
3. Connect this GitHub repo. Render will find `backend/render.yaml`
   automatically and show you the one service it describes
   (`edin-backend`).
4. Before clicking deploy, you'll be prompted to fill in the environment
   variables marked `sync: false` in that file — these are the same
   values from your `backend/.env` (see `SETUP.md`): `DATABASE_URL`,
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
   and (if you're using it) `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`. Leave
   `ALLOWED_ORIGINS` blank for now — that's Step 3.
5. Click **Apply** / **Deploy**. First deploy takes a few minutes.
6. Once it's live, Render gives you a URL like
   `https://edin-backend.onrender.com`. Open
   `https://edin-backend.onrender.com/health` in a browser — you should
   see a small JSON response, not an error page. That confirms the
   backend is actually running and can reach Supabase.
   - **Free tier note:** Render's free web services "spin down" after
     15 minutes of no traffic and take ~30-50 seconds to wake back up on
     the next request. Fine for early testing; worth upgrading to a paid
     instance (a few dollars/month) once real people are relying on it
     not feeling slow on the first request of the day.

---

## Step 2 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login is
   fastest).
2. Click **Add New** → **Project**, and import this same repo.
3. Vercel will ask for the project's **Root Directory** — set it to
   `frontend`. It should auto-detect the framework as Vite; leave the
   build command (`npm run build`) and output directory (`dist`) as
   whatever it suggests.
4. Before deploying, add these **Environment Variables** (Vercel's
   project settings, not a `.env` file — same three values as
   `frontend/.env` from `SETUP.md`):
   - `VITE_API_URL` — the Render URL from Step 1
     (`https://edin-backend.onrender.com`, no trailing slash).
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. You'll get a URL like
   `https://the-way-of-genius.vercel.app` (or a custom domain later,
   under Vercel's project settings, once you have one).

---

## Step 3 — Close the loop: tell the backend about the frontend

1. Back in Render, open the `edin-backend` service → **Environment**.
2. Set `ALLOWED_ORIGINS` to the real Vercel URL from Step 2, e.g.
   `https://the-way-of-genius.vercel.app` — comma-separate more than one
   if you later add a custom domain
   (`https://thewayofgenius.app,https://www.thewayofgenius.app`).
3. Save — Render redeploys automatically with the new setting.

---

## Step 4 — Actually check it works, end to end

Don't call this done until you've done this once, for real, in the
deployed version (not `localhost`):

1. Open the Vercel URL in a real browser.
2. Sign up for a brand-new account (use a real email you can check).
3. Log in, write a dream journal entry, confirm Edin's reflection comes
   back (a real Gemini call, not a canned note).
4. Open the chat and send a real message — confirm it replies and that a
   reload of the page still shows the conversation (real persistence, not
   just in-memory).

If any of those fail, the browser's DevTools console (F12 → Console tab)
and Render's own **Logs** tab for the backend are the two places to look
first — between them they show whether the problem is the frontend not
reaching the backend (CORS/`VITE_API_URL` mismatch) or the backend not
reaching Supabase/Gemini (`DATABASE_URL`/`GEMINI_API_KEY` mismatch).

---

## What this doesn't cover yet

- **Email confirmation and custom SMTP** (see the project's own open
  task list) — needed before strangers, not just you, are signing up.
  This is a Supabase Auth setting plus an SMTP provider, not something
  this file's deploy steps touch.
- **A custom domain** — both Render and Vercel support adding one under
  their own project settings; not required to go live, just to look
  like your own brand instead of a `.onrender.com`/`.vercel.app`
  address.
- **Local development is unaffected.** Everything in `SETUP.md` still
  works exactly the same on your own laptop after this — deploying
  doesn't replace running it locally, it adds a second, real, publicly
  reachable copy alongside it. And once live, shipping updates is just:
  push to `main`, both Render and Vercel redeploy automatically.
