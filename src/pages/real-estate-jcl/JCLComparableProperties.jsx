import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, Plus, Edit, Trash2, Search, TrendingUp, DollarSign, MapPin, Calendar, RefreshCw, Sparkles, Shield
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function JCLComparableProperties() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [comparables, setComparables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_comparable_properties WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setComparables(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load comparable properties');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Comparable Property Valuation Matrix (CMA)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Subject property valuation comps, price-per-sqft adjustments, and market match scoring
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {comparables.length === 0 ? (
          <div className="col-span-3 p-8 border border-dashed border-border rounded-2xl text-center bg-card">
            <p className="text-xs text-muted-foreground">No comparable property comps logged yet.</p>
          </div>
        ) : (
          comparables.map(c => (
            <div key={c.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-foreground text-sm line-clamp-1">{c.address || 'Comp Property'}</h3>
                <Badge variant="outline" className="text-[9px] uppercase font-mono bg-[#006065]/10 text-emerald-700 border-[#006065]/30">
                  {Math.round((c.similarity_score || 0.85) * 100)}% Match
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 text-center font-mono">
                <div>
                  <span className="text-[9px] uppercase text-muted-foreground block mb-0.5">Sale Price</span>
                  <span className="text-sm font-bold text-[#006065] dark:text-[#fad503]">{formatCurrency(c.sale_price || 0, 'USD')}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-muted-foreground block mb-0.5">Price / SqFt</span>
                  <span className="text-xs font-semibold text-foreground">${c.price_per_sqft || 320}/sqft</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
