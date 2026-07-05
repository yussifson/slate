-- ==============================================================================
-- PHASE 4: FIX PROFILES ROLE CHECK
-- ==============================================================================
-- Root Cause Analysis:
-- Users with custom roles (e.g., "Elder / Deacon") are triggering a database error
-- because the `profiles` table has a strict `profiles_role_check` constraint.
-- When this fails, the user's `company_id` is never saved to the database.
-- Without a `company_id`, PowerSync cannot sync any data back to the user,
-- causing all locally created data (Pharmacy, Real Estate, etc.) to disappear on refresh.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Also drop any other potential role checks on the profiles table
DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass AND conname LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name) || ' CASCADE;';
    END LOOP;
END $$;
