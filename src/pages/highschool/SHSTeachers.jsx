import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, User, BookOpen, GraduationCap, Users} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSTeachers() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [teachers, setTeachers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newTeacher, setNewTeacher] = useState({
 firstName: '',
 lastName: '',
 email: '',
 phone: '',
 qualification: '',
 specialization: '',
 hireDate: new Date().toISOString().split('T')[0],
 status: 'Active'
});

 const fetchTeachers = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_teacher', user?.company_id);
 setTeachers(records);
} catch (error) {
 console.error('Failed to fetch teachers:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchTeachers();
}
}, [user]);

 const handleAddTeacher = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_teacher',
 title: `${newTeacher.firstName} ${newTeacher.lastName}`,
 case_number: `TCH-${Math.floor(Math.random() * 10000)}`,
 status: newTeacher.status,
 data: newTeacher
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewTeacher({
 firstName: '', lastName: '', email: '', phone: '', qualification: '', specialization: '', hireDate: new Date().toISOString().split('T')[0], status: 'Active'
});
 fetchTeachers();
} catch (error) {
 console.error('Failed to add teacher:', error);
}
};

 const filteredTeachers = teachers.filter(t => 
 t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 t.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 t.data?.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Teaching Staff
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Manage teacher profiles, qualifications, and department assignments.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Add Teacher
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Total Teachers</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{teachers.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <User className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Active Staff</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">
 {teachers.filter(t => t.status === 'Active').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-amber-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <GraduationCap className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">On Leave</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">
 {teachers.filter(t => t.status === 'On Leave').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Staff Directory</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-muted-foreground" />
 <Input 
 placeholder="Search name or specialization..." 
 className="pl-9 h-9 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Loading staff...</div>
 ) : filteredTeachers.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary mx-auto flex items-center justify-center mb-4">
 <Users className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No teachers found</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">Register a new teacher to populate the directory.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
 {filteredTeachers.map(teacher => (
 <div key={teacher.id} className="group p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card hover:border-primary dark:border-primary/30 -purple-500/5 transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 flex items-center justify-center text-xl font-black text-primary dark:text-primary/70">
 {teacher.title.charAt(0)}
 </div>
 <div>
 <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary dark:text-primary/70 transition-colors">{teacher.title}</h4>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">{teacher.case_number}</p>
 </div>
 </div>
 <Badge variant="outline" className={
 teacher.status === 'Active' ? 'bg-slate-50 dark:bg-secondary/50 text-primary/90 border-primary/20' :
 'bg-amber-50 text-amber-700 border-amber-200'
}>
 {teacher.status}
 </Badge>
 </div>
 
 <div className="space-y-2 mt-4 text-sm">
 <div className="flex items-center justify-between text-slate-600 dark:text-foreground">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Specialization</span>
 <span className="font-medium">{teacher.data?.specialization || 'N/A'}</span>
 </div>
 <div className="flex items-center justify-between text-slate-600 dark:text-foreground">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Qualification</span>
 <span className="font-medium">{teacher.data?.qualification || 'N/A'}</span>
 </div>
 <div className="flex items-center justify-between text-slate-600 dark:text-foreground">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Phone</span>
 <span className="font-medium">{teacher.data?.phone || 'N/A'}</span>
 </div>
 </div>
 
 <div className="mt-5 pt-4 border-t border-primary/40 flex justify-between gap-2">
 <Button variant="outline" size="sm" className="flex-1 rounded-xl border-primary/40 dark:border-primary/40 text-slate-600 dark:text-foreground hover:text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary">
 Profile
 </Button>
 <Button variant="outline" size="sm" className="flex-1 rounded-xl border-primary/40 dark:border-primary/40 text-slate-600 dark:text-foreground hover:text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary">
 Subjects
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Register Teacher</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Add a new staff member to the teaching directory.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary">
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">First Name</label>
 <Input 
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.firstName}
 onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Last Name</label>
 <Input 
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.lastName}
 onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})}
 />
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Email</label>
 <Input 
 type="email"
 placeholder="e.g. teacher@school.edu"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.email}
 onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Phone</label>
 <Input 
 placeholder="e.g. +233 55 123 4567"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.phone}
 onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Specialization</label>
 <Input 
 placeholder="e.g. Mathematics, Science, English"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.specialization}
 onChange={e => setNewTeacher({...newTeacher, specialization: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Qualification</label>
 <Input 
 placeholder="e.g. B.Ed, M.Sc, PhD"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.qualification}
 onChange={e => setNewTeacher({...newTeacher, qualification: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Status</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newTeacher.status}
 onChange={e => setNewTeacher({...newTeacher, status: e.target.value})}
 >
 <option value="Active">Active</option>
 <option value="On Leave">On Leave</option>
 </select>
 </div>
 </div>

 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-foreground">
 Cancel
 </Button>
 <Button 
 onClick={handleAddTeacher} 
 disabled={!newTeacher.firstName || !newTeacher.lastName}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Save Teacher
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
