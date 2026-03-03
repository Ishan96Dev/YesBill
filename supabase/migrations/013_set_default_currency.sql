-- ============================================================
-- YesBill Database Migration - Set Default Currency
-- ============================================================
-- Description: Sets default currency for existing users and updates trigger
-- Author: YesBill Team
-- Date: 2026-02-15

-- ============================================================
-- Update existing users without currency to use INR (India default)
-- ============================================================
UPDATE public.user_profiles
SET 
  currency = 'INR',
  currency_code = '₹'
WHERE currency IS NULL OR currency = '' OR currency_code IS NULL OR currency_code = '';

-- ============================================================
-- Set default values for currency columns
-- ============================================================
ALTER TABLE public.user_profiles 
ALTER COLUMN currency SET DEFAULT 'INR';

ALTER TABLE public.user_profiles 
ALTER COLUMN currency_code SET DEFAULT '₹';

-- ============================================================
-- Update the handle_new_user function to include currency defaults
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    display_name, 
    avatar_url,
    currency,
    currency_code,
    country
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar',
      ''
    ),
    'INR',
    '₹',
    'India'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON COLUMN public.user_profiles.currency IS 'User currency code (e.g., INR, USD, EUR)';
COMMENT ON COLUMN public.user_profiles.currency_code IS 'User currency symbol (e.g., ₹, $, €)';
