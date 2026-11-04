import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Plus, Edit, Trash2, Search, DollarSign, Clock, AlertCircle, CheckCircle2, Zap, RefreshCw, Building2
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function JCLPaymentSchedules() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaseId: '',
    paymentAmount: 1800,
    paymentDueDate: 1,
    gracePeriodDays: 5,
    lateFeePercentage: 5,
    autoDebitEnabled: true,
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_rent_payment_schedules WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setSchedules(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load payment schedules');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  return (
    <div className="space-y-6 pb-12 font-sans min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 relative bg-background w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Payment Schedules & Auto-Debit Rules
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated monthly rent payment dates, grace period thresholds, and late penalty triggers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 bg-card border-border shadow-sm rounded-xl hover:bg-muted font-bold">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="h-9 px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Schedule Rule
          </Button>
        </div>
      </div>

      <div className="bg-card/90 backdrop-blur-xl rounded-[24px] border border-border/80 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 uppercase tracking-wider text-muted-foreground font-extrabold border-b border-border/80 text-[10px]">
              <tr>
                <th className="p-4 pl-5">Lease Reference</th>
                <th className="p-4">Monthly Amount</th>
                <th className="p-4">Due Day</th>
                <th className="p-4">Grace Period</th>
                <th className="p-4">Late Fee</th>
                <th className="p-4 pr-5">Auto Debit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No active payment schedule rules configured.
                  </td>
                </tr>
              ) : (
                schedules.map(item => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="p-4 pl-5 font-mono font-bold">{item.lease_id || 'LS-GENERAL'}</td>
                    <td className="p-4 font-bold text-[#005A9C] dark:text-[#FF6B00] font-mono text-sm">{formatCurrency(item.payment_amount, 'USD')}</td>
                    <td className="p-4 font-semibold">{item.payment_due_date || 1}st of Month</td>
                    <td className="p-4 text-muted-foreground">{item.grace_period_days || 5} Days</td>
                    <td className="p-4 font-mono text-xs font-semibold">{item.late_fee_percentage || 5}%</td>
                    <td className="p-4 pr-5">
                      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold py-0.5 px-2.5", item.auto_debit_enabled ? "bg-[#005A9C]/15 text-[#005A9C] dark:bg-[#FF6B00]/15 dark:text-[#FF6B00] border-emerald-200" : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-200")}>
                        {item.auto_debit_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
