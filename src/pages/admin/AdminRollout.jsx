import React, { useState } from 'react';
import { ToggleRight, Globe, Building2, Users, Activity, PowerOff, Power } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminRollout() {
  const [flags, setFlags] = useState([
    { id: 'f_orbit', name: 'OrbitBuild Studio', description: 'Enable the visual workflow builder', status: 'global_on', scope: 'All Tenants' },
    { id: 'f_ai', name: 'AI Legal Strategy', description: 'Enable LLaMa-3 case prediction', status: 'cohort', scope: 'Law Firms Only' },
    { id: 'f_learn', name: 'Online Learning', description: 'Enable LMS features', status: 'global_off', scope: 'None' },
    { id: 'f_hr', name: 'HR Dashboard', description: 'Enable employee management', status: 'global_on', scope: 'All Tenants' },
    { id: 'f_real_estate', name: 'Real Estate Vertical', description: 'Enable complete real estate management suite with properties, clients, viewings, transactions & leases', status: 'global_on', scope: 'All Tenants' }
  ]);

  const toggleStatus = (id) => {
    setFlags(flags.map(f => {
      if (f.id === id) {
        const next = f.status === 'global_on' ? 'global_off' : f.status === 'global_off' ? 'cohort' : 'global_on';
        const nextScope = next === 'global_on' ? 'All Tenants' : next === 'global_off' ? 'None' : 'Selected Cohorts';
        return { ...f, status: next, scope: nextScope };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-3">
            <ToggleRight className="w-8 h-8" /> 
            Global Rollout Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Control feature flags and module access across all tenants instantly.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {flags.map(flag => (
          <div key={flag.id} className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {flag.name}
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${flag.status === 'global_on' ? 'bg-emerald-500/10 text-emerald-500' : flag.status === 'global_off' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {flag.status.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">{flag.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Scope: {flag.scope}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toggleStatus(flag.id)}
                className={`p-3 rounded-full transition-colors ${flag.status === 'global_on' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {flag.status === 'global_on' ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
