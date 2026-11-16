import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, subtitle, icon: Icon, iconBg, trend, trendUp, trendLabel, className, accent }) {
  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-4 sm:p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] relative overflow-hidden",
      accent && "border-l-[3px]",
      className
    )} style={accent ? { borderLeftColor: accent } : {}}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label mb-1">{title}</p>
          <p className="text-xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg || "bg-primary/10"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      {/* Trend row */}
      {trend && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
          {trendUp ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={cn("text-xs font-semibold", trendUp ? "text-emerald-600" : "text-red-500")}>
            {trendUp ? "+" : ""}{trend}
          </span>
          <span className="text-xs text-muted-foreground">{trendLabel || "vs last month"}</span>
        </div>
      )}
    </div>
  );
}
