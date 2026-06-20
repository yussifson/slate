import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Tag, Search, Plus, Package, Edit, Trash2} from 'lucide-react';
import { ViewModeToggle, RetailStatCard, ProductGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Input} from '@/components/ui/input';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Products() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
  const { t} = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dbRecords, setDbRecords] = useState([]);
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));

        const suppRes = await powerSync.execute('SELECT * FROM univ_retail_suppliers WHERE company_id = ?', [companyId]);
        if(active) setSupplierRecords(suppRes.rows._array || Array.from(suppRes.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);
  
  const suppliers = supplierRecords.map(r => ({
  id: r.id,
  name: r.name || 'Unnamed Supplier'
 }));

  const products = dbRecords.map(r => ({
  id: r.id,
  sku: r.sku || `SKU-${r.id?.slice(0, 5).toUpperCase()}`,
  name: r.name || 'Unnamed Product',
  category: r.category || 'General',
  price: parseFloat(r.price) || 0,
  stock: parseInt(r.stock) || 0,
  status: parseInt(r.stock) > 0 ? 'In Stock' : 'Out of Stock',
  supplierId: r.supplier || '',
  createdBy: 'System',
  createdAt: r.created_at || new Date().toISOString()
 }));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingId, setEditingId] = useState(null);
 const [viewMode, setViewMode] = useState('list');

 const [formData, setFormData] = useState({
 name: '', sku: '', category: '', price: '', stock: '', supplierId: ''
});

 const openEdit = (prod) => {
 setEditingId(prod.id);
 setFormData({ name: prod.name, sku: prod.sku, category: prod.category, price: prod.price, stock: prod.stock, supplierId: prod.supplierId || ''});
 setShowModal(true);
};

 
  const handleAIGenerator = async () => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    if (!formData.name) {
      toast.error('Please enter a product name first.');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `You are an SEO expert. Write a compelling 2-sentence product description for a retail product named "${formData.name}" in category "${formData.category}".`;
      const response = await generateText(prompt);
      toast.success('Description generated!');
      // Assuming we'd add a description field later, or just alert it
      alert(response);
    } catch (e) {
      toast.error('AI Generator failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
  if (!formData.name.trim()) return toast.error("Name is required");

  try {
    if (editingId) {
      await powerSync.execute(`UPDATE univ_retail_products SET name=?, sku=?, category=?, price=?, stock=?, supplier=? WHERE id=?`, 
        [formData.name, formData.sku, formData.category, parseFloat(formData.price) || 0, parseInt(formData.stock) || 0, formData.supplierId, editingId]
      );
      toast.success('Product updated!');
    } else {
      await powerSync.execute(`INSERT INTO univ_retail_products (id, created_at, company_id, name, sku, category, price, stock, supplier, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, 'Active')`, 
        [companyId, formData.name, formData.sku, formData.category, parseFloat(formData.price) || 0, parseInt(formData.stock) || 0, formData.supplierId]
      );
      toast.success('Product added!');
    }
    setShowModal(false);
    setEditingId(null);
    const res = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    setDbRecords(res.rows._array || Array.from(res.rows));
  } catch (err) {
    toast.error('Failed to save product: ' + err.message);
  }
 };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_retail_products WHERE id=?`, [deleteTargetId]);
      toast.success('Product deleted.');
      setDeleteTargetId(null);
      setDbRecords(dbRecords.filter(p => p.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to delete product: ' + err.message);
    }
  };

 const filtered = products.filter(p => 
 p.name.toLowerCase().includes(search.toLowerCase()) || 
 p.sku.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Products Catalog</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Manage your retail products, pricing, and stock.</p>
 </div>
 <Button onClick={() => { setEditingId(null); setFormData({ name: '', sku: '', category: '', price: '', stock: ''}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> Add Product
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label="Total Products" value={products.length} icon={Tag} />
 <RetailStatCard label="Total Items in Stock" value={products.reduce((a, b) => a + b.stock, 0)} icon={Package} />
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No products found.</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filtered.map(p => (
 <ProductGridCard
 key={p.id}
 product={p}
 suppliers={suppliers}
 onEdit={() => openEdit(p)}
 onDelete={() => setDeleteTargetId(p.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Product Name</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Category</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Price</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Stock</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Supplier</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Status</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Added By</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(p => (
 <tr key={p.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{p.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{p.sku}</p>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{p.category}</td>
 <td className="px-6 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${p.price.toFixed(2)}</td>
 <td className="px-6 py-4 text-center font-medium">
 <Link to="/retail-inventory" className="text-primary hover:underline" title="Manage in Inventory">{p.stock}</Link>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{suppliers.find(s => s.id === p.supplierId)?.name || 'None'}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${p.stock > 0 ? 'bg-slate-100 text-primary/90' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{p.createdBy}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(p.createdAt).toLocaleDateString()}</p>
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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20" onClick={handleAIGenerator} disabled={isGenerating}>
              {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
              {isGenerating ? 'Generating...' : 'AI SEO Writer'}
            </Button>
          </div>
 <div className="space-y-3">
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Name</label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">SKU</label><Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Category</label><Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value})} className="mt-1" /></div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Price</label><Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Stock</label><Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value})} className="mt-1" /></div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Supplier</label>
 <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm mt-1">
 <option value="">No Supplier Selected</option>
 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
 <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure you want to delete this product?" />
 </div>
 );
}


