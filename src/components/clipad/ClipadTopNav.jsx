import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Settings, Shield, LogOut, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import GlobalSearch from '@/components/clipad/search/GlobalSearch';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdmin } from '@/lib/constants';

export default function ClipadTopNav({ forceMobile = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const navItems = [
    { label: 'Spaces', path: '/spaces' },
    { label: 'Recordings', path: '/videos' },
    { label: 'Meetings', path: '/meetings' },
    { label: 'Chat', path: '/chat' }
  ];

  return (
    <nav className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-2 md:px-4 lg:px-6 h-14 md:h-16 bg-white/80 dark:bg-card/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/5 overflow-hidden gap-1 md:gap-3">
      <div className="flex items-center gap-2 lg:gap-3 cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center border border-slate-200 dark:border-border shadow-sm text-primary">
          <CliPadLogo size={20} className="md:w-[22px] md:h-[22px]" />
        </div>
        <span className="text-base md:text-lg font-bold tracking-tight hidden sm:block">CliPad</span>
      </div>
      
      {/* Search — tablet and up */}
      <div className={cn("flex-1 min-w-0 max-w-sm lg:max-w-md justify-center", forceMobile ? "hidden" : "hidden md:flex")}>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-0.5 md:gap-1.5 lg:gap-2 shrink-0">
        {/* Nav links — desktop only */}
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)} 
              className={cn(`px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors shrink-0`, forceMobile ? "hidden" : "hidden lg:block", isActive ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white')}
            >
              {item.label}
            </button>
          );
        })}
        {isAdmin(user) && (
            <>
              {user?.clipad_plan === 'enterprise' ? (
                <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise')} className={cn(`px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors shrink-0`, forceMobile ? "hidden" : "hidden lg:block", location.pathname.includes('/enterprise') ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white')}>Enterprise</button>
              ) : (
                <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics')} className={cn(`px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors shrink-0`, forceMobile ? "hidden" : "hidden lg:block", location.pathname.includes('/analytics') ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white')}>Analytics</button>
              )}
            </>
        )}
        
        <div className={cn("h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1", forceMobile ? "hidden" : "hidden lg:block")} />
        
        <div className={forceMobile ? "hidden" : "hidden lg:block"}>
          <LanguageSwitcher />
        </div>
        
        <div className={forceMobile ? "hidden" : "hidden lg:block"}>
          <ThemeToggle />
        </div>
        
        {/* Spotlight - Mobile Only */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className={cn("flex items-center justify-center w-[38px] h-[38px] rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/10 transition-all relative", forceMobile ? "flex" : "md:hidden")}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Chat - Mobile Only (Premium Header placement) */}
        <button 
          onClick={() => navigate('/chat')}
          className={cn("flex items-center justify-center w-[38px] h-[38px] rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/10 transition-all ml-1 relative", forceMobile ? "flex" : "lg:hidden")}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <NotificationCenter />

        <div className={forceMobile ? "hidden" : "hidden md:block"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center font-bold text-sm text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 ml-1 overflow-hidden border border-primary/20">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  firstName[0]?.toUpperCase()
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-sans">
              <DropdownMenuLabel className="font-semibold">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {user?.role === 'super_admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin')} className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Shield className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Super Admin Dashboard</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
