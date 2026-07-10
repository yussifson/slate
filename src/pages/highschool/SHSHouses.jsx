import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Home, Users, UserCheck} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSHouses() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [houses, setHouses] = useState([]);
 const [teachers, setTeachers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newHouse, setNewHouse] = useState({
 name: '',
 color: '#6F00FF',
 houseMasterId: '',
 capacity: 100,
 gender: 'Mixed' // Boys, Girls, Mixed
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [houseData, teacherData] = await Promise.all([
 base44.getEntities('shs_house', user?.company_id),
 base44.getEntities('shs_teacher', user?.company_id)
 ]);
 setHouses(houseData);
 setTeachers(teacherData);
} catch (error) {
 console.error('Failed to fetch data:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleAddHouse = async () => {
 try {
 const selectedMaster = teachers.find(t => t.id === newHouse.houseMasterId);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_house',
 title: newHouse.name,
 case_number: `HS-${Math.floor(Math.random() * 1000)}`,
 status: 'Active',
 data: {
 ...newHouse,
 houseMasterName: selectedMaster?.title || 'Unassigned'
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewHouse({ name: '', color: '#6F00FF', houseMasterId: '', capacity: 100, gender: 'Mixed'});
 fetchData();
} catch (error) {
 console.error('Failed to add house:', error);
}
};

 const filteredHouses = houses.filter(h => 
 h.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 h.data?.houseMasterName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Boarding Houses
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Manage student residences and assign House Masters.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Add House
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {loading ? (
 <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading houses...</div>
 ) : filteredHouses.length === 0 ? (
 <div className="col-span-full p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Home className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No houses defined</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create boarding houses to allocate students.</p>
 </div>
 ) : (
 filteredHouses.map(house => (
 <Card key={house.id} className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 hover:ring-primary/30 dark:hover:ring-primary/30 transition-all group overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div 
 className="absolute top-0 left-0 w-2 h-full" 
 style={{ backgroundColor: house.data?.color || '#6F00FF'}}
 ></div>
 <CardContent className="p-6 pl-8">
 <div className="flex justify-between items-start mb-4">
 <div 
 className="w-12 h-12 rounded-2xl flex items-center justify-center text-white "
 style={{ backgroundColor: house.data?.color || '#6F00FF'}}
 >
 <Home className="w-6 h-6" />
 </div>
 <Badge variant="outline" className={
 house.data?.gender === 'Boys' ? 'bg-orange-50 text-orange-700 border-primary/20' :
 house.data?.gender === 'Girls' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20'
}>
 {house.data?.gender || 'Mixed'}
 </Badge>
 </div>
 
 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{house.title}</h3>
 <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-6">{house.case_number}</p>
 
 <div className="space-y-3 mt-4 text-sm">
 <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 p-2 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40">
 <div className="w-8 h-8 rounded-xl bg-slate-100 text-primary flex items-center justify-center shrink-0">
 <UserCheck className="w-4 h-4" />
 </div>
 <div className="flex-1 overflow-hidden">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">House Master/Mistress</p>
 <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 truncate">{house.data?.houseMasterName || 'Unassigned'}</p>
 </div>
 </div>
 
 <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 p-2 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 text-center">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">Total Capacity</p>
 <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{house.data?.capacity || 100} Beds</p>
 </div>
 </div>
 
 <div className="mt-5 pt-4 border-t border-primary/40 flex justify-end gap-2">
 <Button variant="ghost" size="sm" className="w-full rounded-xl text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 font-semibold">
 Manage Residents <Users className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </div>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Add Boarding House</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Register a new residential hall for students.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">House Name</label>
 <Input 
 placeholder="e.g. Aggrey House"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.name}
 onChange={e => setNewHouse({...newHouse, name: e.target.value})}
 />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Theme Color</label>
 <div className="flex gap-2">
 <Input 
 type="color"
 className="w-12 h-11 p-1 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.color}
 onChange={e => setNewHouse({...newHouse, color: e.target.value})}
 />
 <Input 
 className="flex-1 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.color}
 onChange={e => setNewHouse({...newHouse, color: e.target.value})}
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Gender</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.gender}
 onChange={e => setNewHouse({...newHouse, gender: e.target.value})}
 >
 <option value="Boys">Boys Only</option>
 <option value="Girls">Girls Only</option>
 <option value="Mixed">Mixed</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">House Master/Mistress</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.houseMasterId}
 onChange={e => setNewHouse({...newHouse, houseMasterId: e.target.value})}
 >
 <option value="">Unassigned</option>
 {teachers.map(t => (
 <option key={t.id} value={t.id}>{t.title}</option>
 ))}
 </select>
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Bed Capacity</label>
 <Input 
 type="number"
 min="1"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newHouse.capacity}
 onChange={e => setNewHouse({...newHouse, capacity: parseInt(e.target.value) || 100})}
 />
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddHouse} 
 disabled={!newHouse.name}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Save House
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
