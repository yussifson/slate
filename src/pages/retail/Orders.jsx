import React, { useState} from 'react';
import { useTranslation} from "react-i18next";
import { ClipboardList, Search, Plus, Edit, Trash2, TrendingUp, X} from 'lucide-react';
import { ViewModeToggle, RetailStatCard, OrderGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';

export default function Orders() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const { notifyTeam} = useNotifications();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('order');
 const { data: customerRecords = []} = useIndustryRecords('customer');
 const { data: productRecords = []} = useIndustryRecords('product');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const customers = customerRecords.map(r => {
 const data = r.data || {};
 return {
 id: r.id,
 custId: data.custId || `CUST-${r.id?.slice(0, 4)}`,
 name: data.name || data.customerName || 'Unnamed Customer',
 email: data.email || '',
 phone: data.phone || ''
};
});

 const products = productRecords.map(r => ({
 id: r.id,
 sku: r.data?.sku || '',
 name: r.data?.name || '',
 price: parseFloat(r.data?.price) || 0,
 stock: parseInt(r.data?.quantity || r.data?.stock) || 0
}));

 const orders = dbRecords.map(r => ({
 id: r.id,
 orderId: r.data?.orderId || `ORD-${r.id?.slice(0, 5).toUpperCase()}`,
 customerId: r.data?.customerId || '',
 customerName: r.data?.customerId ? (customers.find(c => c.id === r.data.customerId)?.name || 'Unknown') : (r.data?.customerName || 'Walk-in Customer'),
 date: r.data?.date || new Date().toISOString().split('T')[0],
 total: parseFloat(r.data?.total) || 0,
 status: r.data?.status || 'Pending',
 items: r.data?.items || [],
 createdBy: r.created_by || 'System',
 createdAt: r.created_at || new Date().toISOString()
}));

 const [search, setSearch] = useState('');
 const [viewMode, setViewMode] = useState('list');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingId, setEditingId] = useState(null);

 const [formData, setFormData] = useState({
 customerId: '', date: '', total: '', status: 'Pending', items: []
});
 
 const [isNewCustomer, setIsNewCustomer] = useState(false);
 const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: ''});
 
 const [selectedProduct, setSelectedProduct] = useState('');
 const [productQty, setProductQty] = useState(1);

 const openEdit = (ord) => {
 setEditingId(ord.id);
 setFormData({ 
 customerId: ord.customerId || '', 
 date: ord.date, 
 total: ord.total, 
 status: ord.status,
 items: ord.items || []
});
 setIsNewCustomer(false);
 setShowModal(true);
};

 const handleAddItem = () => {
 if (!selectedProduct) return;
 const prod = products.find(p => p.id === selectedProduct);
 if (!prod) return;
 
 setFormData(prev => {
 const items = [...prev.items, { productId: prod.id, name: prod.name, price: prod.price, qty: Number(productQty)}];
 const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
 return { ...prev, items, total};
});
 setSelectedProduct('');
 setProductQty(1);
};

 const handleRemoveItem = (index) => {
 setFormData(prev => {
 const items = [...prev.items];
 items.splice(index, 1);
 const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
 return { ...prev, items, total};
});
};

 const handleSave = async () => {
 let finalCustomerId = formData.customerId;
 const orderTotal = parseFloat(formData.total) || 0;
 
 // Auto-create new customer if needed
 if (isNewCustomer && newCustomerData.name) {
 try {
 const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
 const newCustRecord = await mutateRecord.mutateAsync({
 recordType: 'customer',
 payload: { 
 ...newCustomerData, 
 custId: newCustId,
 email: newCustomerData.email || '',
 totalSpent: orderTotal,
 orders: 1
},
 status: 'active',
 searchText: newCustomerData.name.toLowerCase()
});
 finalCustomerId = newCustRecord.id;
} catch(err) {
 toast.error("Failed to create new customer");
 return;
}
} else if (finalCustomerId) {
 // Update existing customer's metrics
 const existingCust = customerRecords.find(c => c.id === finalCustomerId);
 if (existingCust && !editingId) {
 // Only increment if this is a brand new order, not just editing an order
 const currentData = existingCust.data || {};
 await mutateRecord.mutateAsync({
 id: existingCust.id,
 recordType: 'customer',
 payload: {
 ...currentData,
 totalSpent: (parseFloat(currentData.totalSpent) || 0) + orderTotal,
 orders: (parseInt(currentData.orders) || 0) + 1
},
 status: existingCust.status,
 searchText: existingCust.search_text
});
}
}

 // Check inventory deduction for 'Delivered' or 'Completed'
 if (formData.status === 'Completed' || formData.status === 'Delivered') {
 const originalOrder = orders.find(o => o.id === editingId);
 const wasAlreadyDeducted = originalOrder && (originalOrder.status === 'Completed' || originalOrder.status === 'Delivered');
 
 if (!wasAlreadyDeducted) {
 // Deduct inventory
 for (const item of formData.items) {
 const prod = productRecords.find(p => p.id === item.productId);
 if (prod) {
 const currentStock = Number(prod.data?.quantity || prod.data?.stock || 0);
 await mutateRecord.mutateAsync({
 id: prod.id,
 recordType: 'product',
 payload: { ...prod.data, quantity: Math.max(0, currentStock - item.qty), stock: Math.max(0, currentStock - item.qty)},
 status: prod.status,
 searchText: prod.search_text
});
}
}
}
 } else if (formData.status === 'Returned') {
   const originalOrder = orders.find(o => o.id === editingId);
   const wasAlreadyReturned = originalOrder && originalOrder.status === 'Returned';
   
   if (!wasAlreadyReturned) {
     // Restock inventory for returned items
     for (const item of formData.items) {
       const prod = productRecords.find(p => p.id === item.productId);
       if (prod) {
         const currentStock = Number(prod.data?.quantity || prod.data?.stock || 0);
         await mutateRecord.mutateAsync({
           id: prod.id,
           recordType: 'product',
           payload: { ...prod.data, quantity: currentStock + item.qty, stock: currentStock + item.qty},
           status: prod.status,
           searchText: prod.search_text
         });
       }
     }
     toast.success("Items have been restocked into inventory.");
   }
 }

 mutateRecord.mutate({
 ...(editingId ? { id: editingId} : {}),
 recordType: 'order',
 payload: {
 customerId: finalCustomerId,
 customerName: isNewCustomer ? newCustomerData.name : undefined,
 date: formData.date,
 total: orderTotal,
 status: formData.status,
 items: formData.items
},
 status: 'active',
 searchText: `${finalCustomerId} ${formData.status}`
}, {
 onSuccess: () => {
 toast.success(editingId ? 'Order updated!' : 'Order added!');
 
 // Notify team via Slack if order is high value or completed/delivered
 if (formData.status === 'Completed' || formData.status === 'Delivered') {
 notifyTeam({
 companyId: user?.company_id,
 provider: 'slack',
 message: `📦 Retail Order ${editingId ? 'updated' : 'placed'} and marked as ${formData.status}. Total: $${parseFloat(formData.total).toFixed(2)}`,
 channel: '#sales'
}).catch(console.error);
} else if (!editingId && parseFloat(formData.total) > 100) {
 notifyTeam({
 companyId: user?.company_id,
 provider: 'slack',
 message: `🎉 New high-value retail order placed! Total: $${parseFloat(formData.total).toFixed(2)}`,
 channel: '#sales'
}).catch(console.error);
}

 setShowModal(false);
 setEditingId(null);
}
});
};

 const filtered = orders.filter(o => 
 o.orderId.toLowerCase().includes(search.toLowerCase()) || 
 o.customerName.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">Orders Management</h1>
 <p className="text-sm text-muted-foreground mt-0.5">Track and manage customer purchases.</p>
 </div>
 <Button onClick={() => { setEditingId(null); setIsNewCustomer(false); setNewCustomerData({name: '', email: '', phone: ''}); setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], total: '', status: 'Pending', items: []}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> Create Order
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label="Total Orders" value={orders.length} icon={ClipboardList} />
 <RetailStatCard label="Total Revenue" value={`$${orders.reduce((a, b) => a + b.total, 0).toFixed(2)}`} icon={TrendingUp} />
 </div>

 <div className="bg-card rounded-xl border border-primary/40 overflow-hidden">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No orders found.</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filtered.map(o => (
 <OrderGridCard
 key={o.id}
 order={o}
 onEdit={() => openEdit(o)}
 onDelete={() => setDeleteTargetId(o.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Order ID</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Customer</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Added By</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(o => (
 <tr key={o.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-bold text-card-foreground">{o.orderId}</td>
 <td className="px-6 py-4 text-muted-foreground">{o.customerName}</td>
 <td className="px-6 py-4 text-muted-foreground">{o.date}</td>
 <td className="px-6 py-4 text-right font-bold text-card-foreground">${o.total.toFixed(2)}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${o.status === 'Completed' || o.status === 'Delivered' ? 'bg-slate-100 text-primary/90' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-card-foreground">{o.createdBy}</p>
 <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="w-4 h-4" /></Button>
 <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTargetId(o.id)}><Trash2 className="w-4 h-4" /></Button>
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
 <div className="bg-card rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
 <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Order' : 'Create Order'}</h2>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Customer</label>
 <select 
 value={isNewCustomer ? "NEW_CUSTOMER" : formData.customerId} 
 onChange={e => {
 if (e.target.value === 'NEW_CUSTOMER') setIsNewCustomer(true);
 else { setIsNewCustomer(false); setFormData({...formData, customerId: e.target.value});}
}} 
 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
 >
 <option value="">Walk-in Customer</option>
 <option value="NEW_CUSTOMER">+ New Customer</option>
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 
 {isNewCustomer && (
 <div className="p-3 bg-muted rounded-md space-y-3">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">New Customer Name</label><Input value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">Email</label><Input value={newCustomerData.email} onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">Phone</label><Input value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40" /></div>
 </div>
 )}

 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">Date</label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</label>
 <select 
 value={formData.status} 
 onChange={e => setFormData({...formData, status: e.target.value})} 
 className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 >
 <option>Pending</option>
 <option>Processing</option>
 <option>Completed</option>
 <option>Delivered</option>
 <option>Returned</option>
 <option>Cancelled</option>
 </select>
 </div>
 </div>

 <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-transparent space-y-4">
 <h4 className="font-semibold text-sm">Order Items</h4>
 <div className="flex gap-2 items-end">
 <div className="flex-1">
 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Product</label>
 <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option value="">Select product...</option>
 {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>)}
 </select>
 </div>
 <div className="w-24">
 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Qty</label>
 <Input type="number" min="1" value={productQty} onChange={e => setProductQty(e.target.value)} className="bg-white dark:bg-slate-900/40" />
 </div>
 <Button type="button" onClick={handleAddItem} variant="secondary">Add</Button>
 </div>

 {formData.items.length > 0 && (
 <div className="mt-4 border rounded-lg bg-white dark:bg-slate-900/40 overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
 <tr>
 <th className="px-3 py-2 text-left">Item</th>
 <th className="px-3 py-2 text-right">Price</th>
 <th className="px-3 py-2 text-right">Qty</th>
 <th className="px-3 py-2 text-right">Total</th>
 <th className="px-3 py-2"></th>
 </tr>
 </thead>
 <tbody className="divide-y">
 {formData.items.map((item, i) => (
 <tr key={i}>
 <td className="px-3 py-2">{item.name}</td>
 <td className="px-3 py-2 text-right">${item.price?.toFixed(2)}</td>
 <td className="px-3 py-2 text-right">{item.qty}</td>
 <td className="px-3 py-2 text-right">${(item.price * item.qty).toFixed(2)}</td>
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

 <div><label className="text-xs font-bold text-muted-foreground uppercase">Total Amount ($)</label><Input type="number" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value})} className="mt-1" /></div>

 </div>
 <div className="flex gap-3 pt-4 border-t">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
 <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'order'}); setDeleteTargetId(null);}} title="Delete Order" message="Are you sure you want to delete this order?" />
 </div>
 );
}
