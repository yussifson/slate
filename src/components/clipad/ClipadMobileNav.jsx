import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Home, Layers, Video, Camera, User, MessageSquare, Bot, Sparkles, Menu, Settings, Shield, LogOut, X, Tag, Star, Phone, Globe, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';

export default function ClipadMobileNav({ isMarketing = false, forceMobile = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const marketingNavItems = [
    { label: 'Features', action: () => { window.location.href = '#features'; }, icon: Star },
    { label: 'Pricing', action: () => { window.location.href = '#pricing'; }, icon: Tag },
    { label: 'Support', action: () => { window.location.href = '#contact'; }, icon: Phone },
  ];

  const appNavItems = [
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Spaces', path: '/spaces', icon: Layers },
    { label: 'Record', path: '/videos', icon: Camera },
    { label: 'Menu', action: () => setIsMenuOpen(true), icon: Menu },
  ];

  const navItems = isMarketing ? marketingNavItems : appNavItems;

  return (
    <>
      <nav className={cn("fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background/95 backdrop-blur-3xl border-t border-slate-200/60 dark:border-border/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]", forceMobile ? "flex" : "md:hidden")}>
        <div className="flex items-center justify-around px-2 md:px-8 h-[60px] md:h-[68px] w-full">
          {navItems.map((item) => {
            const isActive = item.path ? location.pathname.startsWith(item.path) : isMenuOpen;
            const Icon = item.icon;
            
            const content = (
              <>
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(var(--primary),0.5)]" />
                )}
                <div className={cn(
                  "relative flex items-center justify-center mb-1 transition-all duration-300", 
                  isActive ? "text-primary -translate-y-0.5" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}>
                  <Icon className={cn(
                    "transition-all duration-300", 
                    isActive ? "w-6 h-6 scale-110 drop-shadow-md" : "w-5 h-5"
                  )} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] sm:text-[11px] font-semibold leading-none tracking-tight transition-all duration-300 text-center w-full", 
                  isActive ? "text-primary opacity-100 font-bold" : "text-slate-400 dark:text-slate-500 opacity-80"
                )}>
                  {item.label}
                </span>
              </>
            );

            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 active:scale-95 transition-transform duration-100 ease-out"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 active:scale-95 transition-transform duration-100 ease-out"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Compact Floating Menu Panel — anchored to bottom-right */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop — very light, doesn't cover page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed inset-0 z-[59]"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Floating Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="lg:hidden fixed bottom-[76px] right-4 z-[60] w-[260px] overflow-hidden rounded-[24px] bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-3xl saturate-[2] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-slate-200/50 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-4 border-b border-black/[0.04] dark:border-white/[0.06] bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-md ring-2 ring-white/60 dark:ring-white/10">
                    {user.avatar_url || user?.user_metadata?.avatar_url ? (
                      <img src={user.avatar_url || user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (user.full_name || user.email)?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 truncate leading-tight">{user.full_name || user?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Action List */}
              <div className="p-2 flex flex-col gap-0.5">
                {/* Theme */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm border border-slate-200/50 dark:border-transparent">
                    <ThemeToggle iconOnly />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Theme</span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm border border-emerald-100/50 dark:border-transparent">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Language</span>
                  </div>
                  <LanguageSwitcher currentLanguage={user?.user_metadata?.language} />
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-blue-50/80 dark:hover:bg-blue-500/10 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-blue-100/50 dark:border-transparent">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Settings</span>
                </button>

                {/* Analytics / Enterprise */}
                {user?.clipad_plan !== 'enterprise' ? (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-purple-50/80 dark:hover:bg-purple-500/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-purple-100/50 dark:border-transparent">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Analytics</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-indigo-100/50 dark:border-transparent">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Enterprise</span>
                  </button>
                )}

                {/* Optavel Account */}
                <button
                  onClick={() => window.location.href = 'https://account.optavel.com'}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-slate-200/50 dark:border-transparent">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Account</span>
                </button>

                {/* Super Admin */}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-rose-50/80 dark:hover:bg-rose-500/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-rose-100/50 dark:border-transparent">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-rose-600 dark:text-rose-400">Admin</span>
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="border-t border-slate-200/50 dark:border-white/[0.06] mx-3 my-1" />
              <div className="p-2 pt-1">
                <button
                  onClick={async () => { await logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm border border-red-100/50 dark:border-transparent">
                    <LogOut className="w-4 h-4 ml-0.5" />
                  </div>
                  <span className="text-[13px] font-semibold text-red-600 dark:text-red-400">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
