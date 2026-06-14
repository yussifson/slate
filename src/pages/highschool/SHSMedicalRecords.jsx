import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, HeartPulse, Activity, Syringe, ClipboardPlus, Stethoscope} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSMedicalRecords() {
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
 visitType: 'Consultation', // Consultation, Emergency, Routine
 symptoms: '',
 diagnosis: '',
 treatment: '',
 status: 'Treated'
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [medicalData, studentData] = await Promise.all([
 base44.getEntities('shs_medical', user?.company_id),
 base44.getEntities('shs_student', user?.company_id)
 ]);
 setRecords(medicalData);
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
 case_type: 'shs_medical',
 title: `${newRecord.visitType} - ${selectedStudent?.title || 'Unknown'}`,
 case_number: `MED-${Math.floor(Math.random() * 10000)}`,
 status: newRecord.status,
 data: {
 ...newRecord,
 studentName: selectedStudent?.title,
 studentCaseNumber: selectedStudent?.case_number
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewRecord({
 studentId: '', date: new Date().toISOString().split('T')[0], visitType: 'Consultation', symptoms: '', diagnosis: '', treatment: '', status: 'Treated'
});
 fetchData();
} catch (error) {
 console.error('Failed to add medical record:', error);
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
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Medical Records & Infirmary
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Manage student health records, clinic visits, and treatments.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Log Clinic Visit
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Stethoscope className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Total Visits</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{records.length}</h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-rose-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
 <Activity className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Emergencies</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {records.filter(r => r.data?.visitType === 'Emergency').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-amber-100">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
 <HeartPulse className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Admitted</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {records.filter(r => r.status === 'Admitted').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 
 <Card className="rounded-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-primary/10">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
 <Syringe className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-muted-foreground">Treated</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
 {records.filter(r => r.status === 'Treated').length}
 </h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Clinic Log</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search visits or students..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
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
 <ClipboardPlus className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No medical visits logged</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">No visits match your search, or the infirmary log is empty.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Date</th>
 <th className="px-6 py-4">Student</th>
 <th className="px-6 py-4">Visit Type</th>
 <th className="px-6 py-4">Symptoms</th>
 <th className="px-6 py-4">Treatment</th>
 <th className="px-6 py-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredRecords.map((record) => (
 <tr key={record.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
 {record.data?.date}
 </td>
 <td className="px-6 py-4 font-bold text-primary dark:text-primary/70">
 {record.data?.studentName}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 record.data?.visitType === 'Emergency' ? 'bg-rose-50 text-rose-700 border-rose-200' :
 record.data?.visitType === 'Routine' ? 'bg-orange-50 text-orange-700 border-primary/20' :
 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-primary/80 dark:text-primary/20 border-primary/20 dark:border-slate-600'
}>
 {record.data?.visitType}
 </Badge>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300 dark:text-slate-200 max-w-[200px] truncate" title={record.data?.symptoms}>
 {record.data?.symptoms}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={record.data?.treatment}>
 {record.data?.treatment}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 record.status === 'Treated' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' :
 record.status === 'Admitted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200 border-slate-200 dark:border-slate-700'
}>
 {record.status}
 </Badge>
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
 <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black">Log Clinic Visit</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Record a student's visit to the infirmary, symptoms, and treatment.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800">
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Patient (Student)</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
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
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date of Visit</label>
 <Input 
 type="date"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newRecord.date}
 onChange={e => setNewRecord({...newRecord, date: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Visit Type</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newRecord.visitType}
 onChange={e => setNewRecord({...newRecord, visitType: e.target.value})}
 >
 <option value="Consultation">Consultation</option>
 <option value="Emergency">Emergency</option>
 <option value="Routine">Routine Checkup</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Presenting Symptoms</label>
 <Input 
 placeholder="e.g. Headache, Fever, Stomach pain"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newRecord.symptoms}
 onChange={e => setNewRecord({...newRecord, symptoms: e.target.value})}
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Diagnosis</label>
 <Input 
 placeholder="e.g. Malaria, Common Cold"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newRecord.diagnosis}
 onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})}
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Treatment Given</label>
 <Input 
 placeholder="e.g. Paracetamol, Rest in ward"
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
 value={newRecord.treatment}
 onChange={e => setNewRecord({...newRecord, treatment: e.target.value})}
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Outcome / Status</label>
 <select 
 className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={newRecord.status}
 onChange={e => setNewRecord({...newRecord, status: e.target.value})}
 >
 <option value="Treated">Treated & Discharged</option>
 <option value="Admitted">Admitted to Ward</option>
 <option value="Referred">Referred to Hospital</option>
 </select>
 </div>
 </div>
 </ScrollArea>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddRecord} 
 disabled={!newRecord.studentId || !newRecord.symptoms}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
 >
 Save Record
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
