-- ============================================
-- CHIQUE PRO - User Management SQL
-- Drop old tables and create new ones with admin management
-- ============================================

-- 1. Drop existing tables and triggers (if any)
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup();
DROP FUNCTION IF EXISTS handle_login();
DROP TABLE IF EXISTS public.users_check CASCADE;
DROP TABLE IF EXISTS public.checks CASCADE;
DROP TABLE IF EXISTS public.cheque_settings CASCADE;

-- 2. Create users_check table for user management
CREATE TABLE public.users_check (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE,  -- Links to auth.users (can be NULL until user signs up)
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,   -- For admin-created users
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create checks table
CREATE TABLE public.checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    entity_name TEXT NOT NULL,
    type TEXT CHECK (type IN ('incoming', 'outgoing')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'returned', 'garantie')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    fund_name TEXT,
    amount_in_words TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Create cheque_settings table
CREATE TABLE public.cheque_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'CHIQUE PRO',
    currency TEXT DEFAULT 'MAD',
    timezone TEXT DEFAULT 'Africa/Casablanca',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    fiscal_start DATE DEFAULT '2024-01-01',
    alert_before BOOLEAN DEFAULT true,
    alert_delay BOOLEAN DEFAULT true,
    alert_method TEXT DEFAULT 'app',
    alert_days INTEGER DEFAULT 3,
    logo_url TEXT,
    gemini_api_key TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.users_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheque_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for users_check
-- Admins can see and do everything, users can only see their own data
CREATE POLICY "Admins can manage all users" ON public.users_check
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users_check u 
            WHERE u.user_id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own profile" ON public.users_check
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.users_check
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS Policies for checks
CREATE POLICY "Checks access policy" ON public.checks
    FOR ALL USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.users_check 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 8. RLS Policies for settings
CREATE POLICY "Settings access policy" ON public.cheque_settings
    FOR ALL USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users_check 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Function to auto-create user in users_check when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users_check WHERE user_id = NEW.id) THEN
        -- Auto-determine role based on email
        INSERT INTO public.users_check (user_id, email, role, is_active, is_verified, created_by)
        VALUES (
            NEW.id,
            NEW.email,
            CASE 
                WHEN NEW.email = 'admin@apollo.com' THEN 'admin'
                WHEN NEW.email = 'admin@chique.com' THEN 'admin'
                ELSE 'user'
            END,
            true,
            true,
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger for auto role assignment on signup
CREATE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 11. Function to update last login
CREATE OR REPLACE FUNCTION public.handle_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users_check 
    SET last_login = now(), user_id = NEW.id 
    WHERE email = NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.handle_login();

-- 12. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users_check TO anon, authenticated;
GRANT ALL ON public.checks TO anon, authenticated;
GRANT ALL ON public.cheque_settings TO anon, authenticated;

-- 13. Insert default admin user
-- Note: User must sign up first in the app, then admin can change their role
-- This is just a template showing how to add users manually:

-- INSERT INTO public.users_check (email, role, is_active, is_verified)
-- VALUES ('admin@apollo.com', 'admin', true, true);

-- 14. Helper view for admin user management
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.is_active,
    u.is_verified,
    u.created_at,
    u.last_login,
    CASE 
        WHEN u.user_id IS NOT NULL THEN 'Active'
        ELSE 'Pending'
    END as status
FROM public.users_check u;

-- Grant access to view
GRANT SELECT ON public.admin_users TO authenticated;

-- ============================================
-- PRE-CREATED USERS (for demo purposes)
-- ============================================
-- NOTE: These users must sign up in the app first to be created in auth.users
-- The trigger will auto-assign their roles based on their emails
--
-- ADMIN: hamza@apolloeyewear.ma (password: hamzahamza)
-- MANAGER: alfarisse100@gmail.com (password: alfarissealfarisse)
-- USER: dounia@apolloeyewear.ma (password: douniadounia)
--
-- Users will get their roles automatically when they sign up!

-- 15. Success message
SELECT 'User Management System Setup Complete!' as status;
SELECT 'Ready for users to sign up:' as info;
SELECT 'ADMIN: hamza@apolloeyewear.ma (hamzahamza)' as admin_user;
SELECT 'MANAGER: alfarisse100@gmail.com (alfarissealfarisse)' as manager_user;
SELECT 'USER: dounia@apolloeyewear.ma (douniadounia)' as regular_user;
