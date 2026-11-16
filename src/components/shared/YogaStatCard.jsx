import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg, 
  badge,
  badgeVariant = "default",
  className 
}) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-all duration-200 hover:shadow-sm relative overflow-hidden group",
      className
    )}>
      {/* Top Header: Label on left, Clean Icon Pill on right */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs",
            iconBg || "bg-primary/10 text-primary dark:bg-primary/20"
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Metric Value and optional Badge */}
      <div className="flex items-baseline gap-2">
        <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-foreground truncate">
          {value}
        </p>
        {badge && (
          <Badge 
            variant={badgeVariant} 
            className="text-[10px] h-4.5 px-1.5 font-bold shrink-0"
          >
            {badge}
          </Badge>
        )}
      </div>

      {/* Clean Descriptive Subtitle */}
      {subtitle && (
        <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
