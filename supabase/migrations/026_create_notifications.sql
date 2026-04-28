-- ── 026_create_notifications.sql ──────────────────────────────────────────────
-- In-app notification centre. Rows are created by Edge Functions or backend
-- services; users can only read and mark their own notifications as read.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text,
  title       text not null default 'Notification',
  message     text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index for the default query (per-user, newest first)
create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

-- Users may read their own notifications
create policy "notifications_select_own"
  on public.notifications
  for select
  using (auth.uid() = user_id);

-- Users may mark their own notifications as read (only the `read` column)
create policy "notifications_update_own"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service-role / backend may insert notifications for any user
create policy "notifications_insert_service"
  on public.notifications
  for insert
  with check (true);
