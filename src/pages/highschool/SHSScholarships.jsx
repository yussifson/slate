import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Award, CheckCircle2, XCircle, GraduationCap, Percent} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSScholarships() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [scholarships, setScholarships] = useState([]);
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newScholarship, setNewScholarship] = useState({
 studentId: '',
 type: 'Full Scholarship', // Full Scholarship, Partial, Bursary, Staff Dependent
 percentage: 100,
 academicYear: new Date().getFullYear().toString(),
 notes: ''
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [schData, studentData] = await Promise.all([
 base44.getEntities('shs_scholarship', user?.company_id),
 base44.getEntities('shs_student', user?.company_id)
 ]);
 setScholarships(schData);
 setStudents(studentData.filter(s => s.status === 'Active'));
} catch (error) {
 console.error('Failed to fetch scholarships:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleGrantScholarship = async () => {
 try {
 const selectedStudent = students.find(s => s.id === newScholarship.studentId);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_scholarship',
 title: `${newScholarship.type} - ${selectedStudent?.title}`,
 case_number: `SCH-${Math.floor(Math.random() * 10000)}`,
 status: 'Active',
 data: {
 ...newScholarship,
 studentName: selectedStudent?.title,
 studentIndex: selectedStudent?.data?.indexNumber || selectedStudent?.case_number,
 percentage: parseFloat(newScholarship.percentage) || 0
}
};
 
 await base44.createEntity(payload);
 setIsModalOpen(false);
 setNewScholarship({ studentId: '', type: 'Full Scholarship', percentage: 100, academicYear: new Date().getFullYear().toString(), notes: ''});
 fetchData();
} catch (error) {
 console.error('Failed to grant scholarship:', error);
}
};

 const updateStatus = async (id, newStatus) => {
 try {
 await base44.updateEntity(id, { status: newStatus});
 fetchData();
} catch (error) {
 console.error('Failed to update scholarship status:', error);
}
};

 const filteredSch = scholarships.filter(s => 
 s.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.data?.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 s.data?.studentIndex?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Scholarships & Bursaries
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Manage financial aid and tuition waivers for eligible students.
 </p>
 </div>
 
 <Button onClick={() => setIsModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Grant Scholarship
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Award className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Active Grants</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{scholarships.filter(s => s.status === 'Active').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Financial Aid Roster</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-muted-foreground" />
 <Input 
 placeholder="Search student or type..." 
 className="pl-9 h-9 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Loading grants...</div>
 ) : filteredSch.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary mx-auto flex items-center justify-center mb-4">
 <GraduationCap className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No active scholarships</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">Grant a scholarship or bursary to a student.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/80 text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground font-semibold uppercase text-[10px] tracking-wider tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Student</th>
 <th className="px-6 py-4">Grant Type</th>
 <th className="px-6 py-4">Coverage</th>
 <th className="px-6 py-4">Academic Year</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredSch.map((sch) => (
 <tr key={sch.id} className="hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-800 dark:text-slate-100">{sch.data?.studentName}</p>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">{sch.data?.studentIndex}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <Award className="w-3.5 h-3.5 text-primary dark:text-primary/70" />
 <span className="font-semibold text-slate-700 dark:text-foreground dark:text-foreground">{sch.data?.type}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <Badge variant="secondary" className="bg-slate-50 dark:bg-secondary/50 text-primary/90 border-none font-semibold">
 {sch.data?.percentage}% Waived
 </Badge>
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-foreground">
 {sch.data?.academicYear}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 sch.status === 'Active' ? 'bg-slate-50 dark:bg-secondary/50 text-primary/90 border-primary/20' : 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {sch.status}
 </Badge>
 </td>
 <td className="px-6 py-4 text-right">
 {sch.status === 'Active' ? (
 <Button size="sm" variant="outline" onClick={() => updateStatus(sch.id, 'Revoked')} className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 tracking-[0.04em]">
 Revoke
 </Button>
 ) : (
 <Button size="sm" variant="outline" onClick={() => updateStatus(sch.id, 'Active')} className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-slate-50 tracking-[0.04em]">
 Reinstate
 </Button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Grant Financial Aid</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Assign a tuition waiver or bursary to a student.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Select Student</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newScholarship.studentId}
 onChange={e => setNewScholarship({...newScholarship, studentId: e.target.value})}
 >
 <option value="">Search and select student...</option>
 {students.map(s => (
 <option key={s.id} value={s.id}>
 {s.title} ({s.data?.indexNumber || s.case_number})
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Grant Type</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newScholarship.type}
 onChange={e => {
 const type = e.target.value;
 const pct = type === 'Full Scholarship' ? 100 : type === 'Staff Dependent' ? 50 : newScholarship.percentage;
 setNewScholarship({...newScholarship, type, percentage: pct});
}}
 >
 <option value="Full Scholarship">Full Scholarship</option>
 <option value="Partial Scholarship">Partial Scholarship</option>
 <option value="Bursary">Need-based Bursary</option>
 <option value="Staff Dependent">Staff Dependent (50%)</option>
 <option value="Sports Scholarship">Sports Scholarship</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]"><Percent className="w-3.5 h-3.5"/> Waiver (%)</label>
 <Input 
 type="number"
 min="1" max="100"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl h-11 font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newScholarship.percentage}
 onChange={e => setNewScholarship({...newScholarship, percentage: e.target.value})}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Academic Year Target</label>
 <Input 
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl h-11 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newScholarship.academicYear}
 onChange={e => setNewScholarship({...newScholarship, academicYear: e.target.value})}
 />
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Reason / Notes</label>
 <textarea 
 placeholder="Details of the award..."
 className="w-full h-20 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newScholarship.notes}
 onChange={e => setNewScholarship({...newScholarship, notes: e.target.value})}
 />
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-foreground">
 Cancel
 </Button>
 <Button 
 onClick={handleGrantScholarship} 
 disabled={!newScholarship.studentId || !newScholarship.percentage}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Grant Award
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
