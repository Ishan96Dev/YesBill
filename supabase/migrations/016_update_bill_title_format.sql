-- ============================================================
-- YesBill - Update bill_title format from "Name + Month" to "Name (Month)"
-- ============================================================
-- Changes existing bill_title column values and payload.billTitle JSONB field
-- from "Tiffin + February 2026" format to "Tiffin (February 2026)" format.
-- ============================================================

-- 1. Update the bill_title column
UPDATE public.generated_bills
SET bill_title = regexp_replace(bill_title, '^(.+) \+ (.+)$', '\1 (\2)')
WHERE bill_title LIKE '% + %';

-- 2. Update the billTitle field inside the payload JSONB
UPDATE public.generated_bills
SET payload = jsonb_set(
  payload,
  '{billTitle}',
  to_jsonb(regexp_replace(payload->>'billTitle', '^(.+) \+ (.+)$', '\1 (\2)'))
)
WHERE payload->>'billTitle' LIKE '% + %';
