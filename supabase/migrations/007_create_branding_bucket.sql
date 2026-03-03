-- ============================================================
-- YesBill Database Migration - Branding Storage Bucket
-- ============================================================
-- Description: Creates a public storage bucket for branding assets (logo, etc.)
-- These are used in email templates and public-facing content.

-- Note: The bucket must also be created via Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: "branding"
-- 3. Toggle "Public bucket" ON
-- 4. Click Create

-- Public read access for branding assets
CREATE POLICY "Public branding access"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');
