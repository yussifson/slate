import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Scale, ArrowRight, Building, Home, Layers, CreditCard, Info, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { getSubdomainAndBase } from '@/lib/domainUtils';

export default function MarketingLayout({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { baseDomain } = getSubdomainAndBase();
  const companySubdomain = user?.subdomain || user?.company_name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const port = window.location.port ? `:${window.location.port}` : '';
  const workspaceUrl = companySubdomain ? `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}` : '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Features', path: '/features', icon: Layers },
    { name: 'Pricing', path: '/pricing', icon: CreditCard },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail }
  ];

  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground relative">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none bg-noise mix-blend-overlay" />
      
      {/* Subtle ambient background gradients */}
      <div className="fixed top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none z-[-2]" />
      <div className="fixed top-[10%] left-[-15%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[150px] pointer-events-none z-[-2]" />
      <div className="fixed top-[25%] right-[-12%] w-[35vw] h-[35vw] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none z-[-2]" />

      {/* ========== NAVIGATION HEADER ========== */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/40 backdrop-blur-2xl border-b border-white/5 shadow-sm' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 group-hover:shadow-lg">
              <Scale className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground leading-none">
                Airzyle
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.15em] uppercase leading-none mt-0.5">
                Legal OS
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
                      ? 'text-primary bg-primary/[0.08]' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <a href={workspaceUrl}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg group rounded-xl px-5 h-10 flex items-center gap-2 transition-all">
                  <Building className="w-4 h-4" />
                  Go to Workspace
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </a>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium h-10 px-4">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg group rounded-xl px-5 h-10 transition-all">
                    Start Free Trial
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-2">
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

              <div className="flex flex-col gap-2.5 pt-1">
                {isAuthenticated ? (
                  <a href={workspaceUrl} className="w-full">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md h-11 flex items-center justify-center gap-2 rounded-xl">
                      <Building className="w-4 h-4" />
                      Go to Workspace
                    </Button>
                  </a>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" className="w-full font-medium border-border hover:bg-muted/50 text-foreground h-11 rounded-xl">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md h-11 rounded-xl">
                        Start Free Trial
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="relative z-10 pb-20 md:pb-0">
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

      {/* ========== FOOTER ========== */}
      <footer className="bg-card border-t border-border text-muted-foreground pt-16 md:pt-20 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-foreground tracking-tight">Airzyle</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-[280px]">
                The unified practice operating system custom-engineered for legal practitioners across the African continent.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Trusted by 500+ advocates & counsels.
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold text-sm">Product</h4>
              <ul className="flex flex-col gap-3">
                <li><Link to="/features" className="text-sm hover:text-primary transition-colors">Core Features</Link></li>
                <li><Link to="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link></li>
                <li><a href="#security" className="text-sm hover:text-primary transition-colors">Security</a></li>
                <li><a href="#changelog" className="text-sm hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold text-sm">Company</h4>
              <ul className="flex flex-col gap-3">
                <li><Link to="/about" className="text-sm hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link></li>
                <li><a href="#privacy" className="text-sm hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="text-sm hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Regional Offices */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold text-sm">Offices</h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <span className="text-foreground text-sm font-medium block">Lagos, Nigeria</span>
                  <span className="text-xs text-muted-foreground/80">Victoria Island</span>
                </li>
                <li>
                  <span className="text-foreground text-sm font-medium block">Accra, Ghana</span>
                  <span className="text-xs text-muted-foreground/80">Airport Residential</span>
                </li>
                <li>
                  <span className="text-foreground text-sm font-medium block">Freetown, SL</span>
                  <span className="text-xs text-muted-foreground/80">Central District</span>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-border/60 mb-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/70">
            <p>
              © {new Date().getFullYear()} Airzyle Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#cookies" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
