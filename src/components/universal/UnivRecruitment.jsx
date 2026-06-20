import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import {UserPlus, Plus, Search, Trash2, Edit2, XCircle, Briefcase, Mail, Phone, Calendar, User, Star, List, LayoutGrid} from "lucide-react";
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { OrbitLoader } from "@/components/ui/orbit-loader";

const EMPTY_FORM = { candidate_name: '', email: '', phone: '', job_title: '', status: 'Applied', source: '', experience_years: 0, rating: 0, notes: '' };
const STATUS_COLORS = { Applied: 'bg-blue-50 text-blue-700 border-blue-200', Screening: 'bg-violet-50 text-violet-700 border-violet-200', Interviewing: 'bg-amber-50 text-amber-700 border-amber-200', Offered: 'bg-emerald-50 text-emerald-700 border-emerald-200', Hired: 'bg-emerald-100 text-emerald-800 border-emerald-300', Rejected: 'bg-red-50 text-red-700 border-red-200' };


const StarRating = ({ rating, onChange }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`focus:outline-none transition-colors ${rating >= star ? 'text-amber-400' : 'text-[#71717a] dark:text-gray-400/30 hover:text-amber-200'}`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
};

const DisplayStars = ({ rating }) => {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
      ))}
    </div>
  );
};

