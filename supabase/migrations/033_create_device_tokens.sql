-- ── 033_create_device_tokens.sql ─────────────────────────────────────────────
-- Stores FCM/Web-push tokens for every authenticated device/browser session.
-- Rows are created by the backend  (POST /notifications/register-token) and
-- cleaned up on sign-out  (DELETE /notifications/unregister-token).
--
-- `platform` distinguishes Android/iOS FCM tokens from Chrome/Firefox Web-Push
-- subscription objects (stored as JSON strings in the `token` column).
--
-- The (user_id, token) unique constraint prevents duplicate rows when the same
-- device re-registers (e.g. after an app update or token refresh).

create table if not exists public.device_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  token       text        not null,
  platform    text        not null default 'android'
                          check (platform in ('android', 'ios', 'web')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);

-- Fast lookup by user when dispatching push notifications
create index if not exists device_tokens_user_id_idx
  on public.device_tokens (user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.device_tokens enable row level security;

-- Users may register/update/delete only their own tokens
create policy "device_tokens_manage_own"
  on public.device_tokens
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service-role key (used by edge functions) bypasses RLS automatically;
-- no extra policy is needed for server-side push dispatch.
