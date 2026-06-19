import { useTranslation} from "react-i18next";
import React from "react";
import { cn} from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className}) {
 const { t} = useTranslation();
 return (
 <div className={cn("bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 transition-", className)}>
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <p className="text-xs font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{title}</p>
 <p className="text-2xl font-semibold text-foreground tracking-[-0.02em]">{value}</p>
 {subtitle && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{subtitle}</p>}
 </div>
 {Icon && (
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
 <Icon className="w-5 h-5 text-primary" />
 </div>
 )}
 </div>
 {trend && (
 <div className="mt-3 flex items-center gap-2">
 <span className={cn("text-xs font-medium", trendUp ? "text-primary" : "text-red-500")}>
 {trendUp ? "↑" : "↓"} {trend}
 </span>
 <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("vs_last_month", "vs last month")}</span>
 </div>
 )}
 </div>
 );
}