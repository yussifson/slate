import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Briefcase, Plus, Search, Trash2, Edit2, Loader2, XCircle, Calendar, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', client_name: '', status: 'Active', priority: 'Medium', start_date: '', due_date: '', budget: '', assigned_to: '' };
const STATUS_COLORS = { Active: 'bg-blue-50 text-blue-700 border-blue-200', Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'On Hold': 'bg-amber-50 text-amber-700 border-amber-200', Cancelled: 'bg-red-50 text-red-700 border-red-200', Planning: 'bg-violet-50 text-violet-700 border-violet-200' };
const PRIORITY_COLORS = { Low: 'bg-slate-100 text-slate-600', Medium: 'bg-amber-50 text-amber-700', High: 'bg-orange-50 text-orange-700', Urgent: 'bg-red-50 text-red-700' };

export default function UnivProject() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetch();
      const ch = supabase.channel('projects_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_projects', filter: `company_id=eq.${companyId}` }, fetch).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_projects').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('univ_projects').update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Project updated!');
      } else {
        const { error } = await supabase.from('univ_projects').insert({ ...form, company_id: companyId });
        if (error) throw error;
        toast.success('Project created!');
      }
      closeModal(); fetch();
    } catch (err) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('univ_projects').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetch(); setSelected(null); }
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const filtered = records.filter(r => {
    const m = `${r.name} ${r.client_name} ${r.description}`.toLowerCase().includes(search.toLowerCase());
    return m && (statusFilter === 'All' || r.status === statusFilter);
  });

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Briefcase className="w-7 h-7 text-primary" />Projects</h1><p className="text-muted-foreground text-sm font-medium mt-1">{records.length} projects • {records.filter(r=>r.status==='Active').length} active</p></div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />New Project</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        {Object.keys(STATUS_COLORS).map(s => <div key={s} className="bg-card border border-border p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{s}</p><p className="text-2xl font-black text-foreground">{records.filter(r=>r.status===s).length}</p></div>)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>
        <div className="flex gap-2 shrink-0">
          {['All',...Object.keys(STATUS_COLORS)].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filtered.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-foreground leading-tight">{r.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md shrink-0 ml-2 ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {r.client_name && <span className="flex items-center gap-1"><User className="w-3 h-3 text-primary" />{r.client_name}</span>}
                  {r.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" />Due {r.due_date}</span>}
                  {r.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3 text-primary" />{r.assigned_to}</span>}
                </div>
                {r.priority && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md w-fit ${PRIORITY_COLORS[r.priority]}`}>{r.priority} Priority</span>}
                <div className="flex justify-end gap-1 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e=>{e.stopPropagation();openModal(r);}} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={e=>{e.stopPropagation();remove(r.id);}} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl"><Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No projects found.</p></div>}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center"><h3 className="font-black text-lg">Project Details</h3><button onClick={() => setSelected(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3">
              <h2 className="font-black text-xl text-foreground">{selected.name}</h2>
              <span className={`px-3 py-1 text-[11px] font-bold uppercase border rounded-full inline-block ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              {[{label:'Client',value:selected.client_name},{label:'Assigned To',value:selected.assigned_to},{label:'Start Date',value:selected.start_date},{label:'Due Date',value:selected.due_date},{label:'Budget',value:selected.budget?`$${Number(selected.budget).toLocaleString()}`:null},{label:'Priority',value:selected.priority}].map((f,i)=>f.value?(<div key={i} className="p-3 bg-muted/40 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</p><p className="text-sm font-medium">{f.value}</p></div>):null)}
            </div>
            <div className="p-5 border-t border-border flex gap-2">
              <button onClick={()=>{openModal(selected);setSelected(null);}} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
              <button onClick={()=>remove(selected.id)} className="flex-1 h-9 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Project':'New Project'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Project Name *</label><input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client</label><input type="text" value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Assigned To</label><input type="text" value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(PRIORITY_COLORS).map(p=><option key={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Budget ($)</label><input type="number" min="0" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update':'Create Project'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
