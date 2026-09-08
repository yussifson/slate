import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, RefreshCw, MessageSquare, ThumbsUp, Shield, Wrench
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function JCLContractorReviews() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setReviews(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load contractor reviews');
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Contractor Scorecards & Performance Feedback
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified vendor evaluation scores, work order quality audits, and punctuality logs
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reviews.length === 0 ? (
          <div className="col-span-2 p-8 border border-dashed border-border rounded-2xl text-center bg-card">
            <p className="text-xs text-muted-foreground">No vendor reviews submitted yet.</p>
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="p-5 rounded-2xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">{r.contractor_name || 'Vendor Partner'}</h3>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{r.rating || 5}/5</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.review_text || 'Excellent response time and high quality repair execution.'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
