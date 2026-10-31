import React from 'react';
import { 
  Users, UserCheck, Shield, ChevronRight, 
  FolderPlus, Filter, Sparkles, Database, CheckSquare,
  FileText, Activity, Layers, Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContextDeck({ 
  activeCapability, 
  activeView, 
  onSelectView, 
  stats = {} 
}) {
  const getSubViews = () => {
    switch (activeCapability?.id) {
      case 'core_foundation':
        return [
          { id: 'parties_all', label: 'All Parties', icon: Users, badge: stats.allParties || 0 },
          { id: 'parties_clients', label: 'Clients', icon: UserCheck, badge: stats.clients || 0 },
          { id: 'parties_vendors', label: 'Vendors & Partners', icon: Shield, badge: stats.vendors || 0 },
          { id: 'action_center', label: 'Action Center', icon: CheckSquare, badge: null },
          { id: 'intelligence_dashboard', label: 'Business Insights', icon: Sparkles, badge: null },
          { id: 'industry_hub', label: 'Industry Packs', icon: Boxes, badge: null },
          { id: 'blueprint_wizard', label: 'Business Blueprint', icon: Sparkles, badge: null },
          { id: 'workflows', label: 'Workflow Engine', icon: Layers, badge: null },
          { id: 'relationships', label: 'Relationships', icon: Activity, badge: null },
          { id: 'metadata_objects', label: 'Custom Objects', icon: Database, badge: null }
        ];
      case 'crm':
        return [
          { id: 'crm_pipeline', label: 'Pipeline', icon: Layers, badge: null },
          { id: 'crm_leads', label: 'Active Leads', icon: Users, badge: null },
          { id: 'crm_activities', label: 'Activities', icon: Activity, badge: null }
        ];
      case 'finance':
        return [
          { id: 'fin_invoices', label: 'Invoices', icon: FileText, badge: null },
          { id: 'fin_ledger', label: 'General Ledger', icon: Database, badge: null },
          { id: 'fin_tax', label: 'Tax & Compliance', icon: Shield, badge: null }
        ];
      default:
        return [
          { id: 'default_overview', label: 'Overview', icon: Activity, badge: null },
          { id: 'default_records', label: 'Records', icon: Database, badge: null }
        ];
    }
  };

  const subViews = getSubViews();

  return (
    <nav className="w-60 flex-shrink-0 bg-[var(--slate-v2-surface-1)]/60 backdrop-blur-md border-r border-[var(--slate-v2-border-subtle)] flex flex-col py-4 px-3 select-none">
      {/* Capability Title Header */}
      <div className="px-2 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--slate-v2-text-tertiary)]">
          {activeCapability?.category || 'Capability'}
        </h2>
        <div className="text-sm font-bold text-white mt-0.5 truncate">
          {activeCapability?.name || 'Active Capability'}
        </div>
      </div>

      {/* Navigation Sub-Items */}
      <div className="flex-1 flex flex-col gap-1">
        {subViews.map((item) => {
          const Icon = item.icon;
          const isSelected = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left",
                isSelected
                  ? "bg-[var(--slate-v2-brand-surface)] text-[var(--slate-v2-brand)] font-semibold border border-[var(--slate-v2-brand)]/30"
                  : "text-[var(--slate-v2-text-secondary)] hover:text-white hover:bg-[var(--slate-v2-surface-2)]"
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--slate-v2-surface-3)] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contextual Status Deck */}
      <div className="mt-auto px-3 py-2.5 rounded-xl bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-[var(--slate-v2-text-secondary)]">PowerSync Online</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--slate-v2-text-tertiary)]">v2.0</span>
      </div>
    </nav>
  );
}
