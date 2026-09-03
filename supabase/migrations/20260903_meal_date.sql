-- Nutrition needs a day of its own.
--
-- `meals` records id, user_id, name, kcal and protein — no date at all. The Logs reminder
-- currently asks created_at instead, which answers "was a meal logged today" but not "was
-- this meal eaten today": a meal entered after midnight for the evening before lands on the
-- wrong day, and a backfilled meal lands on the day it was typed.
--
-- log_date is what every other daily table already uses (sleep_logs, hydration_logs,
-- body_metrics), so nutrition stops being the odd one out.

alter table public.meals add column if not exists log_date date;

-- Existing rows keep their meaning: the day they were written is the best evidence there is.
update public.meals set log_date = (created_at at time zone 'UTC')::date where log_date is null;

-- New rows default to today rather than null, so a client that has not been updated yet
-- still produces a usable date.
alter table public.meals alter column log_date set default (now() at time zone 'UTC')::date;

create index if not exists meals_user_day_idx on public.meals (user_id, log_date);

comment on column public.meals.log_date is 'The day the meal counts for — not necessarily the day the row was written.';
