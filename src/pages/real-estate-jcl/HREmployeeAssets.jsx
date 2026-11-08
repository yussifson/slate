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
  Trash2, Search, CheckCircle2, AlertCircle, RotateCcw, User, Package, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
    custom_category: '',
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

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleOpenCreate = () => {
    setForm({
      person_id: '',
      person_name: '',
      item_name: '',
      item_category: 'Laptop / Computer',
      custom_category: '',
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
    if (!companyId || !form.person_id || !form.item_name) {
      toast.error('Please select an employee and specify the item');
      return;
    }

    setSaving(true);
    try {
      const resolvedCategory = form.item_category === 'Other' && form.custom_category?.trim()
        ? form.custom_category.trim()
        : form.item_category;

      const payload = {
        company_id: companyId,
        person_id: form.person_id,
        person_name: form.person_name,
        item_name: form.item_name,
        description: [
          resolvedCategory ? `[${resolvedCategory}]` : '',
          form.serial_number ? `S/N: ${form.serial_number}` : '',
          form.description
        ].filter(Boolean).join(' - '),
        issued_at: new Date(form.issued_at).toISOString(),
        expected_return_at: form.expected_return_at ? new Date(form.expected_return_at).toISOString() : null,
        status: 'issued',
        notes: form.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('jcl_item_register')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success('Company item successfully assigned to employee');
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Assign error:', err);
      toast.error(err.message || 'Failed to issue item');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (e) => {
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
          return_condition: returnForm.condition,
          return_notes: returnForm.notes,
          returned_to_name: user?.full_name || user?.email || 'HR Department',
          updated_at: now
        })
        .eq('id', returnModal.id)
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success('Item custody released and returned to inventory');
      setReturnModal(null);
      loadData();
    } catch (err) {
      console.error('Return error:', err);
      toast.error(err.message || 'Failed to record return');
    } finally {
      setSaving(false);
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
    <div className="flex flex-col w-full max-w-full overflow-x-hidden bg-background text-foreground p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 font-sans pb-24">
      {/* ── 1. Clean Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Asset Taking Register
          </h1>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto h-9 px-4 gap-1.5 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-xs rounded-xl justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Issue Company Item
        </Button>
      </div>

      {/* ── 2. Mobile 2x2 Dedicated Stats Grid (< md) ── */}
      <div className="grid grid-cols-2 gap-2.5 md:hidden">
        <div className="bg-card rounded-2xl p-3 border border-border/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">Total Issued</span>
            <span className="text-lg font-black text-foreground">{assets.length}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-3 border border-border/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">In Possession</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {assets.filter(a => a.status === 'issued').length}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-3 border border-border/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">Returned</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {assets.filter(a => a.status === 'returned').length}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-3 border border-border/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">Staff Holders</span>
            <span className="text-lg font-black text-[#005A9C] dark:text-[#FF6B00]">
              {new Set(assets.filter(a => a.status === 'issued').map(a => a.person_name)).size}
            </span>
          </div>
        </div>
      </div>

      {/* ── Desktop Executive KPI Cards (>= md) ── */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Items Issued</span>
          <span className="text-2xl font-black mt-1 text-foreground">{assets.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Employee Possession</span>
          <span className="text-2xl font-black mt-1 text-amber-600">
            {assets.filter(a => a.status === 'issued').length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Returned Safely</span>
          <span className="text-2xl font-black mt-1 text-emerald-600">
            {assets.filter(a => a.status === 'returned').length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employees With Items</span>
          <span className="text-2xl font-black mt-1 text-[#005A9C]">
            {new Set(assets.filter(a => a.status === 'issued').map(a => a.person_name)).size}
          </span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-card/90 p-2.5 sm:p-3 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search items, serial numbers, or employees..." 
            className="pl-9 h-9 text-xs bg-background rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs bg-background rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            <SelectItem value="issued" className="text-xs">Active in Custody</SelectItem>
            <SelectItem value="returned" className="text-xs">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile Native Cards (< md) ── */}
      <div className="md:hidden space-y-2.5">
        {filtered.map(item => (
          <div key={item.id} className="p-3.5 bg-card border border-border/80 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-foreground">{item.item_name}</p>
                <p className="text-xs text-muted-foreground">{item.description || 'Company Equipment'}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px] font-bold capitalize", item.status === 'issued' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
                {item.status === 'issued' ? 'In Custody' : 'Returned'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 space-y-1">
              <div>Employee: <strong className="text-foreground">{item.person_name}</strong></div>
              <div className="text-[11px] font-mono">Issued: {item.issued_at ? new Date(item.issued_at).toLocaleDateString() : '—'}</div>
            </div>
            {item.status === 'issued' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setReturnModal(item);
                  setReturnForm({ condition: 'Good', notes: '' });
                }}
                className="w-full h-8 text-xs font-bold gap-1 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return to Office
              </Button>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border/80">
            No custody asset records found.
          </div>
        )}
      </div>

      {/* ── Desktop Table (>= md) ── */}
      <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3.5">Asset / Equipment</th>
                <th className="p-3.5">Assigned Employee</th>
                <th className="p-3.5">Issued Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-bold text-foreground">
                    <div>{item.item_name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{item.description || '—'}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {item.person_name}
                  </td>
                  <td className="p-3.5 text-muted-foreground font-mono">
                    {item.issued_at ? new Date(item.issued_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3.5">
                    <Badge variant="outline" className={item.status === 'issued' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}>
                      {item.status === 'issued' ? 'In Custody' : 'Returned'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    {item.status === 'issued' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setReturnModal(item);
                          setReturnForm({ condition: 'Good', notes: '' });
                        }}
                        className="h-8 text-xs font-bold gap-1 rounded-xl"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No custody asset records found.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Issue Item */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Issue Company Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Employee</Label>
              <Select
                value={form.person_id}
                onValueChange={(val) => {
                  const emp = employees.find(e => e.id === val);
                  setForm({ ...form, person_id: val, person_name: emp?.name || '' });
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.name} {e.department ? `(${e.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Item Name</Label>
              <Input
                placeholder="e.g. MacBook Pro 14, Total Station 3000..."
                value={form.item_name}
                onChange={e => setForm({ ...form, item_name: e.target.value })}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Category</Label>
              <Select
                value={form.item_category}
                onValueChange={(val) => setForm({ ...form, item_category: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.item_category === 'Other' && (
                <Input
                  placeholder="Specify custom category..."
                  value={form.custom_category || ''}
                  onChange={e => setForm({ ...form, custom_category: e.target.value })}
                  className="h-8 text-xs rounded-xl mt-1.5"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Serial Number</Label>
              <Input
                placeholder="Optional serial number or tag ID"
                value={form.serial_number}
                onChange={e => setForm({ ...form, serial_number: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Notes</Label>
              <Textarea
                placeholder="Accessories, condition at handover..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-[#005A9C] text-white rounded-xl text-xs font-bold">
                {saving ? 'Assigning...' : 'Confirm Issuance'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Return Item */}
      <Dialog open={!!returnModal} onOpenChange={(open) => !open && setReturnModal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Return Asset to Company</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm handover from <strong>{returnModal?.person_name}</strong> for <strong>{returnModal?.item_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturn} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Condition on Return</Label>
              <Select
                value={returnForm.condition}
                onValueChange={(val) => setReturnForm({ ...returnForm, condition: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good" className="text-xs">Good / Working</SelectItem>
                  <SelectItem value="Damaged" className="text-xs">Damaged / Faulty</SelectItem>
                  <SelectItem value="Lost" className="text-xs">Lost / Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Notes</Label>
              <Textarea
                placeholder="Return inspection comments..."
                value={returnForm.notes}
                onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReturnModal(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-[#005A9C] text-white rounded-xl text-xs font-bold">
                {saving ? 'Processing...' : 'Confirm Return'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
