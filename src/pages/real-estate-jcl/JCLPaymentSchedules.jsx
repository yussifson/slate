import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, DollarSign, CheckCircle2, Clock
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';

const defaultForm = {
  lease_id: '',
  payment_amount: '2500',
  payment_due_date: 1,
  grace_period_days: 5,
  late_fee_percentage: 5,
  auto_debit_enabled: 1,
  recurring_start_date: new Date().toISOString().slice(0, 10),
  recurring_end_date: ''
};

export default function JCLPaymentSchedules() {
  const companyId = useCompanyId();

  const [schedules, setSchedules] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [resSched, resLeases] = await Promise.all([
        supabase
          .from('univ_re_rent_payment_schedules')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('univ_re_leases')
          .select('id, lease_number, tenant_name, monthly_rent')
          .eq('company_id', companyId)
      ]);

      setSchedules(resSched.data || []);
      setLeases(resLeases.data || []);
    } catch (_err) {
      console.error('Fetch payment schedules error:', _err);
      toast.error('Failed to load payment schedules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleOpenAdd = () => {
    setFormData({
      ...defaultForm,
      lease_id: leases[0]?.lease_number || leases[0]?.id || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: crypto.randomUUID(),
        company_id: companyId,
        lease_id: formData.lease_id || 'LS-DEFAULT',
        payment_amount: Number(formData.payment_amount) || 0,
        payment_due_date: Number(formData.payment_due_date) || 1,
        grace_period_days: Number(formData.grace_period_days) || 5,
        late_fee_percentage: Number(formData.late_fee_percentage) || 5,
        auto_debit_enabled: Number(formData.auto_debit_enabled) ? 1 : 0,
        recurring_start_date: formData.recurring_start_date || null,
        recurring_end_date: formData.recurring_end_date || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('univ_re_rent_payment_schedules')
        .insert(payload);

      if (error) throw error;
      toast.success('Payment schedule rule established');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('univ_re_rent_payment_schedules')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      toast.success('Schedule rule removed');
      fetchData();
    } catch (_err) {
      toast.error('Failed to delete rule');
    }
  };

  const filtered = schedules.filter(s =>
    `${s.lease_id || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalScheduled = schedules.reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);
  const autoDebitCount = schedules.filter(s => s.auto_debit_enabled).length;

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* ── 1. Header (Clean mobile native header, no sub-description, no refresh button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            Payment Schedules
          </h1>
        </div>
        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="w-full sm:w-auto h-9 px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Schedule
        </Button>
      </div>

      {/* ── 2. Dedicated Mobile 2x2 Stats Grid (< md) & Desktop Row (>= md) ── */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5 text-[#005A9C]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Rules</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{schedules.length}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Rules configured</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Debit</span>
          </div>
          <p className="text-sm font-black text-emerald-600 truncate">{autoDebitCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Automated</span>
        </div>
        <div className="col-span-2 bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Scheduled Monthly Volume</span>
          </div>
          <p className="text-base font-black text-[#005A9C] truncate">
            {formatCurrency(totalScheduled, 'USD')}
          </p>
          <span className="text-[9px] text-muted-foreground font-semibold">Recurring rent roll</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Rules</div>
          <div className="text-2xl font-bold mt-1">{schedules.length}</div>
        </div>
        <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-Debit Enabled</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {autoDebitCount}
          </div>
        </div>
        <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Monthly Volume</div>
          <div className="text-2xl font-bold mt-1 text-[#005A9C] font-mono">
            {formatCurrency(totalScheduled, 'USD')}
          </div>
        </div>
      </div>

      {/* ── 3. Mobile Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            No active payment schedule rules configured.
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-2 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-xs text-foreground truncate">{item.lease_id || 'LS-GENERAL'}</p>
                  <p className="text-[10px] text-muted-foreground">Due: {item.payment_due_date || 1}st of Month • Grace: {item.grace_period_days || 5}d</p>
                </div>
                <span className="font-mono font-bold text-sm text-[#005A9C] shrink-0">
                  {formatCurrency(item.payment_amount, 'USD')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <Badge variant="outline" className={`text-[10px] font-bold rounded-lg ${
                  item.auto_debit_enabled ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-300 text-slate-600'
                }`}>
                  {item.auto_debit_enabled ? 'Auto-Debit Active' : 'Manual Debit'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── 4. Desktop Table (>= md) ── */}
      <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground border-b font-extrabold">
              <tr>
                <th className="p-3.5 pl-4 font-semibold">Lease Reference</th>
                <th className="p-3.5 font-semibold text-right">Monthly Amount</th>
                <th className="p-3.5 font-semibold">Due Day</th>
                <th className="p-3.5 font-semibold">Grace Period</th>
                <th className="p-3.5 font-semibold">Late Fee</th>
                <th className="p-3.5 font-semibold">Auto Debit</th>
                <th className="p-3.5 pr-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No active payment schedule rules configured. Click "Add Schedule" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-medium text-foreground">{item.lease_id || 'LS-GENERAL'}</td>
                    <td className="p-3.5 font-mono font-semibold text-foreground text-right">
                      {formatCurrency(item.payment_amount, 'USD')}
                    </td>
                    <td className="p-3.5 text-foreground">{item.payment_due_date || 1}st of Month</td>
                    <td className="p-3.5 text-muted-foreground">{item.grace_period_days || 5} Days</td>
                    <td className="p-3.5 font-mono text-muted-foreground">{item.late_fee_percentage || 5}%</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className={`font-semibold capitalize text-[10px] rounded-lg ${
                        item.auto_debit_enabled ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-300 text-slate-600'
                      }`}>
                        {item.auto_debit_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6 bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add Payment Schedule Rule</DialogTitle>
            <DialogDescription>
              Configure recurring monthly rent billing dates, grace periods, and late penalty rules.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Lease Reference *</Label>
              <Input
                required
                placeholder="e.g. LS-2026-001"
                value={formData.lease_id}
                onChange={(e) => setFormData({ ...formData, lease_id: e.target.value })}
                className="mt-1 font-mono h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Monthly Amount ($) *</Label>
                <Input
                  required
                  type="number"
                  value={formData.payment_amount}
                  onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Due Day of Month *</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.payment_due_date}
                  onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Grace Period (Days)</Label>
                <Input
                  type="number"
                  value={formData.grace_period_days}
                  onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Late Fee (%)</Label>
                <Input
                  type="number"
                  value={formData.late_fee_percentage}
                  onChange={(e) => setFormData({ ...formData, late_fee_percentage: e.target.value })}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs h-9 font-bold">
                {saving ? 'Saving...' : 'Establish Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
