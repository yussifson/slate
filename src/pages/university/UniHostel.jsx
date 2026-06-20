import React, { useState} from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Home, Bed, Wrench, Users, AlertTriangle, Plus, CheckCircle2} from 'lucide-react';
import OrbitTable from '@/components/university/OrbitTable';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';
import { useToast} from "@/components/ui/use-toast";

function cn(...classes) { return classes.filter(Boolean).join(' ');}

export default function UniHostel() {
 const companyId = useCompanyId();
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('overview');
 const [allocForm, setAllocForm] = useState({ studentId: '', block: 'A', roomNumber: ''});
 const [ticketForm, setTicketForm] = useState({ room: '', issue: '', priority: 'Medium'});

 const { data: students = []} = useQuery({ queryKey: ["clients", companyId, "uni_student"], queryFn: () => powerSync.execute('SELECT * FROM uni_students WHERE company_id = ?', [companyId]).then(r => r.rows._array), enabled: !!companyId});
 const { data: ticketRecords = []} = useQuery({ queryKey: ["cases", companyId, "uni_hostel_ticket"], queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_hostel_ticket'}), enabled: !!companyId});

 const parsedStudents = students.map(s => { let extra = {}; try { extra = JSON.parse(s.extra_data || '{}');} catch(e) {} return { id: s.id, name: s.name, hostel: extra.hostel || null, room: extra.room || null};});
 const allocatedStudents = parsedStudents.filter(s => s.hostel);
 const tickets = ticketRecords.map(t => { let extra = {}; try { extra = JSON.parse(t.notes || '{}');} catch(e) {} return { id: t.id, room: extra.room || 'N/A', issue: extra.issue || t.case_name || 'Maintenance Issue', priority: extra.priority || 'Medium', status: extra.status || 'Open', createdAt: t.created_date || 'N/A'};});

 const allocateMutation = useMutation({
 mutationFn: async ({ studentId, block, roomNumber}) => {
 const student = students.find(s => s.id === studentId); if (!student) return;
 let extra = {}; try { extra = JSON.parse(student.extra_data || '{}');} catch(e) {}
 extra.hostel = `Block ${block}`; extra.room = roomNumber;
 await base44.entities.Client.update(studentId, { extra_data: JSON.stringify(extra)});
},
 onSuccess: () => { queryClient.invalidateQueries(["clients", companyId, "uni_student"]); toast({ title: "Room Allocated"}); setAllocForm({ studentId: '', block: 'A', roomNumber: ''}); setActiveTab('overview');}
});

 const ticketMutation = useMutation({
 mutationFn: (ticket) => base44.entities.LegalCase.create(ticket),
 onSuccess: () => { queryClient.invalidateQueries(["cases", companyId, "uni_hostel_ticket"]); toast({ title: "Ticket Created"}); setTicketForm({ room: '', issue: '', priority: 'Medium'}); setActiveTab('overview');}
});

 const handleAllocate = (e) => { e.preventDefault(); if (!allocForm.studentId || !allocForm.roomNumber) { toast({ title: "Validation", description: "Fill all fields.", variant: "destructive"}); return;} allocateMutation.mutate(allocForm);};
 const handleTicket = (e) => { e.preventDefault(); if (!ticketForm.room || !ticketForm.issue) { toast({ title: "Validation", description: "Fill all fields.", variant: "destructive"}); return;} ticketMutation.mutate({ company_id: companyId, case_name: ticketForm.issue, case_type: 'uni_hostel_ticket', notes: JSON.stringify({ room: ticketForm.room, issue: ticketForm.issue, priority: ticketForm.priority, status: 'Open'})});};

 const inputClass = "w-full bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";
 const stats = [
 { label: 'Total Beds', value: '1,200', icon: Bed, color: 'var(--primary)'},
 { label: 'Occupied', value: allocatedStudents.length, icon: Users, color: 'var(--color-success)'},
 { label: 'Work Orders', value: tickets.filter(t => t.status === 'Open').length, icon: Wrench, color: 'var(--color-warning)'},
 { label: 'Urgent Faults', value: tickets.filter(t => t.priority === 'High').length, icon: AlertTriangle, color: 'var(--color-danger)'}
 ];

 const ticketColumns = [
 { id: 'room', header: 'Room', render: (_, r) => <span className="font-mono font-semibold">{r.room}</span>},
 { id: 'issue', header: 'Issue', render: (_, r) => <span className="text-[var(--color-text-primary)]">{r.issue}</span>},
 { id: 'priority', header: 'Priority', render: (_, r) => <OrbitStatusBadge status={r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'info'} label={r.priority} />},
 { id: 'status', header: 'Status', render: (_, r) => <OrbitStatusBadge status={r.status === 'Open' ? 'warning' : 'success'} label={r.status} />}
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-end justify-between border-b border-primary/40 pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Hostel & Housing</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage room allocations, maintenance tickets, and housing capacity.</p>
 </div>
 <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {[{ id: 'overview', label: 'Overview'}, { id: 'allocate', label: 'Allocate'}, { id: 'tickets', label: 'Tickets'}].map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("px-4 py-1.5 text-[var(--text-sm)] font-medium rounded-md-[var(--radius-md)] transition-all", activeTab === tab.id ? "bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[0.5px] border-black/9 dark:border-white/8 border-transparent")}>{tab.label}</button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <div key={i} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">{stat.label}</p>
 <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight tracking-[-0.02em]">{stat.value}</h3>
 </div>
 <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`}}>
 <stat.icon className="w-6 h-6" style={{ color: stat.color}} />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="min-h-[400px]">
 {activeTab === 'overview' && (
 <div className="space-y-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
 <div className="p-4 border-b border-primary/40"><h3 className="font-semibold text-[var(--color-text-primary)]">Housing Directory</h3></div>
 <div className="p-4 space-y-2">
 {allocatedStudents.length === 0 ? (
 <p className="text-center text-[var(--color-text-tertiary)] py-8">No room allocations yet.</p>
 ) : allocatedStudents.map((s, i) => (
 <div key={i} className="flex justify-between items-center p-3 bg-[var(--color-surface-1)] rounded-md-[var(--radius-md)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-semibold tracking-[0.04em]">{s.name?.substring(0, 2).toUpperCase()}</div>
 <span className="font-medium text-[var(--color-text-primary)]">{s.name}</span>
 </div>
 <div className="text-right">
 <span className="font-mono text-[var(--text-sm)] text-[var(--color-text-secondary)]">{s.hostel} · Room {s.room}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 {tickets.length > 0 && <OrbitTable columns={ticketColumns} data={tickets} title="Maintenance Tickets" showToolbar={true} />}
 </div>
 )}

 {activeTab === 'allocate' && (
 <div className="max-w-lg mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 ">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)] mb-6 tracking-[-0.02em]">Room Allocation</h2>
 <form onSubmit={handleAllocate} className="space-y-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Student</label>
 <select value={allocForm.studentId} onChange={e => setAllocForm({ ...allocForm, studentId: e.target.value})} className={inputClass} required>
 <option value="">-- Select Student --</option>
 {parsedStudents.filter(s => !s.hostel).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Block</label>
 <select value={allocForm.block} onChange={e => setAllocForm({ ...allocForm, block: e.target.value})} className={inputClass}>
 {['A','B','C','D','E'].map(b => <option key={b} value={b}>Block {b}</option>)}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Room Number</label>
 <input placeholder="e.g. 205" value={allocForm.roomNumber} onChange={e => setAllocForm({ ...allocForm, roomNumber: e.target.value})} className={inputClass} required />
 </div>
 </div>
 <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md-[var(--radius-md)] transition-all"><Home className="w-4 h-4" /> Allocate Room</button>
 </form>
 </div>
 )}

 {activeTab === 'tickets' && (
 <div className="max-w-lg mx-auto bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-8 ">
 <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight text-[var(--color-text-primary)] mb-6 tracking-[-0.02em]">New Maintenance Ticket</h2>
 <form onSubmit={handleTicket} className="space-y-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Room Number</label>
 <input placeholder="e.g. B-305" value={ticketForm.room} onChange={e => setTicketForm({ ...ticketForm, room: e.target.value})} className={inputClass} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Issue Description</label>
 <textarea value={ticketForm.issue} onChange={e => setTicketForm({ ...ticketForm, issue: e.target.value})} placeholder="Describe issue..." className={cn(inputClass, "min-h-[100px]")} required />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Priority</label>
 <select value={ticketForm.priority} onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value})} className={inputClass}>
 <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High (Urgent)</option>
 </select>
 </div>
 <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-warning)] hover:opacity-90 text-white font-medium rounded-md-[var(--radius-md)] transition-all"><Wrench className="w-4 h-4" /> Submit Ticket</button>
 </form>
 </div>
 )}
 </div>
 </div>
 );
}
