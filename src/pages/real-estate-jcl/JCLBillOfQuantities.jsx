import React, { useCallback, useEffect, useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, Calculator, 
  FileSpreadsheet, CheckCircle2, Clock, DollarSign, Download 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects } from '@/services/ProjectLookupService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

const blankBoqForm = {
  project_id: '',
  project_name: '',
  item_description: '',
  unit: 'm3',
  quantity: '1',
  unit_rate: '0',
  status: 'Draft'
};

export default function JCLBillOfQuantities() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [boqs, setBoqs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBoq, setEditingBoq] = useState(null);
  const [form, setForm] = useState(blankBoqForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [boqRes, projList] = await Promise.all([
        supabase.from('univ_boqs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (boqRes.error && boqRes.error.code !== '42P01') {
        console.warn('BOQ load error:', boqRes.error);
      }
      setBoqs(boqRes.data || []);
      setProjects(projList || []);
    } catch (err) {
      console.error('BOQ fetch error:', err);
      toast.error('Unable to load BOQ items');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingBoq(null);
    setForm({
      ...blankBoqForm,
      project_id: projects[0]?.id || '',
      project_name: projects[0]?.name || ''
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingBoq(row);
    setForm({
      project_id: row.project_id || '',
      project_name: row.project_name || '',
      item_description: row.item_description || '',
      unit: row.unit || 'm3',
      quantity: row.quantity || '1',
      unit_rate: row.unit_rate || '0',
      status: row.status || 'Draft'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.item_description) {
      toast.error('Description is required');
      return;
    }
    setSaving(true);
    try {
      const qty = Number(form.quantity) || 0;
      const rate = Number(form.unit_rate) || 0;
      const total = qty * rate;

      const payload = {
        company_id: companyId,
        project_name: form.project_name || (projects.find(p => p.id === form.project_id)?.name) || '',
        item_description: form.item_description,
        unit: form.unit,
        quantity: String(qty),
        unit_rate: String(rate),
        status: form.status
      };

      if (editingBoq) {
        const { error } = await supabase.from('univ_boqs')
          .update(payload)
          .eq('id', editingBoq.id)
          .eq('company_id', companyId);
        if (error) throw error;
        toast.success('BOQ item updated');
      } else {
        const { error } = await supabase.from('univ_boqs')
          .insert(payload);
        if (error) throw error;
        toast.success('BOQ item added');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('BOQ save error:', err);
      toast.error(err.message || 'Failed to save BOQ item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this line item?')) return;
    try {
      const { error } = await supabase.from('univ_boqs')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      toast.success('Line item deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = boqs.filter(b => {
    const matchQuery = `${b.item_description || ''} ${b.project_name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const totalBOQValue = boqs.reduce((sum, b) => {
    const q = Number(b.quantity) || 0;
    const r = Number(b.unit_rate) || 0;
    return sum + (q * r);
  }, 0);

  const handleExportCSV = () => {
    if (!boqs.length) return alert('No BOQ data to export');
    const headers = ['Project', 'Item Description', 'Unit', 'Quantity', 'Unit Rate', 'Total Amount', 'Status'];
    const rows = boqs.map(b => {
      const q = Number(b.quantity) || 0;
      const r = Number(b.unit_rate) || 0;
      return [
        `"${b.project_name || ''}"`,
        `"${b.item_description || ''}"`,
        b.unit || '',
        q,
        r,
        (q * r).toFixed(2),
        b.status || 'Draft'
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOQ_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" /> Bill of Quantities (BOQ)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standard construction takeoff, material scheduling, rates estimation, and total commercial valuation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Line Items</div>
          <div className="text-2xl font-bold mt-1">{boqs.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Items</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {boqs.filter(b => b.status === 'Draft').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved Line Items</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {boqs.filter(b => b.status === 'Approved').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Schedule Value</div>
          <div className="text-2xl font-bold mt-1 text-primary font-mono">
            ${totalBOQValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search items, description, project..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Procuring">Procuring</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Unit</th>
                <th className="p-4 font-semibold text-right">Quantity</th>
                <th className="p-4 font-semibold text-right">Unit Rate ($)</th>
                <th className="p-4 font-semibold text-right">Total Amount ($)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No BOQ entries found. Click "Add Item" to begin your cost takeoff.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const qty = Number(b.quantity) || 0;
                  const rate = Number(b.unit_rate) || 0;
                  const total = qty * rate;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground font-medium">
                        {b.project_name || <span className="text-muted-foreground italic">General</span>}
                      </td>
                      <td className="p-4 font-semibold text-foreground max-w-sm truncate" title={b.item_description}>
                        {b.item_description}
                      </td>
                      <td className="p-4 text-muted-foreground uppercase text-xs tracking-wider">
                        {b.unit || 'pcs'}
                      </td>
                      <td className="p-4 font-mono font-medium text-foreground text-right">
                        {qty.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-muted-foreground text-right">
                        ${rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`font-semibold capitalize ${
                          b.status === 'Approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                          b.status === 'Procuring' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40' :
                          'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                        }`}>
                          {b.status || 'Draft'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                            <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                            <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editingBoq ? 'Edit BOQ Item' : 'Add Bill of Quantities Item'}</DialogTitle>
            <DialogDescription>
              Record material quantities, estimated contract rates, and project association.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Project Association</Label>
              <Select 
                value={form.project_name} 
                onValueChange={(val) => setForm({ ...form, project_name: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} {p.project_code ? `(${p.project_code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Item Description *</Label>
              <Input 
                required
                placeholder="e.g. Reinforced Concrete Grade C25/30 for Foundation Footings"
                value={form.item_description} 
                onChange={(e) => setForm({ ...form, item_description: e.target.value })} 
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Quantity *</Label>
                <Input 
                  type="number"
                  step="any"
                  required
                  value={form.quantity} 
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit of Measure</Label>
                <Select value={form.unit} onValueChange={(val) => setForm({ ...form, unit: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m3">Cubic Meters (m3)</SelectItem>
                    <SelectItem value="m2">Square Meters (m2)</SelectItem>
                    <SelectItem value="m">Linear Meters (m)</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="item">Lump Sum / Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Unit Rate ($) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  required
                  value={form.unit_rate} 
                  onChange={(e) => setForm({ ...form, unit_rate: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Approval Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Procuring">Procuring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted border text-sm flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Computed Total:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${((Number(form.quantity) || 0) * (Number(form.unit_rate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : editingBoq ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
