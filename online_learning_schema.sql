-- Migration to add Online Learning System Phase 1 tables

-- 1. online_courses
CREATE TABLE IF NOT EXISTS public.online_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    level TEXT DEFAULT 'Beginner',
    duration_hours REAL,
    status TEXT DEFAULT 'draft',
    thumbnail_url TEXT,
    total_students INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. online_lessons
CREATE TABLE IF NOT EXISTS public.online_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    course_id UUID REFERENCES public.online_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    video_url TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. online_enrollments
CREATE TABLE IF NOT EXISTS public.online_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    course_id UUID REFERENCES public.online_courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    student_name TEXT,
    student_email TEXT,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    progress_percent REAL DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- 4. online_media
CREATE TABLE IF NOT EXISTS public.online_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size TEXT,
    url TEXT NOT NULL,
    folder TEXT DEFAULT 'General',
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.online_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for authenticated users on online_courses" 
ON public.online_courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable ALL for authenticated users on online_lessons" 
ON public.online_lessons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable ALL for authenticated users on online_enrollments" 
ON public.online_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable ALL for authenticated users on online_media" 
ON public.online_media FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for PowerSync
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_media;
