-- 20260630000002_setup_daily_cleanup.sql
-- Schedule daily full database cleanup at 3 AM via pg_cron

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job to avoid duplicates on re-run (ignore if not found)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-cleanup');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist yet, that's fine
END;
$$;

-- Schedule: daily at 3 AM
-- Deletes all rooms — FKs cascade to votes, tasks, groups, participant_groups
SELECT cron.schedule(
    'daily-cleanup',
    '0 3 * * *',
    $$ DELETE FROM public.rooms; $$
);
