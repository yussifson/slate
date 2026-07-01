import { useTranslation} from "react-i18next";
import React, { useState, useEffect, useMemo } from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { supabase} from "@/api/supabaseClient";
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useAuth} from '@/lib/AuthContext';
import { AlertCircle} from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo} from '@/components/ui/Logo';
import { getSubdomainAndBase, getMainAppUrl} from '@/lib/domainUtils';
import { toast} from 'react-hot-toast';

const LOGIN_QUOTES = [
  { quote: "\"Slate completely transformed how our firm operates. We reduced administrative time by 40% in the very first month.\"", name: "Mariama Kamara", initials: "MK" },
  { quote: "\"The level of automation is unprecedented. I can finally focus on strategic growth rather than day-to-day operations.\"", name: "David Chen", initials: "DC" },
  { quote: "\"An incredibly intuitive platform. It felt like it was custom-built for our exact workflow needs from day one.\"", name: "Sarah Jenkins", initials: "SJ" },
  { quote: "\"We migrated our entire team in less than a week. The adoption rate was 100% because the interface is so seamless.\"", name: "Michael Rossi", initials: "MR" },
  { quote: "\"Finally, an enterprise solution that doesn't feel like a legacy dinosaur. It's fast, modern, and genuinely a joy to use.\"", name: "Elena Rostova", initials: "ER" },
  { quote: "\"The analytics dashboard alone saved us dozens of hours in reporting each month. The ROI was immediate.\"", name: "James Thorne", initials: "JT" },
  { quote: "\"Everything we need is unified in one place. No more jumping between five different tabs to close a single deal.\"", name: "Aisha Patel", initials: "AP" },
  { quote: "\"The customizable workflows adapt perfectly to our unconventional processes. We didn't have to change how we work.\"", name: "Liam O'Connor", initials: "LO" },
  { quote: "\"Security and speed were our top priorities. This platform delivered on both without compromising on design.\"", name: "Nina Matsumoto", initials: "NM" },
  { quote: "\"Customer support is practically unnecessary because the UI is so straightforward. But when we do reach out, they are stellar.\"", name: "Omar Farooq", initials: "OF" },
  { quote: "\"I've used every tool on the market over the last decade. This is the first one that actually feels built for the future.\"", name: "Rachel Green", initials: "RG" },
  { quote: "\"The seamless integrations mean we didn't have to rip and replace our existing tech stack. It just orchestrates everything better.\"", name: "Thomas Wright", initials: "TW" },
  { quote: "\"We scaled from 10 to 100 employees in a year, and the platform handled the growth effortlessly without any hiccups.\"", name: "Chloe Dubois", initials: "CD" },
  { quote: "\"The design is absolutely gorgeous. It proves that enterprise software doesn't have to be ugly and clunky.\"", name: "Marcus Johnson", initials: "MJ" },
  { quote: "\"The AI features are actually useful, not just gimmicks. They actively predict what I need to do next.\"", name: "Sophie Taylor", initials: "ST" },
  { quote: "\"A masterclass in user experience. Even our least tech-savvy team members picked it up in an afternoon.\"", name: "William Davies", initials: "WD" },
  { quote: "\"The mobile experience is just as powerful as the desktop app. I can manage my entire business from my phone.\"", name: "Isabella Martinez", initials: "IM" },
  { quote: "\"Data visibility across departments improved by 100%. We finally have a single source of truth for the entire company.\"", name: "Lucas Silva", initials: "LS" },
  { quote: "\"The best software investment we've made this year. It paid for itself in saved labor costs within the first quarter.\"", name: "Emily Watson", initials: "EW" },
  { quote: "\"It's rare to find a platform that balances deep functionality with such a clean, minimalist interface. Truly exceptional.\"", name: "Alexander Kim", initials: "AK" }
];

