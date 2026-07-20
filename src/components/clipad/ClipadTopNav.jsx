import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Settings, Shield, LogOut, MessageSquare, Search, Plus, User, Plug, Network, ChevronDown, Layout, Video, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
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
import { isAdmin } from '@/lib/constants';

export default function ClipadTopNav({ forceMobile = false }) {
  const { user, logout, switchAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [user]);

  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const navItems = [
    { label: 'Spaces', path: '/spaces', icon: Layout },
    { label: 'Recordings', path: '/videos', icon: Video },
    { label: 'Meetings', path: '/meetings', icon: Calendar },
    { label: 'Chat', path: '/chat', icon: MessageSquare }
  ];

  const knowledgeItems = [
    { label: '🕸️ Knowledge Graph', path: '/knowledge-graph', desc: 'Visual relationship map' },
    { label: '⏱️ Timeline', path: '/timeline', desc: 'Chronological knowledge feed' },
    { label: '⚖️ Decisions', path: '/decisions', desc: 'AI-detected decisions' },
    { label: '✅ Action Items', path: '/action-items', desc: 'Tasks across all sources' },
    { label: '🔗 Knowledge Journey', path: '/journey', desc: 'Cross-system knowledge flow' },
    { label: '🔌 Integrations', path: '/integrations', desc: 'Connect external apps' },
  ];

  const handleAddAccount = () => {
    navigate('/login?prompt=login');
  };

  return (
    <nav className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-2 md:px-4 lg:px-6 h-14 md:h-16 bg-white/80 dark:bg-card/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/5 gap-1 md:gap-3">
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
          const Icon = item.icon;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)} 
              className={cn(`flex items-center gap-1.5 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors shrink-0`, forceMobile ? "hidden" : "hidden lg:flex", isActive ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white')}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          );
        })}

        {/* Knowledge Intelligence dropdown */}
        <div className={cn('relative group', forceMobile ? 'hidden' : 'hidden lg:block')}>
          <button
            className={cn('flex items-center gap-1 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors',
              ['/knowledge-graph','/timeline','/decisions','/action-items','/journey','/integrations'].some(p => location.pathname.startsWith(p))
                ? 'text-primary bg-primary/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white'
            )}
          >
            <Network className="w-3.5 h-3.5" />
            Intelligence
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>
          <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {knowledgeItems.map(ki => (
              <button
                key={ki.path}
                onClick={() => navigate(ki.path)}
                className={cn('w-full flex flex-col items-start px-4 py-2.5 text-left hover:bg-secondary transition-colors', location.pathname === ki.path ? 'text-primary bg-primary/5' : '')}
              >
                <span className="text-xs font-semibold text-foreground">{ki.label}</span>
                <span className="text-[10px] text-muted-foreground">{ki.desc}</span>
              </button>
            ))}
          </div>
        </div>
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
            <DropdownMenuContent align="end" className="w-64 font-sans max-h-[85vh] overflow-y-auto">
              <DropdownMenuLabel className="font-semibold px-3 py-2 flex flex-col">
                <span className="text-foreground">{user?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-2">
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/integrations')} className="cursor-pointer py-2">
                <Plug className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Integrations</span>
              </DropdownMenuItem>
              {user?.role === 'super_admin' && (
                <DropdownMenuItem onClick={() => navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin')} className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-2">
                  <Shield className="mr-3 h-4 w-4" />
                  <span className="font-semibold">Super Admin Dashboard</span>
                </DropdownMenuItem>
              )}
              
              {/* Account Switcher Section */}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer py-2">
                  <User className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span>Switch Account</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-56 font-sans">
                    {savedAccounts.filter(acc => acc.id !== user?.id).length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-3 py-1.5 uppercase tracking-wider">
                          Available Accounts
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
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer py-2 text-primary focus:text-primary">
                      <Plus className="mr-3 h-4 w-4" />
                      <span>Add another account</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
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
