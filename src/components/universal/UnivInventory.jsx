import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Trash2, Edit2, Loader2, AlertTriangle, DollarSign, Archive, XCircle, BarChart2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { item_name: '', sku: '', category: '', quantity: 0, unit_price: 0, reorder_level: 10, status: 'In Stock', supplier: '', location: '' };

export default function UnivInventory() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('All');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['univ_inventory', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_inventory').select('*').eq('company_id', companyId).order('item_name', { ascending: true });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const saveItem = useMutation({
    mutationFn: async (payload) => {
      const data = {
        ...payload,
        status: payload.quantity > (payload.reorder_level || 10) ? 'In Stock' : payload.quantity === 0 ? 'Out of Stock' : 'Low Stock'
      };
      if (editingId) return base44.db.from('univ_inventory').update(data).eq('id', editingId);
      return base44.db.from('univ_inventory').insert([{ ...data, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_inventory']);
      toast.success(editingId ? 'Item updated!' : 'Item added!');
      closeModal();
    },
    onError: () => toast.error('Failed to save item')
  });

  const deleteItem = useMutation({
    mutationFn: async (id) => base44.db.from('univ_inventory').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_inventory']); toast.success('Item deleted'); },
    onError: () => toast.error('Failed to delete')
  });

  const openModal = (item = null) => {
    setForm(item ? { ...item } : EMPTY_FORM);
    setEditingId(item?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = inventory.filter(i => {
    const matchSearch = `${i.item_name} ${i.sku} ${i.category} ${i.supplier}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalValue = inventory.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0);
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'Out of Stock').length;

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Inventory
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Track stock, manage products and receive alerts.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total SKUs', value: inventory.length, bg: 'bg-card', color: 'text-foreground', iconBg: 'bg-primary/10 text-primary', icon: <Archive className="w-5 h-5" /> },
          { label: 'Inventory Value', value: `$${totalValue.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}`, bg: 'bg-emerald-50 border-emerald-100', color: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-600', icon: <DollarSign className="w-5 h-5" /> },
          { label: 'Low Stock', value: lowStockCount, bg: 'bg-amber-50 border-amber-100', color: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', icon: <AlertTriangle className="w-5 h-5" /> },
          { label: 'Out of Stock', value: outOfStockCount, bg: 'bg-red-50 border-red-100', color: 'text-red-700', iconBg: 'bg-red-100 text-red-600', icon: <BarChart2 className="w-5 h-5" /> },
        ].map((k, i) => (
          <div key={i} className={`border p-4 rounded-2xl shadow-sm flex items-center gap-4 ${k.bg}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.iconBg}`}>{k.icon}</div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className={`text-xl font-black mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, category, supplier..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 shadow-sm">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-11 bg-transparent text-sm focus:outline-none text-foreground pr-1">
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No items found. Add your first inventory item.</p>
            </div>
          ) : filtered.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku || '—'}</p>
                </div>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">{item.category || '—'}</div>
              <div className="col-span-1 text-right">
                <span className={`text-sm font-black ${item.status === 'Out of Stock' ? 'text-red-600' : item.status === 'Low Stock' ? 'text-amber-600' : 'text-foreground'}`}>{item.quantity}</span>
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-foreground">${Number(item.unit_price).toFixed(2)}</div>
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>{item.status}</span>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(item)} className="p-1.5 text-muted-foreground hover:text-primary bg-muted rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteItem.mutate(item.id)} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveItem.mutate(form); }} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Item Name *</label>
                  <input required type="text" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Auto-generated if blank" className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Quantity *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Unit Price ($) *</label>
                  <input required type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: parseFloat(e.target.value) || 0})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Reorder Level</label>
                  <input type="number" min="0" value={form.reorder_level} onChange={e => setForm({...form, reorder_level: parseInt(e.target.value) || 0})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Supplier</label>
                  <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Storage Location</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Warehouse, Shelf A2..." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveItem.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">
                  {saveItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
