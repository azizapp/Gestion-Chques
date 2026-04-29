-- ============================================
-- CHIQUE PRO - Database Setup
-- ============================================

-- 1. Create users_check table to store user roles
CREATE TABLE IF NOT EXISTS public.users_check (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Create checks table
CREATE TABLE IF NOT EXISTS public.checks (
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

-- 3. Create cheque_settings table
CREATE TABLE IF NOT EXISTS public.cheque_settings (
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

-- 4. Enable RLS on all tables
ALTER TABLE public.users_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheque_settings ENABLE ROW LEVEL SECURITY;

-- 5. Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists in users_check
    IF NOT EXISTS (SELECT 1 FROM public.users_check WHERE user_id = NEW.id) THEN
        -- Determine role based on email
        INSERT INTO public.users_check (user_id, email, role, is_active, created_by)
        VALUES (
            NEW.id,
            NEW.email,
            CASE 
                WHEN NEW.email = 'admin@apollo.com' THEN 'admin'
                WHEN NEW.email = 'admin@chique.com' THEN 'admin'
                WHEN NEW.email LIKE '%@apollo.com' THEN 'manager'
                ELSE 'user'
            END,
            true,
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-create user in users_check on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users_check SET last_login = now() WHERE user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger to update last login
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_last_login();

-- 9. RLS Policies for users_check
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_check;
CREATE POLICY "Users can view own profile" ON public.users_check
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users_check;
CREATE POLICY "Users can update own profile" ON public.users_check
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. RLS Policies for checks (admins/managers see all, users see only their own)
DROP POLICY IF EXISTS "Checks access policy" ON public.checks;
CREATE POLICY "Checks access policy" ON public.checks
    FOR ALL USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.users_check 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 11. RLS Policies for settings
DROP POLICY IF EXISTS "Settings access policy" ON public.cheque_settings;
CREATE POLICY "Settings access policy" ON public.cheque_settings
    FOR ALL USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users_check 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 12. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users_check TO anon, authenticated;
GRANT ALL ON public.checks TO anon, authenticated;
GRANT ALL ON public.cheque_settings TO anon, authenticated;
GRANT ALL ON public.handle_new_user TO anon, authenticated;
GRANT ALL ON public.update_last_login TO anon, authenticated;

-- 13. Verify setup
SELECT 'Setup Complete!' as status;
