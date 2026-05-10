-- 1. PROFILES TABLE
-- This table stores all employee information.
-- NOTE: Maudy (maudy@lazuardi.sch.id) is the designated System Administrator.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    niy TEXT,
    name TEXT NOT NULL,
    nik TEXT,
    bpjs TEXT,
    email TEXT UNIQUE NOT NULL,
    npwp TEXT,
    unit TEXT,
    position TEXT,
    contract_status TEXT,
    entry_date DATE,
    gender TEXT,
    birth_place TEXT,
    birth_date DATE,
    education_level TEXT,
    education TEXT,
    address TEXT,
    phone TEXT,
    marital_status TEXT,
    role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    photo_url TEXT,
    idp_link TEXT,
    emergency_contact JSONB,
    career_history JSONB DEFAULT '[]'::jsonb,
    cuti_data JSONB DEFAULT '{"tahunan": 12, "besar": 0}'::jsonb,
    long_service_leave JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-ADMIN TRIGGER FOR MAUDY
-- This ensures maudy@lazuardi.sch.id is always an admin even if manually edited
CREATE OR REPLACE FUNCTION public.handle_admin_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'maudy@lazuardi.sch.id' THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_upsert_admin ON public.profiles;
CREATE TRIGGER on_profile_upsert_admin
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_assignment();

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. ATTENDANCE CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Attendance Claims
ALTER TABLE public.attendance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own claims" 
ON public.attendance_claims FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all claims" 
ON public.attendance_claims FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert their own claims" 
ON public.attendance_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update claim status" 
ON public.attendance_claims FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. ATTENDANCE RECORDS (Daily Check-in/out)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in JSONB,
    check_out JSONB,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own attendance" 
ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all attendance" 
ON public.attendance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can manage their own attendance" 
ON public.attendance_records FOR ALL USING (auth.uid() = user_id);

-- 4. REGULATIONS (CATEGORIES with Items as JSONB)
CREATE TABLE IF NOT EXISTS public.regulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read regulations" ON public.regulations FOR SELECT USING (true);
CREATE POLICY "Admins can manage regulations" ON public.regulations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. HELP CENTER (FAQ CATEGORIES with Items as JSONB)
CREATE TABLE IF NOT EXISTS public.help_center_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.help_center_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read help categories" ON public.help_center_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage help categories" ON public.help_center_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. DASHBOARD STATS
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
    id TEXT PRIMARY KEY, -- 'bar_data' or 'area_data'
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stats" ON public.dashboard_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage stats" ON public.dashboard_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
