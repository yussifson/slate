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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-background/90 backdrop-blur-3xl border-t border-slate-200/60 dark:border-border/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between px-2 h-[60px] max-w-md mx-auto overflow-x-auto no-scrollbar">
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

      {/* Mobile Settings Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-card rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-border">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">Menu</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-secondary rounded-full text-slate-500 dark:text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
                {user && (
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-slate-50 dark:bg-secondary border border-slate-100 dark:border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                      {user.avatar_url || user?.user_metadata?.avatar_url ? (
                        <img src={user.avatar_url || user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.full_name || user.email)?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.full_name || user?.user_metadata?.full_name || 'User'}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-secondary cursor-pointer border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center"><Settings className="w-5 h-5" /></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Theme</span>
                  </div>
                  <ThemeToggle />
                </div>

                <button onClick={() => { setIsMenuOpen(false); navigate('/settings'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-secondary text-left transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center"><Settings className="w-5 h-5" /></div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Settings</span>
                </button>

                {user?.clipad_plan !== 'enterprise' ? (
                  <button onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors">
                    <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
                    <span className="font-medium text-purple-600 dark:text-purple-400">Analytics</span>
                  </button>
                ) : (
                  <button onClick={() => { setIsMenuOpen(false); navigate(window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center"><Layers className="w-5 h-5" /></div>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Enterprise Dashboard</span>
                  </button>
                )}

                {user?.role === 'super_admin' && (
                  <button onClick={() => { setIsMenuOpen(false); navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-left transition-colors">
                    <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center"><Shield className="w-5 h-5" /></div>
                    <span className="font-medium text-rose-600 dark:text-rose-400">Super Admin Dashboard</span>
                  </button>
                )}

                <button onClick={() => window.location.href = 'https://account.optavel.com'} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-secondary text-left transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"><User className="w-5 h-5" /></div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Go to Optavel Account</span>
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                <button onClick={async () => { await logout(); navigate('/login'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center"><LogOut className="w-5 h-5" /></div>
                  <span className="font-medium text-red-600 dark:text-red-400">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
