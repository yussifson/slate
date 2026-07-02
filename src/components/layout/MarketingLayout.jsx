import { useTranslation} from "react-i18next";
import { Link, useLocation} from 'react-router-dom';
import { useState, useEffect} from 'react';
import { Menu, X, Scale, ArrowRight, Building, Home, Layers, CreditCard, Info, Mail, Shield, Clock, Globe, Download } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { useAuth} from '@/lib/AuthContext';
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { Logo} from '@/components/ui/Logo';
import { LanguageSwitcher, GOOGLE_LANGUAGES } from "@/components/ui/LanguageSwitcher";

export default function MarketingLayout({ children}) {
 const { t, i18n} = useTranslation();
 const { isAuthenticated, user, isLoadingAuth} = useAuth();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
 const location = useLocation();
 const [geoPopup, setGeoPopup] = useState(null);

 const languages = GOOGLE_LANGUAGES;

 const currentLanguage = languages.find(l => l.code === (i18n.language || 'en').split('-')[0]) || languages.find(l => l.code === 'en');

 const { baseDomain} = getSubdomainAndBase();
 const companySubdomain = user?.subdomain || user?.company_name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
 const port = window.location.port ? `:${window.location.port}` : '';
 const isNativeApp = isDesktopApp();
 const workspaceUrl = (companySubdomain && !isNativeApp) ? `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/` : '/';

 useEffect(() => {
 const handleScroll = () => setScrolled(window.scrollY > 20);
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
}, []);

 // Auto-redirect removed to allow logged-in users to browse marketing pages.

 // Disconnect Marketing Pages from Dashboard Theme Switcher
 useEffect(() => {
 const root = window.document.documentElement;
 // Store original theme to restore if navigating back to dashboard
 const originalClass = root.className;
 
 // Force light mode
 root.classList.remove('dark');
 root.classList.add('light');
 root.style.colorScheme = 'light';
 
 // Enable scrolling on body for marketing pages (overrides index.css overflow: hidden)
 window.document.body.style.overflow = 'auto';

 return () => {
 // Restore the dashboard theme when leaving marketing pages
 root.className = originalClass;
 if (originalClass.includes('dark')) {
     root.style.colorScheme = 'dark';
 }
 // Restore body overflow
 window.document.body.style.overflow = '';
 };
}, []);

 // Close mobile menu on route change
 useEffect(() => {
 setMobileMenuOpen(false);
 setMenuDrawerOpen(false);
}, [location.pathname]);

 // First-time location country language detection
 useEffect(() => {
 const checkLocationAndLanguage = async () => {
 const storedPref = localStorage.getItem('slate_lang_pref');
 if (storedPref) {
 i18n.changeLanguage(storedPref);
 return;
}

 try {
 const res = await fetch('https://ipapi.co/json/');
 if (!res.ok) return;
 const data = await res.json();
 
 const countryCode = data.country_code;
 const countryName = data.country_name || 'your country';
 
 const englishCountries = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'SG', 'JM', 'BS', 'GH', 'KE', 'NG', 'IN'];
 if (englishCountries.includes(countryCode)) {
 localStorage.setItem('slate_lang_pref', 'en');
 i18n.changeLanguage('en');
 return;
}
 
 const langMapping = {
 'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es', 'VE': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es', 'BO': 'es', 'DOM': 'es', 'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'UY': 'es', 'PA': 'es',
 'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'MC': 'fr', 'SN': 'fr', 'CI': 'fr', 'CM': 'fr',
 'DE': 'de', 'AT': 'de', 'LI': 'de', 'LU': 'de',
 'PT': 'pt', 'BR': 'pt', 'AO': 'pt', 'MZ': 'pt',
 'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
 'JP': 'ja',
 'AE': 'ar', 'SA': 'ar', 'EG': 'ar', 'DZ': 'ar', 'MA': 'ar', 'IQ': 'ar', 'JO': 'ar', 'KW': 'ar', 'LB': 'ar', 'LY': 'ar', 'OM': 'ar', 'QA': 'ar', 'SY': 'ar', 'TN': 'ar', 'YE': 'ar', 'BH': 'ar', 'SD': 'ar',
 'IL': 'he'
};
 
 const targetLangCode = langMapping[countryCode];
 if (targetLangCode) {
 const langNames = {
 'es': 'Español',
 'fr': 'Français',
 'de': 'Deutsch',
 'pt': 'Português',
 'zh': '中文',
 'ja': '日本語',
 'ar': 'العربية',
 'he': 'עברית'
};
 setGeoPopup({
 country: countryName,
 langCode: targetLangCode,
 langName: langNames[targetLangCode]
});
} else {
 localStorage.setItem('slate_lang_pref', 'en');
 i18n.changeLanguage('en');
}
} catch (err) {
 console.error('Failed to detect location:', err);
}
};
 
 checkLocationAndLanguage();
}, []);

 const handleLanguageChange = (code) => {
 i18n.changeLanguage(code);
 localStorage.setItem('slate_lang_pref', code);
 setMenuDrawerOpen(false);
};

 const navItems = [
  { name: 'Home', path: '/', icon: Home},
  { name: 'Features', path: '/features', icon: Layers},
  { name: 'Solutions', path: '/solutions', icon: Building},
  { name: 'Pricing', path: '/pricing', icon: CreditCard}
  ];

 return (
 <div className="light bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary relative">
 {/* ========== NAVIGATION HEADER ========== */}
 <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-white/95 backdrop-blur-lg border-b-2 border-primary/80 ' : 'py-5 bg-white/50 backdrop-blur-sm border-b-2 border-transparent'}`}>
 <header className="max-w-6xl mx-auto">
 <div className="h-14 flex items-center justify-between">
 {/* Logo */}
 <Link to="/" className="flex items-center gap-2.5 group shrink-0">
 <Logo className="w-10 h-10 md:w-11 md:h-11 transition-transform group-hover:scale-105" />
 <div className="flex flex-col">
 <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground leading-none">
 {t("slate", "Slate")}
 </span>
 <span className="text-[9px] text-[#71717a] dark:text-gray-400 font-semibold tracking-[0.2em] uppercase leading-none mt-0.5 tracking-[0.04em]">
 {t("by_optavel", "by Optavel")}
 </span>
 </div>
 </Link>

 {/* Desktop Navigation */}
 <nav className="hidden lg:flex items-center gap-2">
 {navItems.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <Link
 key={item.name}
 to={item.path}
 className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 relative ${
 isActive 
 ? 'text-primary' 
 : 'text-foreground/70 hover:text-primary'
}`}
 >
 {item.name}
 </Link>
 );
})}
 </nav>

 {/* Desktop CTA Buttons */}
 <div className="hidden lg:flex items-center gap-3">
  {/* Download App Button */}
  <a href="https://github.com/optavel/slate-desktop-releases/releases/download/V1.0.1/Slate.Setup.1.0.1.exe" className="group relative hidden xl:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
    <span className="text-[13px]">Download App</span>
  </a>

  {/* Language Selector Dropdown */}
  <LanguageSwitcher className="h-10 w-[140px] bg-white/80 border-[0.5px] border-black/9 border-primary/40 text-slate-700 font-semibold rounded-xl" />

 {isLoadingAuth ? (
 <div className="w-24 h-10 rounded-full animate-pulse bg-muted/60"></div>
 ) : isAuthenticated ? (
 <a href={workspaceUrl}>
 <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 h-10 flex items-center gap-2 transition-all">
 <Building className="w-4 h-4" />
 {t("go_to_workslate", "Go to WorkSlate")}
 <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
 </Button>
 </a>
 ) : (
 <>
 <Link to="/login">
 <Button variant="ghost" className="text-[#71717a] dark:text-gray-400 hover:text-foreground font-medium h-10 px-4">
 {t("sign_in", "Sign In")}
 </Button>
 </Link>
 <Link to="/signup">
 <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 h-10 transition-all">
 {t("start_free_trial", "Start Free Trial")}
 <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
 </Button>
 </Link>
 </>
 )}
 </div>

 {/* Mobile CTA */}
 <div className="flex lg:hidden items-center gap-2.5">
 {/* Removed broken globe button */}
 {isLoadingAuth ? (
 <div className="w-16 h-9 rounded-full animate-pulse bg-muted/60"></div>
 ) : isAuthenticated ? (
 <a href={workspaceUrl}>
 <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 h-9 text-[11px] uppercase tracking-wider -primary/20 tracking-[0.04em]">
 {t("app", "App")}
 </Button>
 </a>
 ) : (
 <Link to="/signup">
 <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 h-9 text-[11px] uppercase tracking-wider -primary/20 tracking-[0.04em]">
 {t("start", "Start")}
 </Button>
 </Link>
 )}
 </div>
 </div>
 </header>
 </div>
 
 {mobileMenuOpen && (
 <div className="fixed inset-0 top-[60px] z-40 bg-white/95 backdrop-blur-md overflow-y-auto pb-24 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <nav className="flex flex-col p-4">
 <hr className="border-primary/40 my-2" />

 {/* Mobile Language Selector */}
 <div className="flex flex-col gap-2 my-2 bg-slate-50 p-4 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <span className="text-xs font-semibold text-slate-500 flex items-center gap-2.5 px-1 uppercase tracking-wider tracking-[0.04em]">
 <Globe className="w-3.5 h-3.5 text-primary" />
 {t("choose_language", "Choose Language")}
 </span>
 <div className="grid grid-cols-2 gap-2 mt-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
 {languages.map((lang) => (
 <button
 key={lang.code}
 onClick={() => handleLanguageChange(lang.code)}
 className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${currentLanguage.code === lang.code ? 'text-primary bg-slate-50 border-primary/20' : 'text-slate-700 bg-white border-primary/40'}`}
 >
 <span>{lang.name}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="flex flex-col gap-2.5 pt-1">
 {isLoadingAuth ? (
 <div className="w-full h-11 rounded-xl animate-pulse bg-muted/60"></div>
 ) : isAuthenticated ? (
 <a href={workspaceUrl} className="w-full">
 <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 flex items-center justify-center gap-2 rounded-xl">
 <Building className="w-4 h-4" />
 {t("go_to_workslate", "Go to WorkSlate")}
 </Button>
 </a>
 ) : (
 <>
 <Link to="/login" className="w-full">
 <Button variant="outline" className="w-full font-medium border-primary/40 hover:bg-muted/50 text-foreground h-11 rounded-xl">
 {t("sign_in", "Sign In")}
 </Button>
 </Link>
 <Link to="/signup" className="w-full">
 <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-xl">
 {t("start_free_trial", "Start Free Trial")}
 </Button>
 </Link>
 </>
 )}
 </div>
 </nav>
 </div>
 )}
 {/* ========== MAIN CONTENT ========== */}
 <main className="relative z-10 pb-28 md:pb-0 pt-[80px] md:pt-[90px]">
 {children}
 </main>
 {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
 <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur-2xl border-t border-primary/40 pb-[env(safe-area-inset-bottom)] -[0_-10px_40px_rgba(0,0,0,0.03)] transition-shadow duration-200">
 <div className="flex items-center justify-around h-[68px] px-1">
 
 {/* Home */}
 <Link to="/" className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-slate-400'}`}>
 <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${location.pathname === '/' ? 'bg-primary/10' : 'bg-transparent'}`}>
 <Home className={`w-5 h-5 ${location.pathname === '/' ? 'scale-110' : 'scale-100'}`} />
 </div>
 <span className={`text-[10px] font-semibold tracking-wide ${location.pathname === '/' ? 'text-primary' : 'text-slate-500'}`}>Home</span>
 </Link>
 
 {/* Pricing */}
 <Link to="/pricing" className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors ${location.pathname === '/pricing' ? 'text-primary' : 'text-slate-400'}`}>
 <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${location.pathname === '/pricing' ? 'bg-primary/10' : 'bg-transparent'}`}>
 <CreditCard className={`w-5 h-5 ${location.pathname === '/pricing' ? 'scale-110' : 'scale-100'}`} />
 </div>
 <span className={`text-[10px] font-semibold tracking-wide ${location.pathname === '/pricing' ? 'text-primary' : 'text-slate-500'}`}>Price</span>
 </Link>
 
 {/* Menu */}
 <button onClick={() => setMenuDrawerOpen(true)} className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors ${menuDrawerOpen ? 'text-primary' : 'text-slate-400'}`}>
 <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${menuDrawerOpen ? 'bg-primary/10' : 'bg-transparent'}`}>
 <Menu className={`w-5 h-5 ${menuDrawerOpen ? 'scale-110' : 'scale-100'}`} />
 </div>
 <span className={`text-[10px] font-semibold tracking-wide ${menuDrawerOpen ? 'text-primary' : 'text-slate-500'}`}>Menu</span>
 </button>
 
 {/* Auth / App */}
 {isAuthenticated ? (
 <a href={workspaceUrl} className="flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors text-slate-400">
 <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-transparent">
 <Building className="w-5 h-5" />
 </div>
 <span className="text-[10px] font-semibold tracking-wide text-slate-500">App</span>
 </a>
 ) : (
 <Link to="/login" className="flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors text-slate-400">
 <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-transparent">
 <ArrowRight className="w-5 h-5" />
 </div>
 <span className="text-[10px] font-semibold tracking-wide text-slate-500">Login</span>
 </Link>
 )}
 
 </div>
 </nav>
 
 {/* ========== MOBILE MENU DRAWER ========== */}
 {menuDrawerOpen && (
 <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMenuDrawerOpen(false)}>
 <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[calc(24px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-full duration-300" onClick={(e) => e.stopPropagation()}>
 <div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-lg text-slate-900 tracking-tight">Menu</h3>
 <button onClick={() => setMenuDrawerOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="flex flex-col gap-4">
 <Link to="/features" onClick={() => setMenuDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Layers className="w-5 h-5" /></div>
 <span className="font-semibold text-slate-800 text-[15px]">Features</span>
 </Link>
 <Link to="/solutions" onClick={() => setMenuDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Building className="w-5 h-5" /></div>
 <span className="font-semibold text-slate-800 text-[15px]">Solutions</span>
 </Link>
 <div className="mt-2 flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
 <span className="text-xs font-semibold text-slate-500 flex items-center gap-2.5 px-1 uppercase tracking-wider tracking-[0.04em]">
 <Globe className="w-3.5 h-3.5 text-primary" />
 {t("choose_language", "Choose Language")}
 </span>
 <div className="grid grid-cols-2 gap-2 mt-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
 {languages.map((lang) => (
 <button
 key={lang.code}
 onClick={() => handleLanguageChange(lang.code)}
 className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${currentLanguage.code === lang.code ? 'text-primary bg-white shadow-sm border-primary/20' : 'text-slate-600 bg-transparent border-transparent'}`}
 >
 <span>{lang.name}</span>
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 {/* ========== PREMIUM FOOTER (LIGHT THEME) ========== */}
 <footer className="bg-slate-50 text-slate-600 pt-20 md:pt-28 pb-24 md:pb-12 border-t border-primary/40 relative overflow-hidden">
 {/* Subtle background glow */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none"></div>

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-12 mb-16 md:mb-20">
 {/* Brand Column */}
 <div className="col-span-2 md:col-span-5 lg:col-span-4 flex flex-col gap-6 pr-0 md:pr-10">
 <div className="flex flex-col w-fit">
 <Link to="/" className="flex items-center gap-2.5 group">
 <Logo className="w-10 h-10 text-primary" />
 <span className="font-extrabold text-xl text-slate-900 tracking-tight">{t("slate", "Slate")}</span>
 </Link>
 <span className="text-[10px] text-slate-500 font-semibold tracking-[0.2em] uppercase ml-[50px] mt-0.5 tracking-[0.04em]">by Optavel</span>
 </div>
 <p className="text-sm leading-relaxed text-slate-600 font-medium">
 {t(
 "the_unified_business_operating",
 "The unified business operating system custom-engineered for modern enterprises across the globe. Built for scale, security, and speed."
 )}
 </p>
 
 <div className="flex items-center gap-4 mt-2">
 <a href="#" className="w-10 h-10 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
 </a>
 <a href="#" className="w-10 h-10 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
 </a>
 </div>
 </div>

 {/* Product Links */}
 <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-6 space-y-5">
 <h4 className="text-slate-900 font-semibold text-sm uppercase tracking-wider tracking-[0.04em]">{t("product", "Product")}</h4>
 <ul className="flex flex-col gap-3.5">
 <li><Link to="/features" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("core_features", "Core Features")}</Link></li>
 <li><Link to="/solutions" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("solutions", "Solutions")}</Link></li>
 <li><Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("pricing_plans", "Pricing Plans")}</Link></li>
 <li><Link to="/roi-calculator" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("roi_calculator", "ROI Calculator")}</Link></li>
 <li><Link to="/integrations" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("integrations", "Integrations")}</Link></li>
 <li><Link to="/changelog" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("changelog", "Changelog")}</Link></li>
 </ul>
 </div>

 {/* Company Links */}
 <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-5">
 <h4 className="text-slate-900 font-semibold text-sm uppercase tracking-wider tracking-[0.04em]">{t("company", "Company")}</h4>
 <ul className="flex flex-col gap-3.5">
 <li><Link to="/about" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("about_us", "About Us")}</Link></li>
 <li><Link to="/customers" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("customers", "Customers")}</Link></li>
 <li><a href="https://career.optavel.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("careers", "Careers")} <span className="ml-1 inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-primary border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[9px] font-semibold">{t("hiring", "HIRING")}</span></a></li>
 <li><Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("contact_sales", "Contact Sales")}</Link></li>
 <li><Link to="/partners" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("partner_program", "Partner Program")}</Link></li>
 </ul>
 </div>

 {/* Regional Offices */}
 <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
 <h4 className="text-slate-900 font-semibold text-sm uppercase tracking-wider tracking-[0.04em]">{t("offices", "Offices")}</h4>
 <ul className="flex flex-col gap-4">
 <li className="flex items-start gap-3 group">
 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform"></div>
 <div>
 <span className="text-slate-800 text-sm font-semibold block">{t("san_francisco_ca", "San Francisco, CA")}</span>
 <span className="text-xs text-slate-500 mt-0.5 block tracking-[0.04em]">{t("global_hq", "Global HQ")}</span>
 </div>
 </li>
 <li className="flex items-start gap-3 group">
 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform"></div>
 <div>
 <span className="text-slate-800 text-sm font-semibold block">{t("london_uk", "London, UK")}</span>
 <span className="text-xs text-slate-500 mt-0.5 block tracking-[0.04em]">{t("emea_hub", "EMEA Hub")}</span>
 </div>
 </li>
 </ul>
 </div>
 </div>

 <div className="pt-8 border-t border-primary/40 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <div className="flex -space-x-2">
 <div className="w-8 h-8 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Shield className="w-3.5 h-3.5 text-slate-600" />
 </div>
 <div className="w-8 h-8 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Clock className="w-3.5 h-3.5 text-slate-600" />
 </div>
 </div>
 <div className="text-xs text-slate-600 font-medium tracking-[0.04em]">
 {t("soc_2_type_ii_certified", "SOC-2 Type II Certified")} <br/> {t("99_99_uptime_sla", "99.99% Uptime SLA")}
 </div>
 </div>

 <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
 <Link to="/security" className="hover:text-primary transition-colors">{t("trust_center", "Trust & Security")}</Link>
 <Link to="/legal#terms" className="hover:text-primary transition-colors">{t("terms_of_service", "Terms of Service")}</Link>
 <Link to="/legal#privacy" className="hover:text-primary transition-colors">{t("privacy_policy", "Privacy Policy")}</Link>
 <Link to="/legal#security" className="hover:text-primary transition-colors">{t("security", "Security")}</Link>
 <Link to="/legal#cookies" className="hover:text-primary transition-colors">{t("cookie_policy", "Cookie Policy")}</Link>
 </div>
 </div>
 
 <div className="mt-8 text-center md:text-left text-xs text-slate-500 font-medium tracking-[0.04em]">© {new Date().getFullYear()} {t(
 "slate_technologies_inc_all",
 "Slate Technologies Inc. All rights reserved."
 )}
 </div>
 </div>
 </footer>

 {/* Geolocation Language Recommendation Modal */}
 {geoPopup && (
 <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
 <div className="relative bg-white w-full max-w-md rounded-md-[2rem] p-8 sm:p-10 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-primary mb-6 ">
 <Globe className="w-8 h-8 animate-pulse" />
 </div>
 
 <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 tracking-[-0.02em]">
 {t("choose_your_language", "Choose Your Language")}
 </h3>
 
 <p className="text-slate-500 font-semibold text-sm leading-relaxed mb-8">
 We noticed you are visiting from <span className="font-semibold text-slate-800">{geoPopup.country}</span>. Would you like to view Slate in your local language or continue in English?
 </p>
 
 <div className="flex flex-col w-full gap-3">
 <Button 
 onClick={() => {
 i18n.changeLanguage(geoPopup.langCode);
 localStorage.setItem('slate_lang_pref', geoPopup.langCode);
 setGeoPopup(null);
}}
 className="bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl -primary/20 transition-all w-full"
 >
 Use {geoPopup.langName}
 </Button>
 
 <Button 
 onClick={() => {
 i18n.changeLanguage('en');
 localStorage.setItem('slate_lang_pref', 'en');
 setGeoPopup(null);
}}
 variant="outline"
 className="border-primary/40 hover:bg-slate-50 text-slate-600 font-semibold py-6 rounded-xl transition-all w-full bg-transparent"
 >
 Continue in English
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
