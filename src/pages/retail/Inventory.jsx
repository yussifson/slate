import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { Package, Search, Plus, AlertTriangle, Trash2, Edit2, X, DollarSign, ShoppingBag, TrendingDown, MoreVertical, Eye, Edit, ShieldAlert, Printer, MapPin, ArrowRightLeft, Barcode, Bot } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, InventoryGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';

import { Input} from '@/components/ui/input';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useAuth} from '@/lib/AuthContext';
import { isRetailAdmin, isRetailInventoryManager} from '@/lib/constants';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

const CATEGORIES = ['Electronics', 'Apparel', 'Footwear', 'Groceries', 'Fitness', 'Home & Living', 'Beauty', 'Other'];
const LOCATIONS = ['Main Store', 'Downtown Branch', 'Warehouse A', 'Online Fulfillment'];

const statusColors = {
 'In Stock': 'bg-slate-100 dark:bg-primary/20 text-primary/90 dark:text-primary/70',
 'Low Stock': 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-800',
 'Out of Stock': 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-[0.5px] border-black/9 dark:border-white/8 border-red-200 dark:border-red-800'};

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
 storeLocation: 'Main Store'
};

export default function Inventory() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
  const { t} = useTranslation();
  const { user} = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
 
  const canAccess = isRetailAdmin(user) || isRetailInventoryManager(user);
 
  const [dbRecords, setDbRecords] = useState([]);
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_retail_inventory WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
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

 const items = dbRecords.map(r => {
 const d = r;
 const quantity = parseInt(d.quantity) || 0;
 const reorderLevel = parseInt(d.reorder_level) || 10;
 return {
 id: r.id,
 sku: d.sku || `SKU-${r.id?.slice(0, 4).toUpperCase()}`,
 name: d.name || 'Unnamed Item',
 category: d.category || 'General',
 quantity,
 reorderLevel,
 price: parseFloat(d.price) || 0,
 costPrice: parseFloat(d.cost_price) || 0,
 supplierId: d.supplier || '',
 supplierName: d.supplier ? (suppliers.find(s => s.id === d.supplier)?.name || 'Unknown') : (d.supplier || ''),
 expiryDate: d.expiry_date || '',
 storeLocation: d.store_location || 'Main Store',
 status: getStatus(quantity, reorderLevel),
 createdBy: r.created_by || 'System',
 createdAt: r.created_at || new Date().toISOString()
};
});

 const [search, setSearch] = useState('');
 const [viewMode, setViewMode] = useState('list');
 const [showModal, setShowModal] = useState(false);
 const [showTransferModal, setShowTransferModal] = useState(false);
 const [transferData, setTransferData] = useState({ qty: '', targetLocation: '' });
 const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
 const [formData, setFormData] = useState(emptyForm);
 const [selectedItem, setSelectedItem] = useState(null);
 const [isSheetOpen, setIsSheetOpen] = useState(false);
 const [editingItem, setEditingItem] = useState(null);

 const openAdd = () => { setEditingItem(null); setFormData(emptyForm); setShowModal(true);};
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
 storeLocation: item.storeLocation || 'Main Store'});
 setShowModal(true);
};

 
  const handleAIPredictor = async (item) => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are an AI Inventory Predictor for retail.
Product: ${item.name}
SKU: ${item.sku}
Current Quantity: ${item.quantity}
Reorder Level: ${item.reorderLevel}
Status: ${item.status}

