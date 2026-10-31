import React from 'react';
import { 
  ShieldCheck, DollarSign, Users, CheckSquare, 
  FileText, Scale, Building2, HeartPulse, GraduationCap, 
  Settings, Zap, Layers, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ICON_MAP = {
  ShieldCheck,
  DollarSign,
  Users,
  CheckSquare,
  FileText,
  Scale,
  Building2,
  HeartPulse,
  GraduationCap,
  Settings,
  Zap,
  Layers,
  Sparkles
};

export default function PrimaryRail({ 
  capabilities = [], 
  activeCapabilityId, 
  onSelectCapability,
  companyName = 'Slate Enterprise',
  onOpenSettings,
  user
}) {
  return (
    <aside className="w-16 flex-shrink-0 flex flex-col items-center py-4 bg-[var(--slate-v2-surface-1)] border-r border-[var(--slate-v2-border-subtle)] z-30 select-none">
      {/* Brand Mark */}
      <div className="mb-6 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 cursor-pointer">
          <span className="font-extrabold text-white text-base tracking-wider">S2</span>
        </div>
      </div>

      {/* Primary Capability Icons */}
      <TooltipProvider delayDuration={150}>
        <div className="flex-1 flex flex-col items-center gap-2.5 w-full px-2">
          {capabilities.map((cap) => {
            const IconComponent = ICON_MAP[cap.icon] || Layers;
            const isActive = activeCapabilityId === cap.id;

            return (
              <Tooltip key={cap.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectCapability(cap.id)}
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative group",
                      isActive 
                        ? "bg-[var(--slate-v2-brand)] text-white shadow-md shadow-indigo-500/25" 
                        : "text-[var(--slate-v2-text-secondary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)]"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute -left-2 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs font-medium">
                  {cap.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Pinned Controls */}
        <div className="mt-auto flex flex-col items-center gap-2.5 w-full px-2 pt-4 border-t border-[var(--slate-v2-border-subtle)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenSettings}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--slate-v2-text-secondary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)] transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs">
              System Settings
            </TooltipContent>
          </Tooltip>

          {/* User Profile Initial */}
          <div className="w-9 h-9 rounded-full bg-[var(--slate-v2-surface-3)] flex items-center justify-center text-xs font-semibold text-white border border-[var(--slate-v2-border-subtle)]">
            {user?.first_name ? user.first_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
          </div>
        </div>
      </TooltipProvider>
    </aside>
  );
}
