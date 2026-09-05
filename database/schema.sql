-- Edin database schema
-- Target: Supabase Postgres
--
-- How to run this: paste the whole file into the Supabase SQL Editor
-- (Project -> SQL Editor -> New query) and click "Run". Safe to re-run
-- top to bottom on a fresh project; it will fail loudly (not silently
-- corrupt data) if a table already exists, which is what you want.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto"; -- gives us gen_random_uuid()

-- ---------------------------------------------------------------------------
-- User accounts
--
-- Supabase Auth already provides a built-in `auth.users` table that handles
-- sign-up, login, passwords, magic links, etc. You never write to that table
-- directly. Instead, every app-specific table (below) stores a `user_id`
-- that points at `auth.users.id`.
--
-- `profiles` is the one small extension table we add ourselves, for the
-- few pieces of profile info that aren't login credentials (display name,
-- when they joined). A trigger keeps it in sync automatically: the moment
-- someone signs up via Supabase Auth, a matching profiles row is created.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, new.raw_user_meta_data ->> 'display_name');
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Dream journal entries
--
-- Mirrors the Dream Journal feature in the app: a title, the entry written
-- as separate lines (so the UI can highlight individual lines), free-form
-- tags, and Edin's short reflection note on the entry.
-- ---------------------------------------------------------------------------

create table if not exists public.dream_journal_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text,
    lines jsonb not null default '[]'::jsonb, -- [{ "text": "...", "highlighted": false }, ...]
    tags text[] not null default '{}',
    edin_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists dream_journal_entries_user_id_idx
    on public.dream_journal_entries (user_id, created_at desc);

alter table public.dream_journal_entries enable row level security;

create policy "Users manage their own dream journal entries"
    on public.dream_journal_entries for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Genius Constitution results
--
-- One row per completed Constitution session (users can retake it, so this
-- is a log, not a single row per user). Stores the raw answers plus the
-- computed orientation breakdown, so the app never has to recompute
-- historical results differently than they were shown at the time.
-- ---------------------------------------------------------------------------

create table if not exists public.genius_constitution_results (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    answers jsonb not null default '[]'::jsonb, -- ordered raw answer values
    shamanic_pct integer not null check (shamanic_pct between 0 and 100),
    hermetic_pct integer not null check (hermetic_pct between 0 and 100),
    stoic_pct integer not null check (stoic_pct between 0 and 100),
    dominant_orientation text not null check (dominant_orientation in ('shamanic', 'hermetic', 'stoic')),
    focus_answer text check (focus_answer in ('sleep', 'creativity', 'health', 'identity')),
    density_answer text check (density_answer in ('full', 'guided', 'minimal')),
    touch_answer text check (touch_answer in ('front', 'background', 'self')),
    intention text,
    created_at timestamptz not null default now()
);

create index if not exists genius_constitution_results_user_id_idx
    on public.genius_constitution_results (user_id, created_at desc);

alter table public.genius_constitution_results enable row level security;

create policy "Users manage their own constitution results"
    on public.genius_constitution_results for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Follow-through log
--
-- Tracks whether a user actually acted on an intention that came out of a
-- dream, a lesson, a Constitution session, or a coaching session.
-- ---------------------------------------------------------------------------

create table if not exists public.follow_through_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    source text not null check (source in ('dream', 'lesson', 'constitution', 'coaching', 'other')),
    intention text not null,
    status text not null default 'pending' check (status in ('pending', 'did', 'partial', 'didnt')),
    note text,
    emotional_shift text check (emotional_shift in ('higher', 'same', 'lower')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists follow_through_log_user_id_idx
    on public.follow_through_log (user_id, created_at desc);

alter table public.follow_through_log enable row level security;

create policy "Users manage their own follow-through log"
    on public.follow_through_log for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Flagged events (safety escalation)
--
-- Detection/logging half of the safety-escalation feature (Track B): when
-- something a user writes crosses the hard-override threshold (explicit
-- self-harm/suicide ideation with intent, or harm-to-others intent), a row
-- gets logged here for review. See backend/app/crisis_detection.py and
-- protocols/03_Crisis_Escalation_Protocol.md for the tiering and the fixed
-- override message shown to the user when it fires. Wired into dream
-- journal entries and follow-through log notes/intentions.
--
-- Deliberately locked down harder than the other tables: end users should
-- never be able to read, edit, or delete their own flagged events through
-- the app. The backend (see backend/app/main.py) connects to Postgres
-- directly rather than through PostgREST, so it writes here with the
-- DATABASE_URL connection's own privileges regardless of RLS; only a
-- future staff/reviewer role should read it. RLS is enabled with NO
-- policies below, which means the anon/authenticated Supabase keys (e.g.
-- a direct frontend-to-Supabase call, now or in the future) get zero
-- access by default -- this is intentional, not an oversight.
-- ---------------------------------------------------------------------------

create table if not exists public.flagged_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    trigger_phrase_matched text not null,
    "timestamp" timestamptz not null default now(),
    reviewed boolean not null default false,
    review_notes text
);

create index if not exists flagged_events_user_id_idx
    on public.flagged_events (user_id, "timestamp" desc);

create index if not exists flagged_events_unreviewed_idx
    on public.flagged_events ("timestamp")
    where reviewed = false;

alter table public.flagged_events enable row level security;
-- No policies added on purpose -- see comment above.
