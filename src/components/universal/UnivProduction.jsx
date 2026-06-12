import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Factory, Plus, Settings, CheckCircle2, Clock, PlayCircle, Edit2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  batch_number: '',
  product_name: '',
  quantity: '',
  status: 'Planned',
  start_date: '',
  end_date: ''
};

export default function UnivProduction() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchProduction();
      const channel = supabase.channel('production_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_production', filter: `company_id=eq.${companyId}` }, () => {
          fetchProduction();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchProduction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_production')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setProduction(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch production batches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (p = null) => {
    if (p) {
      setEditingId(p.id);
      setForm({
        batch_number: p.batch_number || '',
        product_name: p.product_name || '',
        quantity: p.quantity || '',
        status: p.status || 'Planned',
        start_date: p.start_date || '',
        end_date: p.end_date || ''
      });
    } else {
      setEditingId(null);
      setForm({
        ...EMPTY_FORM,
        batch_number: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        start_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_id: companyId,
        batch_number: form.batch_number.trim(),
        product_name: form.product_name.trim(),
        quantity: Number(form.quantity) || 0,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('univ_production')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Production batch updated');
      } else {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_production (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Production batch created');
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      fetchProduction();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save batch');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_production WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
      toast.success('Batch deleted');
      fetchProduction();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = production.filter(p => 
    `${p.batch_number} ${p.product_name} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="flex flex-col h-full bg-background overflow-hidden relative ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Production Runs</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage manufacturing batches, timelines, and statuses.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Create Batch
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
              placeholder="Search batches, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={p.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Factory className="w-4 h-4 text-primary" /> {p.batch_number}
                      </h3>
                      <div className="text-sm font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                        {p.product_name}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                      p.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      p.status === 'QA' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-background text-foreground border-border'
                    }`}>
                      {p.status === 'In Progress' && <PlayCircle className="w-3 h-3" />}
                      {p.status === 'QA' && <Settings className="w-3 h-3" />}
                      {p.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 'Planned' && <Clock className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target Quantity</span>
                      <span className="font-bold font-mono">{Number(p.quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium">{p.start_date || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. End Date</span>
                      <span className="font-medium">{p.end_date || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={() => handleOpenModal(p)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Factory className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No production batches found.</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">{editingId ? 'Edit Batch' : 'New Production Batch'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Batch Number</label>
                    <input required value={form.batch_number} onChange={e => setForm({...form, batch_number: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="QA">QA</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Product Name</label>
                  <input required value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                  <input type="number" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Save Batch</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
