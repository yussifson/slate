import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, UtensilsCrossed, Plus, CheckCircle2, XCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { item_name: '', category: 'Main Course', description: '', price: 0.00, is_available: true, dietary_info: '' };
const CATEGORIES = ['Appetizer', 'Main Course', 'Dessert', 'Beverage'];

export default function UnivMenu() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetchMenus();
      const channel = supabase.channel('menus_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_menus', filter: `company_id=eq.${companyId}` }, () => {
          fetchMenus();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_menus')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setMenus(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_id: companyId,
        item_name: form.item_name,
        category: form.category,
        description: form.description || null,
        price: Number(form.price) || 0,
        is_available: Boolean(form.is_available),
        dietary_info: form.dietary_info || null
      };

      if (editingId) {
        await (async () => { const _p = payload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${univ_menus} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]); })();
      const error = null; const data = [];
        if (error) throw error;
        toast.success('Menu item updated');
      } else {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_menus (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Menu item added');
      }
      closeModal();
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM univ_menus WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
      toast.success('Menu item deleted');
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete menu item');
    }
  };

  const openModal = (item = null) => {
    setForm(item ? { ...item } : EMPTY_FORM);
    setEditingId(item?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const filtered = menus.filter(m => 
    `${m.item_name} ${m.category} ${m.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Menu</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage food and beverage items, pricing, and availability.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Calendar","Dashboard"].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Item
          </button>
      </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={m.id} 
                  className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm relative group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-2">
                     <div className="bg-primary/10 text-primary p-2 rounded-xl">
                        <UtensilsCrossed className="w-5 h-5" />
                     </div>
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <button onClick={() => openModal(m)} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Edit3 className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(m.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mt-2">{m.item_name}</h3>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.category}</div>
                  
                  {m.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                  )}

                  {m.dietary_info && (
                    <div className="text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded mb-4 font-medium">
                      {m.dietary_info}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-xl font-black text-foreground">${Number(m.price).toFixed(2)}</span>
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                      m.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {m.is_available ? <><CheckCircle2 className="w-3 h-3"/> Available</> : <><XCircle className="w-3 h-3"/> Sold Out</>}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No menu items found.</p>
             </div>
           )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Item Name *</label>
                  <input required type="text" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Category *</label>
                  <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Price ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Dietary Info</label>
                  <input type="text" placeholder="e.g. Gluten-Free, Vegan" value={form.dietary_info || ''} onChange={e => setForm({...form, dietary_info: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                  <textarea rows="3" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="is_available" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
                  <label htmlFor="is_available" className="text-sm font-medium text-foreground select-none">Available for order</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
