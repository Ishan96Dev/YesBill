-- Add cover_image_url column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add storage policies for cover-images bucket
-- Note: Create the 'cover-images' bucket in Supabase Dashboard first (public bucket)

-- Users can upload their own cover images
CREATE POLICY "Users can upload own cover image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cover-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view cover images (public access)
CREATE POLICY "Public cover image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-images');

-- Users can update their own cover images
CREATE POLICY "Users can update own cover image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cover-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'cover-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own cover images
CREATE POLICY "Users can delete own cover image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cover-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
