import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Video, Calendar, MessageSquare, Shield, BarChart2, Network, Clock, Scale, CheckSquare, Map, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/constants';

export default function ClipadSidebar({ forceMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mainItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Layout },
    { label: 'Spaces', path: '/spaces', icon: Layout },
    { label: 'Recordings', path: '/videos', icon: Video },
    { label: 'Meetings', path: '/meetings', icon: Calendar },
    { label: 'Chat', path: '/chat', icon: MessageSquare }
  ];

  const intelligenceItems = [
    { label: 'Timeline', path: '/timeline', icon: Clock },
    { label: 'Knowledge Graph', path: '/knowledge-graph', icon: Network },
    { label: 'Decisions', path: '/decisions', icon: Scale },
    { label: 'Action Items', path: '/action-items', icon: CheckSquare },
    { label: 'Knowledge Journey', path: '/journey', icon: Map },
    { label: 'Integrations', path: '/integrations', icon: Plug },
  ];

  const adminItems = [];
  if (isAdmin(user)) {
    if (user?.clipad_plan === 'enterprise') {
      adminItems.push({ label: 'Enterprise', path: window.location.hostname.includes('clipad') ? '/enterprise' : '/clipad/enterprise', icon: Shield });
    } else {
      adminItems.push({ label: 'Analytics', path: window.location.hostname.includes('clipad') ? '/analytics' : '/clipad/analytics', icon: BarChart2 });
    }
  }
  
  if (user?.role === 'super_admin') {
    adminItems.push({ label: 'Super Admin', path: window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin', icon: Shield });
  }

  const renderNavButton = (item) => {
    const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
    const Icon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200",
          isActive 
            ? "bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white border border-slate-200/60 dark:border-white/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 border border-transparent"
        )}
      >
        <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "opacity-70")} strokeWidth={isActive ? 2.5 : 2} />
        {item.label}
      </button>
    );
  };

  return (
    <aside className={cn("hidden md:flex flex-col w-[260px] h-full bg-[#F7F8F9] dark:bg-[#0a0a0a] border-r border-slate-200/60 dark:border-white/5 transition-all duration-300 z-50 shrink-0", forceMobile && "hidden")}>
      <div className="h-16 flex items-center px-5 shrink-0 cursor-pointer group mt-1" onClick={() => navigate('/dashboard')}>
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm text-primary group-hover:scale-105 transition-transform duration-300">
          <CliPadLogo size={20} />
        </div>
        <span className="ml-3 text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors duration-300">Clipad</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {mainItems.map(renderNavButton)}
        
        <div className="h-px bg-slate-200 dark:bg-white/5 my-3 mx-2" />
        
        {intelligenceItems.map(renderNavButton)}

        {adminItems.length > 0 && (
          <>
            <div className="h-px bg-slate-200 dark:bg-white/5 my-3 mx-2" />
            {adminItems.map(renderNavButton)}
          </>
        )}
      </div>
    </aside>
  );
}