export default function UnivRecruitment() {
  const companyId = useCompanyId();
  const [viewMode, setViewMode] = useState('Board'); // 'List' or 'Board'
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const defaultStages = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'];
  const [STAGES, setSTAGES] = useState(() => {
    try {
      const saved = localStorage.getItem(`pipelines_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return defaultStages;
  });

  const openStageModal = () => {
    setNewStageName('');
    setIsStageModalOpen(true);
  };

  const addStage = (e) => {
    e.preventDefault();
    const stageName = newStageName.trim();
    if (stageName && !STAGES.includes(stageName)) {
      const newStages = [...STAGES, stageName];
      setSTAGES(newStages);
      localStorage.setItem(`pipelines_${companyId}`, JSON.stringify(newStages));
    }
    setIsStageModalOpen(false);
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_recruitment WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setCandidates(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (async () => { const _payload = form; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_recruitment SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]);})();
        toast.success('Candidate updated!');
      } else {
        const { error } = await (async () => {
          const _payload = { ...form, id: crypto.randomUUID(), company_id: companyId };
          const _keys = Object.keys(_payload);
          const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          const _plhdr = _keys.map(()=>'?').join(', ');
          await powerSync.execute(`INSERT INTO univ_recruitment (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null };})();
        if (error) throw error;
        toast.success('Candidate added!');
      }
      closeModal(); fetchData();
    } catch (err) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    await powerSync.execute(`DELETE FROM univ_recruitment WHERE id = ?`, [id]);
    toast.success('Deleted'); fetchData();
  };

  const updateStatus = async (id, status) => {
    await (async () => { const _payload = { status }; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_recruitment SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    
    // Simple optimistic update
    setCandidates(prev => prev.map(c => c.id === draggableId ? { ...c, status: newStatus } : c));
    
    // DB update
    await updateStatus(draggableId, newStatus);
    fetchData();
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  
  const filtered = candidates.filter(c => `${c.candidate_name} ${c.job_title} ${c.email}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || c.status === statusFilter));

  const handleExport = () => {
    const exportData = filtered;
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 tracking-[-0.02em]"><UserPlus className="w-7 h-7 text-primary"/>Recruitment ATS</h1>
          <p className="text-[#71717a] dark:text-gray-400 text-sm font-medium mt-1">Manage applicants and track hiring pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-1 mr-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <button onClick={() => setViewMode('List')} className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'List' ? 'bg-primary text-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('Board')} className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'Board' ? 'bg-primary text-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95">
            Export CSV
          </button>
          <button onClick={openStageModal} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95"><Plus className="w-4 h-4"/>Add Pipeline</button>
          <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4"/>Add Candidate</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400"/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search candidates, roles..." className="w-full h-11 pl-10 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"/>
        </div>
        {viewMode === 'List' && (
          <div className="flex gap-2 overflow-x-auto shrink-0 pb-1 sm:pb-0 custom-scrollbar">
            {['All', ...STAGES].map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 h-11 rounded-xl text-sm font-semibold border-[0.5px] border-black/9 dark:border-white/8 transition-all whitespace-nowrap ${statusFilter===s?'bg-primary text-white border-primary':'bg-card border-primary/40 text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}>{s}</button>)}
          </div>
        )}
      </div>

      {viewMode === 'List' ? (
        <div className="flex-1 overflow-auto min-h-0 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl flex flex-col custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 bg-muted/50 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider shrink-0 tracking-[0.04em]">
            <div className="col-span-4">Candidate</div><div className="col-span-3">Position</div><div className="col-span-2">Rating</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? <div className="flex h-40 items-center justify-center"><OrbitLoader size="md" /></div>
            : filtered.length === 0 ? <div className="p-12 text-center text-[#71717a] dark:text-gray-400"><UserPlus className="w-12 h-12 mx-auto text-[#71717a] dark:text-gray-400/30 mb-3"/><p className="font-medium">No candidates found.</p></div>
            : filtered.map(c=>(
              <div key={c.id} className="grid grid-cols-12 gap-2 p-4 border-b border-primary/40 hover:bg-muted/30 transition-colors items-center group">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0">{(c.candidate_name||'?').charAt(0).toUpperCase()}</div>
                  <div><p className="font-semibold text-sm text-foreground">{c.candidate_name}</p><p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]"><Mail className="w-3 h-3"/> {c.email||'—'}</p></div>
                </div>
                <div className="col-span-3 font-medium text-sm text-foreground">{c.job_title} <span className="text-xs font-normal text-[#71717a] dark:text-gray-400 block tracking-[0.04em]">{c.experience_years} yrs exp</span></div>
                <div className="col-span-2 flex items-center">
                  <DisplayStars rating={c.rating} />
                </div>
                <div className="col-span-2">
                  <select value={c.status} onChange={e=>updateStatus(c.id,e.target.value)} className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer focus:outline-none ${STATUS_COLORS[c.status]||'bg-muted border-primary/40'}`}>
                    {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>openModal(c)} className="p-1.5 bg-muted rounded-lg text-[#71717a] dark:text-gray-400 hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>remove(c.id)} className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-4 pb-2">
          {loading && candidates.length === 0 ? (
             <div className="w-full flex items-center justify-center"><OrbitLoader size="md" /></div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              {STAGES.map(stage => {
                const stageCandidates = filtered.filter(c => c.status === stage);
                return (
                  <Droppable key={stage} droppableId={stage}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-80 shrink-0 flex flex-col bg-muted/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 border-primary/40' : ''}`}
                      >
                        <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-card rounded-md-t-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                          <h3 className="font-black text-sm uppercase tracking-wider text-foreground tracking-[0.04em]">{stage}</h3>
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full tracking-[0.04em]">{stageCandidates.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
                          {stageCandidates.map((c, index) => (
                            <Draggable key={c.id} draggableId={c.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openModal(c)}
                                  className={`bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm cursor-pointer group hover:border-primary/50 transition-all ${snapshot.isDragging ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-2 ring-primary scale-105 z-50' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0 tracking-[0.04em]">{(c.candidate_name||'?').charAt(0).toUpperCase()}</div>
                                      <div>
                                        <p className="font-semibold text-sm text-foreground line-clamp-1">{c.candidate_name}</p>
                                        <p className="text-[11px] font-medium text-[#71717a] dark:text-gray-400">{c.job_title}</p>
                                      </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="p-1 opacity-0 group-hover:opacity-100 text-[#71717a] dark:text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-[11px] font-semibold bg-muted text-[#71717a] dark:text-gray-400 px-2 py-1 rounded-lg">{c.experience_years} yrs exp</span>
                                    <DisplayStars rating={c.rating} />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </DragDropContext>
          )}
        </div>
      )}

      {isStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-muted/20 shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Add Pipeline Stage</h2>
              <button onClick={() => setIsStageModalOpen(false)} className="p-2 bg-background hover:bg-muted rounded-full text-[#71717a] dark:text-gray-400 transition-colors"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={addStage} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Stage Name</label>
                  <input autoFocus required type="text" value={newStageName} onChange={e=>setNewStageName(e.target.value)} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="e.g. Technical Interview"/>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40">
                <button type="button" onClick={() => setIsStageModalOpen(false)} className="h-11 px-6 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-11 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">Add Stage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b border-primary/40 flex justify-between items-center shrink-0 bg-muted/20">
              <h2 className="text-xl font-black flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> {editingId ? 'Edit Candidate Profile' : 'Add New Candidate'}</h2>
              <button onClick={closeModal} className="p-2 bg-background hover:bg-muted rounded-full text-[#71717a] dark:text-gray-400 transition-colors"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Candidate Name *</label><input required type="text" value={form.candidate_name} onChange={e=>setForm({...form,candidate_name:e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Position Applied For *</label><input required type="text" value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Email Address</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400"/><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full h-11 pl-9 pr-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Phone Number</label><div className="relative"><Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400"/><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full h-11 pl-9 pr-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm cursor-pointer">{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Source (e.g. LinkedIn)</label><input type="text" value={form.source} onChange={e=>setForm({...form,source:e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Experience (Years)</label><input type="number" min="0" value={form.experience_years} onChange={e=>setForm({...form,experience_years:Number(e.target.value)})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-2 tracking-[0.04em]">Candidate Rating</label>
                  <StarRating rating={form.rating} onChange={(val) => setForm({...form, rating: val})} />
                </div>
                
                <div className="col-span-2"><label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Interview Notes / Links</label><textarea rows="4" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" placeholder="Paste resume link, interviewer feedback, etc."/></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-primary/40">
                <button type="button" onClick={closeModal} className="h-11 px-6 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-11 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">{editingId ? 'Update Candidate' : 'Add Candidate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
