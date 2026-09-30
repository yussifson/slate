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
          "w-full flex items-center px-3 py-2.5 transition-all duration-200 group relative mb-1",
          isCollapsed ? "justify-center rounded-xl" : "gap-3 rounded-xl",
          isActive 
            ? "bg-slate-100/90 text-slate-900 shadow-sm font-bold border-l-4 border-[#ff521d] pl-2.5" 
            : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-900 font-medium"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", 
          isCollapsed ? "w-5 h-5" : "w-4 h-4",
          isActive ? "text-[#ff521d]" : "text-slate-400 group-hover:text-slate-700"
        )} strokeWidth={isActive ? 2.5 : 2} />
        
        {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
      </button>
    );
  };

  const rawWorkspaceName = user?.user_metadata?.company_name || 'Clipad';
  const workspaceName = rawWorkspaceName.split(' ')[0];
  const firstName = user?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-white text-slate-900 border-r border-slate-200/80 transition-all duration-300 z-50 shrink-0 relative",
        forceMobile && "hidden",
        isCollapsed ? "w-[72px]" : "w-[260px]",
        "h-full overflow-hidden"
      )}
    >
      {/* Header */}
      <div className={cn("h-[64px] flex items-center shrink-0 transition-all border-b border-slate-100 bg-white", isCollapsed ? "px-0 justify-center" : "px-4 justify-between")}>
        {isCollapsed ? (
          /* When collapsed: show expand toggle in logo position */
          <button 
            onClick={() => setIsCollapsed(false)} 
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all hover:scale-105"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-[#ff521d] flex items-center justify-center shadow-md text-white group-hover:scale-105 transition-transform">
                <CliPadLogo size={20} />
              </div>
              <div>
                <span className="font-black text-[16px] text-slate-900 truncate block leading-tight">{workspaceName}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pro Account</span>
              </div>
            </div>
            <button onClick={() => setIsCollapsed(true)} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto scrollbar-hide pb-4 bg-white", isCollapsed ? "px-2" : "px-3")}>
        

        {/* Menu */}
        <div className="py-2">
          {!isCollapsed && <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase">General</div>}
          {mainItems.map(renderNavItem)}
        </div>
        
        <div className="h-px bg-slate-100 my-2 mx-2" />

        {/* Intelligence */}
        <div className="py-1">
          {!isCollapsed ? (
            <button 
              onClick={() => toggleSection('intelligence')}
              className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-slate-400 font-bold hover:text-slate-700 tracking-wide uppercase transition-colors"
            >
              <span>Intelligence</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openSections.intelligence && "rotate-180")} />
            </button>
          ) : (
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 font-bold tracking-wider uppercase text-center cursor-pointer" onClick={() => setIsCollapsed(false)}>INT</div>
          )}
          {(openSections.intelligence || isCollapsed) && (
            <div className="mt-1 space-y-0.5">
              {intelligenceItems.map(renderNavItem)}
            </div>
          )}
        </div>

        {adminItems.length > 0 && (
          <>
            <div className="h-px bg-slate-100 my-2 mx-2" />
            <div className="py-1">
              {!isCollapsed ? (
                <button 
                  onClick={() => toggleSection('admin')}
                  className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-slate-400 font-bold hover:text-slate-700 tracking-wide uppercase transition-colors"
                >
                  <span>Admin</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openSections.admin && "rotate-180")} />
                </button>
              ) : (
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 font-bold tracking-wider uppercase text-center cursor-pointer" onClick={() => setIsCollapsed(false)}>ADM</div>
              )}
              {(openSections.admin || isCollapsed) && (
                <div className="mt-1 space-y-0.5">
                  {adminItems.map(renderNavItem)}
                </div>
              )}
            </div>
          </>
        )}

        <div className="h-px bg-slate-100 my-4 mx-2" />

        {/* Bottom Nav */}
        <div className="space-y-0.5 mb-2">
          <button 
            onClick={() => navigate('/settings')} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Preferences" : undefined}
          >
            <Settings className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Preferences</span>}
          </button>
          
          <button 
            onClick={() => navigate('/support')} 
            className={cn("w-full flex items-center rounded-xl text-[14px] text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 font-medium group", isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5")}
            title={isCollapsed ? "Help & Support" : undefined}
          >
            <HelpCircle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {!isCollapsed && <span>Help & Support</span>}
          </button>
        </div>

      </div>

      {/* User Profile Footer */}
      <div className={cn("p-4 border-t border-slate-100 bg-white text-slate-900", isCollapsed ? "flex justify-center" : "")}>
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
                    <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">{firstName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{displayPlanName}</p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
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

    </aside>
  );
}
