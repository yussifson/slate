-- ========================================================
-- PHASE 4: AI-Powered HCM & Smart Docs Migration
-- Run this in Supabase SQL Editor
-- ========================================================

-- 1. Extend documents table with Smart Docs intelligence columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS key_obligations TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS risks TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signature_status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT;

-- 2. Smart Folders
CREATE TABLE IF NOT EXISTS smart_folders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    color TEXT
);

-- 3. Document Knowledge Graph Links
CREATE TABLE IF NOT EXISTS smart_doc_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    relationship TEXT
);

-- 4. HR Recruitment: Job Postings
CREATE TABLE IF NOT EXISTS hr_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    type TEXT,
    status TEXT DEFAULT 'open',
    description TEXT,
    requirements TEXT
);

-- 5. HR Recruitment: Applicants
CREATE TABLE IF NOT EXISTS hr_applicants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    resume_url TEXT,
    stage TEXT DEFAULT 'applied',
    ai_score NUMERIC,
    interview_score NUMERIC,
    notes TEXT
);

-- 6. HR Attendance
CREATE TABLE IF NOT EXISTS hr_attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    date TEXT NOT NULL,
    clock_in TEXT,
    clock_out TEXT,
    status TEXT DEFAULT 'present',
    location_lat NUMERIC,
    location_lng NUMERIC
);

-- 7. HR Performance Reviews
CREATE TABLE IF NOT EXISTS hr_performance_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    reviewer_id TEXT,
    period TEXT,
    type TEXT,
    score NUMERIC,
    strengths TEXT,
    weaknesses TEXT,
    status TEXT DEFAULT 'draft'
);

-- 8. HR Training Courses
CREATE TABLE IF NOT EXISTS hr_training_courses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_mandatory INTEGER DEFAULT 0
);

-- 9. HR Training Records (per employee)
CREATE TABLE IF NOT EXISTS hr_training_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_at TEXT DEFAULT NOW()::TEXT,
    company_id TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT DEFAULT 'not_started',
    completed_at TEXT,
    expiry_date TEXT
);

-- 10. Enable RLS on all new tables
ALTER TABLE smart_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_doc_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_records ENABLE ROW LEVEL SECURITY;

-- 11. Add to PowerSync and Realtime publications (safe idempotent loop)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'smart_folders','smart_doc_links','hr_jobs','hr_applicants',
        'hr_attendance','hr_performance_reviews','hr_training_courses','hr_training_records'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        BEGIN EXECUTE format('ALTER PUBLICATION powersync ADD TABLE %I', t);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END LOOP;
END $$;
