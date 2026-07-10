import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, ShieldAlert, AlertOctagon, Scale, FileWarning} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSDisciplineRecords() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [records, setRecords] = useState([]);
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newRecord, setNewRecord] = useState({
 studentId: '',
 date: new Date().toISOString().split('T')[0],
 infraction: '',
 severity: 'Minor',
 actionTaken: '',
 points: 0
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [disciplineData, studentData] = await Promise.all([
 base44.getEntities('shs_discipline', user?.company_id),
 base44.getEntities('shs_student', user?.company_id)
 ]);
 setRecords(disciplineData);
 setStudents(studentData);
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

 const handleAddRecord = async () => {
 try {
 const selectedStudent = students.find(s => s.id === newRecord.studentId);
 
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_discipline',
 title: `${newRecord.infraction} - ${selectedStudent?.title || 'Unknown'}`,
 case_number: `DISC-${Math.floor(Math.random() * 10000)}`,
 status: 'Active',
 data: {
 ...newRecord,
 studentName: selectedStudent?.title,
 studentCaseNumber: selectedStudent?.case_number
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewRecord({
 studentId: '', date: new Date().toISOString().split('T')[0], infraction: '', severity: 'Minor', actionTaken: '', points: 0
});
 fetchData();
} catch (error) {
 console.error('Failed to add discipline record:', error);
}
};

 const filteredRecords = records.filter(r => 
 r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 r.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Discipline Records
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Log and manage student behavioral infractions and disciplinary actions.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Log Incident
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <ShieldAlert className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Total Incidents</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{records.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-rose-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
 <AlertOctagon className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Severe Infractions</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">
 {records.filter(r => r.data?.severity === 'Severe').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-amber-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <Scale className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Total Demerits</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">
 {records.reduce((sum, r) => sum + (Number(r.data?.points) || 0), 0)}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Incident Log</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search student or infraction..." 
 className="pl-9 h-9 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading records...</div>
 ) : filteredRecords.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <FileWarning className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No discipline records</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">No incidents match your search, or none have been logged.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Date</th>
 <th className="px-6 py-4">Student</th>
 <th className="px-6 py-4">Infraction</th>
 <th className="px-6 py-4">Severity</th>
 <th className="px-6 py-4">Action Taken</th>
 <th className="px-6 py-4">Demerits</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredRecords.map((record) => (
 <tr key={record.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
 {record.data?.date}
 </td>
 <td className="px-6 py-4 font-semibold text-primary dark:text-primary/70">
 {record.data?.studentName}
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300 dark:text-slate-200">
 {record.data?.infraction}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 record.data?.severity === 'Minor' ? 'bg-orange-50 text-orange-700 border-primary/20' :
 record.data?.severity === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {record.data?.severity}
 </Badge>
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={record.data?.actionTaken}>
 {record.data?.actionTaken}
 </td>
 <td className="px-6 py-4 font-semibold text-rose-600">
 -{record.data?.points || 0}
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
 <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Log Disciplinary Incident</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Record a student infraction and the corresponding disciplinary action.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Student</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.studentId}
 onChange={e => setNewRecord({...newRecord, studentId: e.target.value})}
 >
 <option value="">Select a student...</option>
 {students.map(s => (
 <option key={s.id} value={s.id}>{s.title} ({s.case_number})</option>
 ))}
 </select>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Date of Incident</label>
 <Input 
 type="date"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.date}
 onChange={e => setNewRecord({...newRecord, date: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Severity</label>
 <select 
 className="w-full h-10 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.severity}
 onChange={e => setNewRecord({...newRecord, severity: e.target.value})}
 >
 <option value="Minor">Minor</option>
 <option value="Moderate">Moderate</option>
 <option value="Severe">Severe</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Infraction Description</label>
 <Input 
 placeholder="e.g. Disruption of class, Late to assembly"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.infraction}
 onChange={e => setNewRecord({...newRecord, infraction: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-2 space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Action Taken</label>
 <Input 
 placeholder="e.g. Warning, Suspension, Weeding"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.actionTaken}
 onChange={e => setNewRecord({...newRecord, actionTaken: e.target.value})}
 />
 </div>
 <div className="col-span-1 space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Demerits</label>
 <Input 
 type="number"
 min="0"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newRecord.points}
 onChange={e => setNewRecord({...newRecord, points: parseInt(e.target.value) || 0})}
 />
 </div>
 </div>
 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddRecord} 
 disabled={!newRecord.studentId || !newRecord.infraction}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Log Incident
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
