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
            <div key={c.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{c.name || 'Contractor Firm'}</h3>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold mt-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    {c.specialty || 'General Trade'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <span>{c.rating || 4.9}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-border/60">
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-emerald-600" /> {c.phone || '+1 (555) 019-2831'}</p>
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-blue-600" /> {c.email || 'vendor@contractor.com'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
