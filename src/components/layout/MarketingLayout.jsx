import { useTranslation } from "react-i18next";
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Scale, ArrowRight, Building, Home, Layers, CreditCard, Info, Mail, Shield, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import { Logo } from '@/components/ui/Logo';

export default function MarketingLayout({ children }) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [geoPopup, setGeoPopup] = useState(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' }
  ];

  const currentLanguage = languages.find(l => l.code === (i18n.language || 'en').split('-')[0]) || languages[0];

  const { baseDomain } = getSubdomainAndBase();
  const companySubdomain = user?.subdomain || user?.company_name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const port = window.location.port ? `:${window.location.port}` : '';
  const workspaceUrl = companySubdomain ? `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}` : '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Disconnect Marketing Pages from Dashboard Theme Switcher
  useEffect(() => {
    const root = window.document.documentElement;
    // Store original theme to restore if navigating back to dashboard
    const originalClass = root.className;
    
    // Force light mode
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    return () => {
      // Restore the dashboard theme when leaving marketing pages
      root.className = originalClass;
      root.style.colorScheme = '';
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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
    setLangDropdownOpen(false);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Features', path: '/features', icon: Layers },
    { name: 'Pricing', path: '/pricing', icon: CreditCard },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail }
  ];

  return (
    <div className="light min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary relative">
      {/* ========== NAVIGATION HEADER ========== */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-white/95 backdrop-blur-lg border-b-2 border-primary/80 shadow-sm' : 'py-5 bg-white/50 backdrop-blur-sm border-b-2 border-transparent'}`}>
        <header className="max-w-6xl mx-auto">
          <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <Logo className="w-10 h-10 md:w-11 md:h-11 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground leading-none">
                {t("slate", "Slate")}
              </span>
              <span className="text-[9px] text-muted-foreground font-bold tracking-[0.2em] uppercase leading-none mt-0.5">
                {t("by_optavel", "by Optavel")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 relative ${
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
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all select-none border border-slate-200 bg-white/80 shadow-sm"
              >
                <Globe className="w-4 h-4 text-primary" />
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2.5 ${currentLanguage.code === lang.code ? 'text-primary bg-slate-50' : 'text-slate-700'}`}
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium h-10 px-4">
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>
      </div>
      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[65px] left-0 right-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-xl overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col p-6 gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 text-sm font-medium py-3 px-4 rounded-xl transition-all ${
                      isActive 
                        ? 'text-primary bg-primary/[0.08]' 
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.name}
                  </Link>
                );
              })}

              <hr className="border-border/60 my-2" />

              {/* Mobile Language Selector */}
              <div className="flex flex-col gap-2 my-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-1 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  {t("choose_language", "Choose Language")}
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${currentLanguage.code === lang.code ? 'text-primary bg-slate-50 border-primary/20' : 'text-slate-700 bg-white border-slate-200'}`}
                    >
                      <span>{lang.flag}</span>
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
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md h-11 flex items-center justify-center gap-2 rounded-xl">
                      <Building className="w-4 h-4" />
                      {t("go_to_workslate", "Go to WorkSlate")}
                    </Button>
                  </a>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" className="w-full font-medium border-border hover:bg-muted/50 text-foreground h-11 rounded-xl">
                        {t("sign_in", "Sign In")}
                      </Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md h-11 rounded-xl">
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
      <main className="relative z-10 pb-20 md:pb-0 pt-[80px] md:pt-[90px]">
        {children}
      </main>
      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-lg min-w-[56px] transition-all ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area spacer for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
      {/* ========== PREMIUM FOOTER (LIGHT THEME) ========== */}
      <footer className="bg-slate-50 text-slate-600 pt-20 md:pt-28 pb-24 md:pb-12 border-t border-slate-200 relative overflow-hidden">
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
                <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase ml-[50px] mt-0.5">by Optavel</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">
                {t(
                  "the_unified_business_operating",
                  "The unified business operating system custom-engineered for modern enterprises across the globe. Built for scale, security, and speed."
                )}
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 hover:shadow-sm transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 hover:shadow-sm transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-6 space-y-5">
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider">{t("product", "Product")}</h4>
              <ul className="flex flex-col gap-3.5">
                <li><Link to="/features" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("core_features", "Core Features")}</Link></li>
                <li><Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("pricing_plans", "Pricing Plans")}</Link></li>
                <li><Link to="/integrations" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("integrations", "Integrations")}</Link></li>
                <li><Link to="/changelog" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("changelog", "Changelog")}</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-5">
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider">{t("company", "Company")}</h4>
              <ul className="flex flex-col gap-3.5">
                <li><Link to="/about" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("about_us", "About Us")}</Link></li>
                <li><Link to="/careers" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("careers", "Careers")} <span className="ml-1 inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-primary border border-primary/20 text-[9px] font-bold">{t("hiring", "HIRING")}</span></Link></li>
                <li><Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("contact_sales", "Contact Sales")}</Link></li>
                <li><Link to="/partners" className="text-sm font-medium text-slate-600 hover:text-primary hover:translate-x-1 transition-all inline-block">{t("partner_program", "Partner Program")}</Link></li>
              </ul>
            </div>

            {/* Regional Offices */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider">{t("offices", "Offices")}</h4>
              <ul className="flex flex-col gap-4">
                <li className="flex items-start gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform"></div>
                  <div>
                    <span className="text-slate-800 text-sm font-bold block">{t("san_francisco_ca", "San Francisco, CA")}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block">{t("global_hq", "Global HQ")}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform"></div>
                  <div>
                    <span className="text-slate-800 text-sm font-bold block">{t("london_uk", "London, UK")}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block">{t("emea_hub", "EMEA Hub")}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {t("soc_2_type_ii_certified", "SOC-2 Type II Certified")} <br/> {t("99_99_uptime_sla", "99.99% Uptime SLA")}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <Link to="/legal#terms" className="hover:text-primary transition-colors">{t("terms_of_service", "Terms of Service")}</Link>
              <Link to="/legal#privacy" className="hover:text-primary transition-colors">{t("privacy_policy", "Privacy Policy")}</Link>
              <Link to="/legal#security" className="hover:text-primary transition-colors">{t("security", "Security")}</Link>
              <Link to="/legal#cookies" className="hover:text-primary transition-colors">{t("cookie_policy", "Cookie Policy")}</Link>
            </div>
          </div>
          
          <div className="mt-8 text-center md:text-left text-xs text-slate-500 font-medium">© {new Date().getFullYear()} {t(
              "slate_technologies_inc_all",
              "Slate Technologies Inc. All rights reserved."
            )}
          </div>
        </div>
      </footer>

      {/* Geolocation Language Recommendation Modal */}
      {geoPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-100 flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-primary mb-6 shadow-inner">
              <Globe className="w-8 h-8 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
              {t("choose_your_language", "Choose Your Language")}
            </h3>
            
            <p className="text-slate-500 font-semibold text-sm leading-relaxed mb-8">
              We noticed you are visiting from <span className="font-bold text-slate-800">{geoPopup.country}</span>. Would you like to view Slate in your local language or continue in English?
            </p>
            
            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={() => {
                  i18n.changeLanguage(geoPopup.langCode);
                  localStorage.setItem('slate_lang_pref', geoPopup.langCode);
                  setGeoPopup(null);
                }}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20 transition-all w-full"
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
                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-6 rounded-xl transition-all w-full bg-transparent"
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
