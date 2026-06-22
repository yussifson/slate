import React, { useState, useEffect} from 'react';
import { useTranslation} from "react-i18next";
import { ClipboardList, Search, Plus, Edit, Trash2, TrendingUp, X, RotateCcw, DollarSign } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, OrderGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Orders() {
  const { t} = useTranslation();
  const { user} = useAuth();
  const { notifyTeam} = useNotifications();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dbRecords, setDbRecords] = useState([]);
  const [customerRecords, setCustomerRecords] = useState([]);
  const [productRecords, setProductRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_retail_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));

        const custRes = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ?', [companyId]);
        if(active) setCustomerRecords(custRes.rows._array || Array.from(custRes.rows));

        const prodRes = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ?', [companyId]);
        if(active) setProductRecords(prodRes.rows._array || Array.from(prodRes.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

  const customers = customerRecords.map(r => ({
  id: r.id,
  custId: r.cust_id || `CUST-${r.id?.slice(0, 4)}`,
  name: r.name ||  'Unnamed Customer',
  email: r.email || '',
  phone: r.phone || ''
 }));

  const products = productRecords.map(r => ({
  id: r.id,
  sku: r.sku || '',
  name: r.name || '',
  price: parseFloat(r.price) || 0,
  stock: parseInt(r.stock) || 0
 }));

  const orders = dbRecords.map(r => ({
  id: r.id,
  orderId: r.order_id || `ORD-${r.id?.slice(0, 5).toUpperCase()}`,
  customerId: r.customer || '',
  customerName: r.customer ? (customers.find(c => c.id === r.customer)?.name || 'Unknown') : 'Walk-in Customer',
  date: r.date || new Date().toISOString().split('T')[0],
  total: parseFloat(r.total) || 0,
  status: r.status || 'Pending',
  items: (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) || [],
  createdBy: 'System',
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

  // Return / Refund Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);

  const openReturnModal = (order) => {
    setReturningOrder(order);
    const items = (order.items || []).map(i => ({ ...i, returnQty: i.qty, selected: true }));
    setReturnItems(items);
    setRefundAmount(order.total);
    setReturnReason('');
    setShowReturnModal(true);
  };

  const toggleReturnItem = (idx) => {
    setReturnItems(prev => {
      const updated = prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item);
      const newRefund = updated.filter(i => i.selected).reduce((sum, i) => sum + (i.price * i.returnQty), 0);
      setRefundAmount(parseFloat(newRefund.toFixed(2)));
      return updated;
    });
  };

  const updateReturnQty = (idx, qty) => {
    setReturnItems(prev => {
      const updated = prev.map((item, i) => i === idx ? { ...item, returnQty: Math.max(0, Math.min(qty, item.qty)) } : item);
      const newRefund = updated.filter(i => i.selected).reduce((sum, i) => sum + (i.price * i.returnQty), 0);
      setRefundAmount(parseFloat(newRefund.toFixed(2)));
      return updated;
    });
  };

   const processReturn = async () => {
    if (!returningOrder) return;
    const selectedItems = returnItems.filter(i => i.selected && i.returnQty > 0);
    if (selectedItems.length === 0) { toast.error('Select at least one item to return.'); return; }

    try {
      // Restock inventory for returned items
      for (const item of selectedItems) {
        const prod = productRecords.find(p => p.id === item.productId);
        if (prod) {
          const currentStock = Number(prod.stock || 0);
          await powerSync.execute(`UPDATE univ_retail_products SET stock=? WHERE id=?`, [currentStock + item.returnQty, prod.id]);
        }
      }

      // Update order status to 'Returned'
      await powerSync.execute(`UPDATE univ_retail_orders SET status=? WHERE id=?`, ['Returned', returningOrder.id]);

      // Record in new Returns table (assume it will be created)
      const returnId = `RET-${Date.now().toString().slice(-4)}`;
      await powerSync.execute(`INSERT INTO univ_retail_returns (id, created_at, company_id, return_id, customer, date, amount, reason, status) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'Processed')`, 
        [companyId, returnId, returningOrder.customerId, refundAmount, returnReason || 'Not specified']
      );

      const res = await powerSync.execute('SELECT * FROM univ_retail_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setDbRecords(res.rows._array || Array.from(res.rows));

      toast.success(`Return processed! Refund: $${refundAmount.toFixed(2)}. Items restocked.`);
      notifyTeam({
        companyId: user?.company_id, provider: 'slack',
        message: `🔄 Order ${returningOrder.orderId} returned. Refund: $${refundAmount.toFixed(2)}. Reason: ${returnReason || 'Not specified'}`,
        channel: '#sales'
      }).catch(console.error);
      setShowReturnModal(false); setReturningOrder(null);
    } catch (err) {
      toast.error('Return failed: ' + err.message);
    }
  };

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
  
  try {
    // Auto-create new customer if needed
    if (isNewCustomer && newCustomerData.name) {
      const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
      const newUuid = crypto.randomUUID ? crypto.randomUUID() : 'c-' + Date.now();
      await powerSync.execute(`INSERT INTO univ_retail_customers (id, created_at, company_id, cust_id, name, email, phone, total_spent, orders, segment, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, 1, 'New', 'Active')`, 
        [newUuid, companyId, newCustId, newCustomerData.name, newCustomerData.email, newCustomerData.phone, orderTotal]
      );
      finalCustomerId = newUuid;
    } else if (finalCustomerId) {
      // Update existing customer's metrics
      const existingCust = customerRecords.find(c => c.id === finalCustomerId);
      if (existingCust && !editingId) {
        await powerSync.execute(`UPDATE univ_retail_customers SET total_spent = total_spent + ?, orders = orders + 1 WHERE id = ?`, 
          [orderTotal, finalCustomerId]
        );
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
            const currentStock = Number(prod.stock || 0);
            await powerSync.execute(`UPDATE univ_retail_products SET stock=? WHERE id=?`, 
              [Math.max(0, currentStock - item.qty), prod.id]
            );
          }
        }
      }
    }

    if (editingId) {
      await powerSync.execute(`UPDATE univ_retail_orders SET customer=?, date=?, total=?, status=?, items=? WHERE id=?`, 
        [finalCustomerId, formData.date, orderTotal, formData.status, JSON.stringify(formData.items), editingId]
      );
      toast.success('Order updated!');
    } else {
      const orderId = `ORD-${Date.now().toString().slice(-5).toUpperCase()}`;
      await powerSync.execute(`INSERT INTO univ_retail_orders (id, created_at, company_id, order_id, customer, date, total, status, items) VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`, 
        [companyId, orderId, finalCustomerId, formData.date, orderTotal, formData.status, JSON.stringify(formData.items)]
      );
      toast.success('Order added!');
    }

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

    const res = await powerSync.execute('SELECT * FROM univ_retail_orders WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    setDbRecords(res.rows._array || Array.from(res.rows));
  } catch(err) {
    toast.error("Failed to save order: " + err.message);
  }
};

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_retail_orders WHERE id=?`, [deleteTargetId]);
      toast.success('Order deleted.');
      setDeleteTargetId(null);
      setDbRecords(dbRecords.filter(o => o.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

 const filteredOrders = orders.filter(o =>
 (o.orderId || '').toLowerCase().includes((search || '').toLowerCase()) || 
 (o.customerName || '').toLowerCase().includes((search || '').toLowerCase())
 );

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Orders Management</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Track and manage customer purchases.</p>
 </div>
 <Button onClick={() => { setEditingId(null); setIsNewCustomer(false); setNewCustomerData({name: '', email: '', phone: ''}); setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], total: '', status: 'Pending', items: []}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> Create Order
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
  <RetailStatCard label="Total Orders" value={orders.length} icon={ClipboardList} />
  <RetailStatCard label="Total Revenue" value={`$${orders.reduce((a, b) => a + b.total, 0).toFixed(2)}`} icon={TrendingUp} />
  <RetailStatCard label="Returns" value={orders.filter(o => o.status === 'Returned').length} icon={RotateCcw} />
  <RetailStatCard label="Refunded" value={`$${orders.filter(o => o.status === 'Returned').reduce((a, o) => a + (parseFloat(o.data?.refundAmount) || o.total || 0), 0).toFixed(2)}`} icon={DollarSign} />
  </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filteredOrders.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No orders found.</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filteredOrders.map(o => (
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
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Order ID</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Customer</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Date</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Total</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Status</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Added By</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredOrders.map(o => (
 <tr key={o.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{o.orderId}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{o.customerName}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{o.date}</td>
 <td className="px-6 py-4 text-right font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">${o.total.toFixed(2)}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${o.status === 'Completed' || o.status === 'Delivered' ? 'bg-slate-100 text-primary/90' : o.status === 'Returned' ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{o.createdBy}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(o.createdAt).toLocaleDateString()}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="w-4 h-4" /></Button>
 {(o.status === 'Completed' || o.status === 'Delivered') && <Button variant="ghost" size="icon" className="text-orange-600" onClick={() => openReturnModal(o)} title="Process Return"><RotateCcw className="w-4 h-4" /></Button>}
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
 <div className="bg-card rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editingId ? 'Edit Order' : 'Create Order'}</h2>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Customer</label>
 <select 
 value={isNewCustomer ? "NEW_CUSTOMER" : formData.customerId} 
 onChange={e => {
 if (e.target.value === 'NEW_CUSTOMER') setIsNewCustomer(true);
 else { setIsNewCustomer(false); setFormData({...formData, customerId: e.target.value});}
}} 
 className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm mt-1"
 >
 <option value="">Walk-in Customer</option>
 <option value="NEW_CUSTOMER">+ New Customer</option>
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 
 {isNewCustomer && (
 <div className="p-3 bg-muted rounded-lg space-y-3">
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">New Customer Name</label><Input value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" /></div>
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Email</label><Input value={newCustomerData.email} onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" /></div>
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Phone</label><Input value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} className="mt-1 bg-white dark:bg-slate-900/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" /></div>
 </div>
 )}

 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Date</label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</label>
 <select 
 value={formData.status} 
 onChange={e => setFormData({...formData, status: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm"
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

 <div className="p-4 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl bg-slate-50/50 dark:bg-transparent space-y-4">
 <h4 className="font-semibold text-sm">Order Items</h4>
 <div className="flex gap-2 items-end">
 <div className="flex-1">
 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block tracking-[0.04em]">Product</label>
 <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option value="">Select product...</option>
 {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>)}
 </select>
 </div>
 <div className="w-24">
 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block tracking-[0.04em]">Qty</label>
 <Input type="number" min="1" value={productQty} onChange={e => setProductQty(e.target.value)} className="bg-white dark:bg-slate-900/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 <Button type="button" onClick={handleAddItem} variant="secondary">Add</Button>
 </div>

 {formData.items.length > 0 && (
 <div className="mt-4 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl bg-white dark:bg-slate-900/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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

 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Total Amount ($)</label><Input type="number" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value})} className="mt-1" /></div>

 </div>
 <div className="flex gap-3 pt-4 border-t">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
 <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Order" message="Are you sure you want to delete this order?" />
 
  {/* Return / Refund Modal */}
  {showReturnModal && returningOrder && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-primary/40 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2"><RotateCcw className="w-5 h-5 text-orange-600"/>Process Return</h2>
          <button onClick={() => setShowReturnModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
        </div>

        <div className="bg-muted rounded-xl p-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order</span><span className="font-semibold">{returningOrder.orderId}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{returningOrder.customerName}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">Original Total</span><span className="font-semibold">${returningOrder.total.toFixed(2)}</span></div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-2 block">Select Items to Return</label>
          <div className="space-y-2">
            {returnItems.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border transition-all ${item.selected ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/10' : 'border-primary/20 bg-card'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={item.selected} onChange={() => toggleReturnItem(idx)} className="rounded" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.price?.toFixed(2)} each · Ordered: {item.qty}</p>
                  </div>
                  {item.selected && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Return Qty:</label>
                      <Input type="number" min={1} max={item.qty} value={item.returnQty} onChange={e => updateReturnQty(idx, parseInt(e.target.value) || 0)} className="w-16 h-8 text-center text-sm" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em] mb-1 block">Return Reason</label>
          <select value={returnReason} onChange={e => setReturnReason(e.target.value)}
            className="w-full rounded-lg border-[0.5px] border-input bg-background px-3 py-2 text-sm">
            <option value="">Select reason...</option>
            <option>Defective / Damaged</option>
            <option>Wrong Item Sent</option>
            <option>Customer Changed Mind</option>
            <option>Size / Fit Issue</option>
            <option>Better Price Found</option>
            <option>Other</option>
          </select>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">Refund Amount</p>
          <p className="text-3xl font-black text-red-700 dark:text-red-400 tracking-[-0.02em]">${refundAmount.toFixed(2)}</p>
          <p className="text-xs text-red-500 mt-1">Items will be automatically restocked into inventory.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowReturnModal(false)}>Cancel</Button>
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={processReturn} disabled={returnItems.filter(i => i.selected && i.returnQty > 0).length === 0}>
            <RotateCcw className="w-4 h-4 mr-2"/> Process Return & Refund
          </Button>
        </div>
      </div>
    </div>
  )}
 </div>
 );
}