export default function Login() {
 const { t} = useTranslation();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [workspace, setWorkspace] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [branding, setBranding] = useState({ name: 'Slate', logo_url: null, tagline: 'Enter your credentials to access your account'});

 const randomQuote = useMemo(() => {
    return LOGIN_QUOTES[Math.floor(Math.random() * LOGIN_QUOTES.length)];
 }, []);

 const { currentSubdomain, baseDomain} = getSubdomainAndBase();
 const { isAuthenticated, user, isLoadingAuth} = useAuth();

 const [checkingSubdomain, setCheckingSubdomain] = useState(!!currentSubdomain);
 const [invalidSubdomain, setInvalidSubdomain] = useState(false);

 // Auto-redirect if already authenticated
 useEffect(() => {
 if (!isLoadingAuth && isAuthenticated && user) {
 if (user.role === 'student') window.location.href = '/student-portal';
 else if (user.role === 'parent') window.location.href = '/parent-portal';
 else if (user.role === 'super_admin' && !currentSubdomain) window.location.href = '/admin';
 else window.location.href = '/';
}
}, [isAuthenticated, isLoadingAuth, user, currentSubdomain]);

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

 useEffect(() => {
 const fetchBranding = async () => {
     if (currentSubdomain) {
     // ... existing code for subdomain ...
     try {
       // Use RPC to bypass RLS securely for public branding info
       let brandData = null;
       const { data: rpcData, error: rpcError} = await supabase.rpc('get_company_by_subdomain', { p_subdomain: currentSubdomain});
       
       if (!rpcError && rpcData) {
         const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
         if (row?.id) brandData = row;
       }

       if (!brandData) {
       console.log("RPC missed, trying direct table query...");
        const { data: directData} = await supabase.from('companies').select('id, name, logo_url, logo_light_url, tagline').or(`subdomain.eq.${currentSubdomain},custom_domain.eq.${currentSubdomain}`).maybeSingle();
        
        if (directData) {
        brandData = directData;
        } else {
        const { data: tableData} = await powerSync.execute('SELECT id, name, logo_url, logo_light_url, tagline FROM companies WHERE subdomain = ? OR custom_domain = ? LIMIT 1', [currentSubdomain, currentSubdomain]).then(res => ({ data: res.rows._array[0] || null})).catch(() => ({ data: null}));
        brandData = tableData;
        }
       }

       // Clean up accidentally duplicated URLs
       const cleanLogo = (url) => {
         if (!url) return url;
         const httpPos = url.indexOf('http', 4);
         if (httpPos > 0) return url.substring(0, httpPos);
         return url;
       };

       // Company exists → always show login. Only show "Not Found" if company is truly missing.
       if (brandData?.id) {
        setBranding({
        name: brandData.name || 'Your Workslate',
        logo_url: cleanLogo(brandData.logo_url || brandData.logo_light_url),
        tagline: brandData.tagline || `Sign in to ${brandData.name || 'your workslate'}`
        });
       } else {
         // Fallback to local storage if DB misses entirely
         try {
           const cached = localStorage.getItem('slate_cached_user');
           if (cached) {
             const parsed = JSON.parse(cached);
             if (parsed.company_name) {
               setBranding({
                 name: parsed.company_name || 'Your Workslate',
                 logo_url: cleanLogo(parsed.company_logo_url || null),
                 tagline: parsed.company_tagline || `Sign in to ${parsed.company_name || 'your workslate'}`
               });
               setCheckingSubdomain(false);
               return; // Skip invalid subdomain
             }
           }
         } catch(e) {}
         
         setInvalidSubdomain(true);
       }
     } catch (err) {
       console.error("Could not fetch branding", err);
     } finally {
       setCheckingSubdomain(false);
     }
     } else {
       try {
         const cached = localStorage.getItem('slate_cached_user');
         if (cached) {
           const parsed = JSON.parse(cached);
           const cleanLogo = (url) => {
             if (!url) return url;
             const httpPos = url.indexOf('http', 4);
             if (httpPos > 0) return url.substring(0, httpPos);
             return url;
           };
           if (parsed.company_name || parsed.company_logo_url) {
              setBranding({
                name: parsed.company_name || 'Your Workslate',
                logo_url: cleanLogo(parsed.company_logo_url || null),
                tagline: parsed.company_tagline || `Sign in to ${parsed.company_name || 'your workslate'}`
              });
           }
         }
       } catch(e) {}
       setCheckingSubdomain(false);
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
  const { data: brandData, error: brandErr} = await supabase.rpc('get_company_by_subdomain', { p_subdomain: targetSubdomain});
  let compId = null;
  if (!brandErr && brandData) {
    const d = Array.isArray(brandData) ? brandData[0] : brandData;
    compId = d?.id;
  } 
  
  if (!compId) {
    try {
      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.company_id) compId = parsed.company_id;
      }
    } catch(e) {}
  }
  
  const rawLoginEmail = loginEmail;
  const [localPart, domain] = rawLoginEmail.split('@');
  
  signInError = { message: "Invalid login credentials" }; // Initial state to trigger fallback chain
  
  // 1. Try the primary UUID salt strategy
  if (compId) {
    const proxyEmail = `${localPart}+firm${compId.replace(/-/g, '')}@${domain}`;
    const primaryAuth = await supabase.auth.signInWithPassword({ email: proxyEmail, password });
    if (!primaryAuth.error) {
      authData = primaryAuth.data;
      signInError = null;
      loginEmail = proxyEmail;
    } else {
      signInError = primaryAuth.error;
    }
  }
  
  // 2. If it fails with Invalid Credentials (or compId was null), try the legacy Subdomain salt strategy
  if (signInError && signInError.message === "Invalid login credentials") {
    const proxyEmail = `${localPart}+firm_${targetSubdomain}@${domain}`;
    const retry = await supabase.auth.signInWithPassword({ email: proxyEmail, password });
    if (!retry.error) {
      authData = retry.data;
      signInError = null;
      loginEmail = proxyEmail;
    } else {
      signInError = retry.error;
    }
  }
  
  // 3. If that STILL fails, try the RAW unsalted email
  if (signInError && signInError.message === "Invalid login credentials") {
    const rawRetry = await supabase.auth.signInWithPassword({ email: rawLoginEmail, password });
    if (!rawRetry.error) {
      authData = rawRetry.data;
      signInError = null;
      loginEmail = rawLoginEmail;
    } else {
      signInError = rawRetry.error;
    }
  }
  
  if (signInError && signInError.message === "Invalid login credentials" && !compId) {
     // If everything failed and we didn't even have a compId, show the workspace error
     setError(`Workspace '${targetSubdomain}' not found.`);
     setLoading(false);
     return;
  }
} else {
 // Base domain login
 const baseAuth = await supabase.auth.signInWithPassword({
 email: loginEmail,
 password});
 authData = baseAuth.data;
 signInError = baseAuth.error;
}

 if (signInError) {
 setError(signInError.message === "Invalid login credentials" ? "Invalid email, password, or workspace." : signInError.message);
 setLoading(false);
 return;
}
 
 if (targetSubdomain) {
    // Check if user belongs to this subdomain via Supabase directly (local DB might not be synced yet)
    const { data: profile } = await supabase.from('profiles').select('company_id, role, onboarding_completed').eq('id', authData.user.id).single();
    
    // Only go to onboarding if they explicitly have no company_id
    if (!profile?.company_id) {
      window.location.href = '/onboarding';
      return;
    }

    if (profile?.company_id) {
      const { data: company } = await supabase.from('companies').select('name, subdomain, custom_domain').eq('id', profile.company_id).single();
      // Use subdomain first, then custom_domain, then derive from name as final fallback
      const companySubdomain = company?.subdomain || company?.custom_domain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      // If user is on a custom domain that matches their company, don't redirect — just let them in
      const { isCustomDomain } = getSubdomainAndBase();
      if (isCustomDomain) {
        // They're already on their custom domain, proceed to dashboard
        window.location.href = '/';
        return;
      }
      
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
        else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) url += 'portal';
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
    } else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) {
      window.location.href = '/portal';
      return;
    }

    window.location.href = '/';
} else {
    // Base domain login
    const { data: profile } = await supabase.from('profiles').select('company_id, role, onboarding_completed').eq('id', authData.user.id).single();
    
    // Only go to onboarding if they explicitly have no company_id
    if (!profile?.company_id) {
      window.location.href = '/onboarding';
      return;
    }
    
    // If Super Admin logs into the Base Domain, route directly to the admin command center
    if (profile?.role === 'super_admin') {
      window.location.href = '/admin';
      return;
    }

    // 2. Intelligent Routing to Subdomain
    if (profile?.company_id) {
      const { data: company } = await supabase.from('companies').select('name, subdomain, custom_domain').eq('id', profile.company_id).single();
      const companySubdomain = company?.subdomain || company?.custom_domain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      if (companySubdomain) {
 const port = window.location.port ? `:${window.location.port}` : '';
 let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/`;
 if (authData?.session?.access_token && authData?.session?.refresh_token) {
 url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
}
 
 if (profile?.role === 'student') url += 'student-portal';
 else if (profile?.role === 'parent') url += 'parent-portal';
 else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) url += 'portal';
 
 window.location.href = url;
 return;
}
}
 
 // 3. Fallback if they somehow have no company but ARE onboarded
 window.location.href = '/';
}
};

 if (checkingSubdomain) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background">
 <div className="animate-pulse text-[#71717a] dark:text-gray-400 font-medium">{t("checking_workslate_access", "Checking workslate access...")}</div>
 </div>
 );
}

 if (invalidSubdomain) {
 const mainUrl = `${getMainAppUrl()}/login`;

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900 p-4 font-sans backdrop-blur-sm">
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border-[0.5px] border-black/9 dark:border-white/8 border-slate-100 dark:border-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10/10 mb-6">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2 tracking-[-0.02em]">{t("workslate_not_found", "Workslate Not Found")}</h2>
      <p className="mb-8 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
        {t("we_couldn_t_find_an_organizati", "We couldn't find an organization matching the web address")} <span className="font-semibold text-slate-900 dark:text-white">"{currentSubdomain}"</span>.
      </p>
      <button onClick={() => window.location.href = mainUrl} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all">
        {t("go_to_main_login_portal", "Go to Main Login Portal")}
      </button>
    </div>
  </div>
 );
}

 return (
 <div className="min-h-screen flex flex-col lg:flex-row bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Left Side: Form */}
 <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
 <div className="max-w-md w-full mx-auto">
 <div className="flex flex-col mb-8">
 {branding.logo_url ? (
   <img src={branding.logo_url} alt="Logo" className="h-10 object-contain w-fit" />
 ) : (
   <>
     <Logo className="w-10 h-10" />
     <span className="text-[10px] text-[#71717a] dark:text-gray-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>
   </>
 )}
 </div>
 
 <div className="mb-8">
 <h1 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">{branding.name !== 'Slate' ? `Sign in to ${branding.name}` : t("welcome_back", "Welcome back")}</h1>
 </div>
 
 <form className="space-y-4" onSubmit={handleLogin}>
 {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border-[0.5px] border-black/9 dark:border-white/8 border-red-100 font-medium tracking-[0.04em]">{error}</div>}
 
 <div className="space-y-4">
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
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">{t("password", "Password")}</label>
 <a href="#" className="text-[11px] font-semibold text-primary hover:underline">{t("forgot_password", "Forgot password?")}</a>
 </div>
 <Input
 type="password"
 required
 placeholder="••••••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <Button type="submit" className="w-full h-12 text-base font-medium transition-all active:scale-[0.98]" disabled={loading}>
 {loading ? 'Signing in...' : 'Sign in to workspace'}
 </Button>

 <div className="text-center mt-6">
 <span className="text-xs text-slate-500 font-medium tracking-[0.04em]">{t("don_t_have_an_account", "Don't have an account?")} </span>
 <a href={`${getMainAppUrl()}/signup`} className="text-xs font-semibold text-primary hover:underline tracking-[0.04em]">
 {t("create_workspace", "Create Workslate")}
 </a>
 </div>

 {/* Download Desktop App Button */}
 <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
  <a href="https://github.com/optavel/slate/releases/download/v1.0.0/Slate.Setup.0.0.0.exe" className="group flex items-center justify-center gap-3 w-full p-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300">
    <div className="bg-white/10 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-monitor-down"><path d="M21 12v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="12" x2="12" y1="22" y2="17"/><line x1="7" x2="17" y1="22" y2="22"/><path d="M19 5v6"/><path d="m16 8 3 3 3-3"/></svg>
    </div>
    <div className="flex flex-col items-start text-left">
      <span className="text-[13px] font-semibold tracking-wide">Download Desktop App</span>
      <span className="text-[10px] text-white/70 font-medium">Faster • Smoother • Offline Ready</span>
    </div>
  </a>
 </div>

 </form>
 </div>
 </div>
 {/* Right Side: Marketing Visual */}
 <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-50 overflow-hidden">
 {/* Abstract Pattern Background */}
 <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>

 <div className="relative z-10 w-full max-w-2xl bg-white rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 -[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 lg:p-16 flex flex-col justify-center relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[10rem] font-serif leading-none font-black text-primary/70 group-hover:text-primary group-hover:opacity-10 transition-colors duration-700 pointer-events-none">"</div>
 
 <div className="relative z-10">
 <div className="flex gap-2 mb-8">
 {[1, 2, 3, 4, 5].map(s => {
 return (<svg key={s} className="w-6 h-6 text-amber-400 fill-amber-400 " viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
})}
 </div>
 
 <p className="text-slate-800 font-medium text-2xl md:text-3xl mb-12 relative z-10 leading-relaxed tracking-tight tracking-[-0.02em]">
 {randomQuote.quote}
 </p>
 
 <div className="flex items-center gap-5 pt-8 relative z-10">
 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 flex items-center justify-center text-primary/90 font-semibold text-xl ">
 {randomQuote.initials}
 </div>
 <div>
 <p className="text-xl font-semibold text-slate-900 tracking-tight">{randomQuote.name}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
