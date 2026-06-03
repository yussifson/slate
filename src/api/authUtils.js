import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a secondary client specifically for admin tasks that don't persist session
// This prevents the admin from being logged out when creating users
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'supabase.admin.token'
  }
});

/**
 * Registers a new user for school modules (e.g. Student or Parent).
 * @param {string} proxyEmail - The derived proxy email (e.g., STU-1001@school.optalflow.com)
 * @param {string} password - The generated default password
 * @param {string} role - The role to assign (student, parent)
 * @param {string} companyId - The current workspace ID
 * @returns {object} { user, error }
 */
export const registerSchoolUser = async (proxyEmail, password, role, companyId) => {
  try {
    // 1. Create the user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signUp({
      email: proxyEmail,
      password: password,
      options: {
        data: {
          role: role,
          company_id: companyId
        }
      }
    });
    
    if (error) {
      console.error(`Error creating ${role} auth user:`, error);
      return { error };
    }
    
    // Note: A trigger on the backend should insert this into public.profiles
    // if using Supabase standard practices, but just in case we need it here,
    // we would use a service_role key to bypass RLS, which we don't have.
    // The existing app seems to handle profile creation or role routing securely.
    
    return { user: data.user, error: null };
  } catch (err) {
    console.error(`Exception during ${role} registration:`, err);
    return { error: err };
  }
};
