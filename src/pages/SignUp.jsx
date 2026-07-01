import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo} from '@/components/ui/Logo';
import { getSubdomainAndBase} from '@/lib/domainUtils';
import { useAuth} from '@/lib/AuthContext';

export default function SignUp() {
 const { t} = useTranslation();
 const { isAuthenticated, user, isLoadingAuth} = useAuth();
 
 const [username, setUsername] = useState('');
 const [companyName, setCompanyName] = useState('');
 const [subdomain, setSubdomain] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [loading, setLoading] = useState(false);

 // Auto-redirect if already authenticated and NOT currently registering
 useEffect(() => {
 if (!isLoadingAuth && isAuthenticated && user && !loading && !success) {
 if (user.role === 'student') window.location.href = '/student-portal';
 else if (user.role === 'parent') window.location.href = '/parent-portal';
 else if (user.role === 'super_admin') window.location.href = '/admin';
 else window.location.href = '/';
}
}, [isAuthenticated, isLoadingAuth, user, loading, success]);

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

 const handleSignUp = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 setSuccess('');

 try {
 if (password !== confirmPassword) {
 throw new Error("Passwords do not match");
}

 // 1. Sign up the user
 const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
 if (!cleanSubdomain) throw new Error("Please enter a valid subdomain");

 const { data: authData, error: authError} = await supabase.auth.signUp({
 email,
 password,
 options: {
 data: {
 full_name: username,
 company_name: companyName,
 subdomain: cleanSubdomain
}
}
});

 if (authError) throw authError;

 const user = authData.user;
 if (!user) throw new Error("Could not create user account.");
 
 if (user.identities && user.identities.length === 0) {
 throw new Error("This email is already registered. Please sign in instead.");
}

 if (!authData.session) {
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
    email: email,
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
    full_name: username
  };
  
  // Prevent downgrading super admins
  if (user?.role !== 'super_admin') {
    profPayload.role = 'company_admin';
  }

  const profKeys = Object.keys(profPayload);
  const profVals = Object.values(profPayload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
  await powerSync.execute(`UPDATE profiles SET ${profKeys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [...profVals, user.id]);

  // Trigger Welcome Notification (Novu Webhook)
  try {
    const notifPayload = {
      id: crypto.randomUUID(),
      company_id: companyData.id,
      recipient_email: email,
      recipient_name: username,
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
 setTimeout(() => {
 const { baseDomain} = getSubdomainAndBase();
 const port = window.location.port ? `:${window.location.port}` : '';
 const targetHost = `${companyData.subdomain}.${baseDomain}${port}`;
 
 let url = `${window.location.protocol}//${targetHost}/onboarding`;
 const finalUrl = new URL(url);
 
 if (authData?.session?.access_token && authData?.session?.refresh_token) {
   finalUrl.searchParams.set('access_token', authData.session.access_token);
   finalUrl.searchParams.set('refresh_token', authData.session.refresh_token);
 }
 
 const pendingPrompt = localStorage.getItem('pendingOrbitPrompt');
 if (pendingPrompt) {
   finalUrl.searchParams.set('orbit_prompt', pendingPrompt);
 }
 
 window.location.href = finalUrl.toString();
}, 2000);

} catch (err) {
 setError(err.message);
} finally {
 setLoading(false);
}
};

 return (
 <div className="min-h-screen flex flex-col lg:flex-row bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Left Side: Form */}
 <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
 <div className="max-w-md w-full mx-auto">
 <div className="flex flex-col mb-8">
 <Logo className="w-10 h-10" />
 <span className="text-[10px] text-[#71717a] dark:text-gray-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>
 </div>
 
 <div className="mb-8">
 <h1 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">{t("create_an_account", "Create your account")}</h1>
 <p className="text-xs text-slate-500 font-medium mt-1 tracking-[0.04em]">{t(
 "create_an_account_to_start_man",
 "Create an account to start managing your business"
 )}</p>
 </div>
 
 <form className="space-y-3" onSubmit={handleSignUp}>
 {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border-[0.5px] border-black/9 dark:border-white/8 border-red-100 font-medium tracking-[0.04em]">{error}</div>}
 {success && <div className="rounded-xl bg-slate-50 p-3 text-xs text-primary border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 font-medium tracking-[0.04em]">{success}</div>}
 
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("username", "Your Name")}</label>
 <Input
 required
 placeholder="John Doe"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("email", "Email Address")}</label>
 <Input
 type="email"
 required
 placeholder="john@example.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
 {t("organization_name", "Organization")}
 </label>
 <Input
 required
 placeholder="Acme Corp"
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
 {t("subdomain", "Subdomain")}
 </label>
 <Input
 required
 placeholder="acmecorp"
 value={subdomain}
 onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("password", "Password")}</label>
 <Input
 type="password"
 required
 placeholder="••••••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">{t("confirm_password", "Confirm Password")}</label>
 <Input
 type="password"
 required
 placeholder="••••••••••••"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>
 </div>

 <Button 
 type="submit" 
 className="w-full h-10 bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary text-white font-semibold rounded-xl -primary/20 transition-all hover:-translate-y-0.5 mt-2 text-sm active:scale-[0.98]"
 disabled={loading}
 >
 {loading ? 'Creating...' : 'Create workspace'}
 </Button>
 </form>

 <div className="text-center mt-4 pb-12 lg:pb-0">
 <span className="text-xs text-slate-500 font-medium tracking-[0.04em]">{t("already_have_an_account", "Already have an account?")} </span>
 <a href="/login" className="text-xs font-semibold text-primary hover:underline tracking-[0.04em]">
 {t("sign_in", "Sign in")}
 </a>
 </div>
 </div>
 </div>
 {/* Right Side: Marketing Visual */}
 <div className="hidden lg:flex flex-1 relative items-center justify-center bg-primary/[0.03] overflow-hidden">
 {/* Abstract Pattern Background */}
 <div 
 className="absolute -inset-[100%] animate-[spin_60s_linear_infinite] opacity-40"
 style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.15) 25%, transparent 50%, rgba(16,185,129,0.05) 75%, transparent 100%)'}}
 />
 <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl"></div>

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
 {t(
 "a_workspace_that_grows_with_yo",
 "The foundation for modern institutions."
 )}
 </h3>
 <p className="text-lg text-slate-600 font-medium max-w-lg leading-relaxed">
 {t(
 "slate_unifies_your_team_s_",
 "Slate unifies your entire organization's workflow, operations, and billing into one beautifully orchestrated platform."
 )}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-8 mt-16 border-t border-primary/10 pt-10">
 <div className="group/feature">
 <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-5 group-hover/feature:bg-primary/10 transition-colors duration-300">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
 </div>
 <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("set_up_in_seconds", "Instant Provisioning")}</h4>
 <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(
 "no_engineering_required_just_i",
 "Subdomain, databases, and core infrastructure deployed seamlessly."
 )}</p>
 </div>
 
 <div className="group/feature">
 <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-5 group-hover/feature:bg-primary/10 transition-colors duration-300">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
 </div>
 <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("bank_grade_security", "Enterprise Security")}</h4>
 <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(
 "soc2_compliant_infrastructure_",
 "Isolated sub-tenants with Row-Level Security ensuring absolute data privacy."
 )}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
