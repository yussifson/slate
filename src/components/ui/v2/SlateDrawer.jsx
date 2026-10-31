import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SlateDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-xl"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div 
        className={cn(
          "w-full h-full bg-[var(--slate-v2-surface-1)] border-l border-[var(--slate-v2-border-subtle)] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200",
          width
        )}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[var(--slate-v2-border-subtle)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--slate-v2-text-tertiary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
