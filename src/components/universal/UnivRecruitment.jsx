import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { UserPlus, Plus, Search, Trash2, Edit2, Loader2, XCircle, Briefcase, Mail, Phone, Calendar, User, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { candidate_name: '', email: '', phone: '', position: '', status: 'Applied', source: '', experience_years: 0, rating: 0, notes: '' };
const STATUS_COLORS = { Applied: 'bg-blue-50 text-blue-700 border-blue-200', Screening: 'bg-violet-50 text-violet-700 border-violet-200', Interviewing: 'bg-amber-50 text-amber-700 border-amber-200', Offered: 'bg-emerald-50 text-emerald-700 border-emerald-200', Hired: 'bg-emerald-100 text-emerald-800 border-emerald-300', Rejected: 'bg-red-50 text-red-700 border-red-200' };

export default function UnivRecruitment() {
  const companyId = useCompanyId();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetchData();
      const ch = supabase.channel('recr_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_recruitment', filter: `company_id=eq.${companyId}` }, fetchData).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_recruitment').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setCandidates(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('univ_recruitment').update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Candidate updated!');
      } else {
        const { error } = await supabase.from('univ_recruitment').insert({ ...form, company_id: companyId });
        if (error) throw error;
        toast.success('Candidate added!');
      }
      closeModal(); fetchData();
    } catch (err) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('univ_recruitment').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchData(); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from('univ_recruitment').update({ status }).eq('id', id);
    fetchData();
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const filtered = candidates.filter(c => `${c.candidate_name} ${c.position} ${c.email}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || c.status === statusFilter));

  const stages = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'];

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><UserPlus className="w-7 h-7 text-primary"/>Recruitment</h1><p className="text-muted-foreground text-sm font-medium mt-1">Manage applicants and track hiring pipeline.</p></div>
        <button onClick={()=>openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4"/>Add Candidate</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          {label:'Total Candidates',value:candidates.length,ib:'bg-blue-100 text-blue-600',icon:<User className="w-5 h-5"/>},
          {label:'Interviewing',value:candidates.filter(c=>c.status==='Interviewing').length,ib:'bg-amber-100 text-amber-600',icon:<Calendar className="w-5 h-5"/>},
          {label:'Offers Extended',value:candidates.filter(c=>c.status==='Offered').length,ib:'bg-violet-100 text-violet-600',icon:<Briefcase className="w-5 h-5"/>},
          {label:'Hired',value:candidates.filter(c=>c.status==='Hired').length,ib:'bg-emerald-100 text-emerald-600',icon:<UserPlus className="w-5 h-5"/>},
        ].map((k,i)=>(
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.ib}`}>{k.icon}</div>
            <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-lg font-black text-foreground">{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search candidates, roles..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"/></div>
        <div className="flex gap-2 overflow-x-auto shrink-0 pb-1 sm:pb-0">
          {['All',...stages].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-4">Candidate</div><div className="col-span-3">Position</div><div className="col-span-2">Experience</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          : filtered.length===0 ? <div className="p-12 text-center text-muted-foreground"><UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3"/><p className="font-medium">No candidates found.</p></div>
          : filtered.map(c=>(
            <div key={c.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">{(c.candidate_name||'?').charAt(0).toUpperCase()}</div>
                <div><p className="font-bold text-sm text-foreground">{c.candidate_name}</p><p className="text-xs text-muted-foreground flex items-center gap-2"><Mail className="w-3 h-3"/> {c.email||'—'}</p></div>
              </div>
              <div className="col-span-3 font-medium text-sm text-foreground">{c.position}</div>
              <div className="col-span-2 text-sm text-muted-foreground">{c.experience_years} years</div>
              <div className="col-span-2">
                <select value={c.status} onChange={e=>updateStatus(c.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[c.status]||'bg-muted border-border'}`}>
                  {stages.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>openModal(c)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>remove(c.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Candidate':'Add Candidate'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Candidate Name *</label><input required type="text" value={form.candidate_name} onChange={e=>setForm({...form,candidate_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Position Applied For *</label><input required type="text" value={form.position} onChange={e=>setForm({...form,position:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email Address</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone Number</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{stages.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Source (e.g. LinkedIn, Referral)</label><input type="text" value={form.source} onChange={e=>setForm({...form,source:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Experience (Years)</label><input type="number" min="0" value={form.experience_years} onChange={e=>setForm({...form,experience_years:Number(e.target.value)})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Rating (1-5)</label><input type="number" min="0" max="5" value={form.rating} onChange={e=>setForm({...form,rating:Number(e.target.value)})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label><textarea rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update Candidate':'Add Candidate'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
