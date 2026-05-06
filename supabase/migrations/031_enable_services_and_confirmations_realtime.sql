-- Enable realtime for user_services and service_confirmations tables.
-- Required for the Flutter app's supabase .stream() subscriptions to work
-- without falling back to the HTTP error handler on every load.

alter publication supabase_realtime add table public.user_services;
alter publication supabase_realtime add table public.service_confirmations;
