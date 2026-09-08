-- ============================================================
-- Fix: admin_create_user RPC for the Optavel/Slate Supabase project
-- This fixes the "email not authorized" error when company_admin
-- tries to add new team members on the Career/Slate platform.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Project: wmabgiafwamxkcgxyhee (current Slate/Optavel project)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT,
  user_company_id UUID,
  user_full_name TEXT,
  user_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  caller_role TEXT;
BEGIN
  -- Get the calling user's role
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- Only admins can use this function
  IF caller_role NOT IN ('super_admin', 'admin', 'company_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions: only super_admin, admin, or company_admin can create users';
  END IF;

  -- Create the auth user (email pre-confirmed — no email confirmation required)
  INSERT INTO auth.users (
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    lower(trim(user_email)),
    crypt(user_password, gen_salt('bf')),
    NOW(), -- pre-confirm the email — no email required
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'role', user_role,
      'company_id', user_company_id,
      'full_name', user_full_name
    ) || user_metadata,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_user_id;

  -- Ensure profile is created (the trigger may handle this, but be explicit)
  INSERT INTO profiles (id, company_id, role, email, full_name)
  VALUES (new_user_id, user_company_id, user_role, lower(trim(user_email)), user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  RETURN new_user_id;
EXCEPTION
  WHEN unique_violation THEN
    -- User email already exists in auth.users — return their existing ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = lower(trim(user_email));
    RETURN new_user_id;
END;
$$;

-- Grant execute permission to authenticated users
-- (The function itself checks for admin role internally)
GRANT EXECUTE ON FUNCTION admin_create_user TO authenticated;
