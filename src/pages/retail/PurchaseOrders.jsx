import React, { useState} from 'react';
import { useTranslation} from "react-i18next";
import { Search, Plus, Eye, Trash2, ShieldAlert, ShoppingCart, Check, X, MoreVertical, Edit2} from 'lucide-react';
import { useAuth} from '@/lib/AuthContext';
import { isRetailAdmin, isRetailInventoryManager} from '@/lib/constants';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { toast} from "sonner";
import { generateText } from '@/lib/cloudflareAI';
import { format} from "date-fns";
import ConfirmationModal from '@/components/ConfirmationModal';
import { Link} from 'react-router-dom';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function PurchaseOrders() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const canAccess = isRetailAdmin(user) || isRetailInventoryManager(user);
 
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isPOLoading, setIsPOLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsPOLoading(true);
      try {
        const poRes = await powerSync.execute('SELECT * FROM univ_retail_purchase_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setPurchaseOrders(poRes.rows._array || Array.from(poRes.rows));

        const suppRes = await powerSync.execute('SELECT * FROM univ_retail_suppliers WHERE company_id = ?', [companyId]);
        if(active) setSuppliers(suppRes.rows._array || Array.from(suppRes.rows));

        const prodRes = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? AND status = ?', [companyId, 'Active']);
        if(active) setProducts(prodRes.rows._array || Array.from(prodRes.rows));
      } catch(e){}
      setIsPOLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

 const [searchTerm, setSearchTerm] = useState("");
 const [isSheetOpen, setIsSheetOpen] = useState(false);
 const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
 const [selectedPO, setSelectedPO] = useState(null);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingPOId, setEditingPOId] = useState(null);

 // New PO State
 const [newPO, setNewPO] = useState({
 supplierId: '',
 items: [],
 status: 'draft', // draft, sent, received
 notes: ''
});

 const [selectedProduct, setSelectedProduct] = useState('');
 const [orderQuantity, setOrderQuantity] = useState(1);
 const [orderCost, setOrderCost] = useState(0);

  const filteredPOs = purchaseOrders.filter(po => 
    JSON.stringify(po).toLowerCase().includes((searchTerm || '').toLowerCase())
  );

 const handleAddItem = () => {
 if (!selectedProduct || orderQuantity <= 0) return;
 const prod = products.find(p => p.id === selectedProduct);
 if (!prod) return;

 setNewPO(prev => ({
 ...prev,
 items: [
 ...prev.items,
 {
 productId: prod.id,
 name: prod.name,
 sku: prod.sku,
 quantity: Number(orderQuantity),
 unitCost: Number(orderCost)
}
 ]
}));
 setSelectedProduct('');
 setOrderQuantity(1);
 setOrderCost(0);
};

 const handleRemoveItem = (index) => {
 setNewPO(prev => {
 const items = [...prev.items];
 items.splice(index, 1);
 return { ...prev, items};
});
};

 const handleEdit = (po) => {
 setEditingPOId(po.id);
 setNewPO({
 supplierId: po.supplier || '',
 items: (typeof po.items === 'string' ? JSON.parse(po.items) : po.items) || [],
 status: po.status || 'draft',
 notes: po.notes || ''
});
 setIsNewDialogOpen(true);
};

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_retail_purchase_orders WHERE id=?`, [deleteTargetId]);
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== deleteTargetId));
      toast.success(t("po_deleted", "Purchase Order deleted"));
      setDeleteTargetId(null);
    } catch (error) {
      toast.error("Failed to delete purchase order");
    }
  };

 
  const handleAIPODrafter = async () => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const lowStockProducts = products.filter(p => Number(p.quantity) < 20).map(p => p.name).join(', ');
      const prompt = `You are a Retail Inventory AI. We have low stock on: ${lowStockProducts || 'None'}. Write a short 2-sentence rationale for an emergency purchase order to resupply these items quickly.`;
      const response = await generateText(prompt);
      setAiInsight(response);
    } catch (e) {
      toast.error('AI Drafter failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePO = async () => {
    if (!newPO.supplierId) {
      toast.error(t("select_supplier", "Please select a supplier."));
      return;
    }
    if (newPO.items.length === 0) {
      toast.error(t("add_items", "Please add at least one item."));
      return;
    }

    const supplier = suppliers.find(s => s.id === newPO.supplierId);
    const total = newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const poNumber = editingPOId ? purchaseOrders.find(po => po.id === editingPOId)?.po_number : "PO-" + Math.floor(Math.random() * 1000000);

    try {
      if (editingPOId) {
        await powerSync.execute(`UPDATE univ_retail_purchase_orders SET supplier=?, total=?, status=?, notes=?, items=? WHERE id=?`, 
          [newPO.supplierId, total, newPO.status, newPO.notes, JSON.stringify(newPO.items), editingPOId]
        );
      } else {
        await powerSync.execute(`INSERT INTO univ_retail_purchase_orders (id, created_at, company_id, po_number, supplier, date, total, status, items, notes) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`, 
          [crypto.randomUUID(), companyId, poNumber, newPO.supplierId, total, newPO.status, JSON.stringify(newPO.items), newPO.notes]
        );
      }
      
      const res = await powerSync.execute('SELECT * FROM univ_retail_purchase_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setPurchaseOrders(res.rows._array || Array.from(res.rows));

      toast.success(editingPOId ? t("po_updated", "Purchase Order updated") : t("po_created", "Purchase Order created successfully"));
      setIsNewDialogOpen(false);
      setNewPO({ supplierId: '', items: [], status: 'draft', notes: ''});
      setEditingPOId(null);
    } catch (error) {
      toast.error(t("po_create_error", "Error creating PO: " + error.message));
    }
  };

  const handleReceiveOrder = async (po) => {
    if (po.status === 'received') return;

    try {
      // 1. Update PO status
      await powerSync.execute(`UPDATE univ_retail_purchase_orders SET status='received' WHERE id=?`, [po.id]);

      // 2. Increment Product Stock
      const items = (typeof po.items === 'string' ? JSON.parse(po.items) : po.items) || [];
      for (const item of items) {
        const productData = products.find(p => p.id === item.productId);
        if (productData) {
          const currentStock = Number(productData.stock || 0);
          const newStock = currentStock + Number(item.quantity);
          await powerSync.execute(`UPDATE univ_retail_products SET stock=? WHERE id=?`, [newStock, productData.id]);
        }
      }

      const resPO = await powerSync.execute('SELECT * FROM univ_retail_purchase_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setPurchaseOrders(resPO.rows._array || Array.from(resPO.rows));
      
      const resProd = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? AND status = ?', [companyId, 'Active']);
      setProducts(resProd.rows._array || Array.from(resProd.rows));

      toast.success(t("po_received", "PO marked as received and inventory updated!"));
      setSelectedPO(null);
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Failed to receive order");
    }
  };

 const openSheet = (po) => {
 setSelectedPO(po);
 setIsSheetOpen(true);
};

 const getStatusBadge = (status) => {
 switch (status) {
 case 'received': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-primary/90 tracking-[0.04em]">Received</span>;
 case 'sent': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 tracking-[0.04em]">Sent</span>;
 default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:text-foreground dark:text-foreground tracking-[0.04em]">Draft</span>;
}
};

  if (isPOLoading) {
  return (
  <div className="flex-1 p-6 flex items-center justify-center">
  <OrbitLoader size="md" />
  </div>
  );
 }

 if (!canAccess) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
 <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
 <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
 </div>
 <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-[-0.02em]">Access Restricted</h2>
 <p className="text-[#71717a] dark:text-gray-400 max-w-md mx-auto mb-8">
 Your current role does not grant you permission to view or manage Purchase Orders.
 </p>
 <Button asChild variant="outline">
 <Link to="/retail-dashboard">Return to Dashboard</Link>
 </Button>
 </div>
 );
}

 return (
 <div className="flex-1 p-3 sm:p-6 pb-[max(96px,env(safe-area-inset-bottom))] overflow-y-auto bg-background overflow-x-hidden">
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">{t("purchase_orders", "Purchase Orders")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{t("po_desc", "Manage supplier orders and restock inventory.")}</p>
 </div>
 <Button onClick={() => setIsNewDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white ">
 <Plus className="w-4 h-4 mr-2" /> {t("new_po", "New PO")}
 </Button>
 </div>

 {/* Search */}
 <div className="flex items-center gap-2">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input 
 placeholder={t("search_pos", "Search by PO number or supplier...")} 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 bg-background border-primary/40 "
 />
 </div>
 </div>

 {/* Table */}
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-muted/50 text-[#71717a] dark:text-gray-400 text-xs uppercase font-semibold border-b border-primary/40 tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4">{t("po_number", "PO Number")}</th>
 <th className="px-6 py-4">{t("supplier", "Supplier")}</th>
 <th className="px-6 py-4">{t("date", "Date")}</th>
 <th className="px-6 py-4">{t("total", "Total")}</th>
 <th className="px-6 py-4">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredPOs.map((po) => (
 <tr key={po.id} className="hover:bg-muted/30 transition-colors dark:hover:bg-muted/10">
 <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 dark:text-slate-100">{po.po_number}</td>
 <td className="px-6 py-4 text-slate-700 dark:text-foreground dark:text-foreground">{suppliers.find(s => s.id === po.supplier)?.name || 'Unknown'}</td>
 <td className="px-6 py-4 text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400">
 {po.date ? format(new Date(po.date), 'MMM d, yyyy') : '-'}
 </td>
 <td className="px-6 py-4 font-medium">${Number(po.total || 0).toFixed(2)}</td>
 <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">Open menu</span>
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => openSheet(po)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleEdit(po)}>
 <Edit2 className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(po.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 ))}
 {filteredPOs.length === 0 && (
 <tr>
 <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400 bg-slate-50/30">
 <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-slate-300" />
 <p>{t("no_pos", "No purchase orders found.")}</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>

 {/* Details Sheet */}
 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
 <SheetContent className="sm:max-w-xl overflow-y-auto w-full">
 <SheetHeader className="pb-6 border-b">
 <div className="flex items-center justify-between">
 <div>
 <SheetTitle className="text-2xl font-semibold tracking-[-0.02em]">{selectedPO?.po_number}</SheetTitle>
 <SheetDescription>{t("supplier", "Supplier")}: {suppliers.find(s => s.id === selectedPO?.supplier)?.name}</SheetDescription>
 </div>
 <div className="flex items-center gap-2">
 {getStatusBadge(selectedPO?.status)}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => {
 setIsSheetOpen(false);
 handleEdit(selectedPO);
}}>
 <Edit2 className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 setIsSheetOpen(false);
 setDeleteTargetId(selectedPO.id);
}} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </SheetHeader>
 
 <div className="py-6 space-y-6">
 <div>
 <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 dark:text-slate-100 mb-3 uppercase tracking-wider tracking-[0.04em]">{t("order_items", "Order Items")}</h3>
 <div className="border-[0.5px] border-black/9 dark:border-white/8 rounded-xl overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 dark:bg-secondary/50 border-b">
 <tr>
 <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400">Item</th>
 <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400">Qty</th>
 <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400">Cost</th>
 <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400">Subtotal</th>
 </tr>
 </thead>
 <tbody className="divide-y">
 {((typeof selectedPO?.items === 'string' ? JSON.parse(selectedPO.items) : selectedPO?.items) || []).map((item, i) => (
 <tr key={i}>
 <td className="px-4 py-3">
 <div className="font-medium">{item.name}</div>
 <div className="text-xs text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{item.sku}</div>
 </td>
 <td className="px-4 py-3 text-right">{item.quantity}</td>
 <td className="px-4 py-3 text-right">${Number(item.unitCost).toFixed(2)}</td>
 <td className="px-4 py-3 text-right font-medium">${(item.quantity * item.unitCost).toFixed(2)}</td>
 </tr>
 ))}
 </tbody>
 <tfoot className="bg-slate-50 dark:bg-secondary/50 border-t font-semibold">
 <tr>
 <td colSpan="3" className="px-4 py-3 text-right">Total</td>
 <td className="px-4 py-3 text-right">${Number(selectedPO?.total || 0).toFixed(2)}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 </div>

 {selectedPO?.notes && (
 <div>
 <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 dark:text-slate-100 mb-2 uppercase tracking-wider tracking-[0.04em]">{t("notes", "Notes")}</h3>
 <p className="text-sm text-slate-600 bg-slate-50 dark:bg-secondary/50 p-3 rounded-xl border">{selectedPO.notes}</p>
 </div>
 )}
 
 {selectedPO?.status !== 'received' && (
 <div className="pt-6 border-t flex justify-end">
 <Button 
 onClick={() => handleReceiveOrder(selectedPO)}
 className="bg-primary hover:bg-primary/90 text-white"
 >
 <Check className="w-4 h-4 mr-2" /> {t("mark_received", "Mark as Received")}
 </Button>
 </div>
 )}
 </div>
 </SheetContent>
 </Sheet>

 {/* New PO Dialog */}
 <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
 setIsNewDialogOpen(open);
 if (!open) {
 setEditingPOId(null);
 setNewPO({ supplierId: '', items: [], status: 'draft', notes: ''});
}
}}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>{editingPOId ? t("edit_po", "Edit Purchase Order") : t("create_po", "Create Purchase Order")}</DialogTitle>
 <DialogDescription>{t("create_po_desc", "Order new stock from suppliers.")}</DialogDescription>
 </DialogHeader>
 
 <div className="space-y-6 py-4">
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium mb-1.5 block">{t("supplier", "Supplier")}</label>
 <Select value={newPO.supplierId} onValueChange={(v) => setNewPO({...newPO, supplierId: v})}>
 <SelectTrigger className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue placeholder="Select supplier..." />
 </SelectTrigger>
 <SelectContent>
 {suppliers.map(s => (
 <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 
 <div>
 <label className="text-sm font-medium mb-1.5 block">{t("status", "Status")}</label>
 <Select value={newPO.status} onValueChange={(v) => setNewPO({...newPO, status: v})}>
 <SelectTrigger className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="sent">Sent</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="p-4 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl bg-slate-50/50 dark:bg-transparent dark:bg-transparent space-y-4">
 <h4 className="font-semibold text-sm">{t("add_items", "Add Items")}</h4>
 <div className="flex gap-2 items-end">
 <div className="flex-1">
 <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400 mb-1 block tracking-[0.04em]">Product</label>
 <Select value={selectedProduct} onValueChange={setSelectedProduct}>
 <SelectTrigger className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue placeholder="Select product..." />
 </SelectTrigger>
 <SelectContent>
 {products.map(p => (
 <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="w-24">
 <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400 mb-1 block tracking-[0.04em]">Qty</label>
 <Input type="number" min="1" value={orderQuantity} onChange={e => setOrderQuantity(e.target.value)} className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 <div className="w-32">
 <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground dark:text-[#71717a] dark:text-gray-400 mb-1 block tracking-[0.04em]">Unit Cost ($)</label>
 <Input type="number" min="0" step="0.01" value={orderCost} onChange={e => setOrderCost(e.target.value)} className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 <Button type="button" onClick={handleAddItem} variant="secondary">Add</Button>
 </div>

 {newPO.items.length > 0 && (
 <div className="mt-4 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl bg-white dark:bg-card/40 dark:bg-card/40 overflow-x-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 dark:bg-secondary/50 border-b">
 <tr>
 <th className="px-3 py-2 text-left">Item</th>
 <th className="px-3 py-2 text-right">Qty</th>
 <th className="px-3 py-2 text-right">Cost</th>
 <th className="px-3 py-2 text-right">Total</th>
 <th className="px-3 py-2"></th>
 </tr>
 </thead>
 <tbody className="divide-y">
 {newPO.items.map((item, i) => (
 <tr key={i}>
 <td className="px-3 py-2">{item.name}</td>
 <td className="px-3 py-2 text-right">{item.quantity}</td>
 <td className="px-3 py-2 text-right">${item.unitCost.toFixed(2)}</td>
 <td className="px-3 py-2 text-right">${(item.quantity * item.unitCost).toFixed(2)}</td>
 <td className="px-3 py-2 text-right">
 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(i)} className="h-6 w-6 text-red-500 hover:text-red-700">
 <X className="w-3 h-3" />
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 <div>
 <label className="text-sm font-medium mb-1.5 block">{t("notes", "Notes")}</label>
 <Input 
 value={newPO.notes} 
 onChange={(e) => setNewPO({...newPO, notes: e.target.value})}
 placeholder="Optional notes for this order..."
 className="bg-white dark:bg-card/40 dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>{t("cancel", "Cancel")}</Button>
 <Button onClick={handleCreatePO} className="bg-orange-600 hover:bg-orange-700 text-white">{editingPOId ? t("update", "Update PO") : t("create", "Create PO")}</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Delete Purchase Order"
 message="Are you sure you want to delete this purchase order? This action cannot be undone."
 />
 </div>
 );
}


