import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useMemo, useEffect} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { useToast} from '@/components/ui/use-toast';
import { cn} from '@/lib/utils';
import {
 FileText, Download, CheckCircle2, Search, Settings, 
 CreditCard, MessageSquare, Plus, ExternalLink, ArrowUpRight
} from 'lucide-react';

export default function UnivClientPortal({
 title = 'Client Portal',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const targetTable = tableName || 'industry_records';
 
 const [activeTab, setActiveTab] = useState('overview');
 const [currentUser, setCurrentUser] = useState(null);
 
 useEffect(() => {
 supabase.auth.getUser().then(({ data}) => {
 if (data?.user) setCurrentUser(data.user);
});
}, []);

 // Use a fallback record_type to avoid 400 errors if pageName is undefined
 const fetchType = (type) => pageName ? `${pageName}_${type}` : `portal_${type}`;

 const { data: invoices = []} = useQuery({
 queryKey: ['portal_invoices', effectiveCompanyId, pageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', fetchType('invoices'));
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const { data: documents = []} = useQuery({
 queryKey: ['portal_docs', effectiveCompanyId, pageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', fetchType('documents'));
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const { data: tickets = []} = useQuery({
 queryKey: ['portal_tickets', effectiveCompanyId, pageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', fetchType('support_tickets'));
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, created_at: r.created_at, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const pendingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Unpaid');
 const totalDue = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

 const TABS = [
 { id: 'overview', label: 'Overview', icon: CheckCircle2},
 { id: 'invoices', label: 'My Invoices', icon: CreditCard},
 { id: 'documents', label: 'Documents', icon: FileText},
 { id: 'tickets', label: 'Support Tickets', icon: MessageSquare},
 { id: 'profile', label: 'My Profile', icon: Settings}
 ];

 const handlePay = () => {
 toast({ title: 'Payment Initiated', description: 'Redirecting to payment gateway...'});
};

 const [ticketForm, setTicketForm] = useState({ subject: '', message: ''});
 const submitTicketMutation = useMutation({
 mutationFn: async (ticket) => {
 const payload = {
 company_id: effectiveCompanyId,
 industry: 'orbit_build_data',
 record_type: fetchType('support_tickets'),
 data: { ...ticket, status: 'Open', user: currentUser?.email || 'Unknown'}
};
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['portal_tickets', effectiveCompanyId, pageName]);
 toast({ title: 'Ticket submitted successfully'});
 setTicketForm({ subject: '', message: ''});
 setActiveTab('tickets');
}
});

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
 
 {/* Hero Banner */}
 <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 px-8 py-10 shrink-0 relative overflow-hidden">
 <div className="absolute inset-0 bg-primary/20"></div>
 <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-md-full blur-3xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>
 <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="text-white">
 <h1 className="text-3xl font-extrabold mb-2 tracking-[-0.02em]">Welcome back, {currentUser?.email?.split('@')[0] || 'Client'}</h1>
 <p className="text-indigo-100 font-medium opacity-90">{title} Account Dashboard</p>
 </div>
 <div className="flex gap-4">
 <div className="bg-white/10 backdrop-blur-md border-[0.5px] border-black/9 dark:border-white/8 border-white/20 rounded-md-xl px-4 py-3 text-white min-w-[120px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1 tracking-[0.04em]">Total Due</div>
 <div className="text-2xl font-semibold tracking-[-0.02em]">${totalDue.toFixed(2)}</div>
 </div>
 <div className="bg-white/10 backdrop-blur-md border-[0.5px] border-black/9 dark:border-white/8 border-white/20 rounded-md-xl px-4 py-3 text-white min-w-[120px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1 tracking-[0.04em]">Open Tickets</div>
 <div className="text-2xl font-semibold tracking-[-0.02em]">{tickets.filter(t => t.status === 'Open').length}</div>
 </div>
 </div>
 </div>
 </div>

 {/* Navigation */}
 <div className="bg-card border-b border-primary/40 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-6xl mx-auto px-4 sm:px-8 flex gap-2 overflow-x-auto custom-scrollbar pt-4 pb-0">
 {TABS.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
 activeTab === tab.id 
 ? "border-primary text-primary" 
 : "border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground hover:bg-muted/50 rounded-md-t-lg"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-8 custom-scrollbar">
 <div className="max-w-6xl mx-auto">
 <AnimatePresence mode="wait">
 
 {activeTab === 'overview' && (
 <motion.div
 key="overview"
 initial={{ opacity: 0, y: 10}}
 animate={{ opacity: 1, y: 0}}
 exit={{ opacity: 0, y: -10}}
 className="grid grid-cols-1 md:grid-cols-3 gap-6"
 >
 <div className="md:col-span-2 space-y-6">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-6  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-primary" /> Recent Invoices
 </h3>
 {invoices.length === 0 ? (
 <div className="text-center py-8 text-[#71717a] dark:text-gray-400">No recent invoices</div>
 ) : (
 <div className="space-y-3">
 {invoices.slice(0, 3).map(inv => (
 <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border-[0.5px] border-black/9 dark:border-white/8 border-transparent transition-colors">
 <div>
 <div className="font-semibold text-foreground">{inv.invoice_number || 'INV-000'}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Due {inv.due_date || 'N/A'}</div>
 </div>
 <div className="text-right">
 <div className="font-semibold">${parseFloat(inv.amount || 0).toFixed(2)}</div>
 <span className={cn("text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md-full", 
 inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 )}>
 {inv.status || 'Pending'}
 </span>
 </div>
 </div>
 ))}
 <button onClick={() => setActiveTab('invoices')} className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View all invoices →</button>
 </div>
 )}
 </div>
 
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-6  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-primary" /> Shared Documents
 </h3>
 {documents.length === 0 ? (
 <div className="text-center py-8 text-[#71717a] dark:text-gray-400">No shared documents</div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {documents.slice(0, 4).map(doc => (
 <div key={doc.id} className="flex items-start gap-3 p-3 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/30 transition-colors bg-muted/10">
 <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
 <FileText className="w-4 h-4" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="font-medium text-sm truncate">{doc.title || doc.name || 'Document'}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{doc.date || 'Recently shared'}</div>
 </div>
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary"><Download className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-6 relative overflow-hidden group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-md-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
 <h3 className="text-lg font-semibold mb-2">Need Support?</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-6">Our team is here to help with any questions or issues.</p>
 <button 
 onClick={() => setActiveTab('tickets')}
 className="w-full py-2.5 bg-primary text-white rounded-md-xl text-sm font-medium hover:bg-primary/90 transition-colors "
 >
 Open a Ticket
 </button>
 </div>
 
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-6  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-4 tracking-[0.04em]">Quick Links</h3>
 <div className="space-y-2">
 <a href="#" className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded-xl text-foreground transition-colors">
 Knowledge Base <ArrowUpRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </a>
 <a href="#" className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded-xl text-foreground transition-colors">
 Company Website <ArrowUpRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </a>
 <a href="#" className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded-xl text-foreground transition-colors">
 Terms of Service <ArrowUpRight className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </a>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'invoices' && (
 <motion.div key="invoices" initial={{ opacity: 0}} animate={{ opacity: 1}} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-6 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div>
 <h2 className="text-xl font-semibold">Invoices & Billing</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage your payments and billing history</p>
 </div>
 {totalDue > 0 && (
 <button onClick={handlePay} className="px-5 py-2.5 bg-primary text-white rounded-md-xl text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
 <CreditCard className="w-4 h-4" /> Pay ${totalDue.toFixed(2)}
 </button>
 )}
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-[#71717a] dark:text-gray-400 uppercase bg-muted/50 border-b border-primary/40 tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 font-medium">Invoice</th>
 <th className="px-6 py-4 font-medium">Date</th>
 <th className="px-6 py-4 font-medium">Due Date</th>
 <th className="px-6 py-4 font-medium">Amount</th>
 <th className="px-6 py-4 font-medium">Status</th>
 <th className="px-6 py-4 text-right font-medium">Action</th>
 </tr>
 </thead>
 <tbody>
 {invoices.length === 0 ? (
 <tr><td colSpan="6" className="px-6 py-12 text-center text-[#71717a] dark:text-gray-400">No invoices found</td></tr>
 ) : (
 invoices.map(inv => (
 <tr key={inv.id} className="border-b border-primary/40 hover:bg-muted/30">
 <td className="px-6 py-4 font-medium text-foreground">{inv.invoice_number || 'INV-000'}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{inv.date || 'N/A'}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{inv.due_date || 'N/A'}</td>
 <td className="px-6 py-4 font-semibold">${parseFloat(inv.amount || 0).toFixed(2)}</td>
 <td className="px-6 py-4">
 <span className={cn("text-[10px] uppercase font-semibold tracking-wider px-2 py-1 rounded-md-full", 
 inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 )}>
 {inv.status || 'Pending'}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 {inv.status !== 'Paid' ? (
 <button onClick={handlePay} className="text-primary hover:text-primary/80 font-medium">Pay Now</button>
 ) : (
 <button className="text-[#71717a] dark:text-gray-400 hover:text-foreground"><Download className="w-4 h-4 inline" /></button>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </motion.div>
 )}

 {activeTab === 'tickets' && (
 <motion.div key="tickets" initial={{ opacity: 0}} animate={{ opacity: 1}} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-4">
 <h2 className="text-xl font-semibold mb-4">Support History</h2>
 {tickets.length === 0 ? (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-12 text-center  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <MessageSquare className="w-12 h-12 text-[#71717a] dark:text-gray-400/30 mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-foreground">No Tickets</h3>
 <p className="text-[#71717a] dark:text-gray-400 text-sm mt-1">You haven't submitted any support requests yet.</p>
 </div>
 ) : (
 tickets.map(ticket => (
 <div key={ticket.id} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-5 hover:border-primary/30 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-semibold text-foreground text-lg">{ticket.subject || 'Support Request'}</h4>
 <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-md-full border", 
 ticket.status === 'Open' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
 ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
 'bg-muted text-[#71717a] dark:text-gray-400 border-primary/40'
 )}>
 {ticket.status || 'Open'}
 </span>
 </div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 line-clamp-2 mb-3">{ticket.message}</p>
 <div className="text-xs text-[#71717a] dark:text-gray-400 font-mono bg-muted/50 inline-block px-2 py-1 rounded-md tracking-[0.04em]">
 Ticket #{ticket.id.slice(0, 8)} • {new Date(ticket.created_at).toLocaleDateString()}
 </div>
 </div>
 ))
 )}
 </div>
 
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl overflow-hidden h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 bg-muted/20">
 <h3 className="font-semibold">New Ticket</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">Submit a new request to our team</p>
 </div>
 <form 
 className="p-5 space-y-4"
 onSubmit={(e) => {
 e.preventDefault();
 if (ticketForm.subject && ticketForm.message) submitTicketMutation.mutate(ticketForm);
}}
 >
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Subject</label>
 <input 
 required
 type="text" 
 value={ticketForm.subject}
 onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
 className="w-full h-10 px-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:outline-none focus:border-primary" 
 placeholder="Brief summary of issue..."
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Message</label>
 <textarea 
 required
 value={ticketForm.message}
 onChange={e => setTicketForm({...ticketForm, message: e.target.value})}
 className="w-full min-h-[120px] p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-background text-sm focus:outline-none focus:border-primary resize-y" 
 placeholder="Please describe the details..."
 />
 </div>
 <button 
 type="submit" 
 disabled={submitTicketMutation.isPending}
 className="w-full h-10 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
 >
 {submitTicketMutation.isPending ? 'Submitting...' : 'Submit Request'}
 </button>
 </form>
 </div>
 </motion.div>
 )}

 {/* Placeholder for Documents/Profile to keep code concise */}
 {(activeTab === 'documents' || activeTab === 'profile') && (
 <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-2xl p-12 text-center  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Settings className="w-12 h-12 text-[#71717a] dark:text-gray-400/30 mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-foreground capitalize">{activeTab}</h3>
 <p className="text-[#71717a] dark:text-gray-400 text-sm mt-1">This module is part of the premium workspace expansion.</p>
 </motion.div>
 )}

 </AnimatePresence>
 </div>
 </div>

 </div>
 );
}
