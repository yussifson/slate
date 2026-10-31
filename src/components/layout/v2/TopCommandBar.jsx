import React from 'react';
import { 
  Search, Bell, Sparkles, Building, 
  ChevronDown, RefreshCw, Moon, Sun, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function TopCommandBar({ 
  companyName = 'Apex Global Enterprise', 
  pendingActionCount = 2,
  onOpenOrbit,
  onOpenSearch,
  isRefreshing = false,
  onRefresh,
  user
}) {
  return (
    <header className="h-14 flex-shrink-0 bg-[var(--slate-v2-surface-1)] border-b border-[var(--slate-v2-border-subtle)] px-4 flex items-center justify-between z-20 select-none">
      {/* Left: Organization Switcher */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--slate-v2-surface-2)] text-left transition-colors">
              <Building className="w-4 h-4 text-[var(--slate-v2-brand)]" />
              <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                {companyName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--slate-v2-text-tertiary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white">
            <DropdownMenuItem className="text-xs cursor-pointer">
              Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              Switch Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-[var(--slate-v2-border-subtle)]" />

        {/* Global Refresh Indicator */}
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-[var(--slate-v2-text-tertiary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)] transition-colors"
          title="Refresh Workspace Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Center: Universal Command Search (Cmd+K) */}
      <div className="flex-1 max-w-md mx-4">
        <button 
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-[var(--slate-v2-text-secondary)] hover:border-[var(--slate-v2-border-strong)] transition-all text-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[var(--slate-v2-text-tertiary)]" />
            <span className="truncate">Search records, transactions, actions...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--slate-v2-surface-3)] text-[10px] font-mono text-[var(--slate-v2-text-tertiary)] border border-[var(--slate-v2-border-subtle)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications, & Orbit Ambient Pill */}
      <div className="flex items-center gap-2.5">
        {/* Action Center Badge */}
        <button className="relative p-2 rounded-lg text-[var(--slate-v2-text-secondary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)] transition-colors">
          <Bell className="w-4 h-4" />
          {pendingActionCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Ambient Orbit Co-Pilot Button */}
        <Button 
          onClick={onOpenOrbit}
          size="sm"
          className="h-8 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-medium shadow-sm shadow-indigo-500/25 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Orbit</span>
        </Button>
      </div>
    </header>
  );
}
