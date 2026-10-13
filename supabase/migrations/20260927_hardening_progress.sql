-- THE HARDENING was shipped local-only (localStorage via the app's existing cc_v2 blob),
-- with no server table, so nothing synced across devices. This gives it the same shape
-- every other single-JSONB-blob feature already uses (learning_progress, world_intel_pins,
-- world_intel_routes): one row per user, the whole client-side `hardening` state object
-- stored as-is in `data`, upserted on change and pulled back in the login batch.
--
-- Deliberately one blob rather than normalized tables (a program_days table, a logs table,
-- etc.) — the client already treats the whole feature as one nested object it reads and
-- writes wholesale (onboarding profile, program, edits, logs, habits, mental log, reframe
-- history, weekly reviews), so a matching normalized schema would just be object-relational
-- mapping for its own sake, with the same cost every other blob table already accepted.

create table if not exists public.hardening_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.hardening_progress is
  'THE HARDENING — one JSONB blob per user (onboarding profile, program, edits, session logs, habits, mental log, reframe history, weekly reviews). Mirrors learning_progress.';

alter table public.hardening_progress enable row level security;

drop policy if exists hardening_progress_select_own on public.hardening_progress;
create policy hardening_progress_select_own on public.hardening_progress
  for select using (auth.uid() = user_id);

drop policy if exists hardening_progress_insert_own on public.hardening_progress;
create policy hardening_progress_insert_own on public.hardening_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists hardening_progress_update_own on public.hardening_progress;
create policy hardening_progress_update_own on public.hardening_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists hardening_progress_delete_own on public.hardening_progress;
create policy hardening_progress_delete_own on public.hardening_progress
  for delete using (auth.uid() = user_id);

-- Keeps updated_at honest without the client having to remember to set it on every upsert.
create or replace function public.hardening_progress_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hardening_progress_touch on public.hardening_progress;
create trigger hardening_progress_touch
  before update on public.hardening_progress
  for each row execute function public.hardening_progress_set_updated_at();
