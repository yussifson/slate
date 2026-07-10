import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Menu, X, Home, UserCircle, ShieldCheck, CreditCard, MonitorSmartphone, Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen, LayoutGrid, HelpCircle, Lock, Video, PhoneCall, ClipboardList, Database, Server, AlertCircle } from 'lucide-react';
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";
import AccountSwitcher from './AccountSwitcher';
import CompanySelectionModal from './CompanySelectionModal';

export default function AccountPortalLayout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, changeTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = () => {
      setIsMaintenanceMode(localStorage.getItem('maintenanceMode') === 'true');
    };
    checkMaintenance();
    window.addEventListener('maintenanceModeChanged', checkMaintenance);
    return () => window.removeEventListener('maintenanceModeChanged', checkMaintenance);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Trigger Logout Alert (fire and forget)
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
      if (user?.email) {
        supabase.functions.invoke('send-auth-alert', {
          body: { email: user.email, type: 'Logout', deviceInfo: getDevice() }
        }).catch(e => console.error("Failed to send logout alert:", e));
      }
    } catch (e) {}

    // 1. Clear local storage cache
    localStorage.removeItem('slate_cached_user');
    
    // 2. Sign out of Supabase (wrap in try-catch so it doesn't block if there's a multiple client error)
    try {
       await supabase.auth.signOut();
    } catch (e) {
       console.warn("Sign out warning:", e);
    }
    
    // 3. Hard redirect to login to clear all states and clients in memory
    window.location.href = '/login';
  };

  const [isAppsLauncherOpen, setIsAppsLauncherOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const baseNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Personal info', path: '/personal-info', icon: UserCircle },
    { name: 'Security', path: '/security', icon: ShieldCheck },
    { name: 'Payments & subscriptions', path: '/subscriptions', icon: CreditCard },
    { name: 'Devices', path: '/devices', icon: MonitorSmartphone },
    { name: 'Help Center', path: '/help', icon: HelpCircle },
  ];

  const isSuperAdmin = profile?.role === 'super_admin' || user?.role === 'super_admin';
  const isPremium = profile?.plan === 'premium' || user?.plan === 'premium';

  const navItems = isSuperAdmin 
    ? [...baseNavItems, { name: 'Admin Portal', path: '/admin', icon: Lock }]
    : baseNavItems;

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const initials = getInitials(profile?.first_name, profile?.last_name, user?.email);

  const handleAppLauncherClick = (baseUrl, isSlate = false) => {
    if (isSlate) {
      setIsAppsLauncherOpen(false);
      setIsCompanyModalOpen(true);
      return;
    }
    
    // For other apps, construct auto-login URL with token
    const url = new URL(baseUrl);
    try {
      // Try fetching session from local storage to demonstrate auto login
      const tokenStr = localStorage.getItem('slate_session');
      if (tokenStr) {
        const session = JSON.parse(tokenStr);
        if (session.access_token) {
          url.searchParams.append('access_token', session.access_token);
          url.searchParams.append('action', 'auto_login');
        }
      }
    } catch (e) {}
    window.open(url.toString(), '_blank');
    setIsAppsLauncherOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-background text-slate-900 dark:text-gray-100 font-sans flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-sidebar border-b border-gray-200 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
             <Logo className="w-8 h-8" />
             <span className="text-xl font-medium tracking-tight">Optavel</span>
          </div>
        </div>
        <AccountSwitcher className={`shrink-0 rounded-full ${
          isSuperAdmin ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background' :
          isPremium ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : ''
        }`} />
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white dark:bg-sidebar border-r border-gray-200 dark:border-white/5 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:shadow-none'}
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Desktop Logo Area */}
        <div className="hidden md:flex items-center justify-between px-5 h-20 pt-4">
          {!isDesktopCollapsed && (
            <div className="flex items-center justify-between w-full overflow-hidden">
              <div className="flex items-center gap-3">
                <Logo className="w-9 h-9 shrink-0" />
                <span className="text-xl font-medium tracking-tight text-gray-800 dark:text-gray-100 whitespace-nowrap">Optavel</span>
              </div>
              <button 
                onClick={() => setIsDesktopCollapsed(true)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>
          )}
          {isDesktopCollapsed && (
             <div className="w-full flex justify-center">
                <button 
                  onClick={() => setIsDesktopCollapsed(false)}
                  className="text-gray-400 hover:text-primary transition-colors p-2 rounded-xl hover:bg-primary/10"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="w-6 h-6" />
                </button>
             </div>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <nav className="flex-1 px-3 py-4 md:py-6 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl font-medium text-[15px] transition-all group
                  ${isActive 
                    ? 'bg-primary/10 text-primary dark:text-primary' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                title={isDesktopCollapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isDesktopCollapsed ? '' : ''}`} />
                {!isDesktopCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </NavLink>
            ))}
            
            {/* Apps Launcher Button */}
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800/50">
              <button
                onClick={() => setIsAppsLauncherOpen(!isAppsLauncherOpen)}
                className={`
                  w-full flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl font-medium text-[15px] transition-all group
                  ${isAppsLauncherOpen 
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                title={isDesktopCollapsed ? "Apps" : undefined}
              >
                <LayoutGrid className="w-5 h-5 shrink-0" />
                {!isDesktopCollapsed && <span className="whitespace-nowrap">Apps</span>}
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 space-y-4 relative">
             {/* Theme Switcher */}
             <div className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
                {!isDesktopCollapsed && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>}
                <div className={`flex items-center bg-gray-200/50 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700 ${isDesktopCollapsed ? 'flex-col gap-2' : ''}`}>
                  <button 
                    onClick={() => changeTheme('light')} 
                    title="Light Mode"
                    className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => changeTheme('dark')} 
                    title="Dark Mode"
                    className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
             </div>
             
             {/* Subdued Logout */}
             <button 
               onClick={handleLogout}
               disabled={isLoggingOut}
               title={isDesktopCollapsed ? "Sign out" : undefined}
               className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3 px-3'} w-full py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors`}
             >
               <LogOut className="w-5 h-5 shrink-0" />
               {!isDesktopCollapsed && <span>{isLoggingOut ? 'Signing out...' : 'Sign out everywhere'}</span>}
             </button>
          </div>
        </div>
      </aside>

      {/* Apps Launcher Popover */}
      {isAppsLauncherOpen && (
        <div className={`fixed z-50 bottom-24 ${isDesktopCollapsed ? 'left-24' : 'left-68 md:left-72'} w-80 max-h-[500px] overflow-y-auto bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-5 transition-all animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5`}>
           <div className="flex items-center justify-between mb-6 px-1">
             <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">Optavel Apps</h3>
             <button onClick={() => setIsAppsLauncherOpen(false)} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all hover:rotate-90 duration-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center">
                <X className="w-4 h-4" strokeWidth={2.5} />
             </button>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <button onClick={() => handleAppLauncherClick('https://slate.optavel.com', true)} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-background flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform">
                 <Logo className="w-8 h-8" />
               </div>
               <div className="text-center">
                 <span className="block text-sm font-medium text-gray-900 dark:text-white">Slate</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Business</span>
               </div>
             </button>
             
             <button onClick={() => handleAppLauncherClick('https://preloom.optavel.com')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-background flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform">
                 <Database className="w-7 h-7 text-green-500" />
               </div>
               <div className="text-center">
                 <span className="block text-sm font-medium text-gray-900 dark:text-white">Preloom</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Data</span>
               </div>
             </button>
             
             <button onClick={() => handleAppLauncherClick('https://teleply.optavel.com')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-background flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform">
                 <PhoneCall className="w-7 h-7 text-indigo-500" />
               </div>
               <div className="text-center">
                 <span className="block text-sm font-medium text-gray-900 dark:text-white">Teleply</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Telehealth</span>
               </div>
             </button>
             
             <button onClick={() => handleAppLauncherClick('https://clipad.optavel.com')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-background flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform">
                 <Video className="w-7 h-7 text-orange-500" />
               </div>
               <div className="text-center">
                 <span className="block text-sm font-medium text-gray-900 dark:text-white">Clipad</span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Productivity</span>
               </div>
             </button>
           </div>
           
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <a href="https://optavel.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">More from Optavel</a>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-transparent relative h-full flex flex-col">
        {isMaintenanceMode && (
          <div className="bg-yellow-500 text-black text-center text-xs font-semibold py-1.5 px-4 sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> System is currently in maintenance mode. Some features may be restricted.
          </div>
        )}

        {/* Desktop account switcher in normal flow */}
        <div className="hidden md:flex justify-end px-6 pt-6 shrink-0 z-50 relative pointer-events-none">
          <div className="pointer-events-auto">
            <AccountSwitcher className={
              isSuperAdmin ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background rounded-full' :
              isPremium ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background rounded-full' : ''
            } />
          </div>
        </div>
        
        <div className={`w-full ${['/help', '/admin'].includes(location.pathname) ? 'flex-1 md:pt-4' : 'max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-32'}`}>
           <Outlet />
        </div>
        <CompanySelectionModal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} />
      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
