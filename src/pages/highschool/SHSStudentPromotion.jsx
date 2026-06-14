import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, GraduationCap, ArrowRight, CheckCircle2, AlertCircle} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

export default function SHSStudentPromotion() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [sourceGrade, setSourceGrade] = useState('Form 1');
 const [targetGrade, setTargetGrade] = useState('Form 2');
 const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
 const [isPromoting, setIsPromoting] = useState(false);
 const [promotionSuccess, setPromotionSuccess] = useState(false);

 const fetchStudents = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_student', user?.company_id);
 setStudents(records);
} catch (error) {
 console.error('Failed to fetch students:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchStudents();
}
}, [user]);

 const eligibleStudents = students.filter(s => 
 s.data?.grade === sourceGrade && 
 (s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.case_number?.toLowerCase().includes(searchQuery.toLowerCase()))
 );

 const toggleStudent = (id) => {
 const newSet = new Set(selectedStudentIds);
 if (newSet.has(id)) newSet.delete(id);
 else newSet.add(id);
 setSelectedStudentIds(newSet);
};

 const toggleAll = () => {
 if (selectedStudentIds.size === eligibleStudents.length) {
 setSelectedStudentIds(new Set());
} else {
 setSelectedStudentIds(new Set(eligibleStudents.map(s => s.id)));
}
};

 const handlePromote = async () => {
 if (selectedStudentIds.size === 0) return;
 setIsPromoting(true);
 try {
 // Process promotions in batches
 const toPromote = students.filter(s => selectedStudentIds.has(s.id));
 for (const student of toPromote) {
 const updatedData = { ...student.data, grade: targetGrade};
 await base44.updateEntity(student.id, { data: updatedData});
}
 
 setPromotionSuccess(true);
 setTimeout(() => setPromotionSuccess(false), 3000);
 setSelectedStudentIds(new Set());
 await fetchStudents();
} catch (error) {
 console.error('Promotion failed:', error);
} finally {
 setIsPromoting(false);
}
};

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Student Promotions
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Bulk promote students to the next academic level or graduate them.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="col-span-1 rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
 <CardHeader className="bg-slate-500 dark:bg-slate-800/50 rounded-t-3xl border-b border-slate-200 dark:border-slate-700">
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Promotion Rules</CardTitle>
 <CardDescription>Select the source and target forms</CardDescription>
 </CardHeader>
 <CardContent className="p-6 space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-primary dark:text-primary/70 uppercase tracking-wider">Current Level (From)</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/20 dark:border-slate-600 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary transition-all"
 value={sourceGrade}
 onChange={(e) => {
 setSourceGrade(e.target.value);
 setSelectedStudentIds(new Set());
}}
 >
 <option value="Form 1">Form 1</option>
 <option value="Form 2">Form 2</option>
 <option value="Form 3">Form 3</option>
 </select>
 </div>
 
 <div className="flex justify-center text-primary/30">
 <ArrowRight className="w-8 h-8 rotate-90 md:rotate-0" />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-primary uppercase tracking-wider">Next Level (To)</label>
 <select 
 className="w-full h-11 rounded-xl border border-primary/20 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
 value={targetGrade}
 onChange={(e) => setTargetGrade(e.target.value)}
 >
 <option value="Form 2">Form 2</option>
 <option value="Form 3">Form 3</option>
 <option value="Graduated">Graduated (Alumni)</option>
 </select>
 </div>
 
 <div className="pt-4 border-t border-primary/5">
 <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-primary dark:text-primary/70 shrink-0 mt-0.5" />
 <p className="text-xs text-primary/70 font-medium">
 Promoting students will update their academic level immediately. Ensure end-of-term results are processed before promotion.
 </p>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="col-span-1 md:col-span-2 rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
 <CardHeader className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 rounded-t-3xl border-b border-primary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Eligible Students</CardTitle>
 <CardDescription>{eligibleStudents.length} students currently in {sourceGrade}</CardDescription>
 </div>
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search eligible students..." 
 className="pl-9 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-none rounded-xl h-9"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </CardHeader>
 
 <div className="flex-1 overflow-hidden flex flex-col">
 <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded text-primary dark:text-primary/70 focus:ring-primary dark:focus:ring-primary border-slate-300"
 checked={eligibleStudents.length > 0 && selectedStudentIds.size === eligibleStudents.length}
 onChange={toggleAll}
 />
 <span className="flex-1">Student Details</span>
 <span className="w-32 text-right">Action</span>
 </div>
 
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading students...</div>
 ) : eligibleStudents.length === 0 ? (
 <div className="p-12 text-center flex flex-col items-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center mb-4 text-primary/30">
 <GraduationCap className="w-8 h-8" />
 </div>
 <h3 className="font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No students found in {sourceGrade}</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">There are no students eligible for promotion in this grade.</p>
 </div>
 ) : (
 <div className="divide-y divide-slate-50">
 {eligibleStudents.map(student => (
 <div key={student.id} className={`px-6 py-3 flex items-center gap-4 transition-colors ${selectedStudentIds.has(student.id) ? 'bg-slate-500 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800'}`}>
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded text-primary dark:text-primary/70 focus:ring-primary dark:focus:ring-primary border-slate-300"
 checked={selectedStudentIds.has(student.id)}
 onChange={() => toggleStudent(student.id)}
 />
 <div className="flex-1">
 <p className="font-bold text-slate-800 dark:text-slate-100">{student.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{student.case_number} • {student.data?.program}</p>
 </div>
 <div className="w-32 text-right">
 {selectedStudentIds.has(student.id) ? (
 <Badge className="bg-primary dark:bg-primary text-white">Will Promote</Badge>
 ) : (
 <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">Pending</span>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </ScrollArea>
 </div>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-b-3xl flex items-center justify-between">
 <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
 <span className="text-primary dark:text-primary/70 font-black">{selectedStudentIds.size}</span> students selected
 </p>
 
 <Button 
 onClick={handlePromote}
 disabled={selectedStudentIds.size === 0 || isPromoting || promotionSuccess}
 className={`rounded-xl px-6 h-11 font-bold transition-all ${
 promotionSuccess ? 'bg-primary hover:bg-primary' : 'bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary'
} text-white`}
 >
 {isPromoting ? (
 <>Promoting...</>
 ) : promotionSuccess ? (
 <><CheckCircle2 className="w-4 h-4 mr-2" /> Promoted Successfully!</>
 ) : (
 <><GraduationCap className="w-4 h-4 mr-2" /> Execute Promotion</>
 )}
 </Button>
 </div>
 </Card>
 </div>
 </div>
 );
}
