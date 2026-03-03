-- Add currency fields to user_profiles
-- Currency is auto-determined by the user's selected country
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT '';
