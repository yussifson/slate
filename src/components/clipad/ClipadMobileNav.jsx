import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, Video, Camera, User, MessageSquare, Bot, Sparkles, Menu, Settings, Shield, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';

export default function ClipadMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Spaces', path: '/spaces', icon: Layers },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
    { label: 'Record', path: '/videos', icon: Camera },
    { label: 'Meetings', path: '/meetings', icon: Video },
    { label: 'Menu', action: () => setIsMenuOpen(true), icon: Menu },
  ];

  // Hide nav on immersive screens
  const isImmersive = location.pathname.startsWith('/record') || 
                      location.pathname.startsWith('/watch') || 
                      /^\/meetings\/[^\/]+$/.test(location.pathname);

  if (isImmersive) return null;

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background/95 backdrop-blur-3xl border-t border-slate-200/60 dark:border-border/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
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
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8 }}
              transition={{ type: "spring", damping: 24, stiffness: 380 }}
              className="lg:hidden fixed bottom-[80px] right-3 z-[60] w-[230px] overflow-hidden rounded-[18px] bg-white/90 dark:bg-[#111827]/85 backdrop-blur-[28px] saturate-[1.8] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] border border-black/[0.08] dark:border-white/[0.12]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Info */}
              {user && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                    {user.avatar_url || user?.user_metadata?.avatar_url ? (
                      <img src={user.avatar_url || user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (user.full_name || user.email)?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-[12px] text-slate-900 dark:text-slate-100 truncate leading-tight">{user.full_name || user?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Action Grid — icons + tiny labels */}
              <div className="p-2 grid grid-cols-4 gap-1">
                {/* Theme */}
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-secondary transition-colors cursor-pointer" title="Theme">
                  <ThemeToggle iconOnly />
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Theme</span>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Settings</span>
                </button>

                {/* Analytics / Enterprise */}
                {user?.clipad_plan !== 'enterprise' ? (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    title="Analytics"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Analytics</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="Enterprise"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400">Enterprise</span>
                  </button>
                )}

                {/* Optavel Account */}
                <button
                  onClick={() => window.location.href = 'https://account.optavel.com'}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-secondary transition-colors"
                  title="Account"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Account</span>
                </button>

                {/* Super Admin */}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => { setIsMenuOpen(false); navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin'); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    title="Admin"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-rose-500">Admin</span>
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] mx-2 mb-1" />
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 mb-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-xl mx-auto"
              >
                <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span className="text-[12px] font-semibold text-red-500 dark:text-red-400">Sign Out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
