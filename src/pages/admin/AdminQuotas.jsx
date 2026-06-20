import React from 'react';
import { Database, Cpu, AlertCircle, HardDrive } from 'lucide-react';

export default function AdminQuotas() {
  const quotas = [
    { id: 1, company: 'Optavel Enterprise', plan: 'Enterprise', aiTokensUsed: 1250000, aiTokenLimit: 2000000, storageUsed: 450, storageLimit: 500 },
    { id: 2, company: 'Starlight Law', plan: 'Pro', aiTokensUsed: 450000, aiTokenLimit: 500000, storageUsed: 45, storageLimit: 100 },
    { id: 3, company: 'Vertex Logistics', plan: 'Basic', aiTokensUsed: 95000, aiTokenLimit: 100000, storageUsed: 9.5, storageLimit: 10 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-3">
            <Database className="w-8 h-8" /> 
            Tenant Resource Quotas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor Cloudflare AI token usage and Supabase Storage limits.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {quotas.map(tenant => {
          const aiPercent = (tenant.aiTokensUsed / tenant.aiTokenLimit) * 100;
          const storagePercent = (tenant.storageUsed / tenant.storageLimit) * 100;
          
          return (
            <div key={tenant.id} className="bg-card rounded-2xl border-[0.5px] border-primary/40 p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">{tenant.company}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tier: {tenant.plan}</p>
                </div>
                {(aiPercent > 90 || storagePercent > 90) && (
                  <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Near Limit
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2 font-medium text-muted-foreground"><Cpu className="w-4 h-4 text-indigo-500" /> AI Tokens</span>
                    <span className="font-semibold">{tenant.aiTokensUsed.toLocaleString()} / {tenant.aiTokenLimit.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${aiPercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${aiPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2 font-medium text-muted-foreground"><HardDrive className="w-4 h-4 text-emerald-500" /> Storage (GB)</span>
                    <span className="font-semibold">{tenant.storageUsed} / {tenant.storageLimit} GB</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${storagePercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
