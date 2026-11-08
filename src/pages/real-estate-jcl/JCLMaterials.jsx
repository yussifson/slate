import React, { useCallback, useEffect, useState } from 'react';
import { 
  Plus, Search, Trash2, RefreshCw, Warehouse, 
  Package, Boxes, DollarSign, Layers 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { JCLProcurementService } from '@/services/JCLProcurementService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

const blankMaterialForm = {
  reference: '',
  name: '',
  category: 'Structural',
  unit: 'bags',
  unit_cost: ''
};

export default function JCLMaterials() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [materials, setMaterials] = useState([]);
  const [balances, setBalances] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankMaterialForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [matRes, balRes] = await Promise.all([
        supabase
          .from('jcl_materials')
          .select('*')
          .eq('company_id', companyId)
          .order('name', { ascending: true }),
        supabase
          .from('jcl_inventory_balances')
          .select('id, material_id, location_id, available_quantity, allocated_quantity, consumed_quantity, jcl_materials(id,reference,name,unit), jcl_storage_locations(id,name)')
          .eq('company_id', companyId)
          .order('updated_at', { ascending: false })
      ]);

      if (matRes.error) throw matRes.error;
      setMaterials(matRes.data || []);
      setBalances(balRes.data || []);
    } catch (err) {
      console.error('Materials load error:', err);
      toast.error(err.message || 'Unable to load materials');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setForm({
      reference: `MAT-${Date.now().toString().slice(-5)}`,
      name: '',
      category: 'Structural',
      unit: 'bags',
      unit_cost: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Material name is required');
      return;
    }
    setSaving(true);
    try {
      await JCLProcurementService.createMaterial(companyId, form);
      toast.success('Material added to master catalogue');
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save material error:', err);
      toast.error(err.message || 'Unable to save material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material catalog item?')) return;
    try {
      await JCLProcurementService.deleteMaterial(companyId, id);
      toast.success('Material deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Unable to delete');
    }
  };

  const filtered = materials.filter(m => {
    const matchQuery = `${m.reference || ''} ${m.name || ''} ${m.category || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchQuery && matchCat;
  });

  const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Native Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <Warehouse className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Materials & Catalog</h1>
            <p className="text-xs text-muted-foreground font-medium">{filtered.length} material SKUs & storage balances</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Material Item</span><span className="sm:hidden">Add SKU</span>
          </Button>
        </div>
      </div>

      {/* 2x2 Native Mobile Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Catalog SKUs</span>
          <span className="text-xl sm:text-2xl font-black text-foreground">{materials.length}</span>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Active Categories</span>
          <span className="text-xl sm:text-2xl font-black text-[#005A9C] dark:text-[#FF6B00]">{categories.length || 1}</span>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Storage Balances</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{balances.length}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search SKU reference, name, category..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-xs h-9.5 rounded-xl bg-background border-border/80 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs font-semibold h-9.5 rounded-xl bg-background border-border/80">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Structural">Structural</SelectItem>
              <SelectItem value="Masonry">Masonry</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Finishing">Finishing</SelectItem>
              <SelectItem value="General">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table & Mobile Card List */}
      <div className="space-y-3">
        {/* Mobile Native Card View (< md) */}
        <div className="md:hidden space-y-2.5">
          {filtered.length ? filtered.map(mat => (
            <div key={mat.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{mat.reference}</span>
                  <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{mat.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{mat.category || 'General'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border shrink-0">
                  {mat.unit}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">Standard Cost</span>
                <span className="font-mono font-black text-sm text-foreground">
                  ${Number(mat.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-destructive hover:text-destructive/80 rounded-lg" onClick={() => handleDelete(mat.id)}>
                  <Trash2 className="size-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
              No materials found. Click &quot;Add Material Item&quot; to register one.
            </div>
          )}
        </div>

        {/* Desktop High-Density Table (>= md) */}
        <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/80">
                <tr>
                  <th className="p-3.5">SKU Reference</th>
                  <th className="p-3.5">Material / Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit of Measure</th>
                  <th className="p-3.5 text-right">Standard Unit Cost</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      No materials in catalog.
                    </td>
                  </tr>
                ) : (
                  filtered.map((mat) => (
                    <tr key={mat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-mono font-medium text-foreground">{mat.reference}</td>
                      <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-muted-foreground" /> {mat.name}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground border border-border">
                          {mat.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground uppercase text-xs tracking-wider">
                        {mat.unit}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-foreground text-right">
                        ${Number(mat.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(mat.id)} className="h-7 w-7 text-destructive hover:text-destructive/80">
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
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add Material to Catalog</DialogTitle>
            <DialogDescription>
              Register construction material specifications, category classification, and baseline costing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Material / Item Name *</Label>
              <Input 
                required
                placeholder="e.g. Portland Cement 50kg, High-Yield Rebar 16mm" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Masonry">Masonry</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Finishing">Finishing</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit of Measure</Label>
                <Select value={form.unit} onValueChange={(val) => setForm({ ...form, unit: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="sqm">Square Meters (sqm)</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="trips">Trips / Loads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Standard Unit Cost ($)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unit_cost} 
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">SKU Reference</Label>
                <Input 
                  value={form.reference} 
                  onChange={(e) => setForm({ ...form, reference: e.target.value })} 
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : 'Add Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
