# Render Cron Job Setup

Set up an hourly cron job on Render so auto-bill generation fires even without
GitHub Actions or Supabase pg_cron.

## Steps

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Cron Job**

2. Configure:
   | Field | Value |
   |-------|-------|
   | **Name** | `yesbill-auto-bill-cron` |
   | **Region** | Same region as your backend service |
   | **Schedule** | `0 * * * *` *(every hour)* |
   | **Command** | `curl -sf -X POST $BACKEND_URL/bills/auto-generate -H "X-Scheduler-Secret: $SCHEDULER_SECRET" -H "Content-Type: application/json"` |
   | **Docker image / Runtime** | Use the same image as your backend, **or** use `curlimages/curl:latest` for a lightweight option |

3. Add **Environment Variables** to the cron job:
   - `BACKEND_URL` → your backend URL, e.g. `https://yesbill-api.onrender.com`
   - `SCHEDULER_SECRET` → same value as in your backend's `SCHEDULER_SECRET` env var

4. Click **Create Cron Job**.

## Notes

- Render Cron Jobs are billed per-minute of execution, so an hourly curl call is
  essentially free.
- The backend uses per-user timezones to compute "today", so running hourly
  ensures bills fire at the right local date for users in every timezone.
- The backend deduplicates — running twice won't generate two bills for the same
  user+month.
