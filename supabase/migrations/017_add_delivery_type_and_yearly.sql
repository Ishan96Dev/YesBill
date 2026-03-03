-- ============================================================
-- YesBill - Add delivery_type and yearly frequency to user_services
-- ============================================================
-- delivery_type: How the service is provided (home delivery, utility, etc.)
-- yearly: New frequency type for annual services
-- ============================================================

-- 1. Add delivery_type column
ALTER TABLE public.user_services
  ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'home_delivery'
  CHECK (delivery_type IN ('home_delivery', 'utility', 'visit_based', 'subscription', 'payment'));

-- 2. Update type (frequency) constraint to include 'yearly'
ALTER TABLE public.user_services
  DROP CONSTRAINT IF EXISTS user_services_type_check;

ALTER TABLE public.user_services
  ADD CONSTRAINT user_services_type_check
  CHECK (type IN ('daily', 'weekly', 'monthly', 'yearly'));

COMMENT ON COLUMN public.user_services.delivery_type IS
  'How the service is delivered or consumed: home_delivery (tiffin/milk), utility (internet/electricity), visit_based (gym/clinic), subscription (OTT/magazine), payment (EMI/loan/rent)';
