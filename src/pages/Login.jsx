import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { getSubdomainAndBase, getMainAppUrl } from '@/lib/domainUtils';
import { toast } from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ name: 'Optalflow', logo_url: null, tagline: 'Enter your credentials to access your account' });

  const { currentSubdomain, baseDomain } = getSubdomainAndBase();

  const [checkingSubdomain, setCheckingSubdomain] = useState(!!currentSubdomain);
  const [invalidSubdomain, setInvalidSubdomain] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      if (currentSubdomain) {
        try {
          // Use RPC to bypass RLS securely for public branding info
          const { data, error } = await supabase.rpc('get_company_by_subdomain', { p_subdomain: currentSubdomain });
          
          if (error) {
             console.error("Could not fetch branding via RPC", error);
             // Fallback to table query if RPC is not created yet (for development)
             const { data: tableData, error: tableError } = await supabase.from('companies').select('name, logo_url').eq('subdomain', currentSubdomain).single();
             if (tableData) {
               setBranding({ name: tableData.name || 'Optalflow', logo_url: tableData.logo_url, tagline: `Sign in to ${tableData.name || 'your workspace'}` });
             } else if (tableError) {
               console.error("Table fallback error:", tableError);
               setInvalidSubdomain(true);
             }
          } else if (data) {
            // Handle both object and array responses (depending on how the RPC was created)
            const brandData = Array.isArray(data) ? data[0] : data;
            if (brandData && brandData.name) {
              setBranding({
                name: brandData.name || 'Optalflow',
                logo_url: brandData.logo_url,
                tagline: `Sign in to ${brandData.name || 'your workspace'}`
              });
            } else {
              setInvalidSubdomain(true);
            }
          } else {
             // RPC succeeded but returned null/empty
             setInvalidSubdomain(true);
          }
        } catch (err) {
          console.error("Could not fetch branding", err);
        } finally {
          setCheckingSubdomain(false);
        }
      }
    };
    fetchBranding();
  }, [currentSubdomain]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let loginEmail = email.trim().toLowerCase();
    let targetSubdomain = currentSubdomain || workspace.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    let authData = null;
    let signInError = null;

    if (targetSubdomain) {
      // Fetch company_id for this subdomain to generate the salted email
      const { data: brandData, error: brandErr } = await supabase.rpc('get_company_by_subdomain', { p_subdomain: targetSubdomain });
      let compId = null;
      if (!brandErr && brandData) {
         const d = Array.isArray(brandData) ? brandData[0] : brandData;
         compId = d?.id;
      } 
      
      if (compId) {
         const [localPart, domain] = loginEmail.split('@');
         
         // 1. Try the primary UUID salt strategy
         let proxyEmail = `${localPart}+firm${compId.replace(/-/g, '')}@${domain}`;
         
         const primaryAuth = await supabase.auth.signInWithPassword({
            email: proxyEmail,
            password
         });
         
         authData = primaryAuth.data;
         signInError = primaryAuth.error;
         
         // 2. If it fails with Invalid Credentials, try the legacy Subdomain salt strategy
         if (signInError && signInError.message === "Invalid login credentials") {
            proxyEmail = `${localPart}+firm_${targetSubdomain}@${domain}`;
            const retry = await supabase.auth.signInWithPassword({
               email: proxyEmail,
               password
            });
            
            if (!retry.error) {
               authData = retry.data;
               signInError = null;
            }
         }
         
         if (!signInError) {
             loginEmail = proxyEmail;
         }
      } else {
         setError(`Workspace '${targetSubdomain}' not found.`);
         setLoading(false);
         return;
      }
    } else {
      // Base domain login
      const baseAuth = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      authData = baseAuth.data;
      signInError = baseAuth.error;
    }

    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Invalid email, password, or workspace." : signInError.message);
      setLoading(false);
      return;
    }
      // Check if user belongs to this subdomain
      const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', authData.user.id).single();
      if (profile?.company_id) {
        const { data: company } = await supabase.from('companies').select('name, subdomain').eq('id', profile.company_id).single();
        const companySubdomain = company?.subdomain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        if (companySubdomain && companySubdomain !== currentSubdomain && !workspace) {
          const port = window.location.port ? `:${window.location.port}` : '';
          let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/`;
          if (authData?.session?.access_token && authData?.session?.refresh_token) {
            url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
          }
          window.location.href = url;
          return;
        } else if (companySubdomain && workspace && !currentSubdomain) {
          // We are on root, redirecting to the workspace
          const port = window.location.port ? `:${window.location.port}` : '';
          let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/`;
          if (authData?.session?.access_token && authData?.session?.refresh_token) {
            url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
          }
          if (profile?.role === 'student') url += 'student-portal';
          else if (profile?.role === 'parent') url += 'parent-portal';
          window.location.href = url;
          return;
        }
      }
      
      // Route based on role
      if (profile?.role === 'student') {
        window.location.href = '/student-portal';
        return;
      } else if (profile?.role === 'parent') {
        window.location.href = '/parent-portal';
        return;
      }

      window.location.href = '/';
    } else {
      // Base domain login
      const { data: profile } = await supabase.from('profiles').select('company_id, role, onboarding_completed').eq('id', authData.user.id).single();
      
      // If Super Admin logs into the Base Domain, route directly to the admin command center
      if (profile?.role === 'super_admin') {
        window.location.href = '/admin';
        return;
      }

      if (profile?.company_id) {
        const { data: company } = await supabase.from('companies').select('name, subdomain').eq('id', profile.company_id).single();
        const companySubdomain = company?.subdomain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        if (companySubdomain) {
          const port = window.location.port ? `:${window.location.port}` : '';
          let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/`;
          if (authData?.session?.access_token && authData?.session?.refresh_token) {
            url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
          }
          
          if (profile?.role === 'student') url += 'student-portal';
          else if (profile?.role === 'parent') url += 'parent-portal';
          
          window.location.href = url;
          return;
        }
      }
      // Only send to onboarding if they don't have a company AND haven't completed it
      if (!profile?.company_id && !profile?.onboarding_completed) {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/';
      }
    }
  };

  if (checkingSubdomain) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-medium">{t("checking_workspace_access", "Checking workspace access...")}</div>
      </div>
    );
  }

  if (invalidSubdomain) {
    const mainUrl = `${getMainAppUrl()}/login`;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-xl text-center border border-border">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("workspace_not_found", "Workspace Not Found")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "we_couldn_t_find_an_organizati",
                "We couldn't find an organization matching the web address"
              )} <span className="font-semibold text-foreground">"{currentSubdomain}"</span>.
            </p>
          </div>
          <div className="pt-4 border-t border-border">
            <Button onClick={() => window.location.href = mainUrl} variant="outline" className="w-full">
              {t("go_to_main_login_portal", "Go to Main Login Portal")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <ThemeToggle />
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("sign_in_to", "Sign in to")} {branding.name}</h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">{branding.tagline}</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">{error}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t("email_address", "Email Address")}</label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 text-base bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t("password", "Password")}</label>
                  <a href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">{t("forgot_password", "Forgot password?")}</a>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 text-base bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              { !currentSubdomain && (
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t("workspace", "Workspace URL (Optional)")}</label>
                  <Input
                    placeholder="e.g. myfirm"
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    className="h-12 bg-background/50 pl-4 border-muted hover:border-primary/50 focus:border-primary transition-colors text-foreground"
                  />
                  <span className="absolute right-3 top-[34px] text-muted-foreground text-sm">.{baseDomain}</span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to workspace'}
            </Button>

            <div className="text-center mt-8 pb-12 lg:pb-0">
              <span className="text-sm text-slate-500 font-medium">{t("don_t_have_an_account", "Don't have an account?")} </span>
              <a href="/signup" className="text-sm font-bold text-blue-600 hover:underline">
                {t("create_workspace", "Create workspace")}
              </a>
            </div>
          </form>
        </div>
      </div>
      {/* Right Side: Marketing Visual */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-50 overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-300/20 to-blue-400/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 lg:p-16 flex flex-col justify-center relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[10rem] font-serif leading-none font-black text-blue-900 group-hover:text-blue-600 group-hover:opacity-10 transition-colors duration-700 pointer-events-none">"</div>
          
          <div className="relative z-10">
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(s => {
                return (<svg key={s} className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-sm" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
              })}
            </div>
            
            <p className="text-slate-800 font-medium text-2xl md:text-3xl mb-12 relative z-10 leading-relaxed tracking-tight">
              {t(
                "optalflow_completely_transform",
                "\"Optalflow completely transformed how our firm operates. We reduced administrative time by 40% in the very first month, allowing us to focus entirely on our clients.\""
              )}
            </p>
            
            <div className="flex items-center gap-5 pt-8 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shadow-inner">
                {t("mk", "MK")}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{t("mariama_kamara", "Mariama Kamara")}</p>
                <p className="text-base font-medium text-slate-500">{t("managing_partner_kamara_group", "Managing Partner, Kamara Group")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
