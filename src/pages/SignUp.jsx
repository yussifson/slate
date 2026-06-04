import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { getSubdomainAndBase } from '@/lib/domainUtils';

export default function SignUp() {
  const { t } = useTranslation();
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [industryType, setIndustryType] = useState('law');
  const [educationLevel, setEducationLevel] = useState('primary');
  const [country, setCountry] = useState('Ghana');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Could not create user account.");

      const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanSubdomain) throw new Error("Please enter a valid subdomain");

      // 2. Create the company
      const { data: companyData, error: compError } = await supabase.from('companies').insert({
        name: companyName,
        subdomain: cleanSubdomain,
        email: email,
        industry_type: industryType,
        education_level: industryType === 'school' ? educationLevel : null,
        country: country,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        status: 'active'
      }).select().single();

      if (compError) throw compError;

      // 3. Update the profile
      const { error: profError } = await supabase.from('profiles').update({
        company_id: companyData.id,
        company_name: companyData.name,
        role: 'company_admin'
      }).eq('id', user.id);

      if (profError) throw profError;

      setSuccess("Account and Workspace successfully created! Redirecting to your login portal...");
      
      // Auto-redirect to their new subdomain
      setTimeout(() => {
        const { baseDomain } = getSubdomainAndBase();
        const port = window.location.port ? `:${window.location.port}` : '';
        const targetHost = `${companyData.subdomain}.${baseDomain}${port}`;
        
        window.location.href = `${window.location.protocol}//${targetHost}/login`;
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <ThemeToggle />
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
            {success && <div className="rounded-xl bg-green-50 p-3 text-xs text-green-600 border border-green-100 font-medium">{success}</div>}
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t("company_name", "Company Name")}
                  </label>
                  <Input
                    required
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t("subdomain", "Subdomain")}
                  </label>
                  <Input
                    required
                    placeholder="acmecorp"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("industry_type", "Industry")}</label>
                <Select value={industryType} onValueChange={setIndustryType}>
                  <SelectTrigger className="w-full h-10 text-sm">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law">Law Firm</SelectItem>
                    <SelectItem value="school">Education / School</SelectItem>
                    <SelectItem value="hospital">Healthcare / Hospital</SelectItem>
                    <SelectItem value="retail">Retail / POS</SelectItem>
                    <SelectItem value="hotel">Hospitality / Hotel</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="church">Church / Ministry</SelectItem>
                    <SelectItem value="hr">HR & ERP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {industryType === 'school' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("education_level", "Education Level")}</label>
                  <Select value={educationLevel} onValueChange={setEducationLevel}>
                    <SelectTrigger className="w-full h-10 text-sm border-blue-200 bg-blue-50/50">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preschool">Preschool / Kindergarten</SelectItem>
                      <SelectItem value="primary">Primary / Elementary</SelectItem>
                      <SelectItem value="jhs">Junior High School</SelectItem>
                      <SelectItem value="shs">Senior High School</SelectItem>
                      <SelectItem value="vocational">Vocational / Technical</SelectItem>
                      <SelectItem value="university">University / College</SelectItem>
                      <SelectItem value="online">Online Learning Platform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("workspace_region", "Workspace Region")}</label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full h-10 text-sm">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ghana">{t("ghana", "Ghana")}</SelectItem>
                    <SelectItem value="Nigeria">{t("nigeria", "Nigeria")}</SelectItem>
                    <SelectItem value="Sierra Leone">{t("sierra_leone", "Sierra Leone")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("admin_email", "Admin Email")}</label>
                <Input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("admin_password", "Admin Password")}</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 text-sm"
                />
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
              <a href="/login" className="text-xs font-bold text-blue-600 hover:underline">
                {t("sign_in", "Sign in")}
              </a>
            </div>
        </div>
      </div>
      {/* Right Side: Marketing Visual */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-50 overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-300/20 to-blue-400/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 lg:p-16 flex flex-col justify-between relative group">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 mb-6 uppercase tracking-widest">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              {t("scale_faster", "Scale Faster")}
            </div>
            
            <h3 className="text-4xl 2xl:text-5xl font-extrabold text-slate-900 mb-5 leading-[1.1] tracking-tight">
              {t(
                "a_workspace_that_grows_with_yo",
                "A workspace that grows with your ambition."
              )}
            </h3>
            <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed">
              {t(
                "optalflow_unifies_your_team_s_",
                "Optalflow unifies your team's workflow, client communication, and billing into one single, beautifully simple platform."
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12 border-t border-slate-100 pt-8">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">{t("set_up_in_seconds", "Set up in seconds")}</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(
                "no_engineering_required_just_i",
                "No engineering required. Just invite your team and start working."
              )}</p>
            </div>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">{t("bank_grade_security", "Bank-grade security")}</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(
                "soc2_compliant_infrastructure_",
                "SOC2 compliant infrastructure to keep your client data safe."
              )}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
