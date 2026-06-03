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
 * @param {string} fullName - The full name of the user
 * @returns {object} { user, error }
 */
export const registerSchoolUser = async (proxyEmail, password, role, companyId, fullName) => {
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
    
    // If email confirmations are disabled, signUp returns a valid session.
    // We use this newly created session to bypass RLS and insert their profile.
    if (data?.session) {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
      });
      
      const { error: profileError } = await tempClient.from('profiles').insert([
        {
          id: data.user.id,
          company_id: companyId,
          role: role,
          email: proxyEmail,
          full_name: fullName,
        }
      ]);
      
      if (profileError) {
        console.error(`Error creating ${role} profile:`, profileError);
        // It's not a fatal error for auth, but they might not route properly
      }
    }
    
    return { user: data.user, error: null };
  } catch (err) {
    console.error(`Exception during ${role} registration:`, err);
    return { error: err };
  }
};
