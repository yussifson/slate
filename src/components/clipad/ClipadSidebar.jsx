import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Folder, Video, Calendar, MessageSquare, Shield, BarChart2, Network, Clock, Scale, CheckSquare, Map, Plug, Search, Settings, HelpCircle, PanelLeftClose, PanelLeft, ChevronUp, ChevronDown, Activity, LogOut, Target, TrendingUp, Zap, GitMerge, HeartPulse, Sparkles, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/constants';
import PaystackAPI from '@/api/PaystackAPI';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClipadSidebar({ forceMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({ intelligence: false, admin: false });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentPlan = user?.clipad_plan || 'free';
  const planRank = { free: 0, pro: 1, enterprise: 2 };
  const targetPlan = currentPlan === 'free' ? 'pro' : currentPlan === 'pro' ? 'enterprise' : 'pro';
  const actionWord = (planRank[currentPlan] || 0) > (planRank[targetPlan] || 0) ? 'Downgrade' : 'Upgrade';
  const displayPlanName = currentPlan === 'enterprise' ? 'Enterprise' : currentPlan === 'pro' ? 'Pro' : 'Free Tier';
  const targetPlanDisplay = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);

  const handleUpgradeClick = async () => {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'User email is required for payment.', variant: 'destructive' });
      return;
    }

    const isUpgradingToEnterprise = targetPlan === 'enterprise';
    const amount = isUpgradingToEnterprise ? 300 : 100; // 300 GHS or 100 GHS

    try {
      await PaystackAPI.initializePayment(
        {
          email: user.email,
          amount: amount, 
          currency: 'GHS',
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
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Spaces', path: '/spaces', icon: Folder },
  ];

  const isSuperAdmin = user?.role === 'super_admin';
  const intelligenceItems = [
    { label: 'Timeline', path: '/timeline', icon: Clock },
    { label: 'Knowledge Graph', path: '/knowledge-graph', icon: Network },
    { label: 'Decisions', path: '/decisions', icon: Scale },
    { label: 'Action Items', path: '/action-items', icon: CheckSquare },
    { label: 'Knowledge Journey', path: '/journey', icon: Map },
    { label: 'Integrations', path: '/integrations', icon: Plug },
    { label: 'Integration Analytics', path: '/integration-analytics', icon: BarChart2 },
    ...(isSuperAdmin ? [
      { label: 'Commitment Engine', path: '/commitments', icon: Target },
      { label: 'Risk Intelligence', path: '/risk', icon: TrendingUp },
      { label: 'Org Health Pulse', path: '/pulse', icon: HeartPulse },
      { label: 'Cross-Space Intel', path: '/cross-space', icon: GitMerge },
    ] : []),
  ];

  // Admin items
  const adminItems = [];

  if (isAdmin(user)) {
    adminItems.push({
      label: 'Analytics',
      path: '/analytics',
      icon: BarChart2
    });
    adminItems.push({
      label: 'Knowledge Health',
      path: '/health',
      icon: Activity
    });
    adminItems.push({
      label: 'Custom Requests',
      path: '/admin/custom-requests',
      icon: Sparkles
    });
  }
  
  if (user?.role === 'super_admin') {
    adminItems.push({ 
      label: 'Super Admin', 
      path: '/admin', 
      icon: Shield 
    });
  }

  const renderNavItem = (item) => {
    const isLegacyPath = window.location.pathname.startsWith('/clipad');
    const targetPath = isLegacyPath ? `/clipad${item.path}` : item.path;
    const isActive = location.pathname.startsWith(targetPath) || (item.path === '/search' && location.pathname === '/');
    const Icon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => navigate(targetPath)}
        className={cn(
          "w-full flex items-center px-3 py-2.5 transition-all duration-200 group relative mb-0.5",
          isCollapsed ? "justify-center rounded-xl" : "gap-3 rounded-xl",
          isActive 
            ? "bg-[#fad503] text-[#006065] shadow-[0_2px_12px_rgba(250,213,3,0.35)] font-bold" 
            : "text-white/70 hover:bg-white/10 hover:text-white border border-transparent font-medium"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", 
          isCollapsed ? "w-5 h-5" : "w-4 h-4",
          isActive ? "text-[#006065]" : "text-white/70 group-hover:text-white"
        )} strokeWidth={isActive ? 2.5 : 2} />
        
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const rawWorkspaceName = user?.user_metadata?.company_name || 'Clipad';
  const workspaceName = rawWorkspaceName.split(' ')[0];
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-[#006065] text-white border-r border-black/20 dark:border-white/10 shadow-[4px_0_20px_rgba(0,0,0,0.15)] transition-all duration-300 z-50 shrink-0 relative",
        forceMobile && "hidden",
        isCollapsed ? "w-[72px]" : "w-[260px]",
        "h-full overflow-hidden"
      )}
    >
      {/* Header */}
      <div className={cn("h-[68px] flex items-center shrink-0 border-b border-transparent transition-all", isCollapsed ? "px-0 justify-center" : "px-4 justify-between")}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/search')}>
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-transparent shadow-sm text-[#006065] group-hover:scale-105 transition-transform">
            <CliPadLogo size={20} />
          </div>
          {!isCollapsed && <span className="font-bold text-[17px] text-white truncate">{workspaceName}</span>}
        </div>
        
        {!isCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="text-white/60 hover:text-white transition-colors p-1">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto scrollbar-hide pb-4", isCollapsed ? "px-2" : "px-3")}>
        

        {/* Menu */}
        <div className="py-1">
          {!isCollapsed && <div className="px-3 py-2 text-[12px] font-semibold text-white/50 tracking-wide uppercase">Menu</div>}
          {mainItems.map(renderNavItem)}
        </div>
        
        <div className="h-px bg-white/10 my-2 mx-2" />

        {/* Intelligence */}
        <div className="py-1">
          {!isCollapsed ? (
            <button 
              onClick={() => toggleSection('intelligence')}
              className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-white/50 hover:text-white tracking-wide uppercase transition-colors"
            >
              <span>Intelligence</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openSections.intelligence && "rotate-180")} />
            </button>
          ) : (
            <div className="px-3 py-2 text-[10px] font-semibold text-white/50 tracking-wide uppercase text-center cursor-pointer" onClick={() => setIsCollapsed(false)}>INT</div>
          )}
          {(openSections.intelligence || isCollapsed) && (
            <div className="mt-1 space-y-0.5">
              {intelligenceItems.map(renderNavItem)}
            </div>
          )}
        </div>

        {adminItems.length > 0 && (
          <>
            <div className="h-px bg-white/10 my-2 mx-2" />
            <div className="py-1">
              {!isCollapsed ? (
                <button 
                  onClick={() => toggleSection('admin')}
                  className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-white/50 hover:text-white tracking-wide uppercase transition-colors"
                >
                  <span>Admin</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openSections.admin && "rotate-180")} />
                </button>
              ) : (
                <div className="px-3 py-2 text-[10px] font-semibold text-white/50 tracking-wide uppercase text-center cursor-pointer" onClick={() => setIsCollapsed(false)}>ADM</div>
              )}
              {(openSections.admin || isCollapsed) && (
                <div className="mt-1 space-y-0.5">
                  {adminItems.map(renderNavItem)}
                </div>
              )}
            </div>
          </>
        )}

        <div className="h-px bg-white/10 my-4 mx-2" />

        {/* Bottom Nav */}
        <div className="space-y-0.5 mb-2">
          <button 
            onClick={() => navigate('/settings')} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-white/70 hover:bg-white/10 hover:text-white font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Preferences" : undefined}
          >
            <Settings className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Preferences</span>}
          </button>
          
          <button 
            onClick={() => navigate('/support')} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-white/70 hover:bg-white/10 hover:text-white font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Help & Support" : undefined}
          >
            <HelpCircle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Help & Support</span>}
          </button>
        </div>

      </div>

      {/* User Profile Footer */}
      <div className={cn("p-4 border-t border-white/10 bg-transparent", isCollapsed ? "flex justify-center" : "")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden border border-transparent">
                {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={user.avatar_url || user.user_metadata.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#006065]">{firstName[0]?.toUpperCase()}</span>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate group-hover:text-white/90 transition-colors">{firstName}</p>
                    <p className="text-[11px] text-white/60 truncate">{displayPlanName}</p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56 font-sans">
            <DropdownMenuLabel className="font-semibold px-3 py-2 flex flex-col">
              <span className="text-foreground">{user?.full_name || 'User'}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === 'super_admin' && (
              <DropdownMenuItem 
                onClick={() => navigate(window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin')} 
                className="cursor-pointer py-2"
              >
                <Shield className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Super Admin</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={async () => { await logout(); navigate('/login'); }} 
              className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
