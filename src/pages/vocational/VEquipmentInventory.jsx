import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import { Search, Plus, Package, Wrench, Settings, Trash2, Edit, AlertCircle} from 'lucide-react';

export default function VEquipmentInventory() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [equipment, setEquipment] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [currentRecord, setCurrentRecord] = useState(null);
 const [formData, setFormData] = useState({ title: '', status: 'Available', serial: '', category: '', condition: 'Good'});

 const fetchEquipment = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_equipment', user?.company_id);
 setEquipment(records);
} catch (error) {
 console.error('Failed to fetch equipment:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) fetchEquipment();
}, [user]);

 const handleSave = async () => {
 try {
 const payload = {
 title: formData.title,
 status: formData.status,
 company_id: user.company_id,
 data: {
 serial: formData.serial,
 category: formData.category,
 condition: formData.condition
}
};
 if (currentRecord?.id) {
 await base44.updateEntity('voc_equipment', currentRecord.id, payload);
} else {
 await base44.createEntity('voc_equipment', payload);
}
 setIsModalOpen(false);
 fetchEquipment();
} catch (err) {
 console.error(err);
}
};

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this equipment?')) return;
 try {
 await base44.deleteEntity('voc_equipment', id);
 fetchEquipment();
} catch (err) {
 console.error(err);
}
};

 const openModal = (record = null) => {
 if (record) {
 setCurrentRecord(record);
 setFormData({
 title: record.title || '',
 status: record.status || 'Available',
 serial: record.data?.serial || '',
 category: record.data?.category || '',
 condition: record.data?.condition || 'Good'
});
} else {
 setCurrentRecord(null);
 setFormData({ title: '', status: 'Available', serial: '', category: '', condition: 'Good'});
}
 setIsModalOpen(true);
};

 const filtered = equipment.filter(e => 
 e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 e.data?.serial?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex-1 space-y-6 p-8 bg-slate-50/50 dark:bg-transparent dark:bg-card/50 min-h-screen animate-in fade-in duration-300">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 dark:from-primary/70 dark:to-white bg-clip-text text-transparent flex items-center gap-3 tracking-[-0.02em]">
 <div className="p-2 bg-slate-100 dark:bg-slate-500 rounded-xl text-primary dark:text-primary/70">
 <Package className="w-6 h-6" />
 </div>
 Equipment Inventory
 </h2>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">Manage workshop tools and heavy machinery.</p>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input 
 placeholder="Search equipment..." 
 className="pl-9 w-[250px] bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 focus-visible:ring-primary rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl -indigo-200 transition-all hover:scale-105">
 <Plus className="w-4 h-4" /> Add Equipment
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70">
 <Settings className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Total Equipment</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{equipment.length}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70">
 <Package className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Available</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{equipment.filter(e => e.status === 'Available').length}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-card/40/60 dark:bg-card/60 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
 <Wrench className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Under Maintenance</p>
 <h3 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{equipment.filter(e => e.status === 'Maintenance').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="bg-white dark:bg-card/40/80 dark:bg-card/80 backdrop-blur-xl border-none rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ScrollArea className="h-[500px]">
 {loading ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400">Loading equipment...</div>
 ) : filtered.length === 0 ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400 flex flex-col items-center">
 <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
 <p>No equipment found matching your criteria.</p>
 </div>
 ) : (
 <div className="p-0">
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {filtered.map(item => (
 <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:bg-transparent dark:hover:bg-slate-800/50 transition-colors group">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary/70 font-semibold shrink-0">
 <Settings className="w-6 h-6" />
 </div>
 <div>
 <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 dark:text-white group-hover:text-primary transition-colors">{item.title}</h4>
 <div className="flex items-center gap-3 text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">
 <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">SN: {item.data?.serial || 'N/A'}</span>
 <span>•</span>
 <span>{item.data?.category || 'Uncategorized'}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <Badge className={
 item.status === 'Available' ? 'bg-slate-100 text-primary/90 hover:bg-primary/20 dark:bg-primary/20 dark:text-primary/70' :
 item.status === 'Maintenance' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400' :
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
 <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-card/40 dark:bg-card border-none ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DialogHeader>
 <DialogTitle className="text-xl font-semibold">{currentRecord ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Name / Model</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Bosch Hammer Drill" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Serial Number</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.serial} onChange={e => setFormData({...formData, serial: e.target.value})} placeholder="SN-12345" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Status</label>
 <select 
 className="flex h-10 w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
 value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
 >
 <option value="Available">Available</option>
 <option value="In Use">In Use</option>
 <option value="Maintenance">Maintenance</option>
 <option value="Retired">Retired</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Category</label>
 <Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Power Tools" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Condition</label>
 <select 
 className="flex h-10 w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
 value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}
 >
 <option value="New">New</option>
 <option value="Good">Good</option>
 <option value="Fair">Fair</option>
 <option value="Poor">Poor</option>
 </select>
 </div>
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>Save Record</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
