import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Plus, Search, Trash2, Edit2, Loader2, XCircle,
  Briefcase, Mail, Phone, Star, ChevronRight, Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const STAGE_COLORS = {
  Applied: 'bg-slate-100 text-slate-700 border-slate-200',
  Screening: 'bg-blue-50 text-blue-700 border-blue-200',
  Interview: 'bg-violet-50 text-violet-700 border-violet-200',
  Offer: 'bg-amber-50 text-amber-700 border-amber-200',
  Hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
};

const EMPTY_FORM = {
  applicant_name: '', email: '', phone: '', job_title: '',
  department: '', stage: 'Applied', rating: 0, source: '', resume_url: '', notes: '', applied_date: ''
};

export default function UnivRecruitment() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ['univ_recruitment', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_recruitment').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const saveApplicant = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return base44.db.from('univ_recruitment').update(payload).eq('id', editingId);
      return base44.db.from('univ_recruitment').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_recruitment']);
      toast.success(editingId ? 'Applicant updated!' : 'Applicant added!');
      closeModal();
    },
    onError: () => toast.error('Failed to save applicant')
  });

  const deleteApplicant = useMutation({
    mutationFn: async (id) => base44.db.from('univ_recruitment').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_recruitment']); toast.success('Deleted'); setSelectedApplicant(null); },
    onError: () => toast.error('Failed to delete')
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }) => base44.db.from('univ_recruitment').update({ stage }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries(['univ_recruitment'])
  });

  const openModal = (a = null) => {
    setForm(a ? { ...a } : EMPTY_FORM);
    setEditingId(a?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = applicants.filter(a => {
    const matchSearch = `${a.applicant_name} ${a.job_title} ${a.email} ${a.department}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || a.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = applicants.filter(a => a.stage === s).length;
    return acc;
  }, {});

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange && onChange(n)} className={`w-6 h-6 transition-colors ${n <= value ? 'text-amber-400' : 'text-muted'}`}>
          <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-primary" /> Recruitment
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Track applicants through your hiring pipeline.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Applicant
        </button>
      </div>

      {/* Pipeline Stage KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
        {STAGES.map(stage => (
          <button key={stage} onClick={() => setStageFilter(stageFilter === stage ? 'All' : stage)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all min-w-[100px] ${stageFilter === stage ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'}`}
          >
            <span className="text-2xl font-black text-foreground">{stageCounts[stage] || 0}</span>
            <span className={`text-[11px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-md border ${STAGE_COLORS[stage]}`}>{stage}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, job title, department, email..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-3">Applicant</div>
          <div className="col-span-3">Job / Department</div>
          <div className="col-span-2">Applied</div>
          <div className="col-span-1">Rating</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No applicants found. Add your first candidate.</p>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} onClick={() => setSelectedApplicant(a)} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group cursor-pointer">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-violet-400/20 flex items-center justify-center text-primary text-sm font-black shrink-0 border border-primary/10">
                  {(a.applicant_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{a.applicant_name}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
              </div>
              <div className="col-span-3">
                <p className="font-medium text-sm text-foreground">{a.job_title || '—'}</p>
                <p className="text-xs text-muted-foreground">{a.department || '—'}</p>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {a.applied_date || '—'}
              </div>
              <div className="col-span-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= (a.rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/20'}`} />)}
                </div>
              </div>
              <div className="col-span-2">
                <select
                  value={a.stage}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); updateStage.mutate({ id: a.id, stage: e.target.value }); }}
                  className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STAGE_COLORS[a.stage] || 'bg-muted border-border'}`}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openModal(a); }} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteApplicant.mutate(a.id); }} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant Detail Drawer */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-black text-lg">Applicant</h3>
              <button onClick={() => setSelectedApplicant(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-violet-400/30 flex items-center justify-center text-primary text-2xl font-black mb-2 border border-primary/10">
                  {(selectedApplicant.applicant_name || '?').charAt(0).toUpperCase()}
                </div>
                <h3 className="font-black text-lg">{selectedApplicant.applicant_name}</h3>
                <p className="text-sm font-bold text-primary">{selectedApplicant.job_title}</p>
                <span className={`mt-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${STAGE_COLORS[selectedApplicant.stage]}`}>{selectedApplicant.stage}</span>
                <div className="mt-2 flex gap-0.5">
                  {[1,2,3,4,5].map(n => <Star key={n} className={`w-5 h-5 ${n <= (selectedApplicant.rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/20'}`} />)}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: selectedApplicant.email },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: selectedApplicant.phone },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Department', value: selectedApplicant.department },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Applied', value: selectedApplicant.applied_date },
                ].map((f, i) => f.value ? (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                    <span className="text-primary shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</p>
                      <p className="text-sm font-medium">{f.value}</p>
                    </div>
                  </div>
                ) : null)}
                {selectedApplicant.notes && (
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Notes</p>
                    <p className="text-sm text-foreground">{selectedApplicant.notes}</p>
                  </div>
                )}
                {selectedApplicant.resume_url && (
                  <a href={selectedApplicant.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-primary text-sm font-bold hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4" /> View Resume
                  </a>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-2">
              <button onClick={() => { openModal(selectedApplicant); setSelectedApplicant(null); }} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => deleteApplicant.mutate(selectedApplicant.id)} className="flex-1 h-9 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-100">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Applicant' : 'Add Applicant'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveApplicant.mutate(form); }} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Full Name *</label>
                  <input required type="text" value={form.applicant_name} onChange={e => setForm({...form, applicant_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Job Title *</label>
                  <input required type="text" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Applied Date</label>
                  <input type="date" value={form.applied_date} onChange={e => setForm({...form, applied_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Source</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option value="">Select...</option>
                    {['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Job Fair', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Resume URL</label>
                  <input type="url" value={form.resume_url} onChange={e => setForm({...form, resume_url: e.target.value})} placeholder="https://..." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setForm({...form, rating: n})} className="w-8 h-8">
                        <Star className={`w-6 h-6 transition-colors ${n <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label>
                  <textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Interview notes, impressions..." className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveApplicant.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">
                  {saveApplicant.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Add Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
