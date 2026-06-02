import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ClipboardList, Search, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Orders() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('order');
  const { data: customerRecords = [] } = useIndustryRecords('customer');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const customers = customerRecords.map(r => ({
    id: r.id,
    name: r.data?.name || 'Unnamed Customer'
  }));

  const orders = dbRecords.map(r => ({
    id: r.id,
    orderId: r.data?.orderId || `ORD-${r.id?.slice(0, 5).toUpperCase()}`,
    customerId: r.data?.customerId || '',
    customerName: r.data?.customerId ? (customers.find(c => c.id === r.data.customerId)?.name || 'Unknown') : (r.data?.customerName || 'Walk-in Customer'),
    date: r.data?.date || new Date().toISOString().split('T')[0],
    total: parseFloat(r.data?.total) || 0,
    status: r.data?.status || 'Pending'
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '', date: '', total: '', status: 'Pending'
  });

  const openEdit = (ord) => {
    setEditingId(ord.id);
    setFormData({ customerId: ord.customerId || '', date: ord.date, total: ord.total, status: ord.status });
    setShowModal(true);
  };

  const handleSave = () => {
    mutateRecord.mutate({
      ...(editingId ? { id: editingId } : {}),
      recordType: 'order',
      payload: {
        customerId: formData.customerId, date: formData.date,
        total: parseFloat(formData.total) || 0, status: formData.status
      },
      status: 'active',
      searchText: `${formData.customerId} ${formData.status}`
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Order updated!' : 'Order added!');
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
        <Button onClick={() => { setEditingId(null); setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], total: '', status: 'Pending' }); setShowModal(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Create Order
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><ClipboardList className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{orders.length}</p><p className="text-xs text-muted-foreground">Total Orders</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-green-600"><TrendingUp className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">${orders.reduce((a, b) => a + b.total, 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
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
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Order' : 'Create Order'}</h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Customer</label>
                 <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                   <option value="">Walk-in Customer</option>
                   {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Date</label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1" /></div>
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Total Amount</label><Input type="number" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} className="mt-1" /></div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                 <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                   <option>Pending</option><option>Completed</option><option>Cancelled</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'order' }); setDeleteTargetId(null); }} title="Delete Order" message="Are you sure you want to delete this order?" />
    </div>
  );
}
