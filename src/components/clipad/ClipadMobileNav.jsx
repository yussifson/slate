import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Video, Camera, User, MessageSquare, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClipadOrbitAssistant from './ClipadOrbitAssistant';

export default function ClipadMobileNav() {
  const location = useLocation();
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Spaces', path: '/spaces', icon: Layers },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
    { label: 'Record', path: '/record', icon: Camera },
    { label: 'Meetings', path: '/meetings', icon: Video },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border-t border-slate-200/60 dark:border-slate-800/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between px-2 h-[60px] max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-full h-full min-w-[56px] py-1 active:scale-95 transition-transform duration-100 ease-out"
              >
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
                  "text-[10px] font-semibold leading-none tracking-tight transition-all duration-300 text-center w-full", 
                  isActive ? "text-primary opacity-100 font-bold" : "text-slate-400 dark:text-slate-500 opacity-80"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Orbit AI Floating Toggle - Visible on all screens */}
      {!isOrbitOpen && (
        <button
          onClick={() => setIsOrbitOpen(true)}
          className="fixed bottom-[80px] md:bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
        >
          <Bot className="w-6 h-6" />
          <Sparkles className="w-3 h-3 text-amber-300 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Orbit Assistant Modal */}
      <ClipadOrbitAssistant isOpen={isOrbitOpen} onClose={() => setIsOrbitOpen(false)} />
    </>
  );
}
