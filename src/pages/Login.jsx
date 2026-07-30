import { useTranslation } from "react-i18next";
import { useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { supabase} from "@/api/supabaseClient";
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useAuth} from '@/lib/AuthContext';
import { AlertCircle} from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Logo} from '@/components/ui/Logo';
import { getSubdomainAndBase, getMainAppUrl, isDesktopApp } from '@/lib/domainUtils';
import { toast} from 'react-hot-toast';
import SEO from '@/components/seo/SEO';


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
  const navigate = useNavigate();
  const isElectron = isDesktopApp() || (typeof window !== 'undefined' && !!window.Capacitor);
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

 const isRootAccount = typeof window !== 'undefined' && window.location.hostname.startsWith('account.');
 const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
 const showOptavelButtonOnly = !isRootAccount && !isLocalhost && !isElectron;

  const handleOptavelSSO = () => {
    const idpDomain = isLocalhost ? `http://account.localhost:${window.location.port || '5173'}` : 'https://account.optavel.com';
    const searchParams = new URLSearchParams(window.location.search);
    const continueUrl = searchParams.get('continue');
    
    // Pass the continue parameter along to the callback if it exists
    let callbackPath = '/auth/callback';
    if (continueUrl) {
      callbackPath += `?continue=${encodeURIComponent(continueUrl)}`;
    }
    
    const theme = localStorage.getItem('theme') || 'dark';
    const redirectUri = encodeURIComponent(window.location.origin + callbackPath);
    window.location.href = `${idpDomain}/sso?redirect_uri=${redirectUri}&theme=${theme}`;
  };

  // Auto-redirect if already authenticated or if mobile user needs onboarding
  useEffect(() => {
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobileDevice && !localStorage.getItem('slate_has_seen_onboarding')) {
    navigate('/welcome', { replace: true });
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const promptParam = urlParams.get('prompt');

  if (!isLoadingAuth && isAuthenticated && user && promptParam !== 'login') {
      const redirectUri = urlParams.get('redirect_uri');
      const continueUrl = urlParams.get('continue') || redirectUri;

      if (isElectron) {
        if (continueUrl) navigate(continueUrl);
        else if (user.role === 'student') navigate('/student-portal');
        else if (user.role === 'parent') navigate('/parent-portal');
        else if (user.role === 'super_admin' && !currentSubdomain) navigate('/admin');
        else navigate('/');
      } else {
        if (continueUrl) {
          // Wrap in async IIFE to fetch fresh tokens for the cross-domain jump
          (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const hash = `#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
              const base = continueUrl.split('#')[0];
              window.location.href = `${base}${hash}`;
            } else {
              window.location.href = continueUrl;
            }
          })();
          return;
        }
        else if (user.role === 'student') window.location.href = '/student-portal';
        else if (user.role === 'parent') window.location.href = '/parent-portal';
        else if (user.role === 'super_admin' && !currentSubdomain) window.location.href = '/admin';
        else window.location.href = '/';
      }
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
      if (currentSubdomain && !isRootAccount) {
     // ... existing code for subdomain ...
     try {
       // Use RPC to bypass RLS securely for public branding info
       let brandData = null;
       const cleanSub = currentSubdomain.toLowerCase().trim();
       const { data: rpcData, error: rpcError} = await supabase.rpc('get_company_by_subdomain', { p_subdomain: cleanSub });
       
       if (!rpcError && rpcData) {
         const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
         if (row?.id) brandData = row;
       }

       if (!brandData) {
        console.log("RPC missed, trying direct table query...");
        const { data: directData} = await supabase.from('companies').select('id, name, logo_url, logo_light_url, tagline').or(`subdomain.ilike.${cleanSub},custom_domain.ilike.${cleanSub}`).maybeSingle();
        
        if (directData) {
          brandData = directData;
        } else {
          const { data: tableData} = await powerSync.execute('SELECT id, name, logo_url, logo_light_url, tagline FROM companies WHERE LOWER(subdomain) = ? OR LOWER(custom_domain) = ? LIMIT 1', [cleanSub, cleanSub]).then(res => ({ data: res.rows._array[0] || null})).catch(() => ({ data: null}));
          brandData = tableData;
        }
       }

       // Clean up accidentally duplicated URLs and ensure protocol
       const cleanLogo = (url) => {
         if (!url) return url;
         let finalUrl = url.trim();
         if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/') && !finalUrl.startsWith('data:')) {
           finalUrl = 'https://' + finalUrl;
         }
         if (finalUrl.lastIndexOf('http') > 0) {
            const secondHttp = finalUrl.lastIndexOf('http');
            if (finalUrl.substring(0, secondHttp).includes('=')) {
               finalUrl = finalUrl.substring(secondHttp);
            }
         }
         return finalUrl;
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
               let finalUrl = url.trim();
               if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/') && !finalUrl.startsWith('data:')) {
                 finalUrl = 'https://' + finalUrl;
               }
               if (finalUrl.lastIndexOf('http') > 0) {
                  const secondHttp = finalUrl.lastIndexOf('http');
                  if (finalUrl.substring(0, secondHttp).includes('=')) {
                     finalUrl = finalUrl.substring(secondHttp);
                  }
               }
               return finalUrl;
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

  const handleGoogleOAuth = async () => {
    try {
      setLoading(true);
      setError('');
      const searchParams = new URLSearchParams(window.location.search);
      const continueUrl = searchParams.get('continue');
      
      let callbackPath = '/auth/callback';
      if (continueUrl) {
        callbackPath += `?continue=${encodeURIComponent(continueUrl)}`;
      }

      // We redirect directly to Google OIDC with account.optavel.com as the redirect URI
      // Google will see account.optavel.com (which has premium branding).
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent('https://account.optavel.com/auth/google-callback');
      
      // Generate and hash the nonce for Supabase verification
      const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const encoder = new TextEncoder();
      const data = encoder.encode(rawNonce);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const stateObj = {
        continue: window.location.origin + callbackPath,
        nonce: rawNonce
      };
      const state = encodeURIComponent(JSON.stringify(stateObj));
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&state=${state}&nonce=${hashedNonce}`;
      
      window.location.href = googleAuthUrl;
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

 // Trigger Login Alert (fire and forget — CORS errors are intentionally silenced)
 try {
   const getDevice = () => {
     if (typeof window === 'undefined') return 'Unknown';
     const ua = navigator.userAgent;
     if (ua.includes('Win')) return 'Windows';
     if (ua.includes('Mac')) return 'Mac';
     if (ua.includes('Linux')) return 'Linux';
     if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
     if (ua.includes('Android')) return 'Android';
     return 'Web Browser';
   };
   supabase.functions.invoke('send-auth-alert', {
     body: { email: loginEmail, type: 'Login', deviceInfo: getDevice() }
   }).catch(() => { /* Silenced: CORS on some origins is expected */ });
 } catch (e) { /* Silenced */ }
 
 if (targetSubdomain) {
    // Check if user belongs to this subdomain via Supabase directly (local DB might not be synced yet)
    const { data: profile } = await supabase.from('profiles').select('company_id, role, onboarding_completed').eq('id', authData.user.id).single();
    
    // Only go to onboarding if they explicitly have no company_id anywhere
    if (!profile?.company_id) {
      let pendingCompanyId = authData?.user?.user_metadata?.company_id;
      if (!pendingCompanyId) {
        const { data: staffRec } = await supabase.from('staff_records').select('company_id').ilike('user_email', authData.user.email).maybeSingle();
        if (staffRec?.company_id) pendingCompanyId = staffRec.company_id;
      }
      
      if (!pendingCompanyId) {
        if (isElectron) { navigate('/signup'); } else { window.location.href = '/signup'; }
        return;
      }
    }

    if (profile?.company_id) {
      const { data: company } = await supabase.from('companies').select('name, subdomain, custom_domain').eq('id', profile.company_id).single();
      // Use subdomain first, then custom_domain, then derive from name as final fallback
      const companySubdomain = company?.subdomain || company?.custom_domain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      // If user is on a custom domain that matches their company, don't redirect — just let them in
      const { isCustomDomain } = getSubdomainAndBase();
      if (isCustomDomain) {
        // They're already on their custom domain, proceed to dashboard
        if (isElectron) { navigate('/'); } else { window.location.href = '/'; }
        return;
      }
      
      if (profile?.role !== 'super_admin' && companySubdomain && companySubdomain !== currentSubdomain && !workspace) {
        // Strict multi-tenant boundary: Do not allow logging into another company's subdomain
        await supabase.auth.signOut();
        setError("You are not authorized to access this workspace.");
        setLoading(false);
        return;
      } else if (companySubdomain && workspace && !currentSubdomain) {
        // We are on root, redirecting to the workspace
        let localPath = '/';
        if (profile?.role === 'student') localPath = '/student-portal';
        else if (profile?.role === 'parent') localPath = '/parent-portal';
        else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) localPath = '/portal';
        
        if (isElectron) { 
          navigate(localPath); 
        } else { 
          const port = window.location.port ? `:${window.location.port}` : '';
          let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}${localPath}`;
          if (authData?.session?.access_token && authData?.session?.refresh_token) {
            url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
          }
          window.location.href = url; 
        }
        return;
      }
    }
    
    // Route based on role
    if (profile?.role === 'student') {
      if (isElectron) { navigate('/student-portal'); } else { window.location.href = '/student-portal'; }
      return;
    } else if (profile?.role === 'parent') {
      if (isElectron) { navigate('/parent-portal'); } else { window.location.href = '/parent-portal'; }
      return;
    } else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) {
      if (isElectron) { navigate('/portal'); } else { window.location.href = '/portal'; }
      return;
    }

    if (isElectron) { navigate('/'); } else { window.location.href = '/'; }
} else {
    // Base domain login
    const { data: profile } = await supabase.from('profiles').select('company_id, role, onboarding_completed').eq('id', authData.user.id).single();
    
    // Only go to onboarding if they explicitly have no company_id anywhere
    if (!profile?.company_id) {
      let pendingCompanyId = authData?.user?.user_metadata?.company_id;
      if (!pendingCompanyId) {
        const { data: staffRec } = await supabase.from('staff_records').select('company_id').ilike('user_email', authData.user.email).maybeSingle();
        if (staffRec?.company_id) pendingCompanyId = staffRec.company_id;
      }
      
      if (!pendingCompanyId) {
        if (isElectron) { navigate('/signup'); } else { window.location.href = '/signup'; }
        return;
      }
    }
    
    // If Super Admin logs into the Base Domain, route directly to the admin command center
    if (profile?.role === 'super_admin') {
      if (isElectron) { navigate('/admin'); } else { window.location.href = '/admin'; }
      return;
    }

    // 2. Intelligent Routing to Subdomain
    if (profile?.company_id) {
      const { data: company } = await supabase.from('companies').select('name, subdomain, custom_domain').eq('id', profile.company_id).single();
      const companySubdomain = company?.subdomain || company?.custom_domain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      if (companySubdomain) {
        let localPath = '/';
        if (profile?.role === 'student') localPath = '/student-portal';
        else if (profile?.role === 'parent') localPath = '/parent-portal';
        else if (['client', 'patient', 'guest', 'customer', 'member', 'policyholder'].includes(profile?.role)) localPath = '/portal';

        if (isElectron) { 
          navigate(localPath); 
        } else {
          const port = window.location.port ? `:${window.location.port}` : '';
          let url = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}${localPath}`;
          if (authData?.session?.access_token && authData?.session?.refresh_token) {
             url += `?access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;
          }
          window.location.href = url; 
        }
        return;
      }
}
 
 // 3. Fallback if they somehow have no company but ARE onboarded
 if (isElectron) { navigate('/'); } else { window.location.href = '/'; }
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
  const mainUrl = isDesktopApp() ? '/login' : `${getMainAppUrl()}/login`;

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-card p-4 font-sans backdrop-blur-sm">
    <div className="w-full max-w-md bg-white dark:bg-secondary rounded-3xl p-8 text-center border-[0.5px] border-black/9 dark:border-white/8 border-slate-100 dark:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10/10 mb-6">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2 tracking-[-0.02em]">{t("workslate_not_found", "Workslate Not Found")}</h2>
      <p className="mb-8 text-sm font-medium text-slate-500 dark:text-muted-foreground leading-relaxed">
        {t("we_couldn_t_find_an_organizati", "We couldn't find an organization matching the web address")} <span className="font-semibold text-slate-900 dark:text-white">"{currentSubdomain}"</span>.
      </p>
      <button onClick={() => isDesktopApp() ? navigate('/login') : (window.location.href = mainUrl)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all">
        {t("go_to_main_login_portal", "Go to Main Login Portal")}
      </button>
    </div>
  </div>
 );
}

 return (
  <div className="h-[100dvh] w-full overflow-y-auto bg-white">
 <div className="min-h-full flex flex-col lg:flex-row bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Left Side: Form */}
 <div className="flex-1 flex flex-col pt-12 lg:pt-20 px-8 lg:px-16 pb-12">
 <div className="max-w-lg w-full mx-auto">
 <div className="flex flex-col mb-8">
 {branding.logo_url ? (
   <img src={branding.logo_url} alt="Logo" className="h-10 object-contain w-fit" />
 ) : (
   <>
     <Logo className="w-10 h-10" />
     {!isRootAccount && <span className="text-[10px] text-[#71717a] dark:text-gray-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>}
   </>
 )}
 </div>
 
  <div className="mb-8">
  <h1 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">{isRootAccount ? 'Optavel Account' : branding.name !== 'Slate' ? `Sign in to ${branding.name}` : t("welcome_back", "Welcome back")}</h1>
  </div>
  
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
      <button 
        onClick={handleGoogleOAuth}
        type="button"
        className="flex items-center justify-center gap-2 h-full w-full text-slate-700 dark:text-foreground font-medium text-base transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>
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
      Sign in with Apple
    </button>
    */}
  </div>

  <div className="relative mb-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-200 dark:border-border"></div>
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-white dark:bg-card px-2 text-slate-500 font-semibold tracking-wider">Or continue with email</span>
    </div>
  </div>

  <form onSubmit={handleLogin} className="space-y-4">
    {error && (
      <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 border-[0.5px] border-red-100 dark:border-red-500/20 font-medium tracking-[0.04em]">
        {error}
      </div>
    )}

    {isRootAccount && !currentSubdomain && (
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 tracking-[0.04em]">
          {t("workspace_url", "Workspace URL")}
        </label>
        <div className="relative flex items-center">
          <Input
            type="text"
            required
            placeholder="acme"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 pr-32 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          />
          <div className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
            .optavel.com
          </div>
        </div>
      </div>
    )}

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

    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">
          {t("password", "Password")}
        </label>
        <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
          {t("forgot_password", "Forgot?")}
        </Link>
      </div>
      <Input
        type="password"
        required
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full h-11 text-sm bg-slate-50 border-primary/40 text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
      />
    </div>

    <Button type="submit" className="w-full h-12 mt-2 text-base font-semibold transition-all active:scale-[0.98]" disabled={loading}>
      {loading ? t("signing_in", "Signing in...") : t("sign_in", "Sign In")}
    </Button>
  </form>

  <div className="text-center mt-10">
    <span className="text-sm text-slate-500 font-medium tracking-[0.04em]">{t("don_t_have_an_account", "Don't have an account?")} </span>
    {isElectron ? (
      <Link to="/signup" className="text-sm font-semibold text-primary hover:underline tracking-[0.04em]">
        {isRootAccount ? 'Create an Account' : t("create_workspace", "Create Workslate")}
      </Link>
    ) : (
      <a href={`${getMainAppUrl()}/signup`} className="text-sm font-semibold text-primary hover:underline tracking-[0.04em]">
        {isRootAccount ? 'Create an Account' : t("create_workspace", "Create Workslate")}
      </a>
    )}
  </div>
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
 {isRootAccount ? randomQuote.quote.replace(/Slate/g, 'Optavel') : randomQuote.quote}
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
  </div>
 );
}
