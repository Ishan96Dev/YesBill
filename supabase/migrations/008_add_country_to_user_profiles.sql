-- Add country and country_code columns to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '';
