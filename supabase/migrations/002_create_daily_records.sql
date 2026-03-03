-- ============================================================
-- YesBill Database Migration - Daily Records Table
-- ============================================================
-- Description: Creates the daily_records table for tracking daily YES/NO marks
-- Author: YesBill Team
-- Date: 2026-02-05

-- ============================================================
-- Create daily_status enum
-- ============================================================
DO $$ BEGIN
    CREATE TYPE public.daily_status AS ENUM ('YES', 'NO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Create daily_records table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_config_id UUID NOT NULL REFERENCES public.bill_configs(id) ON DELETE CASCADE,
    date DATE NOT NULL CHECK (date <= CURRENT_DATE),
    status public.daily_status NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one record per user per date
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- ============================================================
-- Create indexes for performance
-- ============================================================
CREATE INDEX idx_daily_records_user_id ON public.daily_records(user_id);
CREATE INDEX idx_daily_records_date ON public.daily_records(date);
CREATE INDEX idx_daily_records_user_date ON public.daily_records(user_id, date);
CREATE INDEX idx_daily_records_bill_config ON public.daily_records(bill_config_id);
CREATE INDEX idx_daily_records_status ON public.daily_records(status);

-- Index for monthly summaries (year-month queries)
CREATE INDEX idx_daily_records_year_month ON public.daily_records(user_id, date DESC);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies - Users can only access their own data
-- ============================================================

-- SELECT: Users can view their own daily records
CREATE POLICY "Users can view their own daily records"
    ON public.daily_records
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own daily records
CREATE POLICY "Users can create their own daily records"
    ON public.daily_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own daily records
CREATE POLICY "Users can update their own daily records"
    ON public.daily_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own daily records
CREATE POLICY "Users can delete their own daily records"
    ON public.daily_records
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- Automatic updated_at timestamp trigger
-- ============================================================

-- Add trigger to daily_records table
CREATE TRIGGER set_daily_records_updated_at
    BEFORE UPDATE ON public.daily_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Automatic amount calculation trigger
-- ============================================================

-- Function to automatically set amount based on bill_config and status
CREATE OR REPLACE FUNCTION public.calculate_daily_amount()
RETURNS TRIGGER AS $$
DECLARE
    config_amount DECIMAL(10, 2);
BEGIN
    -- Get the daily amount from bill_config
    SELECT daily_amount INTO config_amount
    FROM public.bill_configs
    WHERE id = NEW.bill_config_id;
    
    -- Set amount based on status
    IF NEW.status = 'YES' THEN
        NEW.amount = config_amount;
    ELSE
        NEW.amount = 0.00;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically calculate amount
CREATE TRIGGER calculate_amount_before_insert_update
    BEFORE INSERT OR UPDATE ON public.daily_records
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_daily_amount();

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON TABLE public.daily_records IS 'Stores daily YES/NO marks and calculated billing amounts';
COMMENT ON COLUMN public.daily_records.id IS 'Primary key - UUID';
COMMENT ON COLUMN public.daily_records.user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.daily_records.bill_config_id IS 'Foreign key to bill_configs';
COMMENT ON COLUMN public.daily_records.date IS 'Date of the record (cannot be in future)';
COMMENT ON COLUMN public.daily_records.status IS 'YES or NO status for the day';
COMMENT ON COLUMN public.daily_records.amount IS 'Calculated amount (auto-set based on status and config)';
COMMENT ON COLUMN public.daily_records.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.daily_records.updated_at IS 'Timestamp when record was last updated (auto-updated)';
