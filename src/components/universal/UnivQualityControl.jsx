import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ClipboardList, Plus, CheckCircle2, XCircle, AlertTriangle, Clock, Edit2, Trash2, XCircle as CloseIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  batch_number: '',
  inspector_name: '',
  inspection_date: '',
  result: 'Pending',
  notes: ''
};

export default function UnivQualityControl() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchInspections();
      const channel = supabase.channel('qc_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_quality_control', filter: `company_id=eq.${companyId}` }, () => {
          fetchInspections();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_quality_control')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('inspection_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setInspections(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (i = null) => {
    if (i) {
      setEditingId(i.id);
      setForm({
        batch_number: i.batch_number || '',
        inspector_name: i.inspector_name || '',
        inspection_date: i.inspection_date || '',
        result: i.result || 'Pending',
        notes: i.notes || ''
      });
    } else {
      setEditingId(null);
      setForm({
        ...EMPTY_FORM,
        batch_number: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        inspection_date: new Date().toISOString().split('T')[0]
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
        inspector_name: form.inspector_name.trim(),
        inspection_date: form.inspection_date || null,
        result: form.result,
        notes: form.notes.trim()
      };

      if (editingId) {
        const { error } = await supabase
          .from('univ_quality_control')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Inspection updated');
      } else {
        const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_quality_control (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Inspection logged');
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      fetchInspections();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save inspection');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_quality_control WHERE id = ?`, [id]);
      const error = null;
      if (error) throw error;
      toast.success('Inspection deleted');
      fetchInspections();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = inspections.filter(i => 
    `${i.batch_number} ${i.inspector_name} ${i.result}`.toLowerCase().includes(searchTerm.toLowerCase())
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
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Quality Control</h2>
           <p className="text-sm text-muted-foreground mt-1">Log QA inspections, test results, and compliance.</p>
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

        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Inspection
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
              placeholder="Search batches, inspectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((i, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={i.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" /> <span className="line-clamp-1">{i.batch_number}</span>
                      </h3>
                      <div className="text-sm font-medium text-muted-foreground mt-1">
                        Inspector: {i.inspector_name || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                     <div className="mb-3">
                       <span className={`px-3 py-1.5 text-xs uppercase tracking-wider font-bold rounded-md border flex items-center justify-center gap-1.5 w-full ${
                         i.result === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         i.result === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 
                         i.result === 'Rework' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                         'bg-background text-foreground border-border'
                       }`}>
                         {i.result === 'Pass' && <CheckCircle2 className="w-4 h-4" />}
                         {i.result === 'Fail' && <XCircle className="w-4 h-4" />}
                         {i.result === 'Rework' && <AlertTriangle className="w-4 h-4" />}
                         {i.result === 'Pending' && <Clock className="w-4 h-4" />}
                         Result: {i.result}
                       </span>
                     </div>
                     
                     <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                       <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
                       {i.notes || <span className="text-muted-foreground italic">No notes provided.</span>}
                     </div>
                  </div>
                </div>

                <div>
                  <div className="pt-4 border-t border-border flex justify-between items-center text-sm mb-2">
                     <span className="text-muted-foreground">Date:</span>
                     <span className="font-semibold text-foreground">{i.inspection_date || '—'}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => handleOpenModal(i)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(i.id)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No QC inspections found.</p>
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
                <h3 className="font-semibold text-foreground">{editingId ? 'Edit QA Inspection' : 'New QA Inspection'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Batch Number</label>
                    <input required value={form.batch_number} onChange={e => setForm({...form, batch_number: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Result</label>
                    <select value={form.result} onChange={e => setForm({...form, result: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                      <option value="Pending">Pending</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Rework">Rework</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Inspector Name</label>
                    <input value={form.inspector_name} onChange={e => setForm({...form, inspector_name: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Inspection Date</label>
                    <input type="date" value={form.inspection_date} onChange={e => setForm({...form, inspection_date: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notes / Remarks</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="Details of inspection findings..." />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Save Inspection</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
