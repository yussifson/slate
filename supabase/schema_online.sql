-- Online Learning Platform Suite Schema

CREATE TABLE IF NOT EXISTS public.online_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    instructor_id UUID,
    instructor_name TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    level TEXT,
    duration_hours NUMERIC(5, 1),
    thumbnail_url TEXT,
    status TEXT DEFAULT 'Draft',
    rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.online_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_id UUID,
    course_id UUID REFERENCES public.online_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    content TEXT,
    order_index INTEGER,
    is_preview BOOLEAN DEFAULT FALSE,
    duration_minutes INTEGER,
    resources JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.online_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_id UUID,
    course_id UUID REFERENCES public.online_courses(id) ON DELETE CASCADE,
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_percent NUMERIC(5, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Active',
    last_accessed TIMESTAMP WITH TIME ZONE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url TEXT
);

CREATE TABLE IF NOT EXISTS public.online_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_id UUID,
    course_id UUID REFERENCES public.online_courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.online_lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Quiz',
    questions JSONB DEFAULT '[]'::jsonb,
    passing_score NUMERIC(5, 2),
    time_limit_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS public.online_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_id UUID,
    enrollment_id UUID REFERENCES public.online_enrollments(id) ON DELETE CASCADE,
    student_id UUID,
    student_name TEXT,
    course_id UUID REFERENCES public.online_courses(id),
    course_title TEXT,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    credential_id TEXT UNIQUE,
    pdf_url TEXT,
    status TEXT DEFAULT 'Valid'
);

-- Realtime Publication
BEGIN;
  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_courses;
  EXCEPTION WHEN OTHERS THEN END $$;

  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_lessons;
  EXCEPTION WHEN OTHERS THEN END $$;

  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_enrollments;
  EXCEPTION WHEN OTHERS THEN END $$;

  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_assessments;
  EXCEPTION WHEN OTHERS THEN END $$;

  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_certificates;
  EXCEPTION WHEN OTHERS THEN END $$;
COMMIT;
