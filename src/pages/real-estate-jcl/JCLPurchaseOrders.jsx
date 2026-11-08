import React, { useCallback, useEffect, useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, FileCheck, 
  DollarSign, Truck, Calendar, CheckCircle2, AlertCircle, ShoppingCart 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects } from '@/services/ProjectLookupService';
import { JCLProcurementService } from '@/services/JCLProcurementService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

const blankOrderForm = {
  project_id: '',
  supplier_name: '',
  total_amount: '',
  expected_delivery_date: '',
  delivery_address: 'Main Site / Central Depot',
  payment_terms: 'Net 30',
  status: 'draft'
};

const statusLabels = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  issued: 'Issued',
  acknowledged: 'Acknowledged',
  partially_delivered: 'Partially Delivered',
  fully_delivered: 'Fully Delivered',
  cancelled: 'Cancelled'
};

export default function JCLPurchaseOrders() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState(blankOrderForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [resOrders, resProj] = await Promise.all([
        supabase
          .from('jcl_purchase_orders')
          .select('id, reference, status, total_amount, expected_delivery_date, supplier_name, delivery_address, payment_terms, project_id, created_at, ops_projects(id,name,project_code)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (resOrders.error) throw resOrders.error;
      setOrders(resOrders.data || []);
      setProjects(resProj.data || []);
    } catch (err) {
      console.error('Purchase orders load error:', err);
      toast.error(err.message || 'Unable to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingOrder(null);
    setForm({ ...blankOrderForm, project_id: projects[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingOrder(row);
    setForm({
      project_id: row.project_id || '',
      supplier_name: row.supplier_name || '',
      total_amount: row.total_amount || '',
      expected_delivery_date: row.expected_delivery_date || '',
      delivery_address: row.delivery_address || 'Main Site / Central Depot',
      payment_terms: row.payment_terms || 'Net 30',
      status: row.status || 'draft'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.supplier_name) {
      toast.error('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingOrder) {
        await JCLProcurementService.updatePurchaseOrder(companyId, editingOrder.id, form);
        toast.success('Purchase order updated');
      } else {
        await JCLProcurementService.createPurchaseOrder(companyId, user?.id, form);
        toast.success('Purchase order created');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save order error:', err);
      toast.error(err.message || 'Unable to save order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await JCLProcurementService.deletePurchaseOrder(companyId, id);
      toast.success('Purchase order deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Unable to delete');
    }
  };

  const filtered = orders.filter(o => {
    const matchQuery = `${o.reference || ''} ${o.supplier_name || ''} ${o.ops_projects?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const totalCommittedSpend = orders
    .filter(o => !['draft', 'cancelled'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Native Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Purchase Orders</h1>
            <p className="text-xs text-muted-foreground font-medium">{filtered.length} commercial vendor orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Purchase Order</span><span className="sm:hidden">New PO</span>
          </Button>
        </div>
      </div>

      {/* 2x2 Native Mobile Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total POs</span>
          <span className="text-xl sm:text-2xl font-black text-foreground">{orders.length}</span>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pending Approval</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {orders.filter(o => ['draft', 'pending_approval'].includes(o.status)).length}
          </span>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Issued & Active</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {orders.filter(o => ['issued', 'acknowledged', 'approved'].includes(o.status)).length}
          </span>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Committed Spend</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${totalCommittedSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search PO reference, vendor, project..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-xs h-9.5 rounded-xl bg-background border-border/80 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs font-semibold h-9.5 rounded-xl bg-background border-border/80">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({orders.length})</SelectItem>
              {Object.keys(statusLabels).map(k => (
                <SelectItem key={k} value={k}>{statusLabels[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table & Mobile Card List */}
      <div className="space-y-3">
        {/* Mobile Native Card View (< md) */}
        <div className="md:hidden space-y-2.5">
          {filtered.length ? filtered.map(po => (
            <div key={po.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{po.reference}</span>
                  <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{po.supplier_name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{po.ops_projects?.name || 'General Site'}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                  po.status === 'fully_delivered' || po.status === 'approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                  po.status === 'cancelled' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                  po.status === 'issued' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40' :
                  'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                }`}>
                  {statusLabels[po.status] || po.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="font-mono font-black text-sm text-foreground">
                  ${Number(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-muted-foreground">Due: {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg" onClick={() => openEdit(po)}>
                  <Edit3 className="size-3.5 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-destructive hover:text-destructive/80 rounded-lg" onClick={() => handleDelete(po.id)}>
                  <Trash2 className="size-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
              No purchase orders found.
            </div>
          )}
        </div>

        {/* Desktop High-Density Table (>= md) */}
        <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/80">
                <tr>
                  <th className="p-3.5">PO Number</th>
                  <th className="p-3.5">Supplier / Vendor</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5">Expected Delivery</th>
                  <th className="p-3.5">Payment Terms</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((po) => (
                    <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-mono font-medium text-foreground">{po.reference}</td>
                      <td className="p-3.5 font-bold text-foreground">{po.supplier_name}</td>
                      <td className="p-3.5 text-foreground">
                        {po.ops_projects?.name || <span className="text-muted-foreground italic">General Site</span>}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-foreground text-right">
                        ${Number(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{po.payment_terms}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                          po.status === 'fully_delivered' || po.status === 'approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                          po.status === 'cancelled' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                          po.status === 'issued' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40' :
                          'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                        }`}>
                          {statusLabels[po.status] || po.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(po)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(po.id)} className="h-7 w-7 text-destructive hover:text-destructive/80">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
            <DialogDescription>
              Record an authorized order with vendor details, project allocation, and commercial terms.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Vendor / Supplier Name *</Label>
              <Input 
                required
                placeholder="e.g. Dangote Cement, BuildMart Logistics..." 
                value={form.supplier_name} 
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} 
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Project Association</Label>
                <Select value={form.project_id || 'unassigned'} onValueChange={(val) => setForm({ ...form, project_id: val === 'unassigned' ? '' : val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">General / Central Depot</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Amount ($) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.total_amount} 
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Expected Delivery</Label>
                <Input 
                  type="date" 
                  value={form.expected_delivery_date} 
                  onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Payment Terms</Label>
                <Select value={form.payment_terms} onValueChange={(val) => setForm({ ...form, payment_terms: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate / Cash">Immediate / Cash</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Delivery Address / Destination</Label>
                <Input 
                  value={form.delivery_address} 
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="fully_delivered">Fully Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : editingOrder ? 'Update Order' : 'Issue Purchase Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
