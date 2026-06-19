import React, { useState} from 'react';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import {
 CheckCircle, XCircle, RotateCcw, Clock, ChevronDown, ChevronRight,
 Plus, Trash2, Loader2, Search, CheckCheck, InboxIcon,
 ListFilter, LayoutTemplate, AlertCircle, User, CalendarDays, ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow, format, parseISO} from 'date-fns';
import { toast} from 'react-hot-toast';

import { powerSync} from "@/api/PowerSyncConnector";
import { supabase} from "@/api/supabaseClient";
import { useAuth} from '@/lib/AuthContext';
import { useCompanyId} from '@/hooks/useCompanyId';
import { Badge} from '@/components/ui/badge';
import { Button} from '@/components/ui/button';
import { cn} from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE = 'univ_approvals';
const TEMPLATES_TABLE = 'univ_approval_templates';

const STATUS_META = {
 pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', dot: 'bg-amber-400'},
 approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-400'},
 rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-400'},
 changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-400'},
};

const PRIORITY_META = {
 High: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'},
 Medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'},
 Low: { color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'},
};

const RECORD_TYPE_COLORS = {
 Leave: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
 Procurement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
 Document: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
 Recruitment: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
 Expense: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const RECORD_TYPE_COLOR = (type) =>
 RECORD_TYPE_COLORS[type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

const TABS = [
 { id: 'inbox', label: 'My Inbox', Icon: InboxIcon},
 { id: 'all', label: 'All Requests', Icon: ListFilter},
 { id: 'templates', label: 'Templates', Icon: LayoutTemplate},
];

// ─── Helper: days waiting ─────────────────────────────────────────────────────
function daysWaiting(dateStr) {
 if (!dateStr) return 0;
 return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status}) {
 const meta = STATUS_META[status] || STATUS_META.pending;
 return (
 <span className={cn('inline-flex items-center gap-2.5 px-2.5 py-0.5 rounded-md-full text-xs font-semibold', meta.color)}>
 <span className={cn('w-1.5 h-1.5 rounded-md-full', meta.dot)} />
 {meta.label}
 </span>
 );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function ConfirmActionDialog({ open, action, item, onClose, onConfirm}) {
 const [comment, setComment] = useState('');
 if (!open || !item) return null;

 const META = {
 approve: { label: 'Approve', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', title: 'Approve Request'},
 reject: { label: 'Reject', btn: 'bg-red-600 hover:bg-red-700 text-white', title: 'Reject Request'},
 changes_requested:{ label: 'Request Changes', btn: 'bg-amber-500 hover:bg-amber-600 text-white', title: 'Request Changes'},
};
 const m = META[action];

 return (
 <AnimatePresence>
 <motion.div
 initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm"
 onClick={onClose}
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0}} animate={{ scale: 1, opacity: 1}} exit={{ scale: 0.95, opacity: 0}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 w-full max-w-md rounded-md-2xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 onClick={e => e.stopPropagation()}
 >
 <div className="p-5 border-b border-primary/40 flex justify-between items-center">
 <h2 className="text-lg font-semibold text-foreground">{m.title}</h2>
 <button onClick={onClose} className="p-1.5 rounded-md-full hover:bg-muted">
 <XCircle className="w-5 h-5 text-[#71717a] dark:text-gray-400" />
 </button>
 </div>
 <div className="p-5 space-y-4">
 <p className="text-sm text-[#71717a] dark:text-gray-400">
 You are about to <strong className="text-foreground">{m.label.toLowerCase()}</strong> the request:{' '}
 <span className="font-semibold text-foreground">"{item.title}"</span>
 </p>
 <div>
 <label className="block text-xs font-semibold uppercase text-[#71717a] dark:text-gray-400 mb-1.5 tracking-[0.04em]">
 Comment <span className="font-normal text-[#71717a] dark:text-gray-400/60">(optional)</span>
 </label>
 <textarea
 value={comment}
 onChange={e => setComment(e.target.value)}
 rows={3}
 placeholder="Add a note for the requestor..."
 className="w-full px-3 py-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 <div className="flex justify-end gap-3 pt-1">
 <button onClick={onClose} className="h-10 px-5 rounded-md-xl bg-muted text-sm font-medium hover:bg-muted/80">
 Cancel
 </button>
 <button
 onClick={() => { onConfirm(comment); setComment('');}}
 className={cn('h-10 px-5 rounded-md-xl text-sm font-semibold transition-all', m.btn)}
 >
 {m.label}
 </button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 );
}

// ─── Approval Chain Timeline ───────────────────────────────────────────────────
function ApprovalChain({ steps = [], currentStep = 0}) {
 return (
 <div className="flex items-start gap-0 mt-3 overflow-x-auto pb-1">
 {steps.map((step, idx) => {
 const isComplete = idx < currentStep;
 const isCurrent = idx === currentStep;
 const isPending = idx > currentStep;
 return (
 <div key={idx} className="flex items-center shrink-0">
 <div className="flex flex-col items-center gap-2">
 <div className={cn(
 'w-8 h-8 rounded-md-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
 isComplete ? 'bg-emerald-500/10 border-emerald-500 text-white' :
 isCurrent ? 'bg-primary border-primary text-white animate-pulse' :
 'bg-muted border-primary/40 text-[#71717a] dark:text-gray-400'
 )}>
 {isComplete ? <CheckCheck className="w-4 h-4" /> : idx + 1}
 </div>
 <p className="text-[10px] font-semibold text-center text-[#71717a] dark:text-gray-400 whitespace-nowrap max-w-[80px] truncate">
 {step.stepName || `Step ${idx + 1}`}
 </p>
 <p className="text-[9px] text-center text-[#71717a] dark:text-gray-400/70 whitespace-nowrap max-w-[80px] truncate">
 {step.role || step.assignee || '—'}
 </p>
 {step.comment && (
 <p className="text-[9px] italic text-center text-[#71717a] dark:text-gray-400/60 max-w-[80px] truncate">
 "{step.comment}"
 </p>
 )}
 </div>
 {idx < steps.length - 1 && (
 <div className={cn(
 'h-0.5 w-8 mx-1 rounded-md-full transition-all',
 idx < currentStep ? 'bg-emerald-400' : 'bg-primary/40'
 )} />
 )}
 </div>
 );
})}
 </div>
 );
}

// ─── Inbox Item Card ──────────────────────────────────────────────────────────
function InboxCard({ item, onAction}) {
 const waiting = daysWaiting(item.created_at);
 const priority = item.priority || 'Medium';

 return (
 <motion.div
 initial={{ opacity: 0, y: 10}}
 animate={{ opacity: 1, y: 0}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-4 transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-md-xl bg-primary/10 flex items-center justify-center shrink-0">
 <CheckCircle className="w-5 h-5 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2.5 mb-1">
 <span className={cn('px-2 py-0.5 rounded-md-full text-[10px] font-semibold uppercase tracking-wide', RECORD_TYPE_COLOR(item.record_type))}>
 {item.record_type}
 </span>
 <span className={cn('px-2 py-0.5 rounded-md-full text-[10px] font-semibold', PRIORITY_META[priority]?.color)}>
 {priority}
 </span>
 <StatusBadge status={item.status} />
 </div>
 <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
 <div className="flex flex-wrap items-center gap-3 mt-1">
 <span className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <User className="w-3 h-3" /> {item.requestor_name}
 </span>
 <span className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <CalendarDays className="w-3 h-3" />
 {item.created_at ? format(parseISO(item.created_at), 'MMM d, yyyy') : '—'}
 </span>
 <span className={cn(
 'flex items-center gap-2 text-xs font-semibold',
 waiting > 3 ? 'text-red-500' : waiting > 1 ? 'text-amber-500' : 'text-[#71717a] dark:text-gray-400'
 )}>
 <Clock className="w-3 h-3" />
 {waiting === 0 ? 'Today' : `${waiting}d waiting`}
 </span>
 </div>
 </div>
 </div>

 {item.status === 'pending' && (
 <div className="flex gap-2 mt-4 pt-3 border-t border-primary/40">
 <button
 onClick={() => onAction('approve', item)}
 className="flex-1 h-9 rounded-md-xl bg-emerald-500/10/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2.5 hover:bg-emerald-500/10/20 transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 dark:border-emerald-800 tracking-[0.04em]"
 >
 <CheckCircle className="w-3.5 h-3.5" /> Approve
 </button>
 <button
 onClick={() => onAction('reject', item)}
 className="flex-1 h-9 rounded-md-xl bg-red-500/10/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2.5 hover:bg-red-500/10/20 transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-red-200 dark:border-red-800 tracking-[0.04em]"
 >
 <XCircle className="w-3.5 h-3.5" /> Reject
 </button>
 <button
 onClick={() => onAction('changes_requested', item)}
 className="flex-1 h-9 rounded-md-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-2.5 hover:bg-amber-500/20 transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-800 tracking-[0.04em]"
 >
 <RotateCcw className="w-3.5 h-3.5" /> Changes
 </button>
 </div>
 )}
 </motion.div>
 );
}

// ─── All Requests Table Row ────────────────────────────────────────────────────
function AllRequestsRow({ item, expanded, onToggle}) {
 const steps = item.steps || [];
 return (
 <>
 <tr
 className="border-b border-primary/40 hover:bg-muted/20 cursor-pointer transition-colors"
 onClick={onToggle}
 >
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <span className={cn(
 'transition-transform duration-200',
 expanded ? 'rotate-90' : 'rotate-0'
 )}>
 <ChevronRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </span>
 <span className="text-sm font-semibold text-foreground">{item.title}</span>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className={cn('px-2 py-0.5 rounded-md-full text-[10px] font-semibold uppercase tracking-wide', RECORD_TYPE_COLOR(item.record_type))}>
 {item.record_type}
 </span>
 </td>
 <td className="px-4 py-3 text-sm text-[#71717a] dark:text-gray-400">{item.requestor_name}</td>
 <td className="px-4 py-3 text-sm text-[#71717a] dark:text-gray-400">
 Step {(item.current_step || 0) + 1} of {steps.length || 1}
 </td>
 <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
 <td className="px-4 py-3 text-xs text-[#71717a] dark:text-gray-400 whitespace-nowrap tracking-[0.04em]">
 {item.updated_at ? formatDistanceToNow(new Date(item.updated_at), { addSuffix: true}) : '—'}
 </td>
 <td className="px-4 py-3 text-xs text-[#71717a] dark:text-gray-400 whitespace-nowrap tracking-[0.04em]">
 {item.created_at ? format(parseISO(item.created_at), 'MMM d, yyyy') : '—'}
 </td>
 </tr>
 <AnimatePresence>
 {expanded && (
 <tr>
 <td colSpan={7} className="px-0 py-0">
 <motion.div
 initial={{ opacity: 0, height: 0}}
 animate={{ opacity: 1, height: 'auto'}}
 exit={{ opacity: 0, height: 0}}
 className="overflow-hidden"
 >
 <div className="px-6 py-4 bg-muted/30 border-b border-primary/40">
 <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a] dark:text-gray-400 mb-2 tracking-[0.04em]">Approval Chain</p>
 {steps.length > 0 ? (
 <ApprovalChain steps={steps} currentStep={item.current_step || 0} />
 ) : (
 <p className="text-xs text-[#71717a] dark:text-gray-400 italic tracking-[0.04em]">No steps defined for this request.</p>
 )}
 </div>
 </motion.div>
 </td>
 </tr>
 )}
 </AnimatePresence>
 </>
 );
}

// ─── Templates Panel (Admin) ────────────────────────────────────────────────--
function TemplatesPanel({ companyId}) {
 const queryClient = useQueryClient();
 const [form, setForm] = useState({ name: '', steps: [{ stepName: '', role: ''}]});
 const [saving, setSaving] = useState(false);

 const { data: templates = [], isLoading} = useQuery({
 queryKey: ['univ_approval_templates', companyId],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM TEMPLATES_TABLE WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 return data || [];
},
 enabled: !!companyId,
});

 const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { stepName: '', role: ''}]}));
 const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i)}));
 const updateStep = (i, key, val) => setForm(f => ({
 ...f,
 steps: f.steps.map((s, idx) => idx === i ? { ...s, [key]: val} : s)
}));

 const handleSave = async (e) => {
 e.preventDefault();
 if (!form.name.trim()) return toast.error('Template name is required');
 if (form.steps.some(s => !s.stepName.trim())) return toast.error('All step names are required');
 setSaving(true);
 await (async () => {
 const _payload = { id: crypto.randomUUID(), company_id: companyId, name: form.name.trim(), steps: form.steps, created_at: new Date().toISOString()};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO TEMPLATES_TABLE (${_keys.join(',')}) VALUES (${_keys.map(()=>'?').join(',')})`, _vals); return { error: null};})();
 const error = null;
 setSaving(false);
 if (error) { toast.error('Failed to save template: ' + error.message); return;}
 toast.success('Template saved!');
 setForm({ name: '', steps: [{ stepName: '', role: ''}]});
 queryClient.invalidateQueries({ queryKey: ['univ_approval_templates', companyId]});
};

 const deleteTemplate = async (id) => {
 await powerSync.execute(`DELETE FROM TEMPLATES_TABLE WHERE id = ?`, [id]);
 const error = null;
 if (error) toast.error('Delete failed');
 else { toast.success('Template deleted'); queryClient.invalidateQueries({ queryKey: ['univ_approval_templates', companyId]});}
};

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Create form */}
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
 <Plus className="w-4 h-4 text-primary" /> New Template
 </h3>
 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold uppercase text-[#71717a] dark:text-gray-400 mb-1.5 tracking-[0.04em]">Template Name</label>
 <input
 value={form.name}
 onChange={e => setForm(f => ({ ...f, name: e.target.value}))}
 placeholder="e.g. Leave Approval"
 className="w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="block text-xs font-semibold uppercase text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Steps</label>
 <button type="button" onClick={addStep} className="text-xs text-primary font-semibold hover:underline flex items-center gap-2 tracking-[0.04em]">
 <Plus className="w-3 h-3" /> Add Step
 </button>
 </div>
 <div className="space-y-2">
 {form.steps.map((step, i) => (
 <div key={i} className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-md-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
 {i + 1}
 </div>
 <input
 value={step.stepName}
 onChange={e => updateStep(i, 'stepName', e.target.value)}
 placeholder="Step name (e.g. Line Manager)"
 className="flex-1 h-9 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-[0.04em]"
 />
 <input
 value={step.role}
 onChange={e => updateStep(i, 'role', e.target.value)}
 placeholder="Role (e.g. manager)"
 className="flex-1 h-9 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-[0.04em]"
 />
 {form.steps.length > 1 && (
 <button type="button" onClick={() => removeStep(i)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 <div className="flex justify-end pt-1">
 <button
 type="submit" disabled={saving}
 className="h-10 px-6 bg-primary text-white rounded-md-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
 >
 {saving && <Loader2 className="w-4 h-4 animate-spin" />}
 Save Template
 </button>
 </div>
 </form>
 </div>

 {/* Templates list */}
 <div className="space-y-3">
 <h3 className="text-base font-semibold text-foreground">Existing Templates</h3>
 {isLoading ? (
 <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
 ) : templates.length === 0 ? (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 rounded-md-2xl p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <LayoutTemplate className="w-10 h-10 text-[#71717a] dark:text-gray-400 mx-auto mb-2 opacity-40" />
 <p className="text-sm text-[#71717a] dark:text-gray-400">No templates yet. Create your first one.</p>
 </div>
 ) : (
 templates.map(t => (
 <motion.div
 key={t.id}
 initial={{ opacity: 0, y: 8}}
 animate={{ opacity: 1, y: 0}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-foreground">{t.name}</h4>
 <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {(t.steps || []).map((s, i) => (
 <React.Fragment key={i}>
 <div className="flex flex-col items-center gap-0.5">
 <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-xl text-[10px] font-semibold whitespace-nowrap">
 {s.stepName || `Step ${i + 1}`}
 </div>
 {s.role && <span className="text-[9px] text-[#71717a] dark:text-gray-400">{s.role}</span>}
 </div>
 {i < (t.steps || []).length - 1 && <ArrowRight className="w-3 h-3 text-[#71717a] dark:text-gray-400/50 shrink-0" />}
 </React.Fragment>
 ))}
 </div>
 </motion.div>
 ))
 )}
 </div>
 </div>
 );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UnivApprovalEngine() {
 const { user} = useAuth();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();

 const [activeTab, setActiveTab] = useState('inbox');
 const [search, setSearch] = useState('');
 const [expandedRow, setExpandedRow] = useState(null);
 const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, item: null});

 const isAdmin = user?.role === 'company_admin' || user?.role === 'admin' || user?.role === 'super_admin';

 // ── Fetch all approvals for the company ─────────────────────────────────────
 const { data: allApprovals = [], isLoading} = useQuery({
 queryKey: [TABLE, companyId],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM TABLE WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 return data || [];
},
 enabled: !!companyId,
});

 // ── My Inbox: approvals where current step's assignee matches my id/email ──
 const inboxItems = allApprovals.filter(a => {
 if (a.status !== 'pending') return false;
 const step = (a.steps || [])[a.current_step || 0];
 if (!step) return false;
 return (
 step.assignee_id === user?.id ||
 step.assignee_email?.toLowerCase() === user?.email?.toLowerCase()
 );
});

 // ── All Requests: filter by search ──────────────────────────────────────────
 const filteredAll = allApprovals.filter(a =>
 !search || [a.title, a.record_type, a.requestor_name, a.status]
 .join(' ').toLowerCase().includes(search.toLowerCase())
 );

 // ── Update (approve / reject / changes_requested) mutation ──────────────────
 const actionMutation = useMutation({
 mutationFn: async ({ id, status, stepIndex, comment}) => {
 // Update the step in the steps array
 const record = allApprovals.find(a => a.id === id);
 if (!record) throw new Error('Record not found');
 const steps = [...(record.steps || [])];
 if (steps[stepIndex]) {
 steps[stepIndex] = {
 ...steps[stepIndex],
 status,
 comment,
 actioned_by: user?.email,
 actioned_at: new Date().toISOString(),
};
}

 // Determine next step or final status
 let nextStep = stepIndex;
 let finalStatus = status;
 if (status === 'approved') {
 const nextIdx = stepIndex + 1;
 if (nextIdx < steps.length) {
 nextStep = nextIdx;
 finalStatus = 'pending'; // still pending, moved to next step
} else {
 finalStatus = 'approved'; // all steps approved
}
}

 const { error} = await supabase
 .from(TABLE)
 .update({
 status: finalStatus,
 current_step: nextStep,
 steps,
 updated_at: new Date().toISOString(),
})
 .eq('id', id);
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: [TABLE, companyId]});
 toast.success('Action recorded successfully!');
 setConfirmDialog({ open: false, action: null, item: null});
},
 onError: (err) => toast.error('Failed: ' + err.message),
});

 const handleAction = (action, item) => {
 setConfirmDialog({ open: true, action, item});
};

 const handleConfirm = (comment) => {
 const { action, item} = confirmDialog;
 actionMutation.mutate({
 id: item.id,
 status: action,
 stepIndex: item.current_step || 0,
 comment,
});
};

 return (
 <div className="h-full flex flex-col bg-background overflow-auto">
 {/* ── Header ── */}
 <div className="px-6 pt-6 pb-0 border-b border-primary/40 bg-card/60 backdrop-blur-sm shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-[-0.02em]">
 <div className="w-9 h-9 rounded-md-xl bg-primary/10 flex items-center justify-center">
 <CheckCircle className="w-5 h-5 text-primary" />
 </div>
 Approval Engine
 </h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">
 Multi-step approval management for any record type
 </p>
 </div>
 <div className="flex items-center gap-2">
 <div className="px-3 py-1.5 rounded-md-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2.5 tracking-[0.04em]">
 <Clock className="w-3.5 h-3.5" />
 {inboxItems.length} Pending
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-0 -mb-px">
 {TABS.filter(t => t.id !== 'templates' || isAdmin).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all',
 activeTab === tab.id
 ? 'border-primary text-primary'
 : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground'
 )}
 >
 <tab.Icon className="w-4 h-4" />
 {tab.label}
 {tab.id === 'inbox' && inboxItems.length > 0 && (
 <span className="w-5 h-5 rounded-md-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
 {inboxItems.length}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* ── Content ── */}
 <div className="flex-1 p-6 overflow-auto">
 {/* INBOX TAB */}
 {activeTab === 'inbox' && (
 <div className="space-y-3">
 {isLoading ? (
 <div className="flex justify-center items-center py-20">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 ) : inboxItems.length === 0 ? (
 <motion.div
 initial={{ opacity: 0, y: 12}}
 animate={{ opacity: 1, y: 0}}
 className="flex flex-col items-center justify-center py-20 text-center"
 >
 <div className="w-16 h-16 rounded-md-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
 <CheckCheck className="w-8 h-8 text-emerald-500" />
 </div>
 <h3 className="text-lg font-semibold text-foreground mb-1">All clear!</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400">No pending approvals require your action.</p>
 </motion.div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {inboxItems.map(item => (
 <InboxCard key={item.id} item={item} onAction={handleAction} />
 ))}
 </div>
 )}
 </div>
 )}

 {/* ALL REQUESTS TAB */}
 {activeTab === 'all' && (
 <div className="space-y-4">
 <div className="relative max-w-sm">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search requests..."
 className="w-full h-10 pl-9 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 {isLoading ? (
 <div className="flex justify-center items-center py-20">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 ) : (
 <div className="overflow-auto rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-sm min-w-[700px]">
 <thead className="border-b border-primary/40 bg-muted/40 sticky top-0">
 <tr>
 {['Title', 'Type', 'Requestor', 'Current Step', 'Status', 'Last Action', 'Date'].map(col => (
 <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 {col}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filteredAll.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-4 py-16 text-center text-[#71717a] dark:text-gray-400">
 <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
 No approval requests found.
 </td>
 </tr>
 ) : (
 filteredAll.map(item => (
 <AllRequestsRow
 key={item.id}
 item={item}
 expanded={expandedRow === item.id}
 onToggle={() => setExpandedRow(prev => prev === item.id ? null : item.id)}
 />
 ))
 )}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* TEMPLATES TAB (admin only) */}
 {activeTab === 'templates' && isAdmin && (
 <TemplatesPanel companyId={companyId} />
 )}
 {activeTab === 'templates' && !isAdmin && (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <AlertCircle className="w-10 h-10 text-[#71717a] dark:text-gray-400 opacity-40 mb-3" />
 <p className="text-sm text-[#71717a] dark:text-gray-400">Administrator access required to manage templates.</p>
 </div>
 )}
 </div>

 {/* ── Confirmation Dialog ── */}
 <ConfirmActionDialog
 open={confirmDialog.open}
 action={confirmDialog.action}
 item={confirmDialog.item}
 onClose={() => setConfirmDialog({ open: false, action: null, item: null})}
 onConfirm={handleConfirm}
 />
 </div>
 );
}

// ─── useApprovalEngine Hook (exportable utility for other components) ──────────
export function useApprovalEngine() {
 const companyId = useCompanyId();

 const submitRequest = async ({ recordType, recordId, title, requestorName, requestorId, steps = [], priority = 'Medium'}) => {
 if (!companyId) throw new Error('Company ID not available');

 const normalizedSteps = steps.map((s, i) => ({
 stepName: s.stepName || `Step ${i + 1}`,
 role: s.role || '',
 assignee_id: s.assignee_id || null,
 assignee_email: s.assignee_email || null,
 status: 'pending',
 comment: null,
 actioned_by: null,
 actioned_at: null,
}));

 const payload = {
 company_id: companyId,
 record_type: recordType,
 record_id: recordId || null,
 title,
 requestor_id: requestorId || null,
 requestor_name: requestorName,
 current_step: 0,
 steps: normalizedSteps,
 status: 'pending',
 priority,
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
};
 await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO TABLE (${_keys.join(',')}) VALUES (${_keys.map(()=>'?').join(',')})`, _vals); return { error: null};})();
 const data = payload;
 const error = null;

 if (error) throw error;
 return data;
};

 return { submitRequest};
}
