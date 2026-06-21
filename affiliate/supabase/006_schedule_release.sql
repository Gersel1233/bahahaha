-- ============================================================================
-- 006_schedule_release.sql — automatic daily commission release (pg_cron)
-- PREFERRED method: runs entirely inside Postgres, so there is NO public
-- endpoint to secure. Safe to run on an existing DB and safe to re-run.
-- Requires 004_payouts.sql (release_commissions) to already exist.
--
-- Production hold is hard-coded to 30 days here (independent of the edge
-- function's PAYOUT_HOLD_DAYS). For testing with hold 0, use the manual
-- release-commissions function instead — do NOT change this to 0 in prod.
-- ============================================================================

create extension if not exists pg_cron;

-- replace any previous schedule so this file is idempotent
do $$
begin
  if exists (select 1 from cron.job where jobname = 'release-commissions-daily') then
    perform cron.unschedule('release-commissions-daily');
  end if;
end $$;

-- every day at 03:07 UTC: move matured pending commissions -> available
select cron.schedule(
  'release-commissions-daily',
  '7 3 * * *',
  $$ select release_commissions(30); $$
);

-- inspect the schedule:
--   select jobid, schedule, command, active from cron.job where jobname = 'release-commissions-daily';
-- recent runs:
--   select status, return_message, start_time, end_time
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname='release-commissions-daily')
--   order by start_time desc limit 10;
