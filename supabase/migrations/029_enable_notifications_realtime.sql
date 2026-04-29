-- ── 029_enable_notifications_realtime.sql ─────────────────────────────────────
-- Adds the notifications table to the Supabase Realtime publication so that
-- INSERT, UPDATE, and DELETE events are broadcast to subscribed clients.
-- Without this, the postgres_changes subscription in useNotifications.js and
-- the mobile notifications stream receive no events despite being correctly
-- configured — new notifications from the backend never appear in real-time,
-- and read-state changes from other sessions are never propagated.

alter publication supabase_realtime add table public.notifications;
