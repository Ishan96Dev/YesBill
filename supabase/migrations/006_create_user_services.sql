-- ============================================================
-- YesBill Database Migration - User Services Table
-- ============================================================
-- Description: Creates user_services table for tracking recurring services
-- Author: YesBill Team
-- Date: 2026-02-06

-- ============================================================
-- Create user_services table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'monthly')),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    schedule TEXT DEFAULT 'morning' CHECK (schedule IN ('morning', 'evening', 'custom')),
    icon TEXT DEFAULT 'package',
    notes TEXT DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- Create indexes
-- ============================================================
CREATE INDEX idx_user_services_user_id ON public.user_services(user_id);
CREATE INDEX idx_user_services_active ON public.user_services(active) WHERE active = true;

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================
CREATE POLICY "Users can view their own services"
    ON public.user_services FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services"
    ON public.user_services FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
    ON public.user_services FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
    ON public.user_services FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE TRIGGER set_user_services_updated_at
    BEFORE UPDATE ON public.user_services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Create service_confirmations table for daily calendar tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.user_services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('delivered', 'skipped', 'pending')),
    custom_amount DECIMAL(10, 2),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- One confirmation per service per day
    CONSTRAINT unique_service_date UNIQUE (user_id, service_id, date)
);

-- ============================================================
-- Create indexes for service_confirmations
-- ============================================================
CREATE INDEX idx_service_confirmations_user_id ON public.service_confirmations(user_id);
CREATE INDEX idx_service_confirmations_date ON public.service_confirmations(date);
CREATE INDEX idx_service_confirmations_user_date ON public.service_confirmations(user_id, date);
CREATE INDEX idx_service_confirmations_service ON public.service_confirmations(service_id);

-- ============================================================
-- Enable RLS for service_confirmations
-- ============================================================
ALTER TABLE public.service_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own confirmations"
    ON public.service_confirmations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own confirmations"
    ON public.service_confirmations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confirmations"
    ON public.service_confirmations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confirmations"
    ON public.service_confirmations FOR DELETE
    USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_service_confirmations_updated_at
    BEFORE UPDATE ON public.service_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE public.user_services IS 'Stores user recurring services (milk, newspaper, tiffin, etc.)';
COMMENT ON TABLE public.service_confirmations IS 'Daily confirmations of service delivery or skip';
