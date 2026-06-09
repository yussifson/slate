import React from "react";
import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center max-w-sm mx-auto my-6 space-y-4", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-primary shadow-sm">
          <Icon className="w-5 h-5 animate-pulse" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}