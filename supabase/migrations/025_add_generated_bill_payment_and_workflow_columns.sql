-- ============================================================
-- YesBill - Add generated bill payment/workflow metadata columns
-- ============================================================
-- Aligns DB schema with backend + web/mobile bill flows:
-- - mark as paid / unmark paid
-- - auto-generated bill metadata
-- - optional PDF + email delivery flags
-- ============================================================

ALTER TABLE public.generated_bills
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trigger_type TEXT,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_generated_bills_is_paid
  ON public.generated_bills(is_paid);

-- Keep updated_at in sync when helper trigger function is present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'handle_updated_at' AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS set_generated_bills_updated_at ON public.generated_bills;
    CREATE TRIGGER set_generated_bills_updated_at
      BEFORE UPDATE ON public.generated_bills
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

COMMENT ON COLUMN public.generated_bills.auto_generated IS 'True when bill was generated automatically by cron/agent workflows.';
COMMENT ON COLUMN public.generated_bills.trigger_type IS 'Workflow trigger source (manual, cron, setup, etc.).';
COMMENT ON COLUMN public.generated_bills.email_sent IS 'True when bill email notification has been sent.';
COMMENT ON COLUMN public.generated_bills.pdf_url IS 'Optional storage URL/path for generated bill PDF.';
COMMENT ON COLUMN public.generated_bills.is_paid IS 'Payment status for this generated bill.';
COMMENT ON COLUMN public.generated_bills.paid_at IS 'Timestamp when this bill was marked paid.';
COMMENT ON COLUMN public.generated_bills.payment_method IS 'Payment method used (cash, upi, bank_transfer, credit_card, debit_card, net_banking, etc.).';
COMMENT ON COLUMN public.generated_bills.payment_note IS 'Optional user-provided payment note.';
