import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { Package, Plus, Search, Trash2, Edit2, Loader2, XCircle, AlertTriangle, DollarSign, Archive, BarChart2, Filter, QrCode} from 'lucide-react';
import { toast} from 'react-hot-toast';

const EMPTY_FORM = { item_name: '', sku: '', category: '', quantity: 0, unit_price: 0, reorder_level: 10, supplier: '', location: ''};

export default function UnivInventory() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [inventory, setInventory] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [filterStatus, setFilterStatus] = useState('All');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [qrItem, setQrItem] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);

 useEffect(() => {
 if (companyId) {
 fetchItems();
 const ch = supabase.channel('inv_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_inventory', filter: `company_id=eq.${companyId}`}, fetchItems).subscribe();
 return () => supabase.removeChannel(ch);
}
}, [companyId]);

 const fetchItems = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_inventory WHERE company_id = ? ORDER BY item_name ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setInventory(data || []);
} catch (e) { console.error(e);} finally { setLoading(false);}
};

 const calcStatus = (qty, reorder) => qty === 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock';

 const save = async (e) => {
 e.preventDefault();
 const payload = { 
 ...form, 
 quantity: Number(form.quantity) || 0,
 unit_price: Number(form.unit_price) || 0,
 reorder_level: Number(form.reorder_level) || 0,
 status: calcStatus(Number(form.quantity), Number(form.reorder_level)) 
};
 try {
 if (editingId) {
 await (async () => { const _p = { ...payload}; delete _p.status; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_inventory SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Item updated!');
} else {
 await (async () => {
 const _p = { ...payload, id: crypto.randomUUID(), company_id: companyId, sku: form.sku || `SKU-${Math.floor(Math.random()*10000)}`};
 delete _p.status;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO univ_inventory (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v); return { error: null};})();
 const error = null;
 if (error) throw error;
 toast.success('Item added!');
}
 closeModal(); fetchItems();
} catch (err) { console.error(err); toast.error(err.message || 'Failed to save');}
};

 const remove = async (id) => {
 await powerSync.execute(`DELETE FROM univ_inventory WHERE id = ?`, [id]);
 const error = null;
 if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchItems();}
};

 const openModal = (r = null) => { setForm(r ? { ...r} : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true);};
 const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM);};

 const filtered = inventory.filter(i => {
 const m = `${i.item_name} ${i.sku} ${i.category} ${i.supplier}`.toLowerCase().includes(search.toLowerCase());
 return m && (filterStatus === 'All' || i.status === filterStatus);
});

 const totalValue = inventory.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
 const STATUS_STYLE = { 'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200', 'Out of Stock': 'bg-red-50 text-red-700 border-red-200'};

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
 <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Package className="w-7 h-7 text-primary" />Inventory</h1><p className="text-muted-foreground text-sm font-medium mt-1">Track stock, manage products and receive alerts.</p></div>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 "><Plus className="w-4 h-4" />Add Item</button>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
 {[
 { label: 'Total SKUs', value: inventory.length, iconBg: 'bg-primary/10 text-primary', icon: <Archive className="w-5 h-5" />},
 { label: 'Inventory Value', value: `$${totalValue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, iconBg: 'bg-emerald-100 text-emerald-600', icon: <DollarSign className="w-5 h-5" />},
 { label: 'Low Stock', value: inventory.filter(i=>i.status==='Low Stock').length, iconBg: 'bg-amber-100 text-amber-600', icon: <AlertTriangle className="w-5 h-5" />},
 { label: 'Out of Stock', value: inventory.filter(i=>i.status==='Out of Stock').length, iconBg: 'bg-red-100 text-red-600', icon: <BarChart2 className="w-5 h-5" />},
 ].map((k, i) => (
 <div key={i} className="bg-card border border-primary/40 p-4 rounded-2xl flex items-center gap-4">
 <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.iconBg}`}>{k.icon}</div>
 <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-xl font-black text-foreground">{k.value}</p></div>
 </div>
 ))}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 shrink-0">
 <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, SKUs, supplier..." className="w-full h-11 pl-10 pr-4 bg-card border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm " /></div>
 <div className="flex gap-2 shrink-0">
 {['All','In Stock','Low Stock','Out of Stock'].map(s => <button key={s} onClick={()=>setFilterStatus(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${filterStatus===s?'bg-primary text-white border-primary':'bg-card border-primary/40 text-muted-foreground hover:text-foreground'}`}>{s}</button>)}
 </div>
 </div>

 <div className="flex-1 overflow-auto min-h-0 bg-card border border-primary/40 rounded-2xl flex flex-col custom-scrollbar">
 <div className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
 <div className="col-span-4">Item</div><div className="col-span-2">Category</div><div className="col-span-1 text-right">Qty</div><div className="col-span-2 text-right">Unit Price</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
 : filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground"><Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No items found.</p></div>
 : filtered.map(item => (
 <div key={item.id} className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 hover:bg-muted/30 transition-colors items-center group">
 <div className="col-span-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-muted border border-primary/40 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div><div><p className="font-bold text-sm text-foreground">{item.item_name}</p><p className="text-xs text-muted-foreground">{item.sku||'—'}</p></div></div>
 <div className="col-span-2 text-sm text-muted-foreground">{item.category||'—'}</div>
 <div className="col-span-1 text-right"><span className={`text-sm font-black ${item.status==='Out of Stock'?'text-red-600':item.status==='Low Stock'?'text-amber-600':'text-foreground'}`}>{item.quantity}</span></div>
 <div className="col-span-2 text-right text-sm font-bold">${Number(item.unit_price).toFixed(2)}</div>
 <div className="col-span-2"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[item.status]||'bg-muted border-primary/40'}`}>{item.status}</span></div>
 <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={()=>setQrItem(item)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><QrCode className="w-3.5 h-3.5"/></button>
 <button onClick={()=>openModal(item)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
 <button onClick={()=>remove(item.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="bg-card w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]">
 <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Item':'Add Inventory Item'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
 <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Item Name *</label><input required type="text" value={form.item_name} onChange={e=>setForm({...form,item_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">SKU</label><input type="text" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Auto-generated if blank" className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Category</label><input type="text" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Quantity *</label><input required type="number" min="0" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)||0})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Unit Price ($) *</label><input required type="number" min="0" step="0.01" value={form.unit_price} onChange={e=>setForm({...form,unit_price:parseFloat(e.target.value)||0})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Reorder Level</label><input type="number" min="0" value={form.reorder_level} onChange={e=>setForm({...form,reorder_level:parseInt(e.target.value)||0})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Supplier</label><input type="text" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Storage Location</label><input type="text" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Warehouse, Shelf A2..." className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
 </div>
 <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold ">{editingId?'Update Item':'Add Item'}</button></div>
 </form>
 </div>
 </div>
 )}

 {qrItem && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={()=>setQrItem(null)}>
 <div className="bg-card border border-primary/40 w-full max-w-sm rounded-2xl p-6 text-center" onClick={e=>e.stopPropagation()}>
 <div className="flex justify-between items-center mb-4"><h3 className="font-black text-lg">Item QR Code</h3><button onClick={()=>setQrItem(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground"/></button></div>
 <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-primary/40 mb-4">
 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrItem.sku||qrItem.id)}`} alt="QR Code" className="w-48 h-48" />
 </div>
 <h4 className="font-bold text-lg mb-1">{qrItem.item_name}</h4>
 <p className="text-sm text-muted-foreground font-mono">{qrItem.sku}</p>
 <button onClick={()=>setQrItem(null)} className="mt-6 w-full h-10 bg-primary text-white rounded-xl font-bold">Done</button>
 </div>
 </div>
 )}
 </div>
 );
}
