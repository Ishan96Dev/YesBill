-- ============================================================
-- YesBill Database Migration - Helper Functions
-- ============================================================
-- Description: Creates helper functions for monthly summaries and queries
-- Author: YesBill Team
-- Date: 2026-02-05

-- ============================================================
-- Function: Get Monthly Summary
-- ============================================================
-- Returns aggregated summary for a specific year-month
CREATE OR REPLACE FUNCTION public.get_monthly_summary(
    p_user_id UUID,
    p_year_month TEXT  -- Format: 'YYYY-MM'
)
RETURNS TABLE (
    year_month TEXT,
    total_yes_days BIGINT,
    total_amount DECIMAL(10, 2),
    currency VARCHAR(3),
    daily_rate DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_year_month as year_month,
        COUNT(*) FILTER (WHERE dr.status = 'YES') as total_yes_days,
        COALESCE(SUM(dr.amount), 0.00)::DECIMAL(10, 2) as total_amount,
        bc.currency,
        bc.daily_amount as daily_rate
    FROM public.daily_records dr
    INNER JOIN public.bill_configs bc ON dr.bill_config_id = bc.id
    WHERE 
        dr.user_id = p_user_id
        AND TO_CHAR(dr.date, 'YYYY-MM') = p_year_month
        AND bc.active = true
    GROUP BY bc.currency, bc.daily_amount
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(UUID, TEXT) TO authenticated;

-- ============================================================
-- Function: Get Records by Month
-- ============================================================
-- Returns all daily records for a specific year-month
CREATE OR REPLACE FUNCTION public.get_records_by_month(
    p_user_id UUID,
    p_year_month TEXT  -- Format: 'YYYY-MM'
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    date DATE,
    status public.daily_status,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        dr.user_id,
        dr.date,
        dr.status,
        dr.amount,
        dr.created_at
    FROM public.daily_records dr
    WHERE 
        dr.user_id = p_user_id
        AND TO_CHAR(dr.date, 'YYYY-MM') = p_year_month
    ORDER BY dr.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_records_by_month(UUID, TEXT) TO authenticated;

-- ============================================================
-- Function: Get Active Bill Config
-- ============================================================
-- Returns the active bill configuration for a user
CREATE OR REPLACE FUNCTION public.get_active_bill_config(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    daily_amount DECIMAL(10, 2),
    currency VARCHAR(3),
    start_date DATE,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bc.id,
        bc.user_id,
        bc.daily_amount,
        bc.currency,
        bc.start_date,
        bc.active,
        bc.created_at,
        bc.updated_at
    FROM public.bill_configs bc
    WHERE 
        bc.user_id = p_user_id
        AND bc.active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_active_bill_config(UUID) TO authenticated;

-- ============================================================
-- Function: Deactivate Old Configs (Helper for ensuring single active)
-- ============================================================
-- Automatically called before activating a new config
CREATE OR REPLACE FUNCTION public.deactivate_old_configs()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a config to active, deactivate all other configs for this user
    IF NEW.active = true THEN
        UPDATE public.bill_configs
        SET active = false,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to ensure only one active config per user
CREATE TRIGGER ensure_single_active_config
    BEFORE INSERT OR UPDATE ON public.bill_configs
    FOR EACH ROW
    WHEN (NEW.active = true)
    EXECUTE FUNCTION public.deactivate_old_configs();

-- ============================================================
-- Function: Get User Statistics
-- ============================================================
-- Returns overall statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_statistics(
    p_user_id UUID
)
RETURNS TABLE (
    total_records BIGINT,
    total_yes_days BIGINT,
    total_no_days BIGINT,
    total_amount_earned DECIMAL(10, 2),
    current_streak INT,
    longest_streak INT,
    currency VARCHAR(3)
) AS $$
DECLARE
    v_currency VARCHAR(3);
BEGIN
    -- Get currency from active config
    SELECT bc.currency INTO v_currency
    FROM public.bill_configs bc
    WHERE bc.user_id = p_user_id AND bc.active = true
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_records,
        COUNT(*) FILTER (WHERE dr.status = 'YES')::BIGINT as total_yes_days,
        COUNT(*) FILTER (WHERE dr.status = 'NO')::BIGINT as total_no_days,
        COALESCE(SUM(dr.amount), 0.00)::DECIMAL(10, 2) as total_amount_earned,
        0 as current_streak,  -- TODO: Implement streak calculation
        0 as longest_streak,  -- TODO: Implement streak calculation
        COALESCE(v_currency, 'USD') as currency
    FROM public.daily_records dr
    WHERE dr.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_statistics(UUID) TO authenticated;

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON FUNCTION public.get_monthly_summary IS 'Returns aggregated monthly summary with total YES days and amount';
COMMENT ON FUNCTION public.get_records_by_month IS 'Returns all daily records for a specific month';
COMMENT ON FUNCTION public.get_active_bill_config IS 'Returns the currently active bill configuration for a user';
COMMENT ON FUNCTION public.get_user_statistics IS 'Returns overall statistics for a user';
