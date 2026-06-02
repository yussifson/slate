import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Tag, Search, Plus, Package, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Products() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('product');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const products = dbRecords.map(r => ({
    id: r.id,
    sku: r.data?.sku || `SKU-${r.id?.slice(0, 5).toUpperCase()}`,
    name: r.data?.name || 'Unnamed Product',
    category: r.data?.category || 'General',
    price: parseFloat(r.data?.price) || 0,
    stock: parseInt(r.data?.stock) || 0,
    status: r.data?.stock > 0 ? 'In Stock' : 'Out of Stock'
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', price: '', stock: ''
  });

  const openEdit = (prod) => {
    setEditingId(prod.id);
    setFormData({ name: prod.name, sku: prod.sku, category: prod.category, price: prod.price, stock: prod.stock });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error("Name is required");

    mutateRecord.mutate({
      ...(editingId ? { id: editingId } : {}),
      recordType: 'product',
      payload: {
        name: formData.name, sku: formData.sku, category: formData.category,
        price: parseFloat(formData.price) || 0, stock: parseInt(formData.stock) || 0
      },
      status: 'active',
      searchText: `${formData.name} ${formData.sku} ${formData.category}`
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Product updated!' : 'Product added!');
        setShowModal(false);
        setEditingId(null);
      }
    });
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Products Catalog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your retail products, pricing, and stock.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ name: '', sku: '', category: '', price: '', stock: '' }); setShowModal(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><Tag className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{products.length}</p><p className="text-xs text-muted-foreground">Total Products</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-green-600"><Package className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{products.reduce((a, b) => a + b.stock, 0)}</p><p className="text-xs text-muted-foreground">Total Items in Stock</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
               <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
               <p className="font-semibold">No products found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Category</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Price</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Stock</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-card-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{p.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-card-foreground">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-card-foreground font-medium">{p.stock}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTargetId(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <div className="space-y-3">
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Name</label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1" /></div>
               <div><label className="text-xs font-bold text-muted-foreground uppercase">SKU</label><Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="mt-1" /></div>
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Category</label><Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="mt-1" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-muted-foreground uppercase">Price</label><Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="mt-1" /></div>
                 <div><label className="text-xs font-bold text-muted-foreground uppercase">Stock</label><Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="mt-1" /></div>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'product' }); setDeleteTargetId(null); }} title="Delete Product" message="Are you sure you want to delete this product?" />
    </div>
  );
}
