import React, { createContext, useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getSubdomainAndBase } from './domainUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authStep, setAuthStep] = useState("Initializing...");
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });

  const isCheckingRef = useRef(false);
  const isAuthenticatedRef = useRef(false);
  const userRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Keep ref in sync with user state to prevent stale closures
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Keep ref in sync with isAuthenticated state to prevent stale closures
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(false);
    return;
  }, []);

  const checkUserAuth = useCallback(async (passedSession = null, forceRefresh = false) => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      // Only show full-screen loader if the user is not yet authenticated
      if (!isAuthenticatedRef.current) {
        setIsLoadingAuth(true);
      }
      
      let sessionVal = passedSession;
      if (!sessionVal) {
        // Attempt to restore cross-domain session from URL query parameters manually
        const params = new URLSearchParams(window.location.search);
        const urlAccessToken = params.get('access_token');
        const urlRefreshToken = params.get('refresh_token');
        
        if (urlAccessToken && urlRefreshToken) {
            setAuthStep("Restoring cross-domain session...");
            const { data, error } = await supabase.auth.setSession({
                access_token: urlAccessToken,
                refresh_token: urlRefreshToken
            });
            if (!error && data.session) {
                sessionVal = data.session;
                // Clean the URL to remove the tokens for security
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
        
        if (!sessionVal) {
          setAuthStep("Fetching session...");
          const { data: { session: fetchedSession }, error } = await supabase.auth.getSession();
          if (error) throw error;
          sessionVal = fetchedSession;
        }
      }
      
      const sessionUser = sessionVal?.user;
      
      if (!sessionUser) {
        throw new Error("Not logged in");
      }

      // Optimization: If already authenticated with the same user ID and not forcing a refresh, return immediately.
      // This prevents redundant database queries and layout/sidebar flickering on window refocus.
      const currentUser = userRef.current;
      if (!forceRefresh && isAuthenticatedRef.current && currentUser && currentUser.id === sessionUser.id) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        isCheckingRef.current = false;
        return;
      }

      setAuthStep("Fetching profile...");
      let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
      
      setAuthStep("Checking invite/staff records...");
      const { data: staffRecord } = await supabase
        .from('staff_records')
        .select('*')
        .ilike('user_email', sessionUser.email)
        .maybeSingle();

      if (staffRecord) {
        // Fetch company name to copy to the profile
        let companyName = null;
        if (staffRecord.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', staffRecord.company_id)
            .maybeSingle();
          if (company) {
            companyName = company.name;
          }
        }

        if (profileError && profileError.code === 'PGRST116') {
          // Create new profile mapped to the existing company and role
          const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
            id: sessionUser.id,
            role: staffRecord.role || 'lawyer',
            company_id: staffRecord.company_id,
            company_name: companyName,
            phone: staffRecord.phone || null,
            department: staffRecord.department || null,
            bar_number: staffRecord.bar_number || null
          }).select().single();
          if (!insertError) {
            profile = newProfile;
            profileError = null;
          }
        } else if (profile) {
          // If the profile already exists, but its role or company is different from staff_records, sync them!
          if (
            profile.role !== staffRecord.role ||
            profile.company_id !== staffRecord.company_id ||
            profile.department !== staffRecord.department ||
            profile.bar_number !== staffRecord.bar_number ||
            !profile.company_name
          ) {
            const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({
              role: staffRecord.role,
              company_id: staffRecord.company_id,
              company_name: companyName || profile.company_name,
              phone: staffRecord.phone || profile.phone || null,
              department: staffRecord.department || null,
              bar_number: staffRecord.bar_number || null
            }).eq('id', sessionUser.id).select().single();
            if (!updateError) {
              profile = updatedProfile;
            }
          }
        }
      } else if (profileError && profileError.code === 'PGRST116') {
        // No staff record and profile is missing, fallback to default brand new company admin
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
          id: sessionUser.id,
          role: 'company_admin',
          company_name: sessionUser.user_metadata?.company_name || null
        }).select().single();
        if (!insertError) {
          profile = newProfile;
          profileError = null;
        }
      }

      setAuthStep("Checking firm subdomain...");
      let companySubdomain = null;
      let companyData = null;
      if (profile?.company_id) {
        const { data: company, error: companyError } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
        if (company) {
          companyData = company;
          companySubdomain = company.subdomain || company.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        } else if (companyError) {
          console.error("Failed to fetch company for redirect:", companyError);
        }
      }

      // Find where we are right now
      const { currentSubdomain, baseDomain } = getSubdomainAndBase();

      if (companySubdomain && currentSubdomain !== null && currentSubdomain !== companySubdomain) {
         const port = window.location.port ? `:${window.location.port}` : '';
         const targetHost = `${companySubdomain}.${baseDomain}${port}`;
         let url = `${window.location.protocol}//${targetHost}${window.location.pathname}${window.location.search}`;
         
         // Pass session to the new subdomain so they don't have to login twice
         if (sessionVal?.access_token && sessionVal?.refresh_token) {
           url += url.includes('?') ? '&' : '?';
           url += `access_token=${sessionVal.access_token}&refresh_token=${sessionVal.refresh_token}`;
         }
         
         window.location.href = url;
         return; // Stop execution as we are redirecting
      }

      // Update favicon and title if company data has it
      if (companyData) {
        if (companyData.favicon_url) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = companyData.favicon_url;
        }
        if (companyData.name) {
          document.title = `${companyData.name} - Law Management`;
        }
      }

      const newUser = { 
        ...sessionUser, 
        ...profile, 
        role: staffRecord?.role || profile?.role || 'lawyer',
        company_logo_url: companyData?.logo_url || null,
        company_name: companyData?.name || profile?.company_name || sessionUser.user_metadata?.company_name || "Optalflow",
        company_industry: companyData?.industry_type || 'law',
        email: sessionUser.email, 
        full_name: staffRecord?.full_name || profile?.full_name || sessionUser.user_metadata?.full_name || "Admin",
        subscription_plan: companyData?.subscription_plan || 'starter',
        subscription_status: companyData?.subscription_status || 'trial',
        company_created_date: companyData?.created_date || null
      };

      const updatedUser = userRef.current;
      const hasChanged = !updatedUser ||
        updatedUser.id !== newUser.id ||
        updatedUser.role !== newUser.role ||
        updatedUser.company_logo_url !== newUser.company_logo_url ||
        updatedUser.company_name !== newUser.company_name ||
        updatedUser.company_industry !== newUser.company_industry ||
        updatedUser.full_name !== newUser.full_name ||
        updatedUser.email !== newUser.email ||
        updatedUser.subscription_status !== newUser.subscription_status ||
        updatedUser.subscription_plan !== newUser.subscription_plan;

      if (hasChanged) {
        setAuthStep("Setting user...");
        setUser(newUser);
      }
      
      // Cache the fully constructed user profile for offline fallback
      try {
        localStorage.setItem('optalflow_cached_user', JSON.stringify(newUser));
      } catch (e) {}

      setIsAuthenticated(true);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      
      // OFFLINE FALLBACK: If we are offline OR any network error occurred,
      // try to use the cached user profile so the app doesn't kick to login
      const isNetworkError = !navigator.onLine || 
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error.name === 'AuthRetryableFetchError' ||
        error.name === 'TypeError';
        
      if (isNetworkError) {
        try {
          const cachedUserRaw = localStorage.getItem('optalflow_cached_user');
          if (cachedUserRaw) {
            console.warn("Offline mode active: Auth fetch failed. Using cached user profile.");
            const cachedUser = JSON.parse(cachedUserRaw);
            setUser(cachedUser);
            setIsAuthenticated(true);
            setAuthChecked(true);
            setIsLoadingAuth(false);
            isCheckingRef.current = false;
            return;
          }
        } catch (e) {}
      }

      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Not logged in' });
      setAuthChecked(true);
    } finally {
      setAuthStep("Done");
      setIsLoadingAuth(false);
      isCheckingRef.current = false;
    }
  }, []);

  // Listen to auth state changes from Supabase
  useEffect(() => {
    let isMounted = true;

    // Step 1: Perform the initial auth check ourselves.
    // We do NOT rely on onAuthStateChange's INITIAL_SESSION event because
    // it fires with null when there are cross-domain URL tokens that haven't
    // been processed yet, causing a flash redirect to /login.
    const initAuth = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;
      await checkUserAuth(null);
    };
    initAuth();

    // Step 2: Listen to SUBSEQUENT auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      
      // Skip the INITIAL_SESSION event - we handle init ourselves above
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        // Clear cached user on explicit sign out
        try { localStorage.removeItem('optalflow_cached_user'); } catch(e) {}
        return;
      }

      if (newSession) {
        // For SIGNED_IN, TOKEN_REFRESHED events
        checkUserAuth(newSession);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [checkUserAuth]);

  const refreshUser = useCallback(async () => {
    await checkUserAuth(null, true);
    return userRef.current;
  }, [checkUserAuth]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const contextValue = useMemo(() => ({
    user, 
    isAuthenticated, 
    isLoadingAuth,
    authStep,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    authChecked,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
    refreshUser
  }), [
    user,
    isAuthenticated,
    isLoadingAuth,
    authStep,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    authChecked,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
    refreshUser
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};