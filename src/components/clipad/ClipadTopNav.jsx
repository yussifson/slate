import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Settings, Shield, LogOut, MessageSquare, Search, Plus, User, Plug, Network, ChevronDown, Sparkles, Video, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/clipad/search/GlobalSearch';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationCenter from '@/components/clipad/notifications/NotificationCenter';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { getSavedAccounts } from '@/lib/multiAccountUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export default function ClipadTopNav({ forceMobile = false }) {
  const { user, logout, switchAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [user]);

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const handleAddAccount = () => {
    navigate('/login?prompt=login');
  };

  // Extract page title from route
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <nav className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-4 md:px-6 h-[64px] bg-[#006065] text-white border-b border-white/5 gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-shrink-0 group relative p-[1px] rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-md transition-shadow active:scale-95">
              <div className="flex items-center h-9 bg-[#006065] rounded-full px-3 gap-1.5">
                <Video className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-bold text-white uppercase tracking-wide">Studio</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/60 ml-0.5" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-[#006065] border-white/10 text-white">
            <DropdownMenuItem onClick={() => navigate('/videos')} className="cursor-pointer font-medium py-2 text-white hover:bg-white/10 focus:bg-white/10">
              <Video className="w-4 h-4 mr-2 text-[#fad503]" /> Recordings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/meetings')} className="cursor-pointer font-medium py-2 text-white hover:bg-white/10 focus:bg-white/10">
              <Calendar className="w-4 h-4 mr-2 text-[#fad503]" /> Meetings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search & AI Bar — tablet and up */}
      <div className={cn("flex-1 flex items-center min-w-0 max-w-[500px] gap-3 justify-center", forceMobile ? "hidden" : "hidden md:flex")}>
        <GlobalSearch />
        
        {/* New Top Bar AI Pill Button */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-clipad-orbit"))}
          className="flex-shrink-0 group relative p-[1.5px] rounded-full bg-gradient-to-r from-blue-500 to-pink-500 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex items-center h-10 bg-[#006065] rounded-full px-4 gap-2">
            <Sparkles className="w-[18px] h-[18px] text-blue-300 group-hover:rotate-12 transition-transform" />
            <span className="text-[14px] font-bold text-white uppercase tracking-wide">AI</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className={forceMobile ? "hidden" : "hidden lg:block"}>
          <LanguageSwitcher />
        </div>
        
        <div className={forceMobile ? "hidden" : "hidden lg:block"}>
          <ThemeToggle />
        </div>
        
        {/* Spotlight - Mobile Only */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className={cn("flex items-center justify-center w-[38px] h-[38px] rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all relative", forceMobile ? "flex" : "md:hidden")}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Chat - All Devices */}
        <button 
          onClick={() => navigate('/chat')}
          className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all ml-1 relative"
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
            <DropdownMenuContent align="end" className="w-64 font-sans max-h-[85vh] overflow-y-auto mt-2 p-2 border-slate-200 dark:border-white/10 bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]">
              <DropdownMenuLabel className="font-semibold px-3 py-2 flex flex-col">
                <span className="text-foreground">{user?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
              
              {/* Account Switcher Section */}
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 my-1" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer py-2.5 rounded-lg focus:bg-slate-50 dark:focus:bg-white/5">
                  <User className="mr-3 h-4 w-4 text-slate-500" />
                  <span>Switch Account</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-56 font-sans p-2 border-slate-200 dark:border-white/10 bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-xl">
                    {savedAccounts.filter(acc => acc.id !== user?.id).length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs text-slate-400 dark:text-slate-500 font-semibold px-3 py-1.5 uppercase tracking-wider">
                          Available Accounts
                        </DropdownMenuLabel>
                        {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                          <DropdownMenuItem 
                            key={acc.id} 
                            onClick={() => switchAccount(acc.id)}
                            className="cursor-pointer flex items-center py-2.5 rounded-lg focus:bg-slate-50 dark:focus:bg-white/5"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center mr-3 overflow-hidden shrink-0 border border-slate-200 dark:border-border">
                              {acc.avatar_url ? (
                                <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500">
                                  {acc.full_name ? acc.full_name[0].toUpperCase() : <User className="w-3 h-3"/>}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">{acc.full_name || 'User'}</span>
                              <span className="text-xs text-slate-500 truncate">{acc.email}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 my-1" />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer py-2.5 rounded-lg text-primary focus:text-primary focus:bg-primary/5">
                      <Plus className="mr-3 h-4 w-4" />
                      <span>Add another account</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 my-1" />
              <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer py-2.5 rounded-lg text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
