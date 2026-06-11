import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import { useAuth } from '@/hooks/useAuth';

export default function SignUp() {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  
  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && user) {
      if (user.role === 'student') window.location.href = '/student-portal';
      else if (user.role === 'parent') window.location.href = '/parent-portal';
      else if (user.role === 'super_admin') window.location.href = '/admin';
      else window.location.href = '/';
    }
  }, [isAuthenticated, isLoadingAuth, user]);

  const [username, setUsername] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      // 2. Create the company
      const { data: companyData, error: compError } = await supabase.from('companies').insert({
        name: companyName,
        subdomain: cleanSubdomain,
        email: email,
        industry_type: 'law', // Temporarily set to 'law' to pass DB constraints. Onboarding will update it.
        education_level: null,
        country: null,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        status: 'active'
      }).select().single();

      if (compError) throw compError;

      // 3. Update the profile
      const { error: profError } = await supabase.from('profiles').update({
        company_id: companyData.id,
        company_name: companyData.name,
        full_name: username,
        role: 'company_admin'
      }).eq('id', user.id);

      if (profError) throw profError;

      setSuccess("Account and WorkSlate successfully created! Redirecting to your onboarding portal...");
      
      // Auto-redirect to their new subdomain
      setTimeout(() => {
        const { baseDomain } = getSubdomainAndBase();
        const port = window.location.port ? `:${window.location.port}` : '';
        const targetHost = `${companyData.subdomain}.${baseDomain}${port}`;
        
        let url = `${window.location.protocol}//${targetHost}/onboarding`;
        if (authData?.session?.access_token && authData?.session?.refresh_token) {
           url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
        }
        
        window.location.href = url;
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex flex-col mb-8">
            <Logo className="w-10 h-10" />
            <span className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">by Optavel</span>
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">{t("create_an_account", "Create your account")}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t(
              "create_an_account_to_start_man",
              "Create an account to start managing your business"
            )}</p>
          </div>
          
          <form className="space-y-3" onSubmit={handleSignUp}>
            {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 font-medium">{error}</div>}
            {success && <div className="rounded-xl bg-slate-50 p-3 text-xs text-primary border border-slate-200 font-medium">{success}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("username", "Your Name")}</label>
                <Input
                  required
                  placeholder="John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("email", "Email Address")}</label>
                <Input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("organization_name", "Organization")}
                  </label>
                  <Input
                    required
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("subdomain", "Subdomain")}
                  </label>
                  <Input
                    required
                    placeholder="acmecorp"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("password", "Password")}</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("confirm_password", "Confirm Password")}</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 text-sm bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary text-white font-bold rounded-lg shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 mt-2 text-sm active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create workspace'}
            </Button>
          </form>

            <div className="text-center mt-4 pb-12 lg:pb-0">
              <span className="text-xs text-slate-500 font-medium">{t("already_have_an_account", "Already have an account?")} </span>
              <a href="/login" className="text-xs font-bold text-primary hover:underline">
                {t("sign_in", "Sign in")}
              </a>
            </div>
        </div>
      </div>
      {/* Right Side: Marketing Visual */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-50 overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>

        <div className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 lg:p-16 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-primary/90 mb-8 uppercase tracking-[0.2em]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              {t("universal_os", "Universal Operating System")}
            </div>
            
            <h3 className="text-4xl 2xl:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t(
                "a_workspace_that_grows_with_yo",
                "The foundation for modern institutions."
              )}
            </h3>
            <p className="text-lg text-slate-600 font-light max-w-lg leading-relaxed">
              {t(
                "slate_unifies_your_team_s_",
                "Slate unifies your entire organization's workflow, operations, and billing into one beautifully orchestrated platform."
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-16 border-t border-slate-100 pt-10">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-primary mb-5 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("set_up_in_seconds", "Instant Provisioning")}</h4>
              <p className="text-sm text-slate-500 font-light leading-relaxed">{t(
                "no_engineering_required_just_i",
                "Subdomain, databases, and core infrastructure deployed seamlessly."
              )}</p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-primary mb-5 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-wide">{t("bank_grade_security", "Enterprise Security")}</h4>
              <p className="text-sm text-slate-500 font-light leading-relaxed">{t(
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
