import React, { createContext, useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
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
  const isExplicitLogoutRef = useRef(false);

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
      
      // Parse URL parameters ONCE before any scrubbing occurs
      const urlParams = new URLSearchParams(window.location.search);
      const setupModeParam = urlParams.get('setup_mode');
      const activeModulesParam = urlParams.get('active_modules');
      
      if (!sessionVal) {
        // Attempt to restore cross-domain session from URL query parameters manually
        const urlAccessToken = urlParams.get('access_token');
        const urlRefreshToken = urlParams.get('refresh_token');
        
        if (urlAccessToken && urlRefreshToken) {
            setAuthStep("Restoring cross-domain session...");
            
            // ALWAYS clean the URL immediately to prevent retry loops on refresh
            const params = new URLSearchParams(window.location.search);
            params.delete('access_token');
            params.delete('refresh_token');
            const newSearch = params.toString();
            const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);

            const { data, error } = await supabase.auth.setSession({
                access_token: urlAccessToken,
                refresh_token: urlRefreshToken
            });
            
            if (!error && data.session) {
                sessionVal = data.session;
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
      let { data: profile, error: profileError } = await powerSync.execute('SELECT * FROM profiles WHERE id = ?', [sessionUser.id]).then(res => ({ data: res.rows._array })).single();
      
      // Save transferred config to local storage using the correct company ID
      if (setupModeParam && profile?.company_id) {
          localStorage.setItem(`setup_mode_${profile.company_id}`, setupModeParam);
          if (activeModulesParam) {
             localStorage.setItem(`active_modules_${profile.company_id}`, activeModulesParam);
          } else {
             localStorage.removeItem(`active_modules_${profile.company_id}`);
          }
          
          // Clean the URL without reloading
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
      }

      setAuthStep("Checking invite/staff records...");
      let { data: staffRecord } = await supabase
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
                    const _p = {
            id: sessionUser.id,
            role: staffRecord.role || 'lawyer',
            company_id: staffRecord.company_id,
            company_name: companyName,
            email: sessionUser.email?.toLowerCase() || null,
            phone: staffRecord.phone || null,
            department: staffRecord.department || null,
            bar_number: staffRecord.bar_number || null
          };
          const _k = Object.keys(_p);
          const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`INSERT INTO profiles (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
          const __resNew = await powerSync.execute(`SELECT * FROM profiles WHERE id = ?`, [sessionUser.id]);
          const newProfile = __resNew.rows && __resNew.rows.length > 0 ? __resNew.rows.item(0) : null;
          const insertError = null;
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
            !profile.company_name ||
            profile.email?.toLowerCase() !== sessionUser.email?.toLowerCase()
          ) {
                        const _p = {
              role: staffRecord.role,
              company_id: staffRecord.company_id,
              company_name: companyName || profile.company_name,
              email: sessionUser.email?.toLowerCase() || profile.email || null,
              phone: staffRecord.phone || profile.phone || null,
              department: staffRecord.department || null,
              bar_number: staffRecord.bar_number || null
            };
            const _k = Object.keys(_p);
            const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
            await powerSync.execute(`UPDATE profiles SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, sessionUser.id]);
            const __resUpd = await powerSync.execute(`SELECT * FROM profiles WHERE id = ?`, [sessionUser.id]);
            const updatedProfile = __resUpd.rows && __resUpd.rows.length > 0 ? __resUpd.rows.item(0) : null;
            const updateError = null;
            if (!updateError) {
              profile = updatedProfile;
            }
          }
        }

        if (staffRecord.id && !staffRecord.user_id) {
          await (async () => {
        const _p = { user_id: sessionUser.id };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE staff_records SET ${_k.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._v, staffRecord.id]);
      })();
        }
      } else if (profileError && profileError.code === 'PGRST116') {
        let invitedCompanyId = sessionUser.user_metadata?.company_id || null;
        let invitedRole = sessionUser.user_metadata?.role || 'company_admin';

        if (!invitedCompanyId && sessionUser.email) {
          const { data: accessRecord } = await supabase
            .from('univ_accesscontrols')
            .select('*')
            .ilike('email', sessionUser.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (accessRecord) {
             invitedCompanyId = accessRecord.company_id;
             invitedRole = accessRecord.role;
          }
        }

                const _p = {
          id: sessionUser.id,
          role: 'lawyer', // Default role for net-new independent signups
          company_id: companyIdToUse,
          company_name: companyNameToUse,
          email: sessionUser.email?.toLowerCase() || null,
          full_name: sessionUser.user_metadata?.full_name || ''
        };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`INSERT INTO profiles (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
        const __resNew = await powerSync.execute(`SELECT * FROM profiles WHERE id = ?`, [sessionUser.id]);
        const newProfile = __resNew.rows && __resNew.rows.length > 0 ? __resNew.rows.item(0) : null;
        const insertError = null;
        
        if (!insertError) {
          profile = newProfile;
          profileError = null;
        } else {
          console.error("Failed to insert profile on login:", insertError);
        }
      } else if (profile && !profile.company_id && sessionUser.user_metadata?.company_id) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            company_id: sessionUser.user_metadata.company_id,
            email: sessionUser.email?.toLowerCase() || profile.email || null,
          })
          .eq('id', sessionUser.id)
          .select()
          .single();
        if (!updateError) profile = updatedProfile;
      }

      setAuthStep("Checking firm subdomain...");
      let companySubdomain = null;
      let companyData = null;
      if (profile?.company_id) {
        const { data: company, error: companyError } = await powerSync.execute('SELECT * FROM companies WHERE id = ?', [profile.company_id]).then(res => ({ data: res.rows._array })).single();
        if (company) {
          companyData = company;
          companySubdomain = company.subdomain || company.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        } else if (companyError) {
          console.error("Failed to fetch company for redirect:", companyError);
        }
      }

      // Find where we are right now
      const { currentSubdomain, baseDomain } = getSubdomainAndBase();

      if (companySubdomain && currentSubdomain !== companySubdomain) {
         if (currentSubdomain === null) {
             // Logged in via root domain, redirect to their base company immediately!
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
         } else {
             // They are trying to access a DIFFERENT workspace subdomain
             setAuthStep("Checking multi-workspace access...");
             
             // 1. Get the company ID for the current subdomain
             const { data: targetCompany } = await supabase.rpc('get_company_by_subdomain', { p_subdomain: currentSubdomain });
             let targetCompanyId = null;
             let tComp = null;
             if (targetCompany) {
                tComp = Array.isArray(targetCompany) ? targetCompany[0] : targetCompany;
                targetCompanyId = tComp?.id;
             } else {
                // fallback if RPC fails
                const { data: tCompData } = await powerSync.execute('SELECT * FROM companies WHERE subdomain = ?', [currentSubdomain]).then(res => ({ data: res.rows._array })).maybeSingle();
                if (tCompData) {
                   tComp = tCompData;
                   targetCompanyId = tCompData.id;
                }
             }

             if (targetCompanyId) {
                // 2. Check if user is in univ_accesscontrols for this target company
                const { data: accessRecord } = await supabase
                  .from('univ_accesscontrols')
                  .select('*')
                  .eq('company_id', targetCompanyId)
                  .ilike('email', sessionUser.email)
                  .maybeSingle();

                // 3. Or check staff_records
                const { data: staffRecordAlt } = await supabase
                  .from('staff_records')
                  .select('*')
                  .eq('company_id', targetCompanyId)
                  .ilike('user_email', sessionUser.email)
                  .maybeSingle();

                if (accessRecord || staffRecordAlt) {
                   // Access granted! Override the profile and company data in-memory
                   console.log("Multi-workspace access granted to:", currentSubdomain);
                   
                   // Override profile
                   profile.company_id = targetCompanyId;
                   profile.role = accessRecord?.role || staffRecordAlt?.role || 'lawyer';
                   profile.company_name = tComp.name;

                   // Override companyData
                   companyData = tComp;
                   companySubdomain = currentSubdomain; // This prevents the redirect below!
                   
                   // Set the staff record so it's used below
                   if (staffRecordAlt) {
                      staffRecord = staffRecordAlt;
                   } else if (accessRecord) {
                      staffRecord = { role: accessRecord.role, full_name: accessRecord.user_name };
                   }
                }
             }

             // If still different (no access granted), THEN redirect back to THEIR firm!
             if (currentSubdomain !== companySubdomain) {
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
         }
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
          let suffix = "Workspace";
          if (companyData.industry_type === 'law') suffix = "Law Management";
          else if (companyData.industry_type === 'school' || companyData.industry_type === 'highschool') suffix = "Education Platform";
          else if (companyData.industry_type === 'hospital') suffix = "Hospital System";
          else if (companyData.industry_type === 'hotel') suffix = "Property Management";
          else if (companyData.industry_type === 'orbit_build') suffix = "Digital Workspace";
          
          document.title = `${companyData.name} - ${suffix}`;
        }
      }

      setAuthStep("Fetching available workspaces...");
      let availableCompanies = [];
      try {
        const __resUA = await powerSync.execute(`SELECT company_id FROM univ_accesscontrols WHERE email LIKE ?`, [sessionUser.email]);
        const uAccess = __resUA.rows ? (__resUA.rows._array || Array.from(__resUA.rows)) : [];
        const __resSA = await powerSync.execute(`SELECT company_id FROM staff_records WHERE user_email LIKE ?`, [sessionUser.email]);
        const sAccess = __resSA.rows ? (__resSA.rows._array || Array.from(__resSA.rows)) : [];
        
        const cIds = new Set();
        if (profile?.company_id) cIds.add(profile.company_id);
        if (companyData?.id) cIds.add(companyData.id);
        (uAccess || []).forEach(r => r.company_id && cIds.add(r.company_id));
        (sAccess || []).forEach(r => r.company_id && cIds.add(r.company_id));
        
        if (cIds.size > 0) {
          const _cIdsArr = Array.from(cIds);
          let comps = [];
          if (_cIdsArr.length > 0) {
            const _pl = _cIdsArr.map(()=>'?').join(',');
            const __resC = await powerSync.execute(`SELECT id, name, subdomain FROM companies WHERE id IN (${_pl})`, _cIdsArr);
            comps = __resC.rows ? (__resC.rows._array || Array.from(__resC.rows)) : [];
          }
          if (comps) availableCompanies = comps;
        }
      } catch(e) {
        console.error("Failed to fetch available workspaces:", e);
      }

      const newUser = { 
        ...sessionUser, 
        ...profile, 
        role: staffRecord?.role || profile?.role || 'lawyer',
        company_logo_url: companyData?.logo_url || null,
        company_name: companyData?.name || profile?.company_name || sessionUser.user_metadata?.company_name || "Slate",
        company_industry: companyData?.industry_type || 'law',
        email: sessionUser.email, 
        full_name: staffRecord?.full_name || profile?.full_name || sessionUser.user_metadata?.full_name || "Admin",
        avatar_url: sessionUser.user_metadata?.avatar_url || profile?.avatar_url || null,
        subscription_plan: companyData?.subscription_plan || 'starter',
        subscription_status: companyData?.subscription_status || 'trial',
        company_created_date: companyData?.created_date || null,
        available_companies: availableCompanies
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
        updatedUser.avatar_url !== newUser.avatar_url ||
        updatedUser.subscription_status !== newUser.subscription_status ||
        updatedUser.subscription_plan !== newUser.subscription_plan;

      if (hasChanged) {
        setAuthStep("Setting user...");
        setUser(newUser);
      }
      
      // Cache the fully constructed user profile for offline fallback
      try {
        localStorage.setItem('slate_cached_user', JSON.stringify(newUser));
      } catch (e) {}

      setIsAuthenticated(true);
      setAuthChecked(true);
    } catch (error) {
      if (error.message !== 'Not logged in') {
        console.error('User auth check failed:', error);
      }
      
      // OFFLINE FALLBACK: If we are offline OR any network error occurred,
      // try to use the cached user profile so the app doesn't kick to login
      const isNetworkError = !navigator.onLine || 
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error.message?.includes('Too Many Requests') ||
        (error.message === 'Not logged in' && !navigator.onLine) ||
        error.status === 429 ||
        error.status >= 500 ||
        error.code === 'PGRST116' ||
        error.name === 'AuthRetryableFetchError' ||
        error.name === 'TypeError';
        
      if (isNetworkError) {
        try {
          const cachedUserRaw = localStorage.getItem('slate_cached_user');
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
        if (!isExplicitLogoutRef.current) {
          // Implicit sign out (e.g. from failed token refresh during offline mode).
          // Ignore it to allow the offline fallback cache to work!
          console.warn("Ignored implicit SIGNED_OUT event to preserve offline mode cache.");
          return;
        }

        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        // Clear cached user on explicit sign out
        try { localStorage.removeItem('slate_cached_user'); } catch(e) {}
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
    isExplicitLogoutRef.current = true;
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