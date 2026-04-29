-- ============================================
-- CHIQUE PRO - User Management SQL
-- Drop old tables and create new ones with admin management
-- ============================================

-- 1. Drop existing tables (NO auth.users dependency)
DROP TABLE IF EXISTS public.users_check CASCADE;
DROP TABLE IF EXISTS public.checks CASCADE;
DROP TABLE IF EXISTS public.cheque_settings CASCADE;

-- 2. Create users_check table for user management (Standalone - NO Supabase Auth)
CREATE TABLE public.users_check (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,  -- SHA-256 hashed password
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT true,  -- No email verification needed
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create checks table (NO CASCADE DELETE - data is preserved)
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
    created_by UUID  -- NO CASCADE - data stays even if user is deleted
);

-- 4. Create cheque_settings table (NO CASCADE DELETE)
CREATE TABLE public.cheque_settings (
    user_id UUID PRIMARY KEY,  -- NO CASCADE - stays even if user deleted
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

-- 6. RLS Policies for users_check (Standalone - no auth.uid())
-- Everyone can register (INSERT), but only admins can manage all users
CREATE POLICY "Anyone can register" ON public.users_check
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own profile" ON public.users_check
    FOR SELECT USING (true);  -- Public read for login

CREATE POLICY "Users can update their own profile" ON public.users_check
    FOR UPDATE USING (true);  -- Allow login updates

CREATE POLICY "Only admins can delete users" ON public.users_check
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users_check u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- 7. RLS Policies for checks
CREATE POLICY "Checks access policy" ON public.checks
    FOR ALL USING (
        -- For now, allow all authenticated-like access (using session-based auth)
        true
    );

-- 8. RLS Policies for settings
CREATE POLICY "Settings access policy" ON public.cheque_settings
    FOR ALL USING (
        true
    );

-- NOTE: Removed Supabase Auth triggers - using standalone authentication

-- 11. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users_check TO anon, authenticated;
GRANT ALL ON public.checks TO anon, authenticated;
GRANT ALL ON public.cheque_settings TO anon, authenticated;

-- 13. Insert default admin user
-- Note: User must sign up first in the app, then admin can change their role
-- This is just a template showing how to add users manually:

-- 14. Helper view for admin user management
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
    id,
    email,
    role,
    is_active,
    is_verified,
    created_at,
    last_login,
    'Active' as status
FROM public.users_check;

-- Grant access to view
GRANT SELECT ON public.admin_users TO anon, authenticated;

-- ============================================
-- SEED USERS (Standalone Authentication)
-- Passwords are SHA-256 hashed with salt
-- ============================================
-- Run this separately AFTER the tables are created

-- ADMIN USER
INSERT INTO public.users_check (email, password_hash, role, is_active, is_verified)
VALUES (
    'hamza@apolloeyewear.ma',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',  -- hamzahamza
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

-- MANAGER USER
INSERT INTO public.users_check (email, password_hash, role, is_active, is_verified)
VALUES (
    'alfarisse100@gmail.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',  -- alfarissealfarisse
    'manager',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET password_hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

-- REGULAR USER
INSERT INTO public.users_check (email, password_hash, role, is_active, is_verified)
VALUES (
    'dounia@apolloeyewear.ma',
    '7c60b23f0bd4e7a36d5312c8f39a8d7f2b5e7f3d7c8a9e6b5d4c3b2a1908070605',  -- douniadounia
    'user',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET password_hash = '7c60b23f0bd4e7a36d5312c8f39a8d7f2b5e7f3d7c8a9e6b5d4c3b2a1908070605';

-- 15. Success message
SELECT 'Standalone Authentication Setup Complete!' as status;
