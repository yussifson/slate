import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Logo} from '@/components/ui/Logo';
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth} from '@/lib/AuthContext';
import { fetchCompanyBrandingFromDomain } from '@/lib/companyDomainResolver';

export default function SignUp() {
 const { t} = useTranslation();
 const navigate = useNavigate();
 const location = useLocation();
  const isElectron = isDesktopApp();
  const { isAuthenticated, user, profile, isLoadingAuth} = useAuth();
 
  const { baseDomain, currentSubdomain, isCustomDomain } = getSubdomainAndBase();
  const isRootAccount = typeof window !== 'undefined' && window.location.hostname.startsWith('account.');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const showOptavelButtonOnly = !!currentSubdomain && !isRootAccount && !isLocalhost && !isElectron;

  // Block Sign Up page on tenant subdomains & custom domains (sign up is only accessible on main domain)
  useEffect(() => {
    const isMainDomain = !currentSubdomain && !isCustomDomain;
    if (!isMainDomain && !isElectron) {
      navigate('/login', { replace: true });
    }
  }, [currentSubdomain, isCustomDomain, isElectron, navigate]);

  const handleOptavelSSO = () => {
    const idpDomain = isLocalhost ? `http://account.localhost:${window.location.port || '5173'}` : 'https://account.optavel.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${idpDomain}/sso?redirect_uri=${redirectUri}`;
  };
 const [username, setUsername] = useState('');
 const [companyName, setCompanyName] = useState('');
 const [subdomain, setSubdomain] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [loading, setLoading] = useState(false);
  const [companyBranding, setCompanyBranding] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCompanyBrandingFromDomain().then(res => {
      if (active && res?.company?.name) {
        setCompanyBranding(res.company);
      }
    });
    return () => { active = false; };
  }, []);

  // Auto-redirect if already authenticated and NOT currently registering, AND they have a company
  useEffect(() => {
   const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
   if (isMobileDevice && !localStorage.getItem('slate_has_seen_onboarding')) {
     navigate('/welcome', { replace: true });
     return;
   }

  if (!isLoadingAuth && isAuthenticated && user && profile?.company_id && !loading && !success) {
         if (isElectron) {
           if (user.role === 'student') navigate('/student-portal');
           else if (user.role === 'parent') navigate('/parent-portal');
           else if (user.role === 'super_admin') navigate('/admin');
           else navigate('/');
         } else {
           if (user.role === 'student') window.location.href = '/student-portal';
           else if (user.role === 'parent') window.location.href = '/parent-portal';
           else if (user.role === 'super_admin') window.location.href = '/admin';
           else window.location.href = '/';
         }
  }
  }, [isAuthenticated, isLoadingAuth, user, profile, loading, success]);

 // Disconnect Auth Pages from Dashboard Theme Switcher
 useEffect(() => {
 const root = window.document.documentElement;
 const originalClass = root.className;
 
 root.classList.remove('dark');
 root.classList.add('light');
 root.style.colorScheme = 'light';

 return () => {
 root.className = originalClass;
 root.style.colorScheme = '';
};
}, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });
      if (error) throw error;
      
      // If successful, auth state changes and App.jsx routing handles the rest.
      // They will be redirected to Onboarding to complete their profile.
    } catch (err) {
      setError("Google Sign-In failed: " + err.message);
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
    } catch (err) {
      setError("Apple Sign-In failed: " + err.message);
      setLoading(false);
    }
  };

 const handleSignUp = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 setSuccess('');

 try {
 if (password !== confirmPassword) {
 throw new Error("Passwords do not match");
}

  // 1. Sign up the user (or use existing authenticated user)
  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!cleanSubdomain) throw new Error("Please enter a valid subdomain");

  let authData = { user, session: null };
  let authError = null;
  let targetEmail = email;
  let targetUserId = user?.id;

  if (!isAuthenticated) {
    const emailInput = email.trim().toLowerCase();

    if (emailInput.includes('+')) {
      throw new Error('Please use a standard email address. Email aliases (containing "+") are not permitted.');
    }

    let aliasExists = false;
    try {
      const { data, error: rpcError } = await supabase.rpc('check_email_alias_exists', {
        input_email: emailInput
      });

      // Only throw if it's a real database error, not a 404 (missing RPC function)
      if (rpcError && rpcError.code !== 'PGRST104' && rpcError.status !== 404) {
        throw rpcError;
      }
      if (data) aliasExists = true;
    } catch (e) {
      console.warn("Skipping check_email_alias_exists check: RPC is not available.", e);
    }

    if (aliasExists) {
      throw new Error('An account with this email (or an alias) already exists. Please log in or request a workspace invitation from your admin.');
    }

    const res = await supabase.auth.signUp({
      email: emailInput,
      password,
      options: {
        data: {
          full_name: username,
          company_name: companyName,
          subdomain: cleanSubdomain
        }
      }
    });
    authData = res.data;
    authError = res.error;

    if (authError) throw authError;

    const newUser = authData.user;
    if (!newUser) throw new Error("Could not create user account.");
    
    if (newUser.identities && newUser.identities.length === 0) {
      throw new Error("This email is already registered. Please sign in instead.");
    }
    
    targetUserId = newUser.id;
  } else {
    // Already authenticated via SSO/Google/Apple
    targetEmail = user.email;
  }

  if (!isAuthenticated && !authData.session) {
  setSuccess("Registration successful! Please check your email to confirm your account before logging in.");
  return;
 }

 // Parse URL parameters for pricing plans
 const searchParams = new URLSearchParams(window.location.search);
 const urlPlan = searchParams.get('plan') || 'starter';
 const urlMarket = searchParams.get('market') || 'global';

 // 2. Create the company
  const companyId = crypto.randomUUID();
  const payloadData = {
     id: companyId,
     name: companyName,
     subdomain: cleanSubdomain,
     email: targetEmail,
     admin_email: targetEmail,
     created_by: targetUserId || null,
    country: null,
    subscription_plan: urlPlan,
    subscription_status: 'trial',
    status: 'active'
  };
  const payloadKeys = Object.keys(payloadData);
  const payloadVals = Object.values(payloadData).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
  await powerSync.execute(`INSERT INTO companies (${payloadKeys.join(', ')}) VALUES (${payloadKeys.map(()=>'?').join(', ')})`, payloadVals);
  
  const companyData = { ...payloadData };

 // 3. Update the profile
  const profPayload = {
     company_id: companyData.id,
     company_name: companyData.name,
     full_name: isAuthenticated ? (user?.user_metadata?.full_name || username) : username
  };
  
  // Prevent downgrading super admins
  if (user?.role !== 'super_admin') {
    profPayload.role = 'company_admin';
  }

   const profKeys = Object.keys(profPayload);
   const profVals = Object.values(profPayload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
   await powerSync.execute(`UPDATE profiles SET ${profKeys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [...profVals, targetUserId]);

  // Trigger Welcome Notification (Novu Webhook)
  try {
    const notifPayload = {
       id: crypto.randomUUID(),
       company_id: companyData.id,
       recipient_email: targetEmail,
       recipient_name: isAuthenticated ? (user?.user_metadata?.full_name || username) : username,
      title: "Welcome to Optalflow / Slate!",
      message: "Your account has been successfully created. We're excited to have you onboard. Please complete your setup in the onboarding portal.",
      type: 'info',
      is_read: false
    };
    const notifKeys = Object.keys(notifPayload);
    const notifVals = Object.values(notifPayload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
    await powerSync.execute(`INSERT INTO notifications (${notifKeys.join(', ')}) VALUES (${notifKeys.map(()=>'?').join(', ')})`, notifVals);
  } catch (err) {
    console.error("Notification failed:", err);
  }

 setSuccess("Account and WorkSlate successfully created! Redirecting to your onboarding portal...");
 
 // Auto-redirect to their new subdomain
 setTimeout(async () => {
   const { baseDomain} = getSubdomainAndBase();
   const port = window.location.port ? `:${window.location.port}` : '';
   const targetHost = `${companyData.subdomain}.${baseDomain}${port}`;
   
   let url = `${window.location.protocol}//${targetHost}/onboarding`;
   const finalUrl = new URL(url);
   
   // Always pass tokens across domains to ensure immediate authentication 
   // on the new subdomain before background sync finishes.
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.access_token && session?.refresh_token) {
     finalUrl.searchParams.set('access_token', session.access_token);
     finalUrl.searchParams.set('refresh_token', session.refresh_token);
     finalUrl.searchParams.set('action', 'auto_login');
   }
   
   const pendingPrompt = localStorage.getItem('pendingOrbitPrompt');
   if (pendingPrompt) {
     finalUrl.searchParams.set('orbit_prompt', pendingPrompt);
   }
   
   if (isElectron) {
     navigate('/onboarding');
   } else {
     window.location.href = finalUrl.toString();
   }
 }, 2000);

} catch (err) {
 setError(err.message);
} finally {
 setLoading(false);
}
};

  return (
    <div className="h-[100dvh] w-full bg-[#f8fafc] flex items-center justify-center p-3 md:p-6 overflow-hidden font-sans text-slate-900">
      <div className="w-full max-w-6xl max-h-[94vh] h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white rounded-[28px] p-6 lg:p-8 border border-white/30 shadow-2xl flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Logo & Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Logo className="w-7 h-7 text-[#0066ff]" />
                <span className="font-extrabold text-lg tracking-tight text-[#0066ff]">
                  Clipad
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066ff] bg-[#0b0f19]/10 px-2.5 py-0.5 rounded-full">
                Get Started
              </span>
            </div>

            {/* Welcome Heading */}
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0066ff] tracking-tight mb-0.5">
                {isAuthenticated ? t("complete_workslate_setup", "Complete your Workslate setup") : t("create_an_account", "Create your account")}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {isAuthenticated 
                  ? t("just_a_few_more_details", "Just a few more details to get your workspace ready.")
                  : t("create_an_account_to_start_man", "Create an account to start managing your business")
                }
              </p>
            </div>

            {!isAuthenticated && (
              <>
                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  <button
                    onClick={handleOptavelSSO}
                    type="button"
                    className="flex items-center justify-center gap-2 h-10 px-3 bg-slate-50 hover:bg-slate-100 text-[#0066ff] border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Logo hideText={true} className="w-4 h-4 text-[#0066ff]" />
                    Optavel SSO
                  </button>
                  <div className="h-10 flex justify-center items-center w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google login failed")}
                        shape="rectangular"
                        size="medium"
                        theme="outline"
                        text="signup_with"
                        width="200"
                      />
                    </GoogleOAuthProvider>
                  </div>
                </div>

                <div className="relative mb-3.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">Or register with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Form */}
            <form className="space-y-2.5" onSubmit={handleSignUp}>
              {error && <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200 font-medium">{error}</div>}
              {success && <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200 font-medium">{success}</div>}

              {!isAuthenticated && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {t("full_name", "Full Name")}
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {t("email", "Email")}
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {t("password", "Password")}
                      </label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {t("confirm_password", "Confirm Password")}
                      </label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-1.5 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("company_name", "Company Name")}</label>
                    <Input
                      type="text"
                      required
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("subdomain", "Workspace Web Address")}</label>
                    <div className="relative flex items-center">
                      <Input
                        type="text"
                        required
                        placeholder="acme"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 pr-24 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-[#0b0f19]"
                      />
                      <div className="absolute right-2 text-xs font-semibold text-slate-400 pointer-events-none">
                        .optavel.com
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-1 bg-[#0b0f19] hover:bg-[#004d52] text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t("create_workspace", "Create Workslate")
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-3 mt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">{t("already_have_an_account", "Already have an account?")} </span>
            {isElectron ? (
              <Button variant="link" onClick={() => navigate('/login')} className="text-xs font-bold text-[#0066ff] p-0 h-auto hover:underline">
                {t("sign_in", "Sign In")}
              </Button>
            ) : (
              <a href="/login" className="text-xs font-bold text-[#0066ff] hover:underline">
                {t("sign_in", "Sign In")}
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Hero Dark Green Card */}
        <div className="lg:col-span-5 bg-[#0b0f19] rounded-[28px] p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl h-full min-h-[380px]">
          {/* Background ambient light */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#f8fafc]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0066ff]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Arcana style logo mark */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              <div className="w-2 h-2 rounded-full bg-[#0066ff] animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-white/90">Instant Provisioning</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0066ff] flex items-center justify-center text-[#0066ff] shadow-md">
              <Logo className="w-5 h-5 text-[#0066ff]" />
            </div>
          </div>

          {/* Middle content */}
          <div className="relative z-10 my-auto py-4">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              Join Clipad Today
            </h2>
            <p className="text-xs text-white/80 font-normal leading-relaxed">
              Deploy your dedicated multi-tenant operating system with end-to-end security, real-time database sync, and cross-department automation.
            </p>
          </div>

          {/* Charcoal Glass Sub-Card */}
          <div className="relative z-10 bg-[#004d52]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center">✓</div>
                <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">🔐</div>
                <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-teal-600 text-[9px] font-bold text-white flex items-center justify-center">⚡</div>
                <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-[#0066ff] text-[9px] font-extrabold text-[#0066ff] flex items-center justify-center">AI</div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0ea5e9] bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                Ready in 60s
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-medium leading-snug">
              Join thousands of teams scaling their business with intelligent workflows and workspace memory.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
