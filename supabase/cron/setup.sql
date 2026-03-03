-- YesBill Auto-Bill Cron (pg_cron)
-- Runs every hour. The backend computes each user's local date using their
-- saved timezone, so bills always fire at the correct local day — not UTC.
--
-- Prerequisites:
--   1. pg_cron extension must be enabled in Supabase dashboard
--      (Database → Extensions → pg_cron → Enable)
--   2. pg_net extension must be enabled for HTTP calls
--      (Database → Extensions → pg_net → Enable)
--   3. Set the two config values below to your actual backend URL and secret.
--
-- Run this SQL once in the Supabase SQL editor.

-- ── Configuration ─────────────────────────────────────────────────────────────
-- Replace these with your actual values before running:
--   BACKEND_URL  → e.g. https://yesbill-api.onrender.com
--   SCHEDULER_SECRET → must match SCHEDULER_SECRET env var in your backend

DO $$
BEGIN
  -- Store config so the cron job can read it without hardcoding
  PERFORM set_config('app.backend_url',     'https://YOUR_BACKEND_URL', false);
  PERFORM set_config('app.scheduler_secret', 'YOUR_SCHEDULER_SECRET',    false);
END $$;


-- ── Schedule ──────────────────────────────────────────────────────────────────
-- Runs at the top of every hour (0 * * * * = "at minute 0 of every hour")
SELECT cron.schedule(
  'yesbill-auto-bill-hourly',          -- job name (unique)
  '0 * * * *',                         -- cron expression: every hour on the hour
  $$
    SELECT net.http_post(
      url     := current_setting('app.backend_url') || '/bills/auto-generate',
      headers := jsonb_build_object(
        'Content-Type',       'application/json',
        'X-Scheduler-Secret', current_setting('app.scheduler_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);


-- ── Verify ────────────────────────────────────────────────────────────────────
-- Run this query to confirm the job was created:
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'yesbill-auto-bill-hourly';

-- ── Remove (if needed) ────────────────────────────────────────────────────────
-- SELECT cron.unschedule('yesbill-auto-bill-hourly');
