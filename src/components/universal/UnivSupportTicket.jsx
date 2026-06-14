import React, { useState, useMemo} from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import {
 LifeBuoy, Search, Plus, Filter, MessageSquare, 
 Clock, AlertCircle, CheckCircle2, User, 
 MoreHorizontal, Tag, Paperclip, Send
} from 'lucide-react';

const PRIORITY_COLORS = {
 'Low': 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40',
 'Medium': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800',
 'High': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
 'Urgent': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
};

const STATUS_COLORS = {
 'Open': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800',
 'In Progress': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800',
 'Waiting on Customer': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
 'Resolved': 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40',
 'Closed': 'bg-slate-100 text-slate-700 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40'
};

export default function UnivSupportTicket({
 title = 'Help Desk',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'support_tickets';
 const targetTable = tableName || 'industry_records';

 const [searchQuery, setSearchQuery] = useState('');
 const [activeTicketId, setActiveTicketId] = useState(null);
 const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
 const [replyInput, setReplyInput] = useState('');

 const [formState, setFormState] = useState({
 subject: '',
 requester: '',
 department: 'IT Support',
 priority: 'Medium',
 description: ''
});

 const { data: tickets = [], isLoading} = useQuery({
 queryKey: ['tickets', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_tickets`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, created_at: r.created_at, ...(targetTable === 'industry_records' ? r.data : r)}))
 .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
},
 enabled: !!effectiveCompanyId
});

 const filteredTickets = useMemo(() => {
 let filtered = tickets;
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(t => 
 (t.subject || '').toLowerCase().includes(q) || 
 (t.requester || '').toLowerCase().includes(q) ||
 (t.ticket_id || '').toLowerCase().includes(q)
 );
}
 return filtered;
}, [tickets, searchQuery]);

 const activeTicket = useMemo(() => tickets.find(t => t.id === activeTicketId), [tickets, activeTicketId]);

 const saveMutation = useMutation({
 mutationFn: async (ticketData) => {
 const isNew = !ticketData.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_tickets`, data: ticketData};
} else {
 payload = { ...ticketData, company_id: effectiveCompanyId};
}

 if (isNew) {
 await (async () => {
 const _p = {
 ...payload,
 data: {
 ...payload.data,
 ticket_id: `TKT-${Math.floor(Math.random()*100000).toString().padStart(5, '0')}`,
 status: 'Open',
 messages: [{ sender: ticketData.requester || 'User', content: ticketData.description, timestamp: new Date().toISOString()}]
}
};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO ${targetTable} (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v); return { error: null};})();
 const error = null;
 if (error) throw error;
} else {
 const updatePayload = targetTable === 'industry_records' ? { data: ticketData} : ticketData;
 await (async () => { const _p = updatePayload; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, ticketData.id]);})();
 const error = null;
 if (error) throw error;
}
},
 onSuccess: () => {
 queryClient.invalidateQueries(['tickets', effectiveCompanyId, effectivePageName]);
 setIsNewTicketOpen(false);
 setReplyInput('');
 toast({ title: 'Ticket saved successfully.'});
}
});

 const handleCreate = (e) => {
 e.preventDefault();
 if (!formState.subject || !formState.requester) return;
 saveMutation.mutate(formState);
};

 const handleReply = () => {
 if (!replyInput.trim() || !activeTicket) return;
 const updatedMessages = [...(activeTicket.messages || []), {
 sender: 'Support Agent',
 content: replyInput,
 timestamp: new Date().toISOString()
}];
 saveMutation.mutate({ ...activeTicket, messages: updatedMessages, status: 'Waiting on Customer'});
};

 const updateStatus = (newStatus) => {
 if (!activeTicket) return;
 saveMutation.mutate({ ...activeTicket, status: newStatus});
};

 return (
 <div className="flex h-full w-full bg-background font-sans overflow-hidden">
 
 {/* Sidebar - Ticket List */}
 <div className="w-80 md:w-96 border-r border-primary/40 bg-card flex flex-col shrink-0">
 <div className="p-4 border-b border-primary/40 z-10">
 <div className="flex items-center justify-between mb-4">
 <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
 <LifeBuoy className="w-5 h-5 text-primary" /> {title}
 </h1>
 <button 
 onClick={() => setIsNewTicketOpen(true)}
 className="p-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search tickets..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-9 pl-9 pr-3 bg-muted/50 border border-primary/40 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {filteredTickets.length === 0 ? (
 <div className="p-8 text-center text-muted-foreground">
 <p className="text-sm">No tickets found.</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {filteredTickets.map(ticket => (
 <button
 key={ticket.id}
 onClick={() => setActiveTicketId(ticket.id)}
 className={cn(
 "w-full text-left p-4 hover:bg-muted/50 transition-colors focus:outline-none",
 activeTicketId === ticket.id ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-transparent"
 )}
 >
 <div className="flex items-start justify-between gap-2 mb-1">
 <span className="font-semibold text-foreground text-sm line-clamp-1">{ticket.subject}</span>
 <span className="text-[10px] font-mono text-muted-foreground shrink-0">{ticket.ticket_id}</span>
 </div>
 <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
 <span className="truncate">{ticket.requester}</span> • 
 <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border", STATUS_COLORS[ticket.status] || STATUS_COLORS['Open'])}>
 {ticket.status}
 </span>
 <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border", PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS['Medium'])}>
 {ticket.priority}
 </span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Main Area - Ticket Detail */}
 <div className="flex-1 flex flex-col bg-muted/10 relative">
 {activeTicket ? (
 <>
 <div className="border-b border-primary/40 bg-card px-6 py-4 z-10 shrink-0">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h2 className="text-xl font-bold text-foreground">{activeTicket.subject}</h2>
 <span className="px-2 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border">{activeTicket.ticket_id}</span>
 </div>
 <div className="text-sm text-muted-foreground flex items-center gap-4">
 <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {activeTicket.requester}</span>
 <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {activeTicket.department}</span>
 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(activeTicket.created_at).toLocaleString()}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <select 
 value={activeTicket.status} 
 onChange={e => updateStatus(e.target.value)}
 className={cn("h-9 px-3 rounded-lg border text-sm font-bold uppercase tracking-wider outline-none focus:ring-2", STATUS_COLORS[activeTicket.status] || STATUS_COLORS['Open'])}
 >
 <option value="Open">Open</option>
 <option value="In Progress">In Progress</option>
 <option value="Waiting on Customer">Waiting on Customer</option>
 <option value="Resolved">Resolved</option>
 <option value="Closed">Closed</option>
 </select>
 <button className="p-2 border border-primary/40 bg-background rounded-lg hover:bg-muted text-muted-foreground transition-colors">
 <MoreHorizontal className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
 {(activeTicket.messages || []).map((msg, idx) => {
 const isAgent = msg.sender === 'Support Agent';
 return (
 <div key={idx} className={cn("flex gap-4", isAgent ? "flex-row-reverse" : "flex-row")}>
 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-white ", isAgent ? "bg-primary" : "bg-slate-400")}>
 {msg.sender.charAt(0)}
 </div>
 <div className={cn("max-w-[80%] space-y-1", isAgent ? "items-end text-right" : "items-start text-left")}>
 <div className={cn("flex items-baseline gap-2", isAgent && "flex-row-reverse")}>
 <span className="font-semibold text-sm text-foreground">{msg.sender}</span>
 <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString(undefined, {hour: '2-digit', minute:'2-digit'})}</span>
 </div>
 <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ", isAgent ? "bg-primary text-white rounded-tr-none" : "bg-card border border-primary/40 text-foreground rounded-tl-none")}>
 {msg.content}
 </div>
 </div>
 </div>
 );
})}
 </div>

 <div className="p-4 bg-card border-t border-primary/40 shrink-0">
 <div className="bg-background border border-primary/40 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
 <textarea
 value={replyInput}
 onChange={e => setReplyInput(e.target.value)}
 placeholder="Type your reply to the customer..."
 className="w-full p-4 bg-transparent border-none outline-none text-foreground resize-none min-h-[100px] focus:ring-0"
 />
 <div className="bg-muted/30 px-3 py-2 flex items-center justify-between border-t border-primary/40">
 <div className="flex items-center gap-1 text-muted-foreground">
 <button className="p-1.5 hover:bg-muted rounded hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
 </div>
 <button 
 onClick={handleReply}
 disabled={!replyInput.trim() || saveMutation.isPending}
 className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center gap-2 text-sm font-medium "
 >
 <Send className="w-4 h-4" /> Reply
 </button>
 </div>
 </div>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
 <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
 <h3 className="text-xl font-bold text-foreground mb-1">No ticket selected</h3>
 <p>Select a ticket from the sidebar to view details or reply.</p>
 </div>
 )}
 </div>

 {/* New Ticket Modal */}
 <AnimatePresence>
 {isNewTicketOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewTicketOpen(false)} />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: 20}}
 className="relative w-full max-w-lg bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="px-6 py-4 border-b border-primary/40 bg-muted/20">
 <h2 className="text-lg font-bold text-foreground">Create New Ticket</h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 <form id="new-ticket-form" onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Subject *</label>
 <input required type="text" value={formState.subject} onChange={e => setFormState({...formState, subject: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Requester Email *</label>
 <input required type="email" value={formState.requester} onChange={e => setFormState({...formState, requester: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Priority</label>
 <select value={formState.priority} onChange={e => setFormState({...formState, priority: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>Low</option>
 <option>Medium</option>
 <option>High</option>
 <option>Urgent</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Department</label>
 <select value={formState.department} onChange={e => setFormState({...formState, department: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none">
 <option>IT Support</option>
 <option>Billing</option>
 <option>Sales</option>
 <option>General Inquiry</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Initial Description</label>
 <textarea required value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full h-32 p-3 rounded-lg border border-primary/40 bg-background text-sm focus:border-primary focus:outline-none resize-none" />
 </div>
 </form>
 </div>
 
 <div className="px-6 py-4 border-t border-primary/40 bg-muted/20 flex justify-end gap-3">
 <button type="button" onClick={() => setIsNewTicketOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
 <button type="submit" form="new-ticket-form" disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
 {saveMutation.isPending ? 'Creating...' : 'Create Ticket'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
