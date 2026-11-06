import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, RefreshCw, DollarSign, CheckCircle2, Clock
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const powerSync = usePowerSync();

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
      toast.success('Payment schedule rule added');
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Save schedule error:', err);
      toast.error(err.message || 'Failed to save payment schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment schedule rule?')) return;
    try {
      const { error } = await supabase
        .from('univ_re_rent_payment_schedules')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      toast.success('Schedule deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = schedules.filter(s =>
    `${s.lease_id || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Payment Schedules & Auto-Debit Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated monthly rent payment dates, grace period thresholds, and late penalty triggers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Schedule Rule
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Rules</div>
          <div className="text-2xl font-bold mt-1">{schedules.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-Debit Enabled</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {schedules.filter(s => s.auto_debit_enabled).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Monthly Volume</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">
            ${schedules.reduce((sum, s) => sum + Number(s.payment_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-semibold">Lease Reference</th>
                <th className="p-4 font-semibold text-right">Monthly Amount</th>
                <th className="p-4 font-semibold">Due Day</th>
                <th className="p-4 font-semibold">Grace Period</th>
                <th className="p-4 font-semibold">Late Fee</th>
                <th className="p-4 font-semibold">Auto Debit</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No active payment schedule rules configured. Click "Add Schedule Rule" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-foreground">{item.lease_id || 'LS-GENERAL'}</td>
                    <td className="p-4 font-mono font-semibold text-foreground text-right">
                      ${Number(item.payment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-foreground">{item.payment_due_date || 1}st of Month</td>
                    <td className="p-4 text-muted-foreground">{item.grace_period_days || 5} Days</td>
                    <td className="p-4 font-mono text-muted-foreground">{item.late_fee_percentage || 5}%</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`font-semibold capitalize ${
                        item.auto_debit_enabled ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-300 text-slate-600'
                      }`}>
                        {item.auto_debit_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
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
        <DialogContent className="max-w-md bg-card text-card-foreground">
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
                className="mt-1 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Monthly Amount ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.payment_amount}
                  onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Due Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={formData.payment_due_date}
                  onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Grace Period (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.grace_period_days}
                  onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Late Fee (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.late_fee_percentage}
                  onChange={(e) => setFormData({ ...formData, late_fee_percentage: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Auto-Debit Collection</Label>
              <Select
                value={String(formData.auto_debit_enabled)}
                onValueChange={(val) => setFormData({ ...formData, auto_debit_enabled: Number(val) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Enabled (Automated Payment Gate)</SelectItem>
                  <SelectItem value="0">Disabled (Manual Invoicing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Create Schedule Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
