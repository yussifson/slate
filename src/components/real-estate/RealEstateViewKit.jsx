import React from "react";
import { LayoutGrid, List, Edit, Trash2, Eye } from "lucide-react";
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
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-2 rounded-lg transition-colors",
          viewMode === "grid" ? "bg-emerald-600 text-white" : "text-[#71717a] dark:text-gray-400 hover:bg-muted"
        )}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}

export function REStatCard({ label, value, icon: Icon, hint, variant = "default" }) {
  const variants = {
    default: "bg-slate-100 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-red-500/10 text-red-600",
    success: "bg-slate-100 text-emerald-600"
  };
  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-600/40 p-5 flex items-center gap-4 min-h-[88px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", variants[variant])}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{value}</p>
        <p className="text-xs font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-wide tracking-[0.04em]">{label}</p>
        {hint && <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">{hint}</p>}
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
  badgeColor = "bg-slate-100 text-emerald-600 border-emerald-600/20",
  metrics = [], 
  onEdit, 
  onDelete, 
  onView,
  iconImage
}) {
  return (
    <article className="group relative bg-card border-[0.5px] border-black/9 dark:border-white/8 border-emerald-600/40 rounded-2xl overflow-hidden hover:border-emerald-600/50 transition-all flex flex-col min-h-[260px] text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 p-6">
      <div className="absolute top-3 right-3">
        <CardActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      {badge && (
        <span className={cn("absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border", badgeColor)}>
          {badge}
        </span>
      )}

      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-600/20 to-emerald-600/5 border-4 border-background flex items-center justify-center text-3xl font-black text-emerald-600 mb-4 shrink-0 relative tracking-[-0.02em]">
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
        <div className={cn("mt-auto grid gap-4 pt-4 border-t border-emerald-600/40", metrics.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {metrics.map((m, i) => (
            <div key={i} className={cn("text-center", i > 0 && "border-l border-emerald-600/40")}>
              <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1 tracking-[0.04em]">{m.label}</p>
              <p className="text-lg font-extrabold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
