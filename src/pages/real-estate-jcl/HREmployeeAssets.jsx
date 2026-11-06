import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Laptop, Smartphone, ShieldCheck, Key, Plus, RefreshCw, 
  Trash2, Search, CheckCircle2, AlertCircle, RotateCcw, User 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ITEM_CATEGORIES = [
  'Laptop / Computer',
  'Company Phone / SIM',
  'Office Keys / Access Card',
  'Safety Equipment (PPE / Helmet)',
  'Surveying / Engineering Equipment',
  'Vehicle / Fuel Card',
  'Uniform / Badge',
  'Tools / Machinery',
  'Other'
];

export default function HREmployeeAssets() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    person_id: '',
    person_name: '',
    item_name: '',
    item_category: 'Laptop / Computer',
    serial_number: '',
    description: '',
    issued_at: new Date().toISOString().slice(0, 10),
    expected_return_at: '',
    notes: ''
  });

  // Return modal
  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm] = useState({ condition: 'Good', notes: '' });

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [resAssets, resEmps] = await Promise.all([
        supabase
          .from('jcl_item_register')
          .select('*')
          .eq('company_id', companyId)
          .order('issued_at', { ascending: false }),
        supabase
          .from('univ_hr_employees')
          .select('id, name, first_name, last_name, email, department, role')
          .eq('company_id', companyId)
          .order('name', { ascending: true })
      ]);

      setAssets(resAssets.data || []);
      setEmployees((resEmps.data || []).map(e => ({
        ...e,
        name: e.name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email
      })));
    } catch (err) {
      console.error('Assets load error:', err);
      toast.error('Unable to load employee custody items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [companyId]);

  const handleOpenCreate = () => {
    setForm({
      person_id: employees[0]?.id || '',
      person_name: employees[0]?.name || '',
      item_name: '',
      item_category: 'Laptop / Computer',
      serial_number: '',
      description: '',
      issued_at: new Date().toISOString().slice(0, 10),
      expected_return_at: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.person_name) {
      toast.error('Item name and employee are required');
      return;
    }
    setSaving(true);
    try {
      const desc = [
        form.item_category ? `[${form.item_category}]` : '',
        form.serial_number ? `S/N: ${form.serial_number}` : '',
        form.description
      ].filter(Boolean).join(' ');

      const payload = {
        id: crypto.randomUUID(),
        company_id: companyId,
        person_id: form.person_id || null,
        person_name: form.person_name,
        item_name: form.item_name.trim(),
        description: desc || null,
        issued_at: new Date(form.issued_at).toISOString(),
        expected_return_at: form.expected_return_at ? new Date(form.expected_return_at).toISOString() : null,
        status: 'issued',
        issued_by_id: user?.id || null,
        issued_by_name: user?.user_metadata?.full_name || user?.email || 'HR Department',
        notes: form.notes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('jcl_item_register').insert(payload);
      if (error) throw error;

      toast.success('Company item assigned to employee');
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Save asset error:', err);
      toast.error(err.message || 'Failed to record asset assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnItem = async (e) => {
    e.preventDefault();
    if (!returnModal) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('jcl_item_register')
        .update({
          status: 'returned',
          actual_return_at: now,
          returned_to_name: user?.user_metadata?.full_name || user?.email || 'HR Department',
          return_condition: returnForm.condition,
          return_notes: returnForm.notes || null,
          updated_at: now
        })
        .eq('id', returnModal.id)
        .eq('company_id', companyId);

      if (error) throw error;
      toast.success('Item marked as returned');
      setReturnModal(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this custody record?')) return;
    try {
      const { error } = await supabase.from('jcl_item_register').delete().eq('id', id).eq('company_id', companyId);
      if (error) throw error;
      toast.success('Record deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = assets.filter(a => {
    const matchQuery = `${a.item_name || ''} ${a.person_name || ''} ${a.description || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Employee Custody & Company Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all corporate property issued to employees (laptops, phones, access keys, PPE, and vehicles).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Issue Company Item
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Items Issued</div>
          <div className="text-2xl font-bold mt-1">{assets.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Employee Custody</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {assets.filter(a => a.status === 'issued').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Successfully Returned</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {assets.filter(a => a.status === 'returned').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff with Custody</div>
          <div className="text-2xl font-bold mt-1 text-primary">
            {new Set(assets.filter(a => a.status === 'issued').map(a => a.person_name)).size}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search item, employee, serial #..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
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
              <SelectItem value="issued">In Custody</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
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
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Item Name</th>
                <th className="p-4 font-semibold">Details / S/N</th>
                <th className="p-4 font-semibold">Issued Date</th>
                <th className="p-4 font-semibold">Expected Return</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No custody items recorded. Click "Issue Company Item" to record corporate assets handed over to staff.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> {item.person_name}
                    </td>
                    <td className="p-4 text-foreground font-medium">{item.item_name}</td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate" title={item.description}>
                      {item.description || '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {item.issued_at ? new Date(item.issued_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {item.expected_return_at ? new Date(item.expected_return_at).toLocaleDateString() : 'Permanent / Ongoing'}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={`font-semibold capitalize ${
                        item.status === 'returned' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                        'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                      }`}>
                        {item.status === 'returned' ? 'Returned' : 'In Custody'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'issued' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => { setReturnModal(item); setReturnForm({ condition: 'Good', notes: '' }); }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
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

      {/* Issue Item Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Issue Company Item to Employee</DialogTitle>
            <DialogDescription>
              Record company property handed over to new or existing staff members with full inventory tracking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Assign to Employee *</Label>
              <Select 
                value={form.person_id} 
                onValueChange={(val) => {
                  const emp = employees.find(e => e.id === val);
                  setForm({ ...form, person_id: val, person_name: emp ? emp.name : form.person_name });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Staff Member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} {emp.role ? `(${emp.role})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Item Category</Label>
                <Select 
                  value={form.item_category} 
                  onValueChange={(val) => setForm({ ...form, item_category: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Serial Number / Asset Tag</Label>
                <Input 
                  placeholder="e.g. SN-892301"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Item Name & Model *</Label>
              <Input 
                required
                placeholder="e.g. Dell Latitude 5430 (16GB RAM) or Site Helmet"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Date Handed Over</Label>
                <Input 
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Expected Return Date</Label>
                <Input 
                  type="date"
                  value={form.expected_return_at}
                  onChange={(e) => setForm({ ...form, expected_return_at: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Specification & Condition Notes</Label>
              <Textarea 
                rows={2}
                placeholder="Note down item condition, accessories included (chargers, dongles)..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Record Item Issue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Item Dialog */}
      <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
        <DialogContent className="max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Return Company Property</DialogTitle>
            <DialogDescription>
              Confirm return of {returnModal?.item_name} from {returnModal?.person_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturnItem} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Condition on Return</Label>
              <Select 
                value={returnForm.condition} 
                onValueChange={(val) => setReturnForm({ ...returnForm, condition: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair (Normal Wear)</SelectItem>
                  <SelectItem value="Damaged">Damaged / Requires Repair</SelectItem>
                  <SelectItem value="Incomplete">Incomplete (Missing Accessories)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Handover Notes</Label>
              <Textarea 
                rows={3}
                placeholder="Details of item condition, inspection notes..."
                value={returnForm.notes}
                onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setReturnModal(null)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? 'Processing...' : 'Confirm Return'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
