import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Package, Search, Plus, AlertTriangle, Trash2, Edit2, X, DollarSign, ShoppingBag, TrendingDown, MoreVertical, Eye, Edit, ShieldAlert } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, InventoryGridCard } from '@/components/retail/RetailViewKit';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useAuth } from '@/lib/AuthContext';
import { isRetailAdmin, isRetailInventoryManager } from '@/lib/constants';

const CATEGORIES = ['Electronics', 'Apparel', 'Footwear', 'Groceries', 'Fitness', 'Home & Living', 'Beauty', 'Other'];

const statusColors = {
  'In Stock': 'bg-slate-100 dark:bg-primary/20 text-primary/90 dark:text-primary/70',
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
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const canAccess = isRetailAdmin(user) || isRetailInventoryManager(user);
  
  const { data: dbRecords = [], isLoading } = useIndustryRecords('product');
  const { data: supplierRecords = [] } = useIndustryRecords('supplier');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const suppliers = supplierRecords.map(r => ({
    id: r.id,
    name: r.data?.name || 'Unnamed Supplier'
  }));

  const items = dbRecords.map(r => {
    const d = r.data || {};
    const quantity = parseInt(d.stock) || 0;
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
      supplierId: d.supplierId || '',
      supplierName: d.supplierId ? (suppliers.find(s => s.id === d.supplierId)?.name || 'Unknown') : (d.supplier || ''),
      expiryDate: d.expiryDate || '',
      status: getStatus(quantity, reorderLevel),
    };
  });

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
      supplier: item.supplierId,
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
      stock: qty,
      reorderLevel: reorder,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      supplierId: formData.supplier,
      expiryDate: formData.expiryDate,
    };

    mutateRecord.mutate({
      ...(editingItem ? { id: editingItem.id } : {}),
      recordType: 'product',
      payload,
      status: computedStatus,
      searchText: `${payload.sku} ${payload.name} ${payload.category} ${payload.supplierId}`,
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
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'product' }, {
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
    i.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const field = (label, key, props = {}) => {
    return (
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
  };

  if (!canAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Your current role does not grant you permission to view or manage the Inventory. Please contact your Store Manager if you believe this is an error.
        </p>
        <Button asChild variant="outline">
          <Link to="/retail-dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("inventory_management", "Inventory Management")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "track_stock_levels_skus_pricin",
            "Track stock levels, SKUs, pricing and suppliers"
          )}</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> {t("add_item", "Add Item")}
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RetailStatCard label={t("total_items", "Total Items")} value={stats.total} icon={Package} />
        <RetailStatCard label={t("low_stock", "Low Stock")} value={stats.lowStock} icon={TrendingDown} variant="warning" />
        <RetailStatCard label={t("out_of_stock", "Out of Stock")} value={stats.outOfStock} icon={AlertTriangle} variant="danger" />
        <RetailStatCard label={t("total_stock_value", "Total Stock Value")} value={`$${stats.totalValue.toFixed(2)}`} icon={DollarSign} />
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
          <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} {t("item_s", "item(s)")}</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">{t("loading_inventory", "Loading inventory...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Package className="w-14 h-14 mx-auto mb-3 opacity-25" />
              <p className="font-semibold text-base">{t("no_inventory_items_found", "No inventory items found.")}</p>
              <p className="text-xs mt-1">{t(
                "click_add_item_to_configure_yo",
                "Click \"Add Item\" to configure your first stock entry."
              )}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
              {filtered.map(item => (
                <InventoryGridCard
                  key={item.id}
                  item={item}
                  onView={() => { setSelectedItem(item); setIsSheetOpen(true); }}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeleteTargetId(item.id)}
                />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">{t("item", "Item")}</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase">{t("supplier", "Supplier")}</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">{t("price", "Price")}</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">{t("cost", "Cost")}</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase">{t("qty_reorder", "Qty / Reorder")}</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(item => {
                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-card-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        {item.expiryDate && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{t("exp", "Exp:")} {item.expiryDate}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{item.category}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {item.supplierName && item.supplierName !== 'Unknown' ? <Link to="/retail/suppliers" className="text-primary hover:underline">{item.supplierName}</Link> : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-card-foreground">${item.price.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">${item.costPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-black text-lg text-card-foreground">{item.quantity}</span>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("min", "Min:")} {item.reorderLevel}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[item.status] || 'bg-muted'}`}>
                            {item.status}
                          </span>
                          {item.status === 'Low Stock' && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
                              {t("reorder_needed", "Reorder Needed")}
                            </span>
                          )}
                          {item.status === 'Out of Stock' && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
                              {t("critical_alert", "Critical Alert")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("open_menu", "Open menu")}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsSheetOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit2 className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(item.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto w-[400px]">
          <SheetHeader>
            <SheetTitle>{t("inventory_details", "Inventory Details")}</SheetTitle>
            <SheetDescription>{t(
              "view_detailed_information_for_",
              "View detailed information for this item."
            )}</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("sku", "SKU")}</div>
                <div className="col-span-2 font-mono">{selectedItem.sku}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("name", "Name")}</div>
                <div className="col-span-2 font-medium">{selectedItem.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("category", "Category")}</div>
                <div className="col-span-2">{selectedItem.category}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("supplier", "Supplier")}</div>
                <div className="col-span-2">{selectedItem.supplierName && selectedItem.supplierName !== 'Unknown' ? <Link to="/retail/suppliers" className="text-primary hover:underline">{selectedItem.supplierName}</Link> : '—'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("price", "Price")}</div>
                <div className="col-span-2">${selectedItem.price.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("cost_price", "Cost Price")}</div>
                <div className="col-span-2">${selectedItem.costPrice.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("quantity", "Quantity")}</div>
                <div className="col-span-2">{selectedItem.quantity}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("reorder_level", "Reorder Level")}</div>
                <div className="col-span-2">{selectedItem.reorderLevel}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("expiry_date", "Expiry Date")}</div>
                <div className="col-span-2">{selectedItem.expiryDate || '—'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-semibold text-muted-foreground">{t("status", "Status")}</div>
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
                <ShoppingBag className="w-5 h-5 text-primary" />
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
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(c => {
                    return <option key={c}>{c}</option>;
                  })}
                </select>
              </div>
              <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("supplier", "Supplier")}</label>
                 <select
                   value={formData.supplier}
                   onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))}
                   className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 >
                   <option value="">No Supplier Selected</option>
                   {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              {field('Quantity', 'quantity', { type: 'number', placeholder: '50' })}
              {field('Reorder Level', 'reorderLevel', { type: 'number', placeholder: '10' })}
              {field('Selling Price ($) *', 'price', { type: 'number', placeholder: '29.99' })}
              {field('Cost Price ($)', 'costPrice', { type: 'number', placeholder: '15.00' })}
              <div className="col-span-2">
                {field('Expiry Date (optional)', 'expiryDate', { type: 'date' })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button
                className="flex-1"
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
