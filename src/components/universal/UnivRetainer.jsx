import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, DollarSign, Calendar, FileCheck, Edit2, Trash2, XCircle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivRetainer() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    client_name: '', amount: '', date_paid: new Date().toISOString().split('T')[0], status: 'Pending'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('univ_retainer_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_retainer', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_retainer WHERE company_id = ? ORDER BY date_paid DESC`, [companyId]);
      setData(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch retainers');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      setForm({ client_name: '', amount: '', date_paid: new Date().toISOString().split('T')[0], status: 'Pending' });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await powerSync.execute(`UPDATE univ_retainer SET client_name = ?, amount = ?, date_paid = ?, status = ? WHERE id = ?`, 
          [form.client_name, form.amount, form.date_paid, form.status, editingItem.id]);
        toast.success('Retainer updated');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_retainer (id, company_id, client_name, amount, date_paid, status) VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, companyId, form.client_name, form.amount, form.date_paid, form.status]);
        toast.success('Retainer added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save retainer');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this retainer record?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_retainer WHERE id = ?`, [id]);
      toast.success('Retainer deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = data.filter(item => 
    String(item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Retainers</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Track upfront retainer payments and agreements from clients.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> Add Retainer
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4">Client Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={item.id} 
                  onClick={() => openModal(item)}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-[#71717a]" /> {item.client_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-foreground">${Number(item.amount||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[#71717a]"><Calendar className="w-3.5 h-3.5"/> {item.date_paid}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 w-fit ${
                      item.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      item.status === 'Refunded' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10' : 
                      'bg-blue-50 text-blue-700 dark:bg-blue-500/10'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(item.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#71717a]">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No retainers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-sm rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Retainer' : 'Log Retainer'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Client Name</label>
                  <input required value={form.client_name} onChange={e=>setForm({...form, client_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Amount ($)</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Date</label>
                    <input required type="date" value={form.date_paid} onChange={e=>setForm({...form, date_paid: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                    <select required value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Refunded</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
