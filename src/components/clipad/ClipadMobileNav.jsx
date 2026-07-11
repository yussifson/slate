import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Video, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClipadMobileNav() {
  const location = useLocation();
  
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Spaces', path: '/spaces', icon: Layers },
    { label: 'Record', path: '/record', icon: Camera },
    { label: 'Meetings', path: '/meetings', icon: Video },
    { label: 'Profile', path: '/settings', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[56px] px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full min-w-[60px] active:scale-95 transition-transform duration-100 ease-in-out"
            >
              <div className={cn("relative flex items-center justify-center mb-1 transition-colors duration-200", isActive ? "text-primary" : "text-slate-500 dark:text-slate-400")}>
                <Icon className={cn("w-6 h-6 transition-transform duration-200", isActive ? "scale-110 drop-shadow-sm" : "")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn("text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200 text-center w-full", isActive ? "text-primary" : "text-slate-500 dark:text-slate-400")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
