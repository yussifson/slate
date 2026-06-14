import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Clock, Search, Plus, Edit, Trash2, CalendarCheck} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Shifts() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('shift');
 // Load staff instead of just manually typing names
 const { data: staffRecords = []} = useIndustryRecords('staff');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const staffList = staffRecords.map(r => ({
 id: r.id,
 name: r.data?.full_name || r.data?.name || 'Unnamed Staff',
 role: r.data?.role || 'Staff'
}));

 const shifts = dbRecords.map(r => ({
 id: r.id,
 staffId: r.data?.staffId || '',
 staffName: r.data?.staffId ? (staffList.find(s => s.id === r.data.staffId)?.name || 'Unknown') : (r.data?.staffName || 'Unnamed Staff'),
 role: r.data?.role || 'Cashier',
 date: r.data?.date || new Date().toISOString().split('T')[0],
 startTime: r.data?.startTime || '09:00',
 endTime: r.data?.endTime || '17:00',
 status: r.data?.status || 'Scheduled'
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingId, setEditingId] = useState(null);

 const [formData, setFormData] = useState({
 staffId: '', role: 'Cashier', date: '', startTime: '', endTime: '', status: 'Scheduled'
});

 const openEdit = (sh) => {
 setEditingId(sh.id);
 setFormData({ staffId: sh.staffId, role: sh.role, date: sh.date, startTime: sh.startTime, endTime: sh.endTime, status: sh.status});
 setShowModal(true);
};

 const handleSave = () => {
 const selectedStaff = staffList.find(s => s.id === formData.staffId);
 
 mutateRecord.mutate({
 ...(editingId ? { id: editingId} : {}),
 recordType: 'shift',
 payload: {
 staffId: formData.staffId, 
 staffName: selectedStaff?.name || '',
 role: formData.role, 
 date: formData.date,
 startTime: formData.startTime, 
 endTime: formData.endTime, 
 status: formData.status
},
 status: 'active',
 searchText: `${selectedStaff?.name || ''} ${formData.role} ${formData.date}`
}, {
 onSuccess: () => {
 toast.success(editingId ? 'Shift updated!' : 'Shift scheduled!');
 setShowModal(false);
 setEditingId(null);
}
});
};

 const filtered = shifts.filter(s => 
 s.staffName.toLowerCase().includes(search.toLowerCase()) || 
 s.date.includes(search)
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">Staff Shifts</h1>
 <p className="text-sm text-muted-foreground mt-0.5">Manage schedules and rosters for your retail staff.</p>
 </div>
 <Button onClick={() => { setEditingId(null); setFormData({ staffId: '', role: 'Cashier', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '17:00', status: 'Scheduled'}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> Schedule Shift
 </Button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-orange-600"><Clock className="w-5 h-5" /></div>
 <div><p className="text-2xl font-bold text-card-foreground">{shifts.length}</p><p className="text-xs text-muted-foreground">Total Shifts</p></div>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-primary/20 flex items-center justify-center text-primary"><CalendarCheck className="w-5 h-5" /></div>
 <div><p className="text-2xl font-bold text-card-foreground">{shifts.filter(s => s.status === 'Completed').length}</p><p className="text-xs text-muted-foreground">Completed Shifts</p></div>
 </div>
 </div>

 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search staff name or date..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No shifts scheduled.</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Staff Name</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Role</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Time</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(s => (
 <tr key={s.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-bold text-card-foreground">{s.staffName}</td>
 <td className="px-6 py-4 text-muted-foreground">{s.role}</td>
 <td className="px-6 py-4 font-medium">{s.date}</td>
 <td className="px-6 py-4 text-center">{s.startTime} - {s.endTime}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${s.status === 'Completed' ? 'bg-slate-100 text-primary/90' : s.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{s.status}</span>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
 <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTargetId(s.id)}><Trash2 className="w-4 h-4" /></Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4">
 <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Shift' : 'Schedule Shift'}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Staff Member</label>
 <select value={formData.staffId} onChange={e => {
 const sId = e.target.value;
 const role = staffList.find(s => s.id === sId)?.role || formData.role;
 setFormData({...formData, staffId: sId, role: role});
}} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
 <option value="">Select Staff...</option>
 {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
 <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1" placeholder="e.g. Cashier" />
 </div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">Date</label><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value})} className="mt-1" /></div>
 <div className="grid grid-cols-2 gap-4">
 <div><label className="text-xs font-bold text-muted-foreground uppercase">Start Time</label><Input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value})} className="mt-1" /></div>
 <div><label className="text-xs font-bold text-muted-foreground uppercase">End Time</label><Input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value})} className="mt-1" /></div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
 <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
 <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
 <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'shift'}); setDeleteTargetId(null);}} title="Delete Shift" message="Are you sure you want to delete this shift?" />
 </div>
 );
}
