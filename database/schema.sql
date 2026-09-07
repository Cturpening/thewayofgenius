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
    -- Single-coach model for now, matching a private beta with one coach
    -- (Chelsey) directly overseeing every account: no separate coach-client
    -- assignment table, just "is this account allowed to see across
    -- others." Set by hand in the Supabase SQL editor (there's no admin UI
    -- for this yet, deliberately -- see backend/README.md's coach-dashboard
    -- section). Revisit if this ever needs more than one coach.
    is_coach boolean not null default false,
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
    edin_note text, -- Edin's reflection on the dominant orientation + intention, once intention is set
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
-- Goals
--
-- `modality` is a real constrained type, not the decorative free-text label
-- the prototype UI used before this table existed -- it names which lane of
-- the app actually feeds progress on this goal (or 'career' /  'other' for
-- the honest case of no real data source yet). See
-- frontend/src/features/goals-calendar/GoalsAndCalendarLens.jsx. Defined
-- before follow-through log and calendar events below since both carry an
-- optional goal_id referencing this table.
-- ---------------------------------------------------------------------------

create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    modality text not null check (modality in ('sleep', 'biofeedback', 'microbiome', 'career', 'other')),
    progress numeric(3, 2) not null default 0 check (progress between 0 and 1),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx
    on public.goals (user_id, created_at desc);

alter table public.goals enable row level security;

create policy "Users manage their own goals"
    on public.goals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Follow-through log
--
-- Tracks whether a user actually acted on an intention that came out of a
-- dream, a lesson, a Constitution session, or a coaching session.
-- `goal_id` is optional -- a follow-through entry can (but doesn't have to)
-- roll up into a goal's own track record, e.g. a Constitution intention
-- that's really in service of an existing goal. `on delete set null` rather
-- than cascade: deleting a goal shouldn't erase the historical record of
-- whether someone followed through, just un-link it.
-- ---------------------------------------------------------------------------

create table if not exists public.follow_through_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    goal_id uuid references public.goals (id) on delete set null,
    source text not null check (source in ('dream', 'lesson', 'constitution', 'coaching', 'other')),
    intention text not null,
    status text not null default 'pending' check (status in ('pending', 'did', 'partial', 'didnt')),
    note text,
    emotional_shift text check (emotional_shift in ('higher', 'same', 'lower')),
    edin_note text, -- Edin's reflection once status moves past 'pending' (there's nothing to reflect on before then)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists follow_through_log_user_id_idx
    on public.follow_through_log (user_id, created_at desc);

create index if not exists follow_through_log_goal_id_idx
    on public.follow_through_log (goal_id);

alter table public.follow_through_log enable row level security;

create policy "Users manage their own follow-through log"
    on public.follow_through_log for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Calendar events
--
-- The user-added half of the Goals & Calendar view -- "day" is a weekday
-- name against one illustrative week (no real dates yet; the fixed
-- WEEK_SESSIONS shown alongside these are static frontend data, not user
-- data, so they aren't in this table). Real Google Calendar sync is future
-- work per the architecture note in GoalsAndCalendarLens.jsx -- this table
-- is Edin's own record, which a sync would mirror onto Calendar, not the
-- other way around. `goal_id` makes real the "linked goal" extended-property
-- data that note always described -- optional, same on-delete behavior as
-- follow_through_log.goal_id above.
-- ---------------------------------------------------------------------------

create table if not exists public.calendar_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    goal_id uuid references public.goals (id) on delete set null,
    day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    label text not null,
    category text not null check (category in ('health', 'goal', 'incubation', 'journal', 'biofeedback', 'other')),
    created_at timestamptz not null default now()
);

create index if not exists calendar_events_goal_id_idx
    on public.calendar_events (goal_id);

create index if not exists calendar_events_user_id_idx
    on public.calendar_events (user_id, created_at desc);

alter table public.calendar_events enable row level security;

create policy "Users manage their own calendar events"
    on public.calendar_events for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Coach notes
--
-- Free-text observations the coach (see profiles.is_coach above) leaves on
-- a client's account -- an append-only log (dated entries, not one
-- editable field), same reasoning as the follow-through log: what the
-- coach actually noted at the time shouldn't retroactively change. Backend
-- connects directly to Postgres (see flagged_events' note on this same
-- point below), so RLS here is a second line of defense, not the real
-- enforcement boundary -- app/main.py's get_current_coach_id dependency is.
-- ---------------------------------------------------------------------------

create table if not exists public.coach_notes (
    id uuid primary key default gen_random_uuid(),
    coach_id uuid not null references auth.users (id) on delete cascade,
    client_id uuid not null references auth.users (id) on delete cascade,
    note text not null,
    created_at timestamptz not null default now()
);

create index if not exists coach_notes_client_id_idx
    on public.coach_notes (client_id, created_at desc);

alter table public.coach_notes enable row level security;

create policy "Coaches manage the notes they wrote"
    on public.coach_notes for all
    using (auth.uid() = coach_id)
    with check (auth.uid() = coach_id);

-- ---------------------------------------------------------------------------
-- Symbol validations
--
-- Makes real one of the three confirmation paths described in
-- protocols/11_Coherence_Dream_Criteria_Tagging_Density.md: "a symbol's
-- meaning is confirmed only when the user self-identifies it, a coach
-- validates it, or it's appeared consistently five or more times." This
-- table is the coach-validation path -- keyed on (client_id, tag) rather
-- than a specific dream entry, since a symbol's status belongs to the
-- symbol across a user's whole history, not one occurrence of it. The
-- other two confirmation paths (self-ID, 5+ recurrence) aren't built yet.
-- ---------------------------------------------------------------------------

create table if not exists public.symbol_validations (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references auth.users (id) on delete cascade,
    tag text not null,
    validated_by uuid not null references auth.users (id) on delete cascade,
    validated_at timestamptz not null default now(),
    unique (client_id, tag)
);

create index if not exists symbol_validations_client_id_idx
    on public.symbol_validations (client_id);

alter table public.symbol_validations enable row level security;

create policy "Coaches manage the validations they made"
    on public.symbol_validations for all
    using (auth.uid() = validated_by)
    with check (auth.uid() = validated_by);

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
