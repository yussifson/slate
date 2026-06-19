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
import { Search, Plus, Wrench, Edit, Trash2, Clock, CheckCircle2, AlertTriangle, Hammer, DollarSign} from 'lucide-react';

export default function VMaintenance() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [maintenanceRecords, setMaintenanceRecords] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [currentRecord, setCurrentRecord] = useState(null);
 const [formData, setFormData] = useState({ title: '', status: 'Scheduled', equipment_name: '', technician: '', scheduled_date: '', cost: '', notes: ''});

 const fetchMaintenance = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_maintenance', user?.company_id);
 setMaintenanceRecords(records);
} catch (error) {
 console.error('Failed to fetch maintenance records:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) fetchMaintenance();
}, [user]);

 const handleSave = async () => {
 try {
 const payload = {
 title: formData.title,
 status: formData.status,
 company_id: user.company_id,
 data: {
 equipment_name: formData.equipment_name,
 technician: formData.technician,
 scheduled_date: formData.scheduled_date,
 cost: formData.cost,
 notes: formData.notes
}
};
 if (currentRecord?.id) {
 await base44.updateEntity('voc_maintenance', currentRecord.id, payload);
} else {
 await base44.createEntity('voc_maintenance', payload);
}
 setIsModalOpen(false);
 fetchMaintenance();
} catch (err) {
 console.error(err);
}
};

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
 try {
 await base44.deleteEntity('voc_maintenance', id);
 fetchMaintenance();
} catch (err) {
 console.error(err);
}
};

 const openModal = (record = null) => {
 if (record) {
 setCurrentRecord(record);
 setFormData({
 title: record.title || '',
 status: record.status || 'Scheduled',
 equipment_name: record.data?.equipment_name || '',
 technician: record.data?.technician || '',
 scheduled_date: record.data?.scheduled_date || '',
 cost: record.data?.cost || '',
 notes: record.data?.notes || ''
});
} else {
 setCurrentRecord(null);
 setFormData({ title: '', status: 'Scheduled', equipment_name: '', technician: '', scheduled_date: '', cost: '', notes: ''});
}
 setIsModalOpen(true);
};

 const filtered = maintenanceRecords.filter(m => 
 m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 m.data?.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 m.data?.technician?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex-1 space-y-6 p-8 bg-slate-50/50 dark:bg-transparent dark:bg-slate-900/50 min-h-screen animate-in fade-in duration-300">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 dark:from-primary/70 dark:to-white bg-clip-text text-transparent flex items-center gap-3 tracking-[-0.02em]">
 <div className="p-2 bg-slate-100 dark:bg-slate-500 rounded-md-xl text-primary dark:text-primary/70">
 <Wrench className="w-6 h-6" />
 </div>
 Equipment Maintenance
 </h2>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">Schedule and track maintenance, repairs, and calibration.</p>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input 
 placeholder="Search tasks..." 
 className="pl-9 w-[250px] bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 focus-visible:ring-primary rounded-md-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-md-xl -purple-200 transition-all hover:scale-105">
 <Plus className="w-4 h-4" /> New Task
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <Card className="bg-white dark:bg-slate-900/40/60 dark:bg-slate-900/60 backdrop-blur-xl border-none rounded-md-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex flex-col justify-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-md-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
 <Hammer className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Total Tasks</p>
 <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{maintenanceRecords.length}</h3>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900/40/60 dark:bg-slate-900/60 backdrop-blur-xl border-none rounded-md-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex flex-col justify-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-md-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
 <Clock className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Scheduled</p>
 <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{maintenanceRecords.filter(m => m.status === 'Scheduled').length}</h3>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900/40/60 dark:bg-slate-900/60 backdrop-blur-xl border-none rounded-md-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex flex-col justify-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-md-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
 <AlertTriangle className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Overdue</p>
 <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{maintenanceRecords.filter(m => m.status === 'Overdue').length}</h3>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900/40/60 dark:bg-slate-900/60 backdrop-blur-xl border-none rounded-md-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex flex-col justify-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Completed</p>
 <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{maintenanceRecords.filter(m => m.status === 'Completed').length}</h3>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="bg-white dark:bg-slate-900/40/80 dark:bg-slate-900/80 backdrop-blur-xl border-none rounded-md-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ScrollArea className="h-[500px]">
 {loading ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400">Loading maintenance tasks...</div>
 ) : filtered.length === 0 ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400 flex flex-col items-center">
 <AlertTriangle className="w-10 h-10 mb-3 text-slate-300" />
 <p>No maintenance tasks found.</p>
 </div>
 ) : (
 <div className="p-0">
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {filtered.map(item => (
 <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:bg-transparent dark:hover:bg-slate-800/50 transition-colors group">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70 font-semibold shrink-0">
 <Wrench className="w-6 h-6" />
 </div>
 <div>
 <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 dark:text-white group-hover:text-primary transition-colors">{item.title}</h4>
 <div className="flex items-center gap-3 text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
 <span className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">Eq: {item.data?.equipment_name || 'Unspecified'}</span>
 <span>•</span>
 <span>Tech: {item.data?.technician || 'Pending Assignment'}</span>
 <span>•</span>
 <span>Date: {item.data?.scheduled_date || 'TBD'}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-6">
 {item.data?.cost && (
 <div className="hidden md:flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
 <DollarSign className="w-4 h-4 text-primary mr-1" />
 {item.data.cost}
 </div>
 )}
 <Badge className={
 item.status === 'Completed' ? 'bg-slate-100 text-primary/90 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary/70' :
 item.status === 'In Progress' ? 'bg-orange-100 text-orange-700 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary/70' :
 item.status === 'Scheduled' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400' :
 item.status === 'Overdue' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400' :
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
 <DialogContent className="sm:max-w-[500px] rounded-md-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-none ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DialogHeader>
 <DialogTitle className="text-xl font-semibold">{currentRecord ? 'Edit Maintenance Task' : 'New Maintenance Task'}</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Task Title</label>
 <Input className="rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Annual Calibration" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Equipment Name</label>
 <Input className="rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.equipment_name} onChange={e => setFormData({...formData, equipment_name: e.target.value})} placeholder="e.g. Lathe Machine" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Technician</label>
 <Input className="rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.technician} onChange={e => setFormData({...formData, technician: e.target.value})} placeholder="e.g. Mike R." />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Scheduled Date</label>
 <Input type="date" className="rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Cost (optional)</label>
 <Input className="rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="e.g. 150.00" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Status</label>
 <select 
 className="flex h-10 w-full items-center justify-between rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
 value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
 >
 <option value="Scheduled">Scheduled</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 <option value="Overdue">Overdue</option>
 </select>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Notes / Details</label>
 <textarea 
 className="flex w-full rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 py-2 text-sm border-none min-h-[80px] focus:outline-none"
 value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details..."
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" className="rounded-md-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button className="rounded-md-xl bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>Save Task</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
