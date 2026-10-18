-- THE HARDENING is removed from the app (nav entry, scene, hardening.dc.html,
-- hardening-engine.js all gone). Drops the server side of it that
-- 20260927_hardening_progress.sql created — that migration file stays as the
-- historical record of what was once deployed; this one undoes it going forward.

drop trigger if exists hardening_progress_touch on public.hardening_progress;
drop function if exists public.hardening_progress_set_updated_at();
drop table if exists public.hardening_progress;
