import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Settings, Shield, LogOut } from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import GlobalSearch from '@/components/clipad/search/GlobalSearch';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdmin } from '@/lib/constants';

export default function ClipadTopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <nav className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-card/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar w-full">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center border border-slate-200 dark:border-border shadow-sm text-primary">
          <CliPadLogo size={22} />
        </div>
        <span className="text-lg font-bold tracking-tight hidden sm:block">CliPad</span>
      </div>
      
      <div className="flex-1 max-w-md mx-4 flex justify-center hidden md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <button onClick={() => navigate('/spaces')} className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors shrink-0">Spaces</button>
        <button onClick={() => navigate('/videos')} className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors shrink-0">Recordings</button>
        <button onClick={() => navigate('/meetings')} className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors shrink-0">Meetings</button>
        <button onClick={() => navigate('/chat')} className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors shrink-0">Chat</button>
        {isAdmin(user) && (
            <>
              {user?.clipad_plan === 'enterprise' ? (
                <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Enterprise</button>
              ) : (
                <button onClick={() => navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics')} className="hidden md:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white rounded-lg transition-colors">Analytics</button>
              )}
            </>
        )}
        
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
        
        <ThemeToggle />
        
        <button onClick={() => window.dispatchEvent(new CustomEvent("toggle-clipad-orbit"))} className="relative px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-card border border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 transition-all duration-300 flex items-center gap-1.5 ml-2 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" /> 
          <span className="relative z-10 bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">OrbitFlow</span>
        </button>
        
        <NotificationCenter />

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
    </nav>
  );
}
