import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 ClipboardList, Plus, Search, Filter, BarChart3, 
 Send, Users, CheckCircle2, MessageSquare, Edit3, Trash2,
 PieChart
} from 'lucide-react';

export default function UnivSurvey({
 title = 'Surveys & Feedback',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'surveys';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingSurvey, setEditingSurvey] = useState(null);

 const [formState, setFormState] = useState({
 title: '',
 type: 'Pulse', // Pulse, 360 Review, NPS, Custom
 status: 'Draft', // Draft, Active, Closed
 responses: 0,
 target_audience: 'All Employees',
 questions: [{ text: 'How satisfied are you?', type: 'Rating'}]
});

 const { data: surveys = [], isLoading} = useQuery({
 queryKey: ['surveys', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_surveys`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const filteredSurveys = useMemo(() => {
 let filtered = surveys;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(s => 
 (s.title || '').toLowerCase().includes(q) || 
 (s.type || '').toLowerCase().includes(q)
 );
}
 return filtered;
}, [surveys, searchQuery]);

 const saveMutation = useMutation({
 mutationFn: async (surveyData) => {
 const isNew = !surveyData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_surveys`, data: surveyData};
} else {
 payload = { ...surveyData, company_id: effectiveCompanyId};
}

 if (isNew) {
 const { error} = await (async () => {
 const _p = payload;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
} else {
 const updatePayload = targetTable === 'industry_records' ? { data: surveyData} : surveyData;
 await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, surveyData.id]);})();
 const error = null; const data = [];
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['surveys', effectiveCompanyId, effectivePageName]);
 setIsModalOpen(false);
 toast({ title: 'Survey saved successfully.'});
}
});

 const deleteMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['surveys', effectiveCompanyId, effectivePageName]);
 toast({ title: 'Survey deleted.'});
}
});

 const handleSave = (e) => {
 e.preventDefault();
 if (!formState.title) return;
 saveMutation.mutate(formState);
};

 const openNewModal = () => {
 setEditingSurvey(null);
 setFormState({
 title: '',
 type: 'Pulse',
 status: 'Draft',
 responses: 0,
 target_audience: 'All Employees',
 questions: [{ text: 'How satisfied are you?', type: 'Rating'}]
});
 setIsModalOpen(true);
};

 const openEditModal = (survey) => {
 setEditingSurvey(survey);
 setFormState({ ...survey});
 setIsModalOpen(true);
};

 const getStatusStyle = (status) => {
 if (status === 'Active') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800';
 if (status === 'Closed') return 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40';
 if (status === 'Draft') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800';
 return 'bg-muted text-muted-foreground';
};

 // Stats
 const activeCount = surveys.filter(s => s.status === 'Active').length;
 const totalResponses = surveys.reduce((acc, s) => acc + (Number(s.responses) || 0), 0);

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 
 {/* Header */}
 <div className="border-b border-primary/40 bg-card px-6 sm:px-8 py-6 shrink-0 z-10 relative">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
 <ClipboardList className="w-6 h-6 text-primary" /> {title}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Design pulse surveys, 360 reviews, and track employee feedback.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={openNewModal}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Create Survey
 </button>
 </div>
 </div>

 {/* Global Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
 <div className="bg-card border border-primary/40 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
 <ClipboardList className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Surveys</div>
 <div className="text-xl font-bold text-foreground">{surveys.length}</div>
 </div>
 </div>
 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Now</div>
 <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{activeCount}</div>
 </div>
 </div>
 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Responses</div>
 <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalResponses}</div>
 </div>
 </div>
 </div>
 
 {/* Toolbar */}
 <div className="mt-6 flex items-center gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search surveys..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 <button className="h-10 px-4 bg-background border border-primary/40 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-muted transition-colors ">
 <Filter className="w-4 h-4 text-muted-foreground" /> Filter
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-muted/10 custom-scrollbar">
 <div className="max-w-7xl mx-auto space-y-4">
 {filteredSurveys.length === 0 ? (
 <div className="text-center py-20 text-muted-foreground">
 <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
 <h3 className="text-lg font-bold text-foreground">No surveys found</h3>
 <p className="text-sm mt-1">Create your first survey to start collecting feedback.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {filteredSurveys.map(survey => (
 <div key={survey.id} className="bg-card border border-primary/40 rounded-2xl p-6 transition- group relative flex flex-col">
 <div className="flex justify-between items-start mb-4">
 <div>
 <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border mb-2 inline-block", getStatusStyle(survey.status))}>
 {survey.status}
 </span>
 <h3 className="text-lg font-bold text-foreground line-clamp-1">{survey.title}</h3>
 <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
 <span className="font-semibold">{survey.type}</span> • <span>{survey.target_audience}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEditModal(survey)} className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"><Edit3 className="w-4 h-4" /></button>
 <button onClick={() => { if(window.confirm('Delete survey?')) deleteMutation.mutate(survey.id);}} className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="mt-auto pt-6 border-t border-primary/40 flex items-center justify-between">
 <div className="flex items-center gap-4 text-sm">
 <div className="flex items-center gap-1.5 text-foreground font-medium"><Users className="w-4 h-4 text-primary" /> {survey.responses} Responses</div>
 <div className="flex items-center gap-1.5 text-muted-foreground"><MessageSquare className="w-4 h-4" /> {survey.questions?.length || 0} Qs</div>
 </div>
 {survey.status === 'Active' && (
 <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80">
 View Results <BarChart3 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Edit/New Modal */}
 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: 20}}
 className="relative w-full max-w-2xl bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-primary/40 flex items-center justify-between bg-muted/20">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <ClipboardList className="w-5 h-5 text-primary" />
 {editingSurvey ? 'Edit Survey' : 'New Survey'}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="survey-form" onSubmit={handleSave} className="space-y-6">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Survey Title *</label>
 <input required type="text" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Type</label>
 <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Pulse</option>
 <option>360 Review</option>
 <option>NPS</option>
 <option>Custom</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Target Audience</label>
 <input type="text" value={formState.target_audience} onChange={e => setFormState({...formState, target_audience: e.target.value})} placeholder="e.g. Engineering Team" className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
 <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Draft</option>
 <option>Active</option>
 <option>Closed</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Responses (Simulated)</label>
 <input type="number" min="0" value={formState.responses} onChange={e => setFormState({...formState, responses: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2 border-b border-primary/40 pb-2">
 <label className="block text-xs font-semibold text-muted-foreground uppercase">Questions</label>
 <button 
 type="button" 
 onClick={() => setFormState({...formState, questions: [...(formState.questions||[]), {text: 'New Question', type: 'Rating'}]})}
 className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
 >
 <Plus className="w-3 h-3" /> Add Question
 </button>
 </div>
 <div className="space-y-3">
 {(formState.questions || []).map((q, idx) => (
 <div key={idx} className="flex gap-2">
 <input 
 type="text" value={q.text} 
 onChange={(e) => {
 const qs = [...formState.questions];
 qs[idx].text = e.target.value;
 setFormState({...formState, questions: qs});
}}
 className="flex-1 h-9 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" 
 />
 <select 
 value={q.type} 
 onChange={(e) => {
 const qs = [...formState.questions];
 qs[idx].type = e.target.value;
 setFormState({...formState, questions: qs});
}}
 className="w-32 h-9 px-2 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none"
 >
 <option>Rating</option>
 <option>Text</option>
 <option>Multiple Choice</option>
 </select>
 <button 
 type="button"
 onClick={() => {
 const qs = formState.questions.filter((_, i) => i !== idx);
 setFormState({...formState, questions: qs});
}}
 className="p-2 text-muted-foreground hover:text-red-500"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>

 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="survey-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Saving...' : 'Save Survey'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
