import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Video, Calendar, MessageSquare, Shield, BarChart2, Network, Clock, Scale, CheckSquare, Map, Plug, Search, Bell, Inbox, Settings, Moon, HelpCircle, PanelLeftClose, PanelLeft, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/constants';

export default function ClipadSidebar({ forceMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const renderNavItem = (item) => {
    const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
    const Icon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-200 group relative mb-0.5",
          isActive 
            ? "bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-semibold" 
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 border border-transparent font-medium"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "text-slate-500 opacity-80")} strokeWidth={isActive ? 2.5 : 2} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const workspaceName = user?.user_metadata?.company_name || 'Clipad';
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <aside className={cn("hidden md:flex h-full z-50 shrink-0 transition-all duration-300", forceMobile && "hidden")}>
      
      {/* LEFT RAIL (Pane 1) */}
      <div className="w-[68px] h-full bg-[#dce4f4] dark:bg-[#111624] border-r border-white/50 dark:border-white/5 flex flex-col items-center py-4 shrink-0 shadow-sm relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-primary shadow-sm mb-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/dashboard')}>
          <CliPadLogo size={22} />
        </div>

        <div className="flex flex-col gap-4 w-full items-center">
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <Inbox className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#dce4f4]"></span>
          </button>
          
          <div className="w-8 h-px bg-slate-300 dark:bg-white/10 my-2" />
          
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <Layout className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <BarChart2 className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <Plug className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4 w-full items-center">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/10 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white cursor-pointer hover:scale-105 transition-transform mt-2">
            {user?.avatar_url || user?.user_metadata?.avatar_url ? (
              <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-700">{firstName[0]?.toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT MENU (Pane 2) */}
      <div 
        className={cn(
          "h-full bg-[#f8f9fc] dark:bg-[#0d0d0d] border-r border-slate-200/80 dark:border-white/5 flex flex-col transition-all duration-300 overflow-hidden relative",
          isCollapsed ? "w-0 border-transparent opacity-0" : "w-[260px] opacity-100"
        )}
      >
        {/* Header */}
        <div className="h-[68px] px-4 flex items-center justify-between shrink-0 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CliPadLogo size={16} />
            </div>
            <span className="font-bold text-[17px] text-slate-800 dark:text-slate-100">{workspaceName}</span>
          </div>
          <button onClick={() => setIsCollapsed(true)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          
          {/* Quick Actions */}
          <div className="px-3 py-2 space-y-0.5">
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <Search className="w-4 h-4 opacity-70" /> Quick search
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <div className="flex items-center gap-3"><Inbox className="w-4 h-4 opacity-70" /> Inbox</div>
              <span className="text-xs text-slate-500 font-normal">12</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <div className="flex items-center gap-3"><Bell className="w-4 h-4 opacity-70" /> Notifications</div>
              <span className="text-xs text-slate-500 font-normal">15+</span>
            </button>
          </div>

          <div className="h-px bg-slate-200/70 dark:bg-white/5 my-2 mx-5" />

          {/* Menu */}
          <div className="px-3">
            <div className="px-3 py-2 text-[13px] font-semibold text-slate-500">Menu</div>
            {mainItems.map(renderNavItem)}
          </div>
          
          <div className="h-px bg-slate-200/70 dark:bg-white/5 my-3 mx-5" />

          {/* Intelligence */}
          <div className="px-3">
            <div className="px-3 py-2 text-[13px] font-semibold text-slate-500">Intelligence</div>
            {intelligenceItems.map(renderNavItem)}
          </div>

          {/* Premium Callout */}
          <div className="px-4 mt-6">
            <div className="bg-indigo-50/80 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-indigo-900/50 flex items-center justify-center shadow-sm text-indigo-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current plan:</p>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{user?.clipad_plan === 'enterprise' ? 'Enterprise' : 'Pro Trial'}</p>
                </div>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                Upgrade to Pro to get the latest and exclusive features
              </p>
              <button className="w-full py-2 bg-white dark:bg-indigo-600 rounded-xl text-indigo-600 dark:text-white font-semibold text-[13px] shadow-sm border border-slate-200 dark:border-transparent flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                <Shield className="w-4 h-4" fill="currentColor" /> Upgrade to Pro
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-200/70 dark:bg-white/5 my-4 mx-5" />

          {/* Bottom Nav */}
          <div className="px-3 space-y-0.5 mb-4">
            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <Settings className="w-4 h-4 opacity-70" /> Preferences
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <Moon className="w-4 h-4 opacity-70" /> Dark mode
            </button>
            {user?.role === 'super_admin' && (
              <button onClick={() => navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-indigo-600 hover:bg-indigo-50 font-medium">
                <Shield className="w-4 h-4 opacity-70" /> Super Admin
              </button>
            )}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium">
              <HelpCircle className="w-4 h-4 opacity-70" /> Help
            </button>
          </div>

        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-transparent">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-slate-700">{firstName[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{firstName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.clipad_plan === 'enterprise' ? 'Enterprise plan' : 'Pro trial'}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>

      </div>

      {/* Expand Toggle (Visible when collapsed) */}
      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          className="absolute left-[68px] top-6 w-7 h-7 bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-r-lg flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-700 z-40"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

    </aside>
  );
}
