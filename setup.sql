
-- 1. Create checks table with the exact columns requested
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

-- 2. Create cheque_settings table
CREATE TABLE IF NOT EXISTS public.cheque_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'FINANSSE SOLUTIONS',
    currency TEXT DEFAULT 'MAD',
    timezone TEXT DEFAULT 'Africa/Casablanca',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    fiscal_start DATE DEFAULT '2024-01-01',
    alert_before BOOLEAN DEFAULT true,
    alert_delay BOOLEAN DEFAULT true,
    alert_method TEXT DEFAULT 'app',
    alert_days INTEGER DEFAULT 3,
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheque_settings ENABLE ROW LEVEL SECURITY;

-- 4. Updated Policies for checks
-- حذف السياسة القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can manage their own checks" ON public.checks;

-- إنشاء سياسة جديدة تسمح للمدراء (admin و user المخصص) بالوصول الكامل، وللبقية ببياناتهم فقط
CREATE POLICY "Checks access policy" ON public.checks 
    FOR ALL USING (
        auth.uid() = created_by OR 
        (auth.jwt() ->> 'email') = 'admin@apollo.com' OR 
        (auth.jwt() ->> 'email') = 'user@apollo.com'
    );

-- 5. Updated Policies for settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.cheque_settings;

CREATE POLICY "Settings access policy" ON public.cheque_settings 
    FOR ALL USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'email') = 'admin@apollo.com'
    );
