-- Marks a workout row as having come from Bulk Import rather than a single logged set.
--
-- Bulk Import now pays 10 XP per row on top of the usual per-exercise-per-day credit,
-- computePower() reads this flag straight off the row. Without a real column it would
-- reset to false on every fresh pull from Supabase, and the XP it grants would visibly
-- drop out from under someone the next time they synced.

alter table public.workouts add column if not exists via_import boolean not null default false;

comment on column public.workouts.via_import is 'true when this row was created by Bulk Import rather than a single logged set — drives its extra 10 XP in computePower().';
