-- ============================================================
-- YesBill - Add bill_title and custom_note to generated_bills
-- ============================================================
-- bill_title: Human-readable name e.g. "Tiffin + February 2026"
-- custom_note: User-provided optional bill note (refined by AI)
-- ============================================================

ALTER TABLE public.generated_bills
  ADD COLUMN IF NOT EXISTS bill_title TEXT;

ALTER TABLE public.generated_bills
  ADD COLUMN IF NOT EXISTS custom_note TEXT;

COMMENT ON COLUMN public.generated_bills.bill_title IS 'Human-readable bill name: ServiceName + Month Year';
COMMENT ON COLUMN public.generated_bills.custom_note IS 'User-provided optional bill note (refined by AI)';
