-- Nutrition already had its day. This migration is a no-op, kept as the record of a
-- mistake rather than deleted.
--
-- I read the client's insert into `meals` — id, user_id, name, kcal, protein — saw no date
-- and concluded the table had no date column, at a point when I could not query the schema
-- to check. It has had `logged_date date default CURRENT_DATE` all along.
--
-- The first version of this file added a second date column, `log_date`, which was applied
-- and then dropped once the real schema was visible. Two columns meaning the same thing is
-- worse than the problem it was solving.
--
-- What actually needed fixing was elsewhere and is not SQL:
--   * the client now sets logged_date explicitly instead of relying on the default, so a
--     meal entered after midnight for the evening before can be given the right day
--   * the Logs reminder reads logged_date rather than created_at, which answered "when was
--     this row written" rather than "which day does this meal count for"

-- Intentionally empty.
select 1;
