-- Event detail columns, so the calendar reminder can say what the owner's copy asks it to.
--
-- The requested wording is:
--   work:     "For tomorrow you have {task} from {time} till {time} with {persons}"
--   general:  "For tomorrow you have {task} that you have set for you to do"
--   both:     "...{task} from {time} till {time} with {persons}, when this has been
--              completed you have {task}, this should take about {duration}"
--
-- An events row today is (id, user_id, title, event_date, event_time, repeat_days). Three
-- of those placeholders have no column behind them, so the reminder currently sends only
-- the general shape. These columns are what the other two need.
--
-- All nullable with sane defaults: every existing row stays valid and keeps behaving as a
-- general task, which is what it was.

alter table public.events add column if not exists end_time   text;
alter table public.events add column if not exists attendees  text;
alter table public.events add column if not exists kind       text not null default 'general';
alter table public.events add column if not exists est_minutes integer;

-- 'work' or 'general'. Constrained rather than free text, because the reminder picks its
-- wording from this value and a typo would silently choose the wrong sentence.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_kind_check'
  ) then
    alter table public.events
      add constraint events_kind_check check (kind in ('work', 'general'));
  end if;
end $$;

comment on column public.events.end_time    is 'HH:MM. Work events only; null means open-ended.';
comment on column public.events.attendees   is 'Free text, e.g. "Dan and Priya". Work events only.';
comment on column public.events.kind        is 'work | general — selects which reminder wording is used.';
comment on column public.events.est_minutes is 'Rough duration for a general task, used in the combined wording.';
