-- ============================================================
-- YesBill - Generated Bills Table
-- ============================================================
-- Stores AI-generated bills per user/month/services.
-- Used for Previous Bills list, delete, regenerate, export.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generated_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
    service_ids UUID[] NOT NULL DEFAULT '{}',
    payload JSONB NOT NULL DEFAULT '{}',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    ai_model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_generated_bills_user_id ON public.generated_bills(user_id);
CREATE INDEX idx_generated_bills_user_year_month ON public.generated_bills(user_id, year_month);
CREATE INDEX idx_generated_bills_created_at ON public.generated_bills(created_at DESC);

ALTER TABLE public.generated_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated bills"
    ON public.generated_bills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated bills"
    ON public.generated_bills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated bills"
    ON public.generated_bills FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated bills"
    ON public.generated_bills FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.generated_bills IS 'AI-generated bills; payload contains full bill JSON for display and export';
