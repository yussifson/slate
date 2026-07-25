import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Folder, Video, Calendar, MessageSquare, Shield, BarChart2, Network, Clock, Scale, CheckSquare, Map, Plug, Search, Settings, HelpCircle, PanelLeftClose, PanelLeft, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/constants';
import PaystackAPI from '@/api/PaystackAPI';
import { useToast } from '@/components/ui/use-toast';

export default function ClipadSidebar({ forceMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleUpgradeClick = async () => {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'User email is required for payment.', variant: 'destructive' });
      return;
    }

    const currentPlan = user.clipad_plan;
    const isUpgradingToEnterprise = currentPlan === 'pro';
    const amount = isUpgradingToEnterprise ? 200000 : 50000; // 200,000 NGN or 50,000 NGN

    try {
      await PaystackAPI.initializePayment(
        {
          email: user.email,
          amount: amount, 
        },
        (response) => {
          // onSuccess
          console.log('Payment successful:', response);
          toast({ 
            title: 'Payment Successful!', 
            description: `You have successfully upgraded to ${isUpgradingToEnterprise ? 'Enterprise' : 'Pro'}.` 
          });
          // Ideally, we would refresh the user data here.
        },
        () => {
          // onClose
          console.log('Payment window closed.');
        }
      );
    } catch (error) {
      console.error(error);
      toast({ title: 'Payment Failed', description: 'Could not initialize Paystack payment.', variant: 'destructive' });
    }
  };

  const mainItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Layout },
    { label: 'Spaces', path: '/spaces', icon: Folder },
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

  const renderNavItem = (item) => {
    const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
    const Icon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={cn(
          "w-full flex items-center px-3 py-2.5 transition-all duration-200 group relative mb-0.5",
          isCollapsed ? "justify-center rounded-xl" : "gap-3 rounded-xl",
          isActive 
            ? "bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-semibold" 
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 border border-transparent font-medium"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {/* The Exact Green Edge Line for Active State */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-primary rounded-r-full" />
        )}

        <Icon className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", 
          isCollapsed ? "w-5 h-5" : "w-4 h-4",
          isActive ? "text-primary" : "text-slate-500 opacity-80"
        )} strokeWidth={isActive ? 2.5 : 2} />
        
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const workspaceName = user?.user_metadata?.company_name || 'Clipad';
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-full bg-[#f8f9fc] dark:bg-background border-r-2 border-primary/40 dark:border-primary/40 transition-all duration-300 z-50 shrink-0 relative",
        forceMobile && "hidden",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className={cn("h-[68px] flex items-center shrink-0 border-b border-transparent transition-all", isCollapsed ? "px-0 justify-center" : "px-4 justify-between")}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm text-primary group-hover:scale-105 transition-transform">
            <CliPadLogo size={20} />
          </div>
          {!isCollapsed && <span className="font-bold text-[17px] text-slate-800 dark:text-slate-100 truncate">{workspaceName}</span>}
        </div>
        
        {!isCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto scrollbar-hide pb-4", isCollapsed ? "px-2" : "px-3")}>
        
        {/* Quick Actions */}
        <div className={cn("py-2 space-y-0.5", !isCollapsed && "px-1")}>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Quick Search" : undefined}
          >
            <Search className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Quick search</span>}
          </button>
        </div>

        <div className="h-px bg-slate-200/70 dark:bg-white/5 my-2 mx-2" />

        {/* Menu */}
        <div className="py-1">
          {!isCollapsed && <div className="px-3 py-2 text-[12px] font-semibold text-slate-400 tracking-wide uppercase">Menu</div>}
          {mainItems.map(renderNavItem)}
        </div>
        
        <div className="h-px bg-slate-200/70 dark:bg-white/5 my-2 mx-2" />

        {/* Intelligence */}
        <div className="py-1">
          {!isCollapsed && <div className="px-3 py-2 text-[12px] font-semibold text-slate-400 tracking-wide uppercase">Intelligence</div>}
          {intelligenceItems.map(renderNavItem)}
        </div>

        {adminItems.length > 0 && (
          <>
            <div className="h-px bg-slate-200/70 dark:bg-white/5 my-2 mx-2" />
            <div className="py-1">
              {!isCollapsed && <div className="px-3 py-2 text-[12px] font-semibold text-slate-400 tracking-wide uppercase">Admin</div>}
              {adminItems.map(renderNavItem)}
            </div>
          </>
        )}

        {/* Premium Callout (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="px-2 mt-6">
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-primary/20 flex items-center justify-center shadow-sm text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Current plan</p>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{user?.clipad_plan === 'enterprise' ? 'Enterprise' : 'Pro Trial'}</p>
                </div>
              </div>
              <p className="text-[12px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                Upgrade to {user?.clipad_plan === 'pro' ? 'Enterprise' : 'Pro'} to get the latest exclusive features
              </p>
              <button 
                onClick={handleUpgradeClick}
                className="w-full py-2 bg-white dark:bg-primary rounded-xl text-primary dark:text-white font-semibold text-[13px] shadow-sm border border-slate-200 dark:border-transparent flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" fill="currentColor" /> Upgrade to {user?.clipad_plan === 'pro' ? 'Enterprise' : 'Pro'}
              </button>
            </div>
          </div>
        )}

        <div className="h-px bg-slate-200/70 dark:bg-white/5 my-4 mx-2" />

        {/* Bottom Nav */}
        <div className="space-y-0.5 mb-2">
          <button 
            onClick={() => navigate('/settings')} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Preferences" : undefined}
          >
            <Settings className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Preferences</span>}
          </button>
          
          <button 
            onClick={() => window.location.href = "mailto:support@clipad.com"} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-slate-600 hover:bg-slate-100 font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Help" : undefined}
          >
            <HelpCircle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Help</span>}
          </button>
        </div>

      </div>

      {/* User Profile Footer */}
      <div className={cn("p-4 border-t border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-transparent", isCollapsed ? "flex justify-center" : "")}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/settings')}>
          <div className="w-9 h-9 shrink-0 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
            {user?.avatar_url || user?.user_metadata?.avatar_url ? (
              <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-700">{firstName[0]?.toUpperCase()}</span>
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{firstName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.clipad_plan === 'enterprise' ? 'Enterprise plan' : 'Pro trial'}</p>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </>
          )}
        </div>
      </div>

      {/* Expand Toggle (Visible when collapsed) */}
      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3.5 top-6 w-7 h-7 bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-700 z-40 hover:scale-110 transition-all"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
}
