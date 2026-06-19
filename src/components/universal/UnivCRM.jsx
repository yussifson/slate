import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';
import { motion, AnimatePresence} from 'framer-motion';
import { 
 Plus, Search, Filter, MoreHorizontal, User, Mail, Phone, 
 Calendar as CalendarIcon, Loader2, DollarSign, Trash2, X,
 LayoutList, KanbanSquare, Target, TrendingUp, Building2, Edit2, Eye
} from 'lucide-react';
import { toast} from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from "@/components/ui/sheet";

const DEFAULT_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export default function UnivCRM() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [leads, setLeads] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

 const [stages, setStages] = useState(DEFAULT_STAGES);
 const [newStageName, setNewStageName] = useState('');
 const [isAddingStage, setIsAddingStage] = useState(false);

 // Modal State
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingLeadId, setEditingLeadId] = useState(null);
 
 // Sheet State
 const [viewingLead, setViewingLead] = useState(null);

 const [formData, setFormData] = useState({
 first_name: '', last_name: '', email: '', phone: '', source: '', value: 0, status: 'New', notes: ''
});

 useEffect(() => {
 if (companyId) {
 const savedStages = localStorage.getItem(`crm_stages_${companyId}`);
 if (savedStages) setStages(JSON.parse(savedStages));
 fetchLeads();
 const channel = supabase.channel('crm_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_crm_leads', filter: `company_id=eq.${companyId}`}, () => {
 fetchLeads();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchLeads = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_crm_leads WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setLeads(data || []);
} catch (err) {
 console.error('Error fetching leads:', err);
} finally {
 setLoading(false);
}
};

 const handleOpenModal = (lead = null) => {
 if (lead) {
 setEditingLeadId(lead.id);
 setFormData({
 first_name: lead.first_name || '', last_name: lead.last_name || '', email: lead.email || '',
 phone: lead.phone || '', source: lead.source || '', value: lead.value || 0,
 status: lead.status || 'New', notes: lead.notes || ''
});
} else {
 setEditingLeadId(null);
 setFormData({
 first_name: '', last_name: '', email: '', phone: '', source: '', value: 0, status: 'New', notes: ''
});
}
 setIsModalOpen(true);
};

 const handleSaveLead = async (e) => {
 e.preventDefault();
 if (!formData.first_name.trim()) return toast.error("First name is required");

 const payload = {
 company_id: companyId,
 first_name: formData.first_name,
 last_name: formData.last_name,
 email: formData.email,
 phone: formData.phone,
 source: formData.source,
 value: Number(formData.value) || 0,
 status: formData.status,
 notes: formData.notes
};

 try {
 if (editingLeadId) {
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_crm_leads SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingLeadId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Lead updated successfully');
} else {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_crm_leads (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Lead added successfully');
}
 setIsModalOpen(false);
} catch (err) {
 toast.error('Failed to save lead');
}
};

 const handleDeleteLead = async (id, e) => {
 if (e) e.stopPropagation();
 if (!window.confirm("Are you sure you want to delete this lead?")) return;
 try {
 await powerSync.execute(`DELETE FROM univ_crm_leads WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
 toast.success('Lead deleted');
 if (viewingLead?.id === id) setViewingLead(null);
} catch (err) {
 toast.error('Failed to delete lead');
}
};

 const updateLeadStatus = async (id, newStatus, e) => {
 if (e) e.stopPropagation();
 try {
 await (async () => { const _payload = { status: newStatus}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_crm_leads SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success('Lead status updated');
} catch (err) {
 toast.error("Failed to update status");
}
};

 const handleAddStage = (e) => {
 e.preventDefault();
 if (!newStageName.trim() || stages.includes(newStageName.trim())) return;
 const newStages = [...stages, newStageName.trim()];
 setStages(newStages);
 localStorage.setItem(`crm_stages_${companyId}`, JSON.stringify(newStages));
 setNewStageName('');
 setIsAddingStage(false);
 toast.success('Pipeline stage added');
};

 const onDragEnd = async (result) => {
 if (!result.destination) return;
 const { source, destination, draggableId} = result;
 if (source.droppableId === destination.droppableId && source.index === destination.index) return;

 const leadId = draggableId;
 const newStatus = destination.droppableId;
 
 // Optimistic update
 setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus} : l));
 
 try {
 await (async () => { const _payload = { status: newStatus}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_crm_leads SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, leadId]);})();
 const error = null; const data = [];
 if (error) throw error;
 toast.success(`Moved to ${newStatus}`);
} catch (err) {
 toast.error('Failed to move lead');
 fetchLeads(); // Revert
}
};

 const filteredLeads = leads.filter(l => 
 `${l.first_name} ${l.last_name} ${l.email} ${l.phone} ${l.source}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const totalValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
 const wonLeads = leads.filter(l => l.status === 'Won').length;
 const winRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

 
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
 <div className="min-h-[80vh] h-full flex flex-col gap-6 w-full bg-background ${view !== 'Default' ? 'hide-default' : ''}">
 
 {/* Top Header Controls */}
 <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4 px-1">
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-[-0.02em]">Lead Management</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Track and manage your sales pipeline from end to end.</p>
 </div>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="flex items-center p-1 bg-muted rounded-xl shrink-0">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-md-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button 
 onClick={() => setViewMode('kanban')} 
 className={`p-1.5 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-background text-foreground ' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 <KanbanSquare className="w-4 h-4" /> Kanban
 </button>
 <button 
 onClick={() => setViewMode('list')} 
 className={`p-1.5 rounded-lg flex items-center gap-2.5 text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-background text-foreground ' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}
 >
 <LayoutList className="w-4 h-4" /> List
 </button>
 </div>
 <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20 whitespace-nowrap">
 <Plus className="w-4 h-4" /> Add Lead
 </button>
 </div>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0 px-1">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-5 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Total Active Leads</p>
 <h3 className="text-3xl font-black text-foreground mt-1 tracking-[-0.02em]">{leads.length}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-xl bg-blue-100 dark:bg-blue-500/10/10 flex items-center justify-center text-blue-600">
 <User className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-5 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Pipeline Value</p>
 <h3 className="text-3xl font-black text-foreground mt-1 tracking-[-0.02em]">${totalValue.toLocaleString()}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-xl bg-emerald-100 dark:bg-emerald-500/10/10 flex items-center justify-center text-emerald-600">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-5 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Overall Win Rate</p>
 <h3 className="text-3xl font-black text-foreground mt-1 tracking-[-0.02em]">{winRate}%</h3>
 </div>
 <div className="w-12 h-12 rounded-md-xl bg-purple-100 dark:bg-purple-500/10/10 flex items-center justify-center text-purple-600">
 <TrendingUp className="w-6 h-6" />
 </div>
 </div>
 </div>

 {/* Search Bar */}
 <div className="relative mb-6 shrink-0 px-1 max-w-md">
 <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search by name, email, phone, or source..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-11 pl-11 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 {/* Main Content Area */}
 {viewMode === 'kanban' ? (
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-5 pb-4 snap-x px-1 min-h-[500px] items-stretch custom-scrollbar">
 {loading && leads.length === 0 ? (
 <div className="w-full h-full flex items-center justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 ) : (
 <>
 {stages.map(stage => {
 const stageLeads = filteredLeads.filter(l => l.status === stage);
 return (
 <div key={stage} className="flex-shrink-0 w-[320px] max-w-[85vw] bg-muted/40 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl flex flex-col snap-center h-full">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-card/60 rounded-md-t-2xl shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-sm text-foreground tracking-tight">{stage}</h3>
 <span className="px-2.5 py-0.5 rounded-md-full bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs font-semibold text-[#71717a] dark:text-gray-400  tracking-[0.04em]">
 {stageLeads.length}
 </span>
 </div>
 <Droppable droppableId={stage}>
 {(provided, snapshot) => (
 <div 
 ref={provided.innerRef} 
 {...provided.droppableProps}
 className={`p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px] transition-colors rounded-md-b-2xl ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
 >
 {stageLeads.map((lead, index) => (
 <Draggable key={lead.id} draggableId={lead.id} index={index}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 onClick={() => setViewingLead(lead)}
 className={`bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-md-xl transition-all group cursor-pointer relative overflow-hidden ${snapshot.isDragging ? ' ring-2 ring-primary scale-105 z-50' : ' '}`}
 style={provided.draggableProps.style}
 >
 <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${stage === 'Won' ? 'bg-emerald-500/10' : stage === 'Lost' ? 'bg-red-500/10' : 'bg-primary/40 group-hover:bg-primary'}`}></div>
 
 <div className="flex justify-between items-start mb-2 pl-2">
 <h4 className="font-semibold text-[15px] text-foreground tracking-tight">{lead.first_name} {lead.last_name}</h4>
 <div className="flex gap-2">
 <button onClick={(e) => { e.stopPropagation(); setViewingLead(lead);}} className="text-[#71717a] dark:text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-muted rounded-lg">
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button onClick={(e) => { e.stopPropagation(); handleOpenModal(lead);}} className="text-[#71717a] dark:text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-muted rounded-lg">
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button onClick={(e) => handleDeleteLead(lead.id, e)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 
 <div className="pl-2">
 {lead.source && <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2.5 mb-1.5 tracking-[0.04em]"><Building2 className="w-3 h-3" /> {lead.source}</p>}
 {lead.email && <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2.5 mb-3 tracking-[0.04em]"><Mail className="w-3 h-3" /> {lead.email}</p>}
 </div>
 
 <div className="flex items-center justify-between text-xs font-medium bg-muted/60 p-2 rounded-xl mt-auto ml-2 tracking-[0.04em]">
 <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
 <DollarSign className="w-3.5 h-3.5" /> {Number(lead.value || 0).toLocaleString()}
 </span>
 <span className={`px-2 py-0.5 rounded-md-full font-semibold text-[10px] uppercase tracking-wider ${lead.value > 10000 ? 'bg-red-100 text-red-700' : lead.value > 5000 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
 {lead.value > 10000 ? 'Hot' : lead.value > 5000 ? 'Warm' : 'Cold'}
 </span>
 </div>
 </div>
 )}
 </Draggable>
 ))}
 {provided.placeholder}
 {stageLeads.length === 0 && !snapshot.isDraggingOver && (
 <div className="h-24 flex items-center justify-center border-2 border-dashed border-primary/40 rounded-md-xl text-xs text-[#71717a] dark:text-gray-400 font-medium bg-card/20 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 Drop leads here
 </div>
 )}
 </div>
 )}
 </Droppable>
 </div>
 );
})}
 {/* Add Stage Column */}
 <div className="flex-shrink-0 w-[320px] max-w-[85vw] h-[150px] rounded-md-2xl flex flex-col snap-center border-2 border-dashed border-primary/40 hover:border-primary/40 transition-colors bg-card/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {isAddingStage ? (
 <form onSubmit={handleAddStage} className="p-4 flex flex-col gap-3 h-full justify-center">
 <input autoFocus type="text" value={newStageName} onChange={e=>setNewStageName(e.target.value)} placeholder="Stage Name..." className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm " />
 <div className="flex gap-2">
 <button type="submit" className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 -primary/20">Save</button>
 <button type="button" onClick={()=>setIsAddingStage(false)} className="flex-1 h-9 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">Cancel</button>
 </div>
 </form>
 ) : (
 <button onClick={()=>setIsAddingStage(true)} className="flex-1 flex flex-col items-center justify-center gap-2 text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors">
 <div className="w-10 h-10 rounded-md-full bg-primary/10 flex items-center justify-center">
 <Plus className="w-5 h-5" />
 </div>
 <span className="text-sm font-semibold">Add Pipeline Stage</span>
 </button>
 )}
 </div>
 </>
 )}
 </div>
 </DragDropContext>
 ) : (
 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl overflow-hidden flex flex-col mx-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="overflow-x-auto flex-1">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-[#71717a] dark:text-gray-400 text-xs uppercase font-semibold tracking-wider border-b border-primary/40 sticky top-0 z-10 tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4">Lead Name</th>
 <th className="px-6 py-4">Contact Info</th>
 <th className="px-6 py-4">Source/Company</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Value</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredLeads.map(lead => (
 <tr key={lead.id} onClick={() => setViewingLead(lead)} className="hover:bg-muted/30 transition-colors cursor-pointer group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
 {lead.first_name[0]}{lead.last_name?.[0] || ''}
 </div>
 <span className="font-semibold text-foreground">{lead.first_name} {lead.last_name}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col gap-2">
 {lead.email && <span className="flex items-center gap-2.5 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]"><Mail className="w-3 h-3" /> {lead.email}</span>}
 {lead.phone && <span className="flex items-center gap-2.5 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]"><Phone className="w-3 h-3" /> {lead.phone}</span>}
 </div>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{lead.source || '-'}</td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-lg border ${
 lead.status === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
 lead.status === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' :
 lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
 'bg-amber-50 text-amber-700 border-amber-200'
}`}>
 {lead.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
 ${Number(lead.value || 0).toLocaleString()}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button onClick={(e) => { e.stopPropagation(); handleOpenModal(lead);}} className="p-2 text-[#71717a] dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={(e) => handleDeleteLead(lead.id, e)} className="p-2 text-[#71717a] dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filteredLeads.length === 0 && (
 <tr>
 <td colSpan="6" className="px-6 py-16 text-center text-[#71717a] dark:text-gray-400">
 No leads found matching your criteria.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Add / Edit Modal (Tailwind CSS Modal to ensure zero dependency issues) */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-center p-5 sm:p-6 border-b border-primary/40 bg-muted/30 shrink-0">
 <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
 {editingLeadId ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
 {editingLeadId ? 'Edit Lead' : 'Add New Lead'}
 </h2>
 <button onClick={() => setIsModalOpen(false)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form onSubmit={handleSaveLead} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">First Name *</label>
 <input required autoFocus type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="John" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Last Name</label>
 <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="Doe" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Email Address</label>
 <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="john@example.com" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Phone Number</label>
 <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="+1 (555) 000-0000" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Company / Source</label>
 <input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="Acme Corp" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Expected Value ($)</label>
 <input type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder="5000" />
 </div>
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Pipeline Stage</label>
 <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
 {stages.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 <div className="sm:col-span-2">
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-1.5 tracking-[0.04em]">Notes</label>
 <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" placeholder="Add any background info here..."></textarea>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 pt-4 mt-auto border-t border-primary/40">
 <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted text-foreground rounded-md-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
 <button type="submit" className="h-10 px-5 bg-primary text-white rounded-md-xl text-sm font-semibold hover:bg-primary/90 transition-colors -primary/20">
 {editingLeadId ? 'Save Changes' : 'Create Lead'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Lead Info Sheet */}
 <Sheet open={!!viewingLead} onOpenChange={(open) => !open && setViewingLead(null)}>
 <SheetContent className="overflow-y-auto w-full sm:max-w-md border-l border-primary/40 ">
 <SheetHeader className="pb-6 border-b border-primary/40">
 <div className="w-16 h-16 rounded-md-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl mb-4 tracking-[-0.02em]">
 {viewingLead?.first_name?.[0]}{viewingLead?.last_name?.[0]}
 </div>
 <SheetTitle className="text-2xl font-semibold tracking-[-0.02em]">{viewingLead?.first_name} {viewingLead?.last_name}</SheetTitle>
 <SheetDescription className="text-sm font-medium flex items-center gap-2 mt-1">
 <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-lg border ${
 viewingLead?.status === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
 viewingLead?.status === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' :
 'bg-blue-50 text-blue-700 border-blue-200'
}`}>
 {viewingLead?.status}
 </span>
 <span>Lead Profile</span>
 </SheetDescription>
 </SheetHeader>
 
 {viewingLead && (
 <div className="mt-6 space-y-6">
 
 <div className="bg-muted/30 p-4 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 space-y-4">
 <div className="flex items-start gap-3">
 <Building2 className="w-4 h-4 text-[#71717a] dark:text-gray-400 mt-0.5" />
 <div>
 <p className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Company / Source</p>
 <p className="text-sm font-semibold text-foreground mt-0.5">{viewingLead.source || 'No source provided'}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Mail className="w-4 h-4 text-[#71717a] dark:text-gray-400 mt-0.5" />
 <div>
 <p className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Email Address</p>
 <p className="text-sm font-semibold text-foreground mt-0.5">{viewingLead.email || 'No email provided'}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Phone className="w-4 h-4 text-[#71717a] dark:text-gray-400 mt-0.5" />
 <div>
 <p className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Phone Number</p>
 <p className="text-sm font-semibold text-foreground mt-0.5">{viewingLead.phone || 'No phone provided'}</p>
 </div>
 </div>
 </div>

 <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider tracking-[0.04em]">Expected Value</p>
 <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tracking-[-0.02em]">${Number(viewingLead.value || 0).toLocaleString()}</p>
 </div>
 <DollarSign className="w-8 h-8 text-emerald-200 dark:text-emerald-800" />
 </div>

 <div>
 <p className="text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2 tracking-[0.04em]">Notes & Context</p>
 <div className="bg-muted/30 p-4 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-sm text-foreground whitespace-pre-wrap min-h-[100px]">
 {viewingLead.notes || <span className="text-[#71717a] dark:text-gray-400 italic">No notes added to this lead yet.</span>}
 </div>
 </div>

 <div className="pt-6 border-t border-primary/40 flex gap-3">
 <button 
 onClick={() => { handleOpenModal(viewingLead); setViewingLead(null);}}
 className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white rounded-md-xl text-sm font-semibold hover:bg-primary/90 transition-colors "
 >
 <Edit2 className="w-4 h-4" /> Edit Profile
 </button>
 <button 
 onClick={() => handleDeleteLead(viewingLead.id)}
 className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-md-xl hover:bg-red-100 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 </div>
 )}
 </SheetContent>
 </Sheet>

 </div>
 );
}
