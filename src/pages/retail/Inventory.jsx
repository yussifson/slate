import { useState } from 'react';
import { Package, Search, Plus, AlertTriangle, Trash2, Edit2, X, DollarSign, ShoppingBag, TrendingDown, MoreVertical, Eye, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const CATEGORIES = ['Electronics', 'Apparel', 'Footwear', 'Groceries', 'Fitness', 'Home & Living', 'Beauty', 'Other'];

const statusColors = {
  'In Stock': 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400',
  'Low Stock': 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  'Out of Stock': 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
};

function getStatus(quantity, reorderLevel) {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

const emptyForm = {
  sku: '',
  name: '',
  category: 'Electronics',
  quantity: '',
  reorderLevel: '',
  price: '',
  costPrice: '',
  supplier: '',
  expiryDate: '',
};

export default function Inventory() {
  const { data: dbRecords = [], isLoading } = useIndustryRecords('inventory_item');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const items = dbRecords.map(r => {
    const d = r.data || {};
    const quantity = parseInt(d.quantity) || 0;
    const reorderLevel = parseInt(d.reorderLevel) || 10;
    return {
      id: r.id,
      sku: d.sku || `SKU-${r.id?.slice(0, 4).toUpperCase()}`,
      name: d.name || 'Unnamed Item',
      category: d.category || 'General',
      quantity,
      reorderLevel,
      price: parseFloat(d.price) || 0,
      costPrice: parseFloat(d.costPrice) || 0,
      supplier: d.supplier || '',
      expiryDate: d.expiryDate || '',
      status: getStatus(quantity, reorderLevel),
    };
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openAdd = () => { setEditingItem(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      reorderLevel: String(item.reorderLevel),
      price: String(item.price),
      costPrice: String(item.costPrice),
      supplier: item.supplier,
      expiryDate: item.expiryDate,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.sku.trim() || !formData.name.trim() || !formData.price) {
      return toast.error('SKU, Name, and Price are required.');
    }
    const qty = parseInt(formData.quantity) || 0;
    const reorder = parseInt(formData.reorderLevel) || 10;
    const computedStatus = getStatus(qty, reorder);

    const payload = {
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: formData.category,
      quantity: qty,
      reorderLevel: reorder,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      supplier: formData.supplier.trim(),
      expiryDate: formData.expiryDate,
    };

    mutateRecord.mutate({
      ...(editingItem ? { id: editingItem.id } : {}),
      recordType: 'inventory_item',
      payload,
      status: computedStatus,
      searchText: `${payload.sku} ${payload.name} ${payload.category} ${payload.supplier}`,
    }, {
      onSuccess: () => {
        toast.success(editingItem ? 'Item updated!' : 'Item added to inventory!');
        setShowModal(false);
        setFormData(emptyForm);
        setEditingItem(null);
      },
      onError: (err) => toast.error('Failed: ' + err.message),
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'inventory_item' }, {
      onSuccess: () => { toast.success('Item deleted.'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.status === 'Low Stock').length,
    outOfStock: items.filter(i => i.status === 'Out of Stock').length,
    totalValue: items.reduce((s, i) => s + i.price * i.quantity, 0),
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const field = (label, key, props = {}) => (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase">{label}</label>
      <Input
        className="mt-1"
        value={formData[key]}
        onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track stock levels, SKUs, pricing and suppliers</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-card-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border border-l-4 border-l-amber-500 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">{stats.lowStock}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border border-l-4 border-l-red-500 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-600">{stats.outOfStock}</p>
            <p className="text-xs text-muted-foreground">Out of Stock</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-card-foreground">${stats.totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Stock Value</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex gap-4 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} item(s)</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Package className="w-14 h-14 mx-auto mb-3 opacity-25" />
              <p className="font-semibold text-base">No inventory items found.</p>
              <p className="text-xs mt-1">Click "Add Item" to configure your first stock entry.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Item</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Supplier</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Price</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Cost</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Qty / Reorder</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-card-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      {item.expiryDate && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Exp: {item.expiryDate}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{item.category}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {item.supplier ? <Link to="/retail/suppliers" className="text-primary hover:underline">{item.supplier}</Link> : '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-card-foreground">${item.price.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">${item.costPrice.toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-black text-lg text-card-foreground">{item.quantity}</span>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Min: {item.reorderLevel}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[item.status] || 'bg-muted'}`}>
                          {item.status}
                        </span>
                        {item.status === 'Low Stock' && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
                            Reorder Needed
                          </span>
                        )}
                        {item.status === 'Out of Stock' && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
                            Critical Alert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsSheetOpen(true); }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(item.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-[400px]">
          <SheetHeader>
            <SheetTitle>Inventory Details</SheetTitle>
            <SheetDescription>View detailed information for this item.</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">SKU</div>
                <div className="col-span-2 font-mono">{selectedItem.sku}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Name</div>
                <div className="col-span-2 font-medium">{selectedItem.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Category</div>
                <div className="col-span-2">{selectedItem.category}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Supplier</div>
                <div className="col-span-2">{selectedItem.supplier ? <Link to="/retail/suppliers" className="text-primary hover:underline">{selectedItem.supplier}</Link> : '—'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Price</div>
                <div className="col-span-2">${selectedItem.price.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Cost Price</div>
                <div className="col-span-2">${selectedItem.costPrice.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Quantity</div>
                <div className="col-span-2">{selectedItem.quantity}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Reorder Level</div>
                <div className="col-span-2">{selectedItem.reorderLevel}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Expiry Date</div>
                <div className="col-span-2">{selectedItem.expiryDate || '—'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-semibold text-muted-foreground">Status</div>
                <div className="col-span-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[selectedItem.status] || 'bg-muted'}`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('SKU / Barcode', 'sku', { placeholder: 'SKU-1001' })}
              {field('Item Name *', 'name', { placeholder: 'e.g. Wireless Mouse' })}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {field('Supplier', 'supplier', { placeholder: 'e.g. Acme Wholesale' })}
              {field('Quantity', 'quantity', { type: 'number', placeholder: '50' })}
              {field('Reorder Level', 'reorderLevel', { type: 'number', placeholder: '10' })}
              {field('Selling Price ($) *', 'price', { type: 'number', placeholder: '29.99' })}
              {field('Cost Price ($)', 'costPrice', { type: 'number', placeholder: '15.00' })}
              <div className="col-span-2">
                {field('Expiry Date (optional)', 'expiryDate', { type: 'date' })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSave}
                disabled={mutateRecord.isPending}
              >
                {mutateRecord.isPending ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this item? This will remove it from inventory and the POS register permanently."
      />

      

      
    </div>
  );
}
