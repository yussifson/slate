import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Menu, X, Home, UserCircle, ShieldCheck, CreditCard, MonitorSmartphone, Sun, Moon, LogOut } from 'lucide-react';
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";

export default function AccountPortalLayout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // 1. Clear local storage cache
    localStorage.removeItem('slate_cached_user');
    
    // 2. Sign out of Supabase
    await supabase.auth.signOut();
    
    // 3. Optional: Add an iframe trick here later if we need to clear tokens across subdomains, 
    // but for now, redirecting to login is sufficient for the root domain.
    navigate('/login');
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
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#202124] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 border-r border-gray-200 dark:border-gray-800 shadow-2xl' : '-translate-x-full md:border-none md:shadow-none'}
      `}>
        {/* Desktop Logo Area */}
        <div className="hidden md:flex items-center gap-3 px-8 h-20 pt-4">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-medium tracking-tight text-gray-800 dark:text-gray-100">Optavel</span>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
          <nav className="flex-1 px-3 py-4 md:py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-4 px-5 py-3.5 rounded-r-full font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-5 border-t border-gray-100 dark:border-gray-800/60 space-y-4 bg-white dark:bg-[#202124]">
             {/* Theme Switcher */}
             <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => changeTheme('light')} 
                    className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => changeTheme('dark')} 
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
               className="flex items-center gap-3 w-full px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
             >
               <LogOut className="w-5 h-5" />
               {isLoggingOut ? 'Signing out...' : 'Sign out everywhere'}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-24">
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
