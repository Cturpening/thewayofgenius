# Turning on real account emails — step by step

Right now, email confirmation on sign-up is switched off in Supabase (it
was turned off deliberately, early on, so testing accounts didn't need a
real inbox for every test run — see the project's own task list). Before
real strangers can sign up, two things need to happen: confirmation gets
turned back on, and a real email provider gets connected so those
confirmation emails actually arrive and don't land in spam. Supabase's
own built-in email sending is meant for testing only — very low volume,
easy to hit limits, easy to get marked as spam.

This uses [Resend](https://resend.com) as the email provider: a generous
free tier (3,000 emails/month), and it's one of the providers Supabase's
own docs point to directly. Nothing here locks you into it forever if you
outgrow it later.

---

## Step 1 — Create a Resend account and get SMTP credentials

1. Go to [resend.com](https://resend.com) and sign up.
2. **Add and verify a domain**, if you have one (Resend walks you through
   adding a couple of DNS records at whoever you bought the domain
   through — this is what lets emails actually say
   "noreply@thewayofgenius.app" instead of a generic Resend address, and
   is also what keeps them out of spam folders). If you don't have a
   domain yet, Resend also gives you a working `onboarding@resend.dev`
   sender for early testing — real, but branded as Resend, not you; swap
   it for your own domain once you have one, no other setup changes.
3. In Resend's dashboard, go to **SMTP** (sometimes under "API Keys" —
   Resend's SMTP credentials are generated the same way as API keys).
   Note down: **Host**, **Port**, **Username**, and the **Password**
   (this is really an API key, shown once — save it somewhere, same rule
   as the Supabase database password from `SETUP.md`).

---

## Step 2 — Connect it to Supabase

1. In your Supabase project dashboard, go to **Project Settings** →
   **Authentication** → **SMTP Settings** (the exact location has moved
   around in Supabase's UI before; search "SMTP" in the dashboard's
   search bar if this doesn't match what you see).
2. Turn on **Enable Custom SMTP**.
3. Fill in:
   - **Sender email** — the address you verified in Resend (or
     `onboarding@resend.dev` for now).
   - **Sender name** — e.g. "Edin" or "The Way of Genius".
   - **Host / Port / Username / Password** — from Step 1.
4. Save. Supabase usually offers a way to send a test email right there —
   use it, and confirm it actually lands in a real inbox (check spam too,
   the first time).

---

## Step 3 — Turn email confirmation back on

1. Still in Supabase, **Authentication** → **Providers** → **Email**.
2. Turn **Confirm email** back on (this is the setting that was
   deliberately switched off for testing — see the note at the top of
   this file).
3. Save.

---

## Step 4 — Check it for real

Don't consider this done until you've actually done this once:

1. On the real, deployed app (see `DEPLOY.md`) or locally, sign up with a
   real email address you can check.
2. Confirm you receive a real confirmation email (from your own domain,
   or `resend.dev` if that's what's set up), and that clicking it actually
   logs you in / lets you log in.
3. Try logging in *before* clicking the confirmation link — confirm the
   app correctly tells you to check your email rather than letting you in
   anyway. That's the actual point of turning this back on.

---

## What this doesn't cover

- **A custom domain for the app itself** — separate from the sending
  domain here, that's `DEPLOY.md`'s territory (Vercel/Render custom
  domains).
- **Password reset / magic link emails** — these ride the same SMTP
  connection once it's set up above, nothing extra to configure, but
  worth testing once for real the same way as Step 4.
