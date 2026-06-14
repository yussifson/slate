import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Book, Target, Layers} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSSubjects() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [subjects, setSubjects] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newSubject, setNewSubject] = useState({
 name: '',
 code: '',
 type: 'Core', // Core or Elective
 department: '',
 credits: 3
});

 const fetchSubjects = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_subject', user?.company_id);
 setSubjects(records);
} catch (error) {
 console.error('Failed to fetch subjects:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchSubjects();
}
}, [user]);

 const handleAddSubject = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_subject',
 title: newSubject.name,
 case_number: newSubject.code || `SUB-${Math.floor(Math.random() * 1000)}`,
 status: 'Active',
 data: newSubject
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewSubject({ name: '', code: '', type: 'Core', department: '', credits: 3});
 fetchSubjects();
} catch (error) {
 console.error('Failed to add subject:', error);
}
};

 const filteredSubjects = subjects.filter(s => 
 s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 s.data?.department?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Curriculum Subjects
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Define core and elective subjects for academic programmes.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Add Subject
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Book className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Subjects</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{subjects.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <Target className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Core Subjects</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {subjects.filter(s => s.data?.type === 'Core').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-amber-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <Layers className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Elective Subjects</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {subjects.filter(s => s.data?.type === 'Elective').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Subjects Register</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search subject or code..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading subjects...</div>
 ) : filteredSubjects.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Book className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No subjects defined</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create a new subject to populate the curriculum.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
 {filteredSubjects.map(subject => (
 <div key={subject.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900/40 dark:bg-slate-900 hover:border-primary dark:border-primary/30 -purple-500/5 transition-all duration-300">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary dark:text-primary/70 transition-colors">{subject.title}</h4>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{subject.case_number}</p>
 </div>
 <Badge variant="outline" className={
 subject.data?.type === 'Core' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 'bg-amber-50 text-amber-700 border-amber-200'
}>
 {subject.data?.type}
 </Badge>
 </div>
 
 <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-sm">
 <span className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Dept: <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">{subject.data?.department || 'General'}</strong></span>
 <span className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Credits: <strong className="text-primary dark:text-primary/70">{subject.data?.credits || 3}</strong></span>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Add Subject</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Register a new subject for the academic curriculum.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject Name</label>
 <Input 
 placeholder="e.g. Integrated Science"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newSubject.name}
 onChange={e => setNewSubject({...newSubject, name: e.target.value})}
 />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject Code</label>
 <Input 
 placeholder="e.g. ISC101"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newSubject.code}
 onChange={e => setNewSubject({...newSubject, code: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Type</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newSubject.type}
 onChange={e => setNewSubject({...newSubject, type: e.target.value})}
 >
 <option value="Core">Core Subject</option>
 <option value="Elective">Elective Subject</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Department</label>
 <Input 
 placeholder="e.g. Science, Mathematics, Languages"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newSubject.department}
 onChange={e => setNewSubject({...newSubject, department: e.target.value})}
 />
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credits / Weighting</label>
 <Input 
 type="number"
 min="1"
 max="10"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newSubject.credits}
 onChange={e => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 3})}
 />
 </div>

 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddSubject} 
 disabled={!newSubject.name}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 Save Subject
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
