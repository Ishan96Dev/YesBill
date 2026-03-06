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
-- Replace the two placeholder values below before running:
--   YOUR_BACKEND_URL    → e.g. https://yesbill-api.onrender.com
--   YOUR_SCHEDULER_SECRET → must match SCHEDULER_SECRET env var in your backend
--
-- Note: ALTER DATABASE / ALTER ROLE GUC approaches require superuser which
-- Supabase does not grant. Values are embedded directly in the job body instead.

-- ── Schedule ──────────────────────────────────────────────────────────────────
-- Runs at the top of every hour (0 * * * * = "at minute 0 of every hour")
SELECT cron.schedule(
  'yesbill-auto-bill-hourly',          -- job name (unique)
  '0 * * * *',                         -- cron expression: every hour on the hour
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_BACKEND_URL/bills/auto-generate',
      headers := jsonb_build_object(
        'Content-Type',       'application/json',
        'X-Scheduler-Secret', 'YOUR_SCHEDULER_SECRET'
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
