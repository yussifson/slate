import React from "react";
import { List, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Brand emerald palette — perfect for Real Estate */
export const RE_BRAND = {
  primary: "hsl(142.1, 76.2%, 36.3%)", // emerald-600
  primaryDark: "hsl(142.1, 70.6%, 25.3%)", // emerald-800
  primaryLight: "hsl(149.3, 80.4%, 90%)", // emerald-100
};

export function ViewModeToggle({ viewMode, onChange, className }) {
  return (
    <div className={cn("bg-card border-[0.5px] border-black/9 dark:border-white/8 border-emerald-600/40 p-1 rounded-xl flex items-center ", className)}>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-2 rounded-lg transition-colors",
          viewMode === "list" ? "bg-emerald-600 text-white" : "text-[#71717a] dark:text-gray-400 hover:bg-muted"
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

export function REStatCard({ label, value, icon: Icon, hint, variant = "default", trend }) {
  const variants = {
    default: {
      bg: "bg-gradient-to-br from-emerald-50 via-emerald-25 to-emerald-50 dark:from-emerald-950/30 dark:via-emerald-900/20 dark:to-emerald-950/30",
      icon: "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200/60 dark:border-emerald-800/40",
      shadow: "hover:shadow-[0_12px_24px_rgba(5,150,105,0.15)] dark:hover:shadow-[0_12px_24px_rgba(5,150,105,0.1)]"
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 via-amber-25 to-amber-50 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-950/30",
      icon: "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200/60 dark:border-amber-800/40",
      shadow: "hover:shadow-[0_12px_24px_rgba(217,119,6,0.15)] dark:hover:shadow-[0_12px_24px_rgba(217,119,6,0.1)]"
    },
    danger: {
      bg: "bg-gradient-to-br from-red-50 via-red-25 to-red-50 dark:from-red-950/30 dark:via-red-900/20 dark:to-red-950/30",
      icon: "bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/50 dark:to-red-800/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200/60 dark:border-red-800/40",
      shadow: "hover:shadow-[0_12px_24px_rgba(239,68,68,0.15)] dark:hover:shadow-[0_12px_24px_rgba(239,68,68,0.1)]"
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-50 via-emerald-25 to-emerald-50 dark:from-emerald-950/30 dark:via-emerald-900/20 dark:to-emerald-950/30",
      icon: "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200/60 dark:border-emerald-800/40",
      shadow: "hover:shadow-[0_12px_24px_rgba(5,150,105,0.15)] dark:hover:shadow-[0_12px_24px_rgba(5,150,105,0.1)]"
    }
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <div className={cn(
      "bg-card rounded-xl border-[0.5px] p-5 flex items-center gap-4 min-h-[88px] transition-all duration-300 ease-out",
      variantStyle.bg,
      variantStyle.border,
      variantStyle.shadow
    )}>
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110", variantStyle.icon)}>
        <Icon className={cn("w-7 h-7 transition-colors duration-300", variantStyle.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className={cn("text-3xl font-bold tracking-tight tracking-[-0.02em]", variantStyle.text)}>{value}</p>
          {trend && (
            <span className={cn("text-xs font-semibold flex items-center gap-0.5", trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        <p className={cn("text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mt-1")}>{label}</p>
        {hint && <p className={cn("text-[11px] font-medium mt-0.5", variantStyle.text)}>{hint}</p>}
      </div>
    </div>
  );
}

export function REPageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function REGridShell({ children, empty, isLoading, loadingText = "Loading..." }) {
  if (isLoading) {
    return <div className="py-16 text-center text-[#71717a] dark:text-gray-400">{loadingText}</div>;
  }
  if (empty) return empty;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
      {children}
    </div>
  );
}

export function CardActions({ onEdit, onDelete, onView }) {
  return (
    <div className="absolute top-3 right-3 flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {onView && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 hover:bg-emerald-50 hover:text-emerald-600" onClick={onView}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}
      {onEdit && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 hover:bg-emerald-50 hover:text-emerald-600" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/95 hover:bg-red-50 text-red-600" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

/** 
 * A generic, highly flexible Data Card used everywhere in Real Estate.
 * Designed to look exactly like the premium retail cards.
 */
export function REDataCard({ 
  title, 
  subtitle, 
  iconText, 
  badge, 
  badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
  metrics = [], 
  onEdit, 
  onDelete, 
  onView,
  iconImage
}) {
  return (
    <article className="group relative bg-card border-[0.5px] border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl overflow-hidden hover:border-emerald-400/60 dark:hover:border-emerald-600/60 transition-all duration-300 flex flex-col min-h-[260px] text-center hover:shadow-[0_16px_32px_rgba(5,150,105,0.12)] dark:hover:shadow-[0_16px_32px_rgba(5,150,105,0.08)] p-6">
      <div className="absolute top-3 right-3">
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      {badge && (
        <span className={cn("absolute top-3 left-3 text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider border transition-all duration-300", badgeColor)}>
          {badge}
        </span>
      )}

      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 border-4 border-background flex items-center justify-center text-3xl font-black text-emerald-700 dark:text-emerald-400 mb-4 shrink-0 relative tracking-[-0.02em] transition-transform duration-300 group-hover:scale-110">
        {iconImage ? (
          <img src={iconImage} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          iconText
        )}
      </div>
      
      <div className="min-w-0 flex-1 mb-6">
        <h3 className="font-semibold text-xl text-foreground truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono mt-1 tracking-[0.04em]">{subtitle}</p>
        )}
      </div>
      
      {metrics.length > 0 && (
        <div className={cn("mt-auto grid gap-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40", metrics.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {metrics.map((m, i) => (
            <div key={i} className={cn("text-center", i > 0 && "border-l border-emerald-200/60 dark:border-emerald-800/40")}>
              <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{m.label}</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
