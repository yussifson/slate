import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Video, Calendar, MessageSquare, Brain, Shield, BarChart2, CheckSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/constants';

export default function ClipadSidebar({ forceMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Spaces', path: '/spaces', icon: Layout },
    { label: 'Recordings', path: '/videos', icon: Video },
    { label: 'Meetings', path: '/meetings', icon: Calendar },
    { label: 'Chat', path: '/chat', icon: MessageSquare }
  ];

  const adminItems = [];
  if (isAdmin(user)) {
    if (user?.clipad_plan === 'enterprise') {
      adminItems.push({ label: 'Enterprise', path: window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise', icon: Shield });
    } else {
      adminItems.push({ label: 'Analytics', path: window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics', icon: BarChart2 });
    }
  }

  return (
    <aside className={cn("hidden md:flex flex-col w-64 h-full bg-white/50 dark:bg-card/30 backdrop-blur-3xl border-r border-slate-200/60 dark:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 z-50 shrink-0", forceMobile && "hidden")}>
      <div className="h-16 flex items-center px-6 shrink-0 cursor-pointer group mt-2" onClick={() => navigate('/dashboard')}>
        <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm text-primary group-hover:scale-105 transition-transform duration-300">
          <CliPadLogo size={22} />
        </div>
        <span className="ml-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors duration-300">CliPad</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-hide">
        <div className="mb-3 px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Main Menu</div>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "text-primary bg-primary/10 shadow-sm shadow-primary/5" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
              )}
              <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "opacity-70 group-hover:opacity-100")} />
              {item.label}
            </button>
          );
        })}

        {adminItems.length > 0 && (
          <>
            <div className="mt-8 mb-3 px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Administration</div>
            {adminItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 shadow-sm" 
                      : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/10"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full" />
                  )}
                  <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "" : "opacity-70 group-hover:opacity-100")} />
                  {item.label}
                </button>
              );
            })}
          </>
        )}
      </div>

      <div className="p-4 mt-auto">
         {/* Premium subtle footer or capacity indicator could go here */}
      </div>
    </aside>
  );
}
