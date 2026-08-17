# Edin database

This folder holds the database schema as plain SQL, meant to be run against
a Supabase Postgres project. `schema.sql` is the single source of truth —
run it once in the Supabase SQL Editor and it creates everything below.

Full step-by-step setup instructions (including creating a Supabase account)
are in the repo root's `SETUP.md`.

## Tables

| Table | Purpose |
|---|---|
| `profiles` | App-specific extension of Supabase's built-in `auth.users` (display name, join date). Kept in sync automatically via a trigger. |
| `dream_journal_entries` | Dream Journal entries: title, lines of text, tags, Edin's reflection note. |
| `genius_constitution_results` | One row per completed Genius Constitution quiz: raw answers plus the computed orientation/focus/density/touch result. |
| `follow_through_log` | Whether a user acted on an intention (from a dream, lesson, Constitution session, or coaching). |
| `flagged_events` | Placeholder for the future safety-escalation feature. No detection logic exists yet — just the data shape (`trigger_phrase_matched`, `user_id`, `timestamp`, `reviewed`, `review_notes`), so it doesn't need to be retrofitted later. |

## Security notes

- Every table has **Row Level Security (RLS)** turned on. Without RLS,
  anyone with your project's public API key could read every user's data.
- `profiles`, `dream_journal_entries`, `genius_constitution_results`, and
  `follow_through_log` have policies letting a signed-in user read/write
  only *their own* rows.
- `flagged_events` intentionally has **no policies at all** — not even for
  the row's own user. Only the backend, using Supabase's `service_role` key
  (never exposed to the frontend), can write to it. Nobody can read it yet;
  that will change when the review feature is built.

## Making changes later

There's no migration tool wired up yet (like Alembic or the Supabase CLI's
migration system) — for now, `schema.sql` is edited directly and re-run
statements are added by hand for changes. If the schema grows a lot, it's
worth introducing the [Supabase CLI](https://supabase.com/docs/guides/cli)
migration workflow instead of hand-editing this file forever.
