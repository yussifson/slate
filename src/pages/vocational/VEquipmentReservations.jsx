import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import { Search, Plus, Calendar, Edit, Trash2, Clock, CheckCircle2, XCircle, AlertCircle} from 'lucide-react';

export default function VEquipmentReservations() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [reservations, setReservations] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [currentRecord, setCurrentRecord] = useState(null);
 const [formData, setFormData] = useState({ title: '', status: 'Pending', equipment_name: '', reserved_by: '', start_date: '', end_date: ''});

 const fetchReservations = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_reservation', user?.company_id);
 setReservations(records);
} catch (error) {
 console.error('Failed to fetch reservations:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) fetchReservations();
}, [user]);

 const handleSave = async () => {
 try {
 const payload = {
 title: formData.title,
 status: formData.status,
 company_id: user.company_id,
 data: {
 equipment_name: formData.equipment_name,
 reserved_by: formData.reserved_by,
 start_date: formData.start_date,
 end_date: formData.end_date
}
};
 if (currentRecord?.id) {
 await base44.updateEntity('voc_reservation', currentRecord.id, payload);
} else {
 await base44.createEntity('voc_reservation', payload);
}
 setIsModalOpen(false);
 fetchReservations();
} catch (err) {
 console.error(err);
}
};

 const handleDelete = async (id) => {
 if (!window.confirm('Cancel and delete this reservation?')) return;
 try {
 await base44.deleteEntity('voc_reservation', id);
 fetchReservations();
} catch (err) {
 console.error(err);
}
};

 const openModal = (record = null) => {
 if (record) {
 setCurrentRecord(record);
 setFormData({
 title: record.title || '',
 status: record.status || 'Pending',
 equipment_name: record.data?.equipment_name || '',
 reserved_by: record.data?.reserved_by || '',
 start_date: record.data?.start_date || '',
 end_date: record.data?.end_date || ''
});
} else {
 setCurrentRecord(null);
 setFormData({ title: '', status: 'Pending', equipment_name: '', reserved_by: '', start_date: '', end_date: ''});
}
 setIsModalOpen(true);
};

 const filtered = reservations.filter(r => 
 r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 r.data?.reserved_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 r.data?.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex-1 space-y-6 p-8 bg-slate-50/50 dark:bg-transparent dark:bg-card/50 min-h-screen animate-in fade-in duration-300">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 dark:from-primary/70 dark:to-white bg-clip-text text-transparent flex items-center gap-3 tracking-[-0.02em]">
 <div className="p-2 bg-slate-100 dark:bg-slate-500 rounded-xl text-primary dark:text-primary/70">
 <Calendar className="w-6 h-6" />
 </div>
 Equipment Reservations
 </h2>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">Book tools and heavy machinery for classes or exams.</p>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input 
 placeholder="Search reservations..." 
 className="pl-9 w-[250px] bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 focus-visible:ring-primary rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl -emerald-200 transition-all hover:scale-105">
 <Plus className="w-4 h-4" /> New Booking
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
 <Clock className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Pending Requests</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{reservations.filter(r => r.status === 'Pending').length}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70">
 <CheckCircle2 className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Approved</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{reservations.filter(r => r.status === 'Approved').length}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
 <XCircle className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Cancelled</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{reservations.filter(r => r.status === 'Cancelled').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="bg-white dark:bg-card/40/80 dark:bg-card/80 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ScrollArea className="h-[500px]">
 {loading ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400">Loading reservations...</div>
 ) : filtered.length === 0 ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400 flex flex-col items-center">
 <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
 <p>No reservations found matching your criteria.</p>
 </div>
 ) : (
 <div className="p-0">
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {filtered.map(item => (
 <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:bg-transparent dark:hover:bg-slate-800/50 transition-colors group">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70 font-semibold shrink-0">
 <Calendar className="w-6 h-6" />
 </div>
 <div>
 <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 dark:text-white group-hover:text-primary transition-colors">{item.title}</h4>
 <div className="flex items-center gap-3 text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
 <span className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">{item.data?.equipment_name || 'No Equipment Specified'}</span>
 <span>•</span>
 <span>By: {item.data?.reserved_by || 'Unknown'}</span>
 <span>•</span>
 <span>{item.data?.start_date} to {item.data?.end_date}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <Badge className={
 item.status === 'Approved' ? 'bg-slate-100 text-primary/90 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary/70' :
 item.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400' :
 item.status === 'Cancelled' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400' :
 'bg-slate-100 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
} variant="secondary">
 {item.status}
 </Badge>
 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <Button variant="ghost" size="icon" onClick={() => openModal(item)} className="h-8 w-8 text-primary hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-primary/20">
 <Edit className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </ScrollArea>
 </Card>

 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white dark:bg-card/40 dark:bg-card border-none ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DialogHeader>
 <DialogTitle className="text-xl font-semibold">{currentRecord ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Reservation Title</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Workshop Practical Exam" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Equipment Needed</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.equipment_name} onChange={e => setFormData({...formData, equipment_name: e.target.value})} placeholder="e.g. CNC Machine A" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Reserved By</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.reserved_by} onChange={e => setFormData({...formData, reserved_by: e.target.value})} placeholder="e.g. Instructor Smith" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Start Date & Time</label>
 <Input type="datetime-local" className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">End Date & Time</label>
 <Input type="datetime-local" className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
 </div>
 </div>
 <div className="space-y-2 mt-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Status</label>
 <select 
 className="flex h-10 w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
 value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
 >
 <option value="Pending">Pending</option>
 <option value="Approved">Approved</option>
 <option value="Active">Active</option>
 <option value="Completed">Completed</option>
 <option value="Cancelled">Cancelled</option>
 </select>
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>Save Reservation</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
