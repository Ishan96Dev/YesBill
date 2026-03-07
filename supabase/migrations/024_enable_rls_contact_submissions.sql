-- Migration 024: Enable RLS on contact_submissions table
-- Description: Fixes SECURITY ERROR — contact_submissions was created without RLS,
--              exposing all contact form data (names, emails, messages) to any client
--              with the anon key. This migration enables RLS and adds proper policies.
--
-- Policy design for a public contact form:
--   INSERT  → allowed for anon AND authenticated users (public form submissions)
--   SELECT  → NOT granted to any role (only service_role bypasses RLS to read admin-side)
--   UPDATE  → NOT granted (submissions are immutable)
--   DELETE  → NOT granted (only service_role admin can delete if needed)
--
-- This means the contact form on the website continues to work perfectly,
-- but no client-side code can leak/read other users' contact submissions.

-- ── Step 1: Enable Row Level Security ──────────────────────────
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Allow public INSERT (contact form submissions) ─────
-- Anyone — including unauthenticated visitors — may submit the contact form.
-- The honeypot and ip_address columns handle spam at the app layer.
CREATE POLICY "contact_submissions_public_insert"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── Step 3: No SELECT / UPDATE / DELETE for normal clients ─────
-- service_role (used by Edge Functions and admin scripts) bypasses RLS
-- automatically and can read all submissions without any explicit policy.
-- Authenticated users such as the app frontend should never be able to
-- read other people's contact messages, so we intentionally create no
-- SELECT policy here.

-- ── Done ───────────────────────────────────────────────────────
-- After this migration:
--   • contact_submissions shows RLS ENABLED in Supabase dashboard
--   • Security advisor ERROR "RLS Disabled in Public" is resolved
--   • Contact form POST from the frontend continues to work
--   • No client can list/read contact submissions via the anon key
