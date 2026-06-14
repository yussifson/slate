import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Calendar, FileText, CheckCircle2, AlertCircle} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSInternalExams() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [exams, setExams] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newExam, setNewExam] = useState({
 examName: '',
 academicYear: new Date().getFullYear().toString(),
 term: 'Term 1',
 startDate: '',
 endDate: '',
 type: 'End of Term' // End of Term, Mid-Term
});

 const fetchExams = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_exam', user?.company_id);
 setExams(records);
} catch (error) {
 console.error('Failed to fetch exams:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchExams();
}
}, [user]);

 const handleCreateExam = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_exam',
 title: newExam.examName,
 case_number: `EXM-${Math.floor(Math.random() * 10000)}`,
 status: 'Upcoming', // Upcoming, Ongoing, Completed, Published
 data: newExam
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewExam({
 examName: '', academicYear: new Date().getFullYear().toString(), term: 'Term 1', startDate: '', endDate: '', type: 'End of Term'
});
 fetchExams();
} catch (error) {
 console.error('Failed to create exam:', error);
}
};

 const updateExamStatus = async (examId, newStatus) => {
 try {
 await base44.updateEntity(examId, { status: newStatus});
 fetchExams();
} catch (error) {
 console.error('Failed to update exam status:', error);
}
};

 const filteredExams = exams.filter(e => 
 e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 e.data?.academicYear?.includes(searchQuery)
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Internal Examinations
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage school-wide assessment cycles, mid-terms, and end-of-term exams.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Create Exam Cycle
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <FileText className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Exams</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{exams.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <AlertCircle className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Ongoing</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {exams.filter(e => e.status === 'Ongoing').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-amber-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Published Results</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {exams.filter(e => e.status === 'Published').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Exam Cycles</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search exams..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading exams...</div>
 ) : filteredExams.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <FileText className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No exams found</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create an exam cycle to begin assessing students.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Exam Name</th>
 <th className="px-6 py-4">Academic Term</th>
 <th className="px-6 py-4">Duration</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredExams.map((exam) => (
 <tr key={exam.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-bold text-slate-800 dark:text-slate-100">{exam.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{exam.case_number} • {exam.data?.type}</p>
 </td>
 <td className="px-6 py-4">
 <span className="font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200">{exam.data?.academicYear}</span>
 <span className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs ml-1">({exam.data?.term})</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
 <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <span>{exam.data?.startDate} to {exam.data?.endDate}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 exam.status === 'Upcoming' ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-primary/40 dark:border-primary/40' :
 exam.status === 'Ongoing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
 exam.status === 'Completed' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary border-primary/20' :
 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20'
}>
 {exam.status}
 </Badge>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2">
 {exam.status === 'Upcoming' && (
 <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Ongoing')} className="h-8 text-xs font-semibold">
 Start Exam
 </Button>
 )}
 {exam.status === 'Ongoing' && (
 <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Completed')} className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-slate-50">
 End Exam
 </Button>
 )}
 {exam.status === 'Completed' && (
 <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Published')} className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-slate-50">
 Publish Results
 </Button>
 )}
 <Button size="sm" variant="ghost" className="h-8 text-primary dark:text-primary/70 font-semibold hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 Details
 </Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Create Exam Cycle</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Setup a new internal examination for the school.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-4">
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Exam Name</label>
 <Input 
 placeholder="e.g. End of Term 1 Final Exams"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl"
 value={newExam.examName}
 onChange={e => setNewExam({...newExam, examName: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Academic Year</label>
 <Input 
 placeholder="e.g. 2025/2026"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl"
 value={newExam.academicYear}
 onChange={e => setNewExam({...newExam, academicYear: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Term</label>
 <select 
 className="w-full h-10 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newExam.term}
 onChange={e => setNewExam({...newExam, term: e.target.value})}
 >
 <option value="Term 1">Term 1</option>
 <option value="Term 2">Term 2</option>
 <option value="Term 3">Term 3</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Exam Type</label>
 <select 
 className="w-full h-10 rounded-xl border border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newExam.type}
 onChange={e => setNewExam({...newExam, type: e.target.value})}
 >
 <option value="End of Term">End of Term Exam</option>
 <option value="Mid-Term">Mid-Term Exam</option>
 <option value="Mock">Mock Exam</option>
 </select>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Start Date</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl"
 value={newExam.startDate}
 onChange={e => setNewExam({...newExam, startDate: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">End Date</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl"
 value={newExam.endDate}
 onChange={e => setNewExam({...newExam, endDate: e.target.value})}
 />
 </div>
 </div>

 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleCreateExam} 
 disabled={!newExam.examName || !newExam.startDate || !newExam.endDate}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 Create Exam
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
