-- Distance for cardio.
--
-- The voice assistant already parses "a 5k run" correctly and then throws the 5k away,
-- because logWorkout carries (exercise, minutes, weight, sets, reps) and `workouts` has
-- nowhere to put a distance. Running 5k and running 10k are currently the same row.
--
-- Stored as a number plus its unit rather than normalised to one of them: someone who runs
-- in miles wants to read miles back, and converting on the way in loses which they said.

alter table public.workouts add column if not exists distance      numeric;
alter table public.workouts add column if not exists distance_unit text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workouts_distance_unit_check') then
    alter table public.workouts
      add constraint workouts_distance_unit_check
      check (distance_unit is null or distance_unit in ('km', 'mi', 'm'));
  end if;
end $$;

comment on column public.workouts.distance      is 'Distance covered, in distance_unit. Null for non-cardio.';
comment on column public.workouts.distance_unit is 'km | mi | m — the unit the user actually said, kept rather than normalised.';
