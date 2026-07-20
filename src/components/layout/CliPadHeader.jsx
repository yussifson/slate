import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Plug } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import GlobalSearch from '@/components/clipad/search/GlobalSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CliPadHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-slate-200 dark:border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center border border-slate-200 dark:border-border shadow-sm text-primary">
          <CliPadLogo size={22} />
        </div>
        <span className="text-lg font-bold tracking-tight">CliPad</span>
      </div>

      <div className="flex-1 max-w-2xl mx-4 flex justify-center">
        <GlobalSearch />
      </div>
      
      <div className="flex items-center gap-1.5 md:gap-3">
        <ThemeToggle />
        
        {/* New Notification Center Component added here */}
        <NotificationCenter />
        
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-foreground hidden md:block"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

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
            <DropdownMenuItem onClick={() => navigate('/clipad/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/clipad/integrations')} className="cursor-pointer">
              <Plug className="mr-2 h-4 w-4" />
              <span>Integrations</span>
            </DropdownMenuItem>
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
