-- 20260630000003_fix_cron_cleanup.sql
-- Fix cron job: safe unschedule + add VACUUM ANALYZE

SELECT cron.unschedule('daily-cleanup');

SELECT cron.schedule(
    'daily-cleanup',
    '0 3 * * *',
    $$ DELETE FROM public.rooms; VACUUM ANALYZE; $$
);
