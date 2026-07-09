import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Menu, X, Home, UserCircle, ShieldCheck, CreditCard, MonitorSmartphone, Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";

export default function AccountPortalLayout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
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

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Personal info', path: '/personal-info', icon: UserCircle },
    { name: 'Security', path: '/security', icon: ShieldCheck },
    { name: 'Payments & subscriptions', path: '/subscriptions', icon: CreditCard },
    { name: 'Devices', path: '/devices', icon: MonitorSmartphone },
  ];

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const initials = getInitials(profile?.first_name, profile?.last_name, user?.email);

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED] font-sans flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
             <Logo className="w-8 h-8" />
             <span className="text-xl font-medium tracking-tight">Optavel</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm">
          {initials}
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#F8F9FA] dark:bg-[#1A1B1E] border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full md:shadow-none'}
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        {/* Desktop Logo Area */}
        <div className="hidden md:flex items-center justify-between px-5 h-20 pt-4">
          {!isDesktopCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <Logo className="w-9 h-9 shrink-0" />
              <span className="text-xl font-medium tracking-tight text-gray-800 dark:text-gray-100 whitespace-nowrap">Optavel</span>
            </div>
          )}
          {isDesktopCollapsed && (
             <div className="w-full flex justify-center">
                <Logo className="w-9 h-9 shrink-0" />
             </div>
          )}
        </div>
        
        {/* Collapse Toggle (Desktop Only) */}
        <button 
           onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
           className="hidden md:flex absolute -right-3 top-24 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
        >
           {isDesktopCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

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
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 space-y-4">
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#202124] relative h-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-32">
           <Outlet />
        </div>
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