Give a 2-sentence prediction on when this item will stock out and whether the reorder level should be adjusted.`;
      const response = await generateText(prompt);
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      setAiInsight(responseText);
    } catch (e) {
      toast.error('AI Predictor failed.');
    } finally {
      setIsGenerating(false);
    }
  };

   const handleTransfer = async () => {
    const qty = parseInt(transferData.qty) || 0;
    if (qty <= 0) return toast.error('Transfer quantity must be greater than 0');
    if (qty > selectedItem.quantity) return toast.error('Insufficient stock for transfer');
    if (!transferData.targetLocation || transferData.targetLocation === selectedItem.storeLocation) {
      return toast.error('Please select a different target location');
    }

    try {
      // 1. Decrement current item
      const currentQty = selectedItem.quantity - qty;
      const currentStatus = getStatus(currentQty, selectedItem.reorderLevel);
      await powerSync.execute(`UPDATE univ_retail_inventory SET quantity=?, status=? WHERE id=?`, 
        [currentQty, currentStatus, selectedItem.id]
      );

      // 2. See if item exists in target location
      const targetItem = items.find(i => i.sku === selectedItem.sku && i.storeLocation === transferData.targetLocation);
      if (targetItem) {
        const targetQty = targetItem.quantity + qty;
        const targetStatus = getStatus(targetQty, targetItem.reorderLevel);
        await powerSync.execute(`UPDATE univ_retail_inventory SET quantity=?, status=? WHERE id=?`, 
          [targetQty, targetStatus, targetItem.id]
        );
      } else {
        // Create new item in target location
        await powerSync.execute(`INSERT INTO univ_retail_inventory (id, created_at, company_id, sku, name, category, supplier, price, cost_price, quantity, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [companyId, selectedItem.sku, selectedItem.name, selectedItem.category, selectedItem.supplierId, selectedItem.price, selectedItem.costPrice, qty, getStatus(qty, selectedItem.reorderLevel)]
        );
      }

      const res = await powerSync.execute('SELECT * FROM univ_retail_inventory WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setDbRecords(res.rows._array || Array.from(res.rows));

      toast.success(`Successfully transferred ${qty} items to ${transferData.targetLocation}`);
      setShowTransferModal(false);
      setIsSheetOpen(false);
    } catch (err) {
      toast.error('Failed to transfer stock: ' + err.message);
    }
  };

  const handleSave = async () => {
  if (!formData.sku.trim() || !formData.name.trim() || !formData.price) {
  return toast.error('SKU, Name, and Price are required.');
 }
  const qty = parseInt(formData.quantity) || 0;
  const reorder = parseInt(formData.reorderLevel) || 10;
  const computedStatus = getStatus(qty, reorder);

  try {
    if (editingItem) {
      await powerSync.execute(`UPDATE univ_retail_inventory SET sku=?, name=?, category=?, supplier=?, price=?, cost_price=?, quantity=?, status=? WHERE id=?`, 
        [formData.sku.trim(), formData.name.trim(), formData.category, formData.supplier, parseFloat(formData.price) || 0, parseFloat(formData.costPrice) || 0, qty, computedStatus, editingItem.id]
      );
      toast.success('Item updated!');
    } else {
      await powerSync.execute(`INSERT INTO univ_retail_inventory (id, created_at, company_id, sku, name, category, supplier, price, cost_price, quantity, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [companyId, formData.sku.trim(), formData.name.trim(), formData.category, formData.supplier, parseFloat(formData.price) || 0, parseFloat(formData.costPrice) || 0, qty, computedStatus]
      );
      toast.success('Item added to inventory!');
    }
    setShowModal(false);
    setFormData(emptyForm);
    setEditingItem(null);
    
    const res = await powerSync.execute('SELECT * FROM univ_retail_inventory WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    setDbRecords(res.rows._array || Array.from(res.rows));
  } catch (err) {
    toast.error('Failed: ' + err.message);
  }
 };

  const handleDelete = async () => {
  if (!deleteTargetId) return;
  try {
    await powerSync.execute(`DELETE FROM univ_retail_inventory WHERE id=?`, [deleteTargetId]);
    toast.success('Item deleted.');
    setDeleteTargetId(null);
    setDbRecords(dbRecords.filter(i => i.id !== deleteTargetId));
  } catch (err) {
    toast.error('Failed: ' + err.message);
  }
 };

 const stats = {
 total: items.length,
 lowStock: items.filter(i => i.status === 'Low Stock').length,
 outOfStock: items.filter(i => i.status === 'Out of Stock').length,
 totalValue: items.reduce((s, i) => s + i.price * i.quantity, 0)};

 const filtered = items.filter(i =>
 (i.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
 (i.sku || '').toLowerCase().includes((search || '').toLowerCase()) ||
 (i.supplierName || '').toLowerCase().includes((search || '').toLowerCase())
 );

 const field = (label, key, props = {}) => {
 return (
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{label}</label>
 <Input
 className="mt-1"
 value={formData[key]}
 onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value}))}
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
 <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-[-0.02em]">Access Restricted</h2>
 <p className="text-[#71717a] dark:text-gray-400 max-w-md mx-auto mb-8">
 Your current role does not grant you permission to view or manage the Inventory. Please contact your Store Manager if you believe this is an error.
 </p>
 <Button asChild variant="outline">
 <Link to="/retail-dashboard">Return to Dashboard</Link>
 </Button>
 </div>
 );
}

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("inventory_management", "Inventory Management")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
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
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50 flex gap-4 justify-between items-center">
 <div className="relative max-w-md w-full">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input
 placeholder="Search by name, SKU, or supplier..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <span className="text-xs text-[#71717a] dark:text-gray-400 whitespace-nowrap tracking-[0.04em]">{filtered.length} {t("item_s", "item(s)")}</span>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? (
 <div className="py-16 text-center text-[#71717a] dark:text-gray-400">{t("loading_inventory", "Loading inventory...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-16 text-center text-[#71717a] dark:text-gray-400">
 <Package className="w-14 h-14 mx-auto mb-3 opacity-25" />
 <p className="font-semibold text-base">{t("no_inventory_items_found", "No inventory items found.")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
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
 onView={() => { setSelectedItem(item); setIsSheetOpen(true);}}
 onEdit={() => openEdit(item)}
 onDelete={() => setDeleteTargetId(item.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-muted/30 border-b border-primary/40">
 <tr>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("item", "Item")}</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("category", "Category")}</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("location", "Location")}</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("supplier", "Supplier")}</th>
 <th className="px-5 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("price", "Price")}</th>
 <th className="px-5 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("cost", "Cost")}</th>
 <th className="px-5 py-3 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("qty_reorder", "Qty / Reorder")}</th>
 <th className="px-5 py-3 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-5 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Added By</th>
 <th className="px-5 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(item => {
 return (
 <tr key={item.id} className="hover:bg-muted/40 transition-colors">
 <td className="px-5 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{item.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{item.sku}</p>
 {item.expiryDate && (
 <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{t("exp", "Exp:")} {item.expiryDate}</p>
 )}
 </td>
 <td className="px-5 py-4 text-[#71717a] dark:text-gray-400">{item.category}</td>
 <td className="px-5 py-4 text-xs font-medium text-slate-600 tracking-[0.04em]"><MapPin className="w-3 h-3 inline mr-1" />{item.storeLocation}</td>
 <td className="px-5 py-4 text-[#71717a] dark:text-gray-400">
 {item.supplierName && item.supplierName !== 'Unknown' ? <Link to="/suppliers" className="text-primary hover:underline">{item.supplierName}</Link> : '—'}
 </td>
 <td className="px-5 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${item.price.toFixed(2)}</td>
 <td className="px-5 py-4 text-right text-[#71717a] dark:text-gray-400">${item.costPrice.toFixed(2)}</td>
 <td className="px-5 py-4 text-center">
 <span className="font-black text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{item.quantity}</span>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase font-semibold tracking-[0.04em]">{t("min", "Min:")} {item.reorderLevel}</p>
 </td>
 <td className="px-5 py-4 text-center">
 <div className="flex flex-col items-center gap-2.5">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[item.status] || 'bg-muted'}`}>
 {item.status}
 </span>
 {item.status === 'Low Stock' && (
 <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
 {t("reorder_needed", "Reorder Needed")}
 </span>
 )}
 {item.status === 'Out of Stock' && (
 <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
 {t("critical_alert", "Critical Alert")}
 </span>
 )}
 </div>
 </td>
 <td className="px-5 py-4">
 <p className="text-sm font-medium text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{item.createdBy}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(item.createdAt).toLocaleDateString()}</p>
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
 <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsSheetOpen(true);}}>
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
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("sku", "SKU")}</div>
 <div className="col-span-2 font-mono">{selectedItem.sku}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("name", "Name")}</div>
 <div className="col-span-2 font-medium">{selectedItem.name}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("category", "Category")}</div>
 <div className="col-span-2">{selectedItem.category}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
  <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("location", "Location")}</div>
  <div className="col-span-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {selectedItem.storeLocation}</div>
  </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("supplier", "Supplier")}</div>
 <div className="col-span-2">{selectedItem.supplierName && selectedItem.supplierName !== 'Unknown' ? <Link to="/suppliers" className="text-primary hover:underline">{selectedItem.supplierName}</Link> : '—'}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("price", "Price")}</div>
 <div className="col-span-2">${selectedItem.price.toFixed(2)}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("cost_price", "Cost Price")}</div>
 <div className="col-span-2">${selectedItem.costPrice.toFixed(2)}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("quantity", "Quantity")}</div>
 <div className="col-span-2">{selectedItem.quantity}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("reorder_level", "Reorder Level")}</div>
 <div className="col-span-2">{selectedItem.reorderLevel}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("expiry_date", "Expiry Date")}</div>
 <div className="col-span-2">{selectedItem.expiryDate || '—'}</div>
 </div>
 <div className="grid grid-cols-3 gap-4 border-b pb-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">{t("status", "Status")}</div>
 <div className="col-span-2">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[selectedItem.status] || 'bg-muted'}`}>
 {selectedItem.status}
 </span>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1 font-semibold text-[#71717a] dark:text-gray-400">Added By</div>
 <div className="col-span-2">{selectedItem.createdBy} on {new Date(selectedItem.createdAt).toLocaleDateString()}</div>
 </div>

  
          {aiInsight && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mt-4 mb-2">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> AI Predictor</h3>
              <p className="text-sm text-foreground font-medium">{aiInsight}</p>
            </div>
          )}
          <div className="bg-muted/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center space-y-2 mt-4">
    <div className="flex space-x-[2px] h-12 w-48 opacity-80">
       {/* Pseudo barcode using div borders */}
       {Array.from({length: 30}).map((_, i) => (
         <div key={i} style={{ width: Math.random() > 0.5 ? '4px' : '2px', backgroundColor: 'currentColor' }} className="h-full text-slate-800"></div>
       ))}
    </div>
    <div className="font-mono text-xs text-[#71717a] dark:text-gray-400 tracking-widest tracking-[0.04em]">{selectedItem.sku}</div>
  </div>

  <div className="flex gap-2 pt-4">
    <Button variant="outline" className="flex-1 text-primary border-primary hover:bg-primary/5" onClick={() => { toast.success("Sending to label printer..."); }}><Printer className="w-4 h-4 mr-2"/> Print Label</Button>
    <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setShowTransferModal(true); }}><ArrowRightLeft className="w-4 h-4 mr-2"/> Transfer</Button>
  </div>
 </div>
 )}
 </SheetContent>
 </Sheet>

  {showTransferModal && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <h3 className="font-semibold text-lg flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-amber-600" /> Transfer Stock</h3>
        <p className="text-sm text-[#71717a] dark:text-gray-400">Move inventory from <strong>{selectedItem?.storeLocation}</strong> to another location.</p>
        
        <div>
          <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Quantity to Transfer (Max {selectedItem?.quantity})</label>
          <Input type="number" value={transferData.qty} onChange={e => setTransferData({...transferData, qty: e.target.value})} className="mt-1" placeholder="e.g. 5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Target Location</label>
          <select value={transferData.targetLocation} onChange={e => setTransferData({...transferData, targetLocation: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
            <option value="">Select Location</option>
            {LOCATIONS.filter(l => l !== selectedItem?.storeLocation).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>Cancel</Button>
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleTransfer}>Transfer</Button>
        </div>
      </div>
    </div>
  )}

 {/* Add / Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ShoppingBag className="w-5 h-5 text-primary" />
 {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
 </h2>
 <button onClick={() => setShowModal(false)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="grid grid-cols-2 gap-3">
 {field('SKU / Barcode', 'sku', { placeholder: 'SKU-1001'})}
 {field('Item Name *', 'name', { placeholder: 'e.g. Wireless Mouse'})}
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("category", "Category")}</label>
 <select
 value={formData.category}
 onChange={e => setFormData(p => ({ ...p, category: e.target.value}))}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm"
 >
 {CATEGORIES.map(c => {
 return <option key={c}>{c}</option>;
})}
 </select>
 </div>
 <div>
  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Location</label>
  <select
  value={formData.storeLocation}
  onChange={e => setFormData(p => ({ ...p, storeLocation: e.target.value}))}
  className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm"
  >
  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
  </select>
  </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("supplier", "Supplier")}</label>
 <select
 value={formData.supplier}
 onChange={e => setFormData(p => ({ ...p, supplier: e.target.value}))}
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm"
 >
 <option value="">No Supplier Selected</option>
 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 {field('Quantity', 'quantity', { type: 'number', placeholder: '50'})}
 {field('Reorder Level', 'reorderLevel', { type: 'number', placeholder: '10'})}
 {field('Selling Price ($) *', 'price', { type: 'number', placeholder: '29.99'})}
 {field('Cost Price ($)', 'costPrice', { type: 'number', placeholder: '15.00'})}
 <div className="col-span-2">
 {field('Expiry Date (optional)', 'expiryDate', { type: 'date'})}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
  <Button
  className="flex-1"
  onClick={handleSave}
  >
  {editingItem ? 'Update Item' : 'Add Item'}
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


