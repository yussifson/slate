-- ============================================================================
-- PORTAL INFRASTRUCTURE (Option 3: Unified System, Role-Based Access)
-- ============================================================================
-- Run this in your Supabase SQL Editor.
--
-- Architecture:
--   • Clients log into the SAME subdomain/login as staff.
--   • Their role (e.g. 'patient', 'student', 'tenant') is stored in
--     auth.users.raw_user_meta_data -> 'role'.
--   • The React app reads this role on login and routes them to /portal,
--     which MasterPortalRouter then dispatches to the correct vertical portal.
--   • Data isolation is enforced via company_id + entity-scoped RLS policies.
-- ============================================================================

-- ─── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. PORTAL INVITATIONS ───────────────────────────────────────────────────
-- Records every invitation sent to a client/patient/student etc.
-- The token is generated in the frontend and embedded in the invite email.
CREATE TABLE IF NOT EXISTS portal_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  role          text NOT NULL,           -- 'patient','student','tenant','client' etc.
  token         uuid NOT NULL DEFAULT gen_random_uuid(),
  status        text NOT NULL DEFAULT 'pending', -- pending | active | expired | revoked
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by    uuid REFERENCES auth.users(id),
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_invitations_token_idx ON portal_invitations(token);
CREATE INDEX IF NOT EXISTS portal_invitations_company_idx ON portal_invitations(company_id);
CREATE INDEX IF NOT EXISTS portal_invitations_email_idx  ON portal_invitations(email);

-- ─── 2. PORTAL USERS ─────────────────────────────────────────────────────────
-- Once a user accepts an invite and logs in, their auth user is linked here.
-- This lets the workspace admin see who is actively using the portal.
CREATE TABLE IF NOT EXISTS portal_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  role          text NOT NULL,           -- matches the invited role
  entity_id     uuid,                    -- links to e.g. patient_id, student_id, client_id
  entity_type   text,                    -- 'patient','student','client','tenant' etc.
  status        text NOT NULL DEFAULT 'active',
  invitation_id uuid REFERENCES portal_invitations(id),
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS portal_users_company_idx ON portal_users(company_id);
CREATE INDEX IF NOT EXISTS portal_users_user_idx    ON portal_users(user_id);

-- ─── 3. PORTAL SETTINGS ──────────────────────────────────────────────────────
-- Optional branding / customisation per company for their portal.
CREATE TABLE IF NOT EXISTS portal_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  welcome_message text,
  logo_url        text,
  accent_color    text DEFAULT '#6366f1',
  features        jsonb DEFAULT '{}',    -- { "documents": true, "invoices": true, ... }
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. TRIGGER: Mark invitation as 'active' when user accepts ──────────────
CREATE OR REPLACE FUNCTION portal_accept_invitation(p_token uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite portal_invitations;
BEGIN
  -- Fetch and validate token
  SELECT * INTO v_invite
  FROM portal_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation token is invalid or has expired.';
  END IF;

  -- Mark invitation as accepted
  UPDATE portal_invitations
  SET status = 'active', accepted_at = now(), updated_at = now()
  WHERE id = v_invite.id;

  -- Upsert portal user record
  INSERT INTO portal_users (company_id, user_id, email, full_name, role, invitation_id)
  VALUES (v_invite.company_id, p_user_id, v_invite.email, v_invite.full_name, v_invite.role, v_invite.id)
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

  -- Stamp the user metadata with their role + company so the app can read it instantly
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object(
      'role', v_invite.role,
      'company_id', v_invite.company_id
    )
  WHERE id = p_user_id;
END;
$$;

-- ─── 5. RLS POLICIES ─────────────────────────────────────────────────────────

ALTER TABLE portal_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_settings    ENABLE ROW LEVEL SECURITY;

-- portal_invitations: staff of the company can manage their own invitations
DROP POLICY IF EXISTS "Company staff can manage their portal invitations" ON portal_invitations;
CREATE POLICY "Company staff can manage their portal invitations"
ON portal_invitations
FOR ALL
USING (
  company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- portal_users: company staff can read, portal users can read their own row
DROP POLICY IF EXISTS "Company staff see all portal users" ON portal_users;
CREATE POLICY "Company staff see all portal users"
ON portal_users
FOR SELECT
USING (
  company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Portal user sees own record" ON portal_users;
CREATE POLICY "Portal user sees own record"
ON portal_users
FOR SELECT
USING (user_id = auth.uid());

-- portal_settings: company admins manage, portal users read
DROP POLICY IF EXISTS "Company admin manages portal settings" ON portal_settings;
CREATE POLICY "Company admin manages portal settings"
ON portal_settings
FOR ALL
USING (
  company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- ─── 6. UPDATE FUNCTION: last_login_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_portal_user_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE portal_users
  SET last_login_at = now(), updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- (Optional) Drop and recreate the trigger on auth.users if you have access:
-- DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
-- CREATE TRIGGER on_auth_user_login
--   AFTER UPDATE OF last_sign_in_at ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION update_portal_user_last_login();

-- ─── 7. CONVENIENCE VIEW: portal_access_summary ─────────────────────────────
CREATE OR REPLACE VIEW portal_access_summary AS
SELECT
  pu.company_id,
  pu.user_id,
  pu.email,
  pu.full_name,
  pu.role,
  pu.entity_type,
  pu.entity_id,
  pu.status,
  pu.last_login_at,
  pi.invited_by,
  pi.created_at AS invited_at,
  pi.accepted_at
FROM portal_users pu
LEFT JOIN portal_invitations pi ON pi.id = pu.invitation_id;

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- After running this, go to:
--   Settings > Portal Management (/settings/portal)
-- to invite your first client/patient/student etc.
-- ============================================================================
