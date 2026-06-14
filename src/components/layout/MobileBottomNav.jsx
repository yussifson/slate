import React, { useState} from "react";
import { Link, useLocation} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { cn} from "@/lib/utils";
import { useNavigation} from "@/hooks/useNavigation";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { X, MoreHorizontal, LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield, PanelLeft, ChevronRight} from "lucide-react";

// Mapping string icons to components
const ICON_MAP = {
 LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield
};

export default function MobileBottomNav() {
 const { t} = useTranslation();
 const location = useLocation();
 const { user} = useAuth();
 const { impersonatedCompany} = useImpersonation();
 const { navItems} = useNavigation(user, impersonatedCompany);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

 // We want to show exactly 4 items in the bottom nav + 1 "More" button
 const bottomNavItems = navItems.slice(0, 4);
 const overflowItems = navItems.slice(4);

 return (
 <>
 <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-border -[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
 <div className="flex items-center justify-around h-16 px-1">
 {bottomNavItems.map((item) => {
 const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
 
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className={cn(
 "flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all",
 isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
 )}
 >
 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-slate-100" : "")}>
 <IconComp className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
 </div>
 <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-primary" : "")}>
 {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 </Link>
 );
})}
 
 {/* More Tab */}
 <button
 onClick={() => setMobileMenuOpen(true)}
 className={cn(
 "flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all",
 mobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
 )}
 >
 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", mobileMenuOpen ? "bg-slate-100" : "")}>
 <MoreHorizontal className={cn("w-5 h-5 transition-transform", mobileMenuOpen ? "scale-110" : "")} />
 </div>
 <span className={cn("text-[10px] font-semibold leading-none", mobileMenuOpen ? "text-primary" : "")}>
 {t("more", "More")}
 </span>
 </button>
 </div>
 </nav>

 {/* Native Mobile Bottom Sheet for More Items */}
 {mobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />
 
 {/* Sheet */}
 <div className="relative w-full rounded-t-[32px] max-h-[85vh] bg-white dark:bg-slate-950 transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col">
 
 {/* Drag Handle & Header */}
 <div className="flex flex-col items-center pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
 <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mb-4" />
 <div className="w-full flex items-center justify-between px-6">
 <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t('menu', 'Menu')}</h2>
 <button 
 onClick={() => setMobileMenuOpen(false)} 
 className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Native Scrollable List */}
 <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50 ">
 {overflowItems.map((item, index) => {
 const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
 
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className={cn(
 "flex items-center gap-4 px-5 py-4 transition-colors active:bg-slate-200/50 dark:active:bg-slate-800/50",
 isActive ? "bg-white dark:bg-slate-950" : "bg-transparent hover:bg-white/50 dark:hover:bg-slate-900"
 )}
 >
 <div className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
 isActive ? "bg-primary/10 text-primary" : "bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
 )}>
 <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className={cn(
 "text-[16px] font-semibold tracking-tight flex-1",
 isActive ? "text-primary" : "text-slate-700 dark:text-slate-300"
 )}>
 {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 {/* Chevron for native feel */}
 <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
 </Link>
 );
})}
 </div>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
