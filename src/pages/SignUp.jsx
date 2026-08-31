import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo} from '@/components/ui/Logo';
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth} from '@/lib/AuthContext';
import IndustryFeatureShowcase from '@/components/shared/IndustryFeatureShowcase';
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
  <div className="h-[100dvh] w-full overflow-y-auto bg-white">
  <div className="min-h-full flex flex-col lg:flex-row bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Left Side: Form */}
 <div className="flex-1 flex flex-col pt-12 lg:pt-20 px-8 lg:px-16 pb-12">
 <div className="max-w-lg w-full mx-auto">
 <div className="flex flex-col mb-8">
 <Logo className="w-10 h-10" />
 <span className="text-[10px] text-[#71717a] dark:text-gray-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>
 </div>
 
  <div className="mb-8">
  <h1 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">
    {isAuthenticated ? t("complete_workslate_setup", "Complete your Workslate setup") : t("create_an_account", "Create your account")}
  </h1>
  <p className="text-xs text-slate-500 font-medium mt-1 tracking-[0.04em]">
    {isAuthenticated 
      ? t("just_a_few_more_details", "Just a few more details to get your workspace ready.")
      : t("create_an_account_to_start_man", "Create an account to start managing your business")
    }
  </p>
  </div>
 
  {!isAuthenticated && (
  <div className="flex flex-col gap-3 mb-6">
    <button
      onClick={handleOptavelSSO}
      type="button"
      className="flex items-center justify-center gap-2 h-12 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-base font-semibold transition-colors shadow-sm"
    >
      <Logo hideText={true} className="w-5 h-5 text-primary" />
      Continue with Optavel
    </button>
    <div className="h-12 flex justify-center items-center w-full overflow-hidden rounded-xl border border-primary/20 bg-white hover:bg-slate-50 transition-colors shadow-sm">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google login failed")}
          shape="rectangular"
          size="large"
          theme="outline"
          text="signup_with"
          width="360"
        />
      </GoogleOAuthProvider>
    </div>
    {/*
    <button 
      onClick={handleAppleSignIn}
      type="button"
      className="flex items-center justify-center gap-2 h-12 w-full bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium transition-colors shadow-sm"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.365 21.43c-1.39.95-2.81 1.05-4.14.04-1.36-.97-2.73-1.01-4.22.04-1.63 1.1-3.23.95-4.62-.54-1.22-1.29-2.3-3.26-3.08-5.72-.81-2.58-.87-5.01-.22-7.14.65-2.12 1.83-3.79 3.5-4.8 1.48-.89 3.09-1.04 4.54-.53 1.43.49 2.53 1.05 3.73 1.05 1.14 0 2.45-.63 4.12-1.18 1.87-.61 3.66-.45 5.15.54 1.17.76 2.05 1.83 2.55 3.04-1.6.93-2.45 2.37-2.37 4.18.09 1.94 1.17 3.44 2.89 4.25-1.1 2.3-2.5 4.39-4.22 6.01l-.23.23c-1.21 1.15-2.31 1.6-3.38.53z" />
      </svg>
      Continue with Apple
    </button>
    */}
  </div>
  )}

  {!isAuthenticated && (
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-border"></div>
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-card px-2 text-slate-500 font-semibold tracking-wider">Or register with email</span>
      </div>
    </div>
  )}

  <form className="space-y-4" onSubmit={handleSignUp}>
  {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border-[0.5px] border-black/9 dark:border-white/8 border-red-100 font-medium tracking-[0.04em]">{error}</div>}
  {success && <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 border-[0.5px] border-emerald-100 font-medium tracking-[0.04em]">{success}</div>}
 
  {!isAuthenticated && (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
          {t("full_name", "Full Name")}
        </label>
        <Input
          type="text"
          required
          placeholder="Jane Doe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
          {t("email", "Email")}
        </label>
        <Input
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
            {t("password", "Password")}
          </label>
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
            {t("confirm_password", "Confirm Password")}
          </label>
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          />
        </div>
      </div>
    </div>
  )}

  <div className="pt-2 border-t border-slate-100">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-800">{t("workslate_details", "Workslate Details")}</h3>
      <p className="text-xs text-slate-500">{t("workslate_details_desc", "This will be the dedicated workspace for your team.")}</p>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("company_name", "Company Name")}</label>
        <Input
          type="text"
          required
          placeholder="Acme Corp"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("subdomain", "Workspace Web Address")}</label>
        <div className="relative flex items-center">
          <Input
            type="text"
            required
            placeholder="acme"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 pr-32 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          />
          <div className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
            .optavel.com
          </div>
        </div>
      </div>
    </div>
  </div>

  <Button type="submit" className="w-full h-12 text-base font-medium transition-all active:scale-[0.98]" disabled={loading}>
    {loading ? t("creating_account", "Creating account...") : t("create_workspace", "Create Workslate")}
  </Button>
  </form>

  <div className="text-center mt-10">
    <span className="text-sm text-slate-500 font-medium tracking-[0.04em]">{t("already_have_an_account", "Already have an account?")} </span>
    {isElectron ? (
      <Button variant="link" onClick={() => navigate('/login')} className="text-sm font-semibold text-primary p-0 h-auto hover:underline tracking-[0.04em]">
        {t("sign_in", "Sign In")}
      </Button>
    ) : (
      <a href="/login" className="text-sm font-semibold text-primary hover:underline tracking-[0.04em]">
        {t("sign_in", "Sign In")}
      </a>
    )}
  </div>
 </div>
 </div>
 
 {/* Right Side: Marketing Visual */}
 <div className="hidden lg:flex flex-1 relative items-center justify-center bg-primary/[0.03] overflow-hidden p-8">
 {/* Abstract Pattern Background */}
 <div 
   className="absolute -inset-[100%] animate-[spin_60s_linear_infinite] opacity-40"
   style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.15) 25%, transparent 50%, rgba(16,185,129,0.05) 75%, transparent 100%)'}}
 />
 <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl"></div>

 {(currentSubdomain || companyBranding?.name) ? (
   <IndustryFeatureShowcase companyName={companyBranding?.name} industryType={companyBranding?.industry_type} />
 ) : (
   <div className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[2rem] border-[0.5px] border-primary/20 shadow-[0_20px_80px_-20px_rgba(16,185,129,0.15)] p-12 lg:p-16 flex flex-col justify-between group hover:shadow-[0_20px_80px_-15px_rgba(16,185,129,0.2)] hover:bg-white/90 transition-all duration-500">
     <div>
       <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-8 uppercase tracking-widest">
         <span className="flex h-2 w-2 relative">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
         </span>
         {t("universal_os", "Universal Operating System")}
       </div>
       
       <h3 className="text-4xl 2xl:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
         {t("a_workspace_that_grows_with_yo", "The foundation for modern institutions.")}
       </h3>
       <p className="text-lg text-slate-600 font-medium max-w-lg leading-relaxed">
         {t("slate_unifies_your_team_s_", "Slate unifies your entire organization's workflow, operations, and billing into one beautifully orchestrated platform.")}
       </p>
     </div>

     <div className="grid grid-cols-2 gap-8 mt-16 border-t border-primary/10 pt-10">
       <div className="group/feature">
         <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-5 group-hover/feature:bg-primary/10 transition-colors duration-300">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
         </div>
         <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("set_up_in_seconds", "Instant Provisioning")}</h4>
         <p className="text-sm text-slate-500 font-medium leading-relaxed">{t("no_engineering_required_just_i", "Subdomain, databases, and core infrastructure deployed seamlessly.")}</p>
       </div>
       
       <div className="group/feature">
         <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-5 group-hover/feature:bg-primary/10 transition-colors duration-300">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
         </div>
         <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("bank_grade_security", "Enterprise Security")}</h4>
         <p className="text-sm text-slate-500 font-medium leading-relaxed">{t("soc2_compliant_infrastructure_", "Isolated sub-tenants with Row-Level Security ensuring absolute data privacy.")}</p>
       </div>
     </div>
   </div>
 )}
 </div>
 </div>
  </div>
 );
}
