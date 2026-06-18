import { useTranslation} from "react-i18next";
import React from "react";
import { cn} from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className}) {
 const { t} = useTranslation();
 return (
 <div className={cn("stat-card-premium", className)}>
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-2 flex-1">
 <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">{title}</p>
 <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
 {subtitle && <p className="text-xs font-medium text-muted-foreground mt-1">{subtitle}</p>}
 </div>
 {Icon && (
 <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110">
 <Icon className="w-6 h-6 text-primary" />
 </div>
 )}
 </div>
 {trend && (
 <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border/30">
 <span className={cn("text-sm font-semibold", trendUp ? "text-primary" : "text-destructive")}>
 {trendUp ? "↑" : "↓"} {trend}
 </span>
 <span className="text-xs text-muted-foreground font-medium">{t("vs_last_month", "vs last month")}</span>
 </div>
 )}
 </div>
 );
}
