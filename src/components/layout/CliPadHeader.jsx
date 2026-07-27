import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Plug, Plus, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getSavedAccounts } from '@/lib/multiAccountUtils';
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
  const { user, logout, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [user]);
  
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  const handleAddAccount = () => {
    navigate('/login?prompt=login');
  };

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
          <DropdownMenuContent align="end" className="w-64 font-sans max-h-[85vh] overflow-y-auto">
            <DropdownMenuLabel className="font-semibold px-3 py-2 flex flex-col">
              <span className="text-foreground">{user?.full_name || 'User'}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Account Switcher Section */}
            {savedAccounts.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-3 py-1.5 uppercase tracking-wider">
                  Switch Account
                </DropdownMenuLabel>
                {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                  <DropdownMenuItem 
                    key={acc.id} 
                    onClick={() => switchAccount(acc.id)}
                    className="cursor-pointer flex items-center py-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-3 overflow-hidden shrink-0 border border-border">
                      {acc.avatar_url ? (
                        <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {acc.full_name ? acc.full_name[0].toUpperCase() : <User className="w-3 h-3"/>}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{acc.full_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground truncate">{acc.email}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer py-2 text-primary focus:text-primary">
              <Plus className="mr-3 h-4 w-4" />
              <span>Add another account</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
