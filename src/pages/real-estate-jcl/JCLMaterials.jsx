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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" /> Materials & Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Construction master materials catalog, unit pricing, standard specifications, and on-site warehouse balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Add Material
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog SKUs</div>
          <div className="text-2xl font-bold mt-1">{materials.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Categories</div>
          <div className="text-2xl font-bold mt-1 text-primary">{categories.length || 1}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Balances Tracked</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{balances.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search SKU reference, name, category..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
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

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-semibold">SKU Reference</th>
                <th className="p-4 font-semibold">Material / Item Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Unit of Measure</th>
                <th className="p-4 font-semibold text-right">Standard Unit Cost</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No materials in catalog. Click "Add Material" to register your first construction item.
                  </td>
                </tr>
              ) : (
                filtered.map((mat) => (
                  <tr key={mat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-foreground">{mat.reference}</td>
                    <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-muted-foreground" /> {mat.name}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground border">
                        {mat.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground uppercase text-xs tracking-wider">
                      {mat.unit}
                    </td>
                    <td className="p-4 font-mono font-semibold text-foreground text-right">
                      ${Number(mat.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(mat.id)}>
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
