import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Star, Plus, Edit, Trash2, Search, Phone, Mail, CheckCircle2, Shield, RefreshCw
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function JCLContractors() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setContractors(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load contractors');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Contractors & Maintenance Vendors
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified trade contractors, licensed plumbers, electricians, HVAC specialists, and ratings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {contractors.length === 0 ? (
          <div className="col-span-3 p-8 border border-dashed border-border rounded-2xl text-center bg-card">
            <p className="text-xs text-muted-foreground">No approved contractors registered yet.</p>
          </div>
        ) : (
          contractors.map(c => (
            <div key={c.id} className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              {/* Gradient Banner */}
              <div className="relative h-24 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="flex items-start justify-between relative z-10">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                    {c.specialty || 'General Trade'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-white" />
                    {c.rating || 4.9}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-white font-extrabold text-sm leading-snug line-clamp-1">{c.name || 'Contractor Firm'}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Contact */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{c.phone || '+1 (555) 019-2831'}</p>
                  <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />{c.email || 'vendor@contractor.com'}</p>
                </div>

                {/* Footer spec strip */}
                <div className="mt-auto pt-3 border-t border-border/60 grid grid-cols-2 divide-x divide-border/60 text-center">
                  <div>
                    <span className="block text-[9px] uppercase font-semibold text-muted-foreground mb-0.5">Status</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.status || 'Verified'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-semibold text-muted-foreground mb-0.5">Jobs Done</span>
                    <span className="text-xs font-bold text-foreground">{c.jobs_completed || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
