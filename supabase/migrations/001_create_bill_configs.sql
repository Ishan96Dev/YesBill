-- ============================================================
-- YesBill Database Migration - Bill Configs Table
-- ============================================================
-- Description: Creates the bill_configs table for storing user billing configurations
-- Author: YesBill Team
-- Date: 2026-02-05

-- ============================================================
-- Create bill_configs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bill_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_amount DECIMAL(10, 2) NOT NULL CHECK (daily_amount > 0 AND daily_amount < 1000000),
    currency VARCHAR(3) NOT NULL CHECK (length(currency) = 3),
    start_date DATE NOT NULL CHECK (start_date <= CURRENT_DATE),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- Create unique constraint for active configs
-- ============================================================
-- Ensures only one active config per user at a time
CREATE UNIQUE INDEX unique_active_config 
    ON public.bill_configs (user_id) 
    WHERE active = true;

-- ============================================================
-- Create indexes for performance
-- ============================================================
CREATE INDEX idx_bill_configs_user_id ON public.bill_configs(user_id);
CREATE INDEX idx_bill_configs_active ON public.bill_configs(active) WHERE active = true;

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE public.bill_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies - Users can only access their own data
-- ============================================================

-- SELECT: Users can view their own bill configs
CREATE POLICY "Users can view their own bill configs"
    ON public.bill_configs
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own bill configs
CREATE POLICY "Users can create their own bill configs"
    ON public.bill_configs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own bill configs
CREATE POLICY "Users can update their own bill configs"
    ON public.bill_configs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own bill configs
CREATE POLICY "Users can delete their own bill configs"
    ON public.bill_configs
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- Automatic updated_at timestamp trigger
-- ============================================================

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to bill_configs table
CREATE TRIGGER set_bill_configs_updated_at
    BEFORE UPDATE ON public.bill_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON TABLE public.bill_configs IS 'Stores user billing configurations for daily amount tracking';
COMMENT ON COLUMN public.bill_configs.id IS 'Primary key - UUID';
COMMENT ON COLUMN public.bill_configs.user_id IS 'Foreign key to auth.users - ensures cascade delete';
COMMENT ON COLUMN public.bill_configs.daily_amount IS 'Daily billing amount (must be > 0 and < 1,000,000)';
COMMENT ON COLUMN public.bill_configs.currency IS 'ISO 4217 currency code (3 letters, e.g., USD, EUR)';
COMMENT ON COLUMN public.bill_configs.start_date IS 'Start date for billing (cannot be in future)';
COMMENT ON COLUMN public.bill_configs.active IS 'Whether this config is currently active (only one active per user)';
COMMENT ON COLUMN public.bill_configs.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.bill_configs.updated_at IS 'Timestamp when record was last updated (auto-updated)';
