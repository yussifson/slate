import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

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

export const generateSaltedEmail = (realEmail, companyId) => {
  const cleanEmail = realEmail.trim().toLowerCase();
  const [localPart, domain] = cleanEmail.split('@');
  return `${localPart}+firm${companyId.replace(/-/g, '')}@${domain}`;
};

/**
 * Registers a new user for school/firm modules.
 * @param {string} realEmail - The user's actual email
 * @param {string} password - The generated or chosen password
 * @param {string} role - The role to assign
 * @param {string} companyId - The current workspace ID
 * @param {string} fullName - The full name of the user
 * @param {boolean} forcePasswordReset - Whether the user must reset password on first login
 * @returns {object} { user, error }
 */
export const registerSchoolUser = async (realEmail, password, role, companyId, fullName, forcePasswordReset = false) => {
  try {
    const cleanEmail = realEmail.trim().toLowerCase();
    
    // 1. Pre-check if they already exist in this specific firm
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .eq('company_id', companyId);
      
    if (existingProfiles && existingProfiles.length > 0) {
      return { error: { message: 'already registered in this firm' } };
    }

    // 2. Create the user directly via secure RPC to bypass email rate limits
    const { data: newUserId, error } = await supabaseAdmin.rpc('admin_create_user', {
      user_email: cleanEmail,
      user_password: password,
      user_role: role,
      user_company_id: companyId,
      user_full_name: fullName,
      user_metadata: { force_password_reset: forcePasswordReset }
    });
    
    if (error) {
      // Fallback if RPC doesn't exist (e.g. before migration runs)
      if (error.message && (error.message.includes('function admin_create_user does not exist') || error.message.includes('function gen_salt'))) {
         const { data: fallbackData, error: fallbackError } = await supabaseAdmin.auth.signUp({
           email: cleanEmail,
           password: password,
           options: { data: { role: role, company_id: companyId, full_name: fullName, force_password_reset: forcePasswordReset } }
         });
         if (fallbackError) return { error: fallbackError };
         return { user: fallbackData.user };
      }
      return { error };
    }
    
    // If email confirmations are disabled, signUp returns a valid session.
    // We use this newly created session to bypass RLS and insert their profile.
    if (data && data.session && data.user) {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
      });
      
      const { error: profileError } = await tempClient.from('profiles').insert([
        {
          id: data.user.id,
          company_id: companyId,
          role: role,
          email: cleanEmail
        }
      ]);
      
      if (profileError) {
        console.error(`Error creating ${role} profile:`, profileError);
      }
      return { user: data.user, error: null };
    }
    
    // For RPC success, the profile is created within the RPC
    return { user: { id: newUserId }, error: null };
  } catch (err) {
    console.error(`Exception during ${role} registration:`, err);
    return { error: err };
  }
};
