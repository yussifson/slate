import React from "react";
import { cn } from "@/lib/utils";

export default function SectionCard({ title, description, actions, children, className, noPadding = false }) {
  return (
    <div className={cn(
      "bg-card rounded-lg border border-border shadow-[var(--shadow-card)]",
      className
    )}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="min-w-0">
            {title && <h3 className="text-[14px] font-semibold text-foreground leading-tight">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div className={cn(!noPadding && "p-4 sm:p-5")}>
        {children}
      </div>
    </div>
  );
}
