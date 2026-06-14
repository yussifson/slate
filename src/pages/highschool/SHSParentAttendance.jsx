import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { User, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertTriangle} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSParentAttendance() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [loading, setLoading] = useState(true);
 const [wards, setWards] = useState([]);
 const [selectedWardId, setSelectedWardId] = useState('');
 
 const [attendanceRecords, setAttendanceRecords] = useState([]);

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const students = await base44.getEntities('shs_student', user?.company_id);
 const myWards = students.slice(0, 2);
 setWards(myWards);
 if (myWards.length > 0) setSelectedWardId(myWards[0].id);
 
 // Fetch all attendance and filter by studentId
 const dailyAtt = await base44.getEntities('shs_daily_attendance', user?.company_id);
 const boardingAtt = await base44.getEntities('shs_boarding_attendance', user?.company_id);
 
 const combined = [];
 dailyAtt.forEach(a => {
 if(a.data?.records) {
 a.data.records.forEach(r => {
 if (myWards.find(w => w.id === r.studentId)) {
 combined.push({ type: 'Morning Roll', date: a.data.date, status: r.status, studentId: r.studentId});
}
});
}
});
 boardingAtt.forEach(a => {
 if(a.data?.records) {
 a.data.records.forEach(r => {
 if (myWards.find(w => w.id === r.studentId)) {
 combined.push({ type: 'Evening House Roll', date: a.data.date, status: r.status, studentId: r.studentId});
}
});
}
});

 // Sort latest first
 combined.sort((a, b) => new Date(b.date) - new Date(a.date));
 setAttendanceRecords(combined);

} catch (error) {
 console.error('Failed to fetch attendance data:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const selectedWard = wards.find(w => w.id === selectedWardId);
 const wardRecords = attendanceRecords.filter(r => r.studentId === selectedWardId);

 const getStatusIcon = (status) => {
 switch(status) {
 case 'Present': return <CheckCircle2 className="w-5 h-5 text-primary" />;
 case 'Absent': return <XCircle className="w-5 h-5 text-rose-500" />;
 case 'Late': return <Clock className="w-5 h-5 text-amber-500" />;
 case 'Excused': return <AlertTriangle className="w-5 h-5 text-primary" />;
 case 'Exeat': return <AlertTriangle className="w-5 h-5 text-primary dark:text-primary/70" />;
 default: return null;
}
};

 const getStatusColor = (status) => {
 switch(status) {
 case 'Present': return 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20';
 case 'Absent': return 'bg-rose-50 text-rose-700 border-rose-200';
 case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
 case 'Excused': return 'bg-orange-50 text-orange-700 border-primary/20';
 case 'Exeat': return 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-primary/80 dark:text-primary/20 border-primary/20 dark:border-slate-600';
 default: return 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200 border-slate-200 dark:border-slate-700';
}
};

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
 Attendance Records
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Monitor daily roll calls and boarding house presence.
 </p>
 </div>
 </div>

 {loading ? (
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardContent className="p-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading attendance data...</CardContent>
 </Card>
 ) : wards.length === 0 ? (
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
 <CardContent className="p-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <User className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Wards Linked</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Contact the school administration to link your child's account.</p>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 
 <div className="lg:col-span-1 space-y-4">
 <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">Select Child</h3>
 {wards.map(ward => (
 <button
 key={ward.id}
 onClick={() => setSelectedWardId(ward.id)}
 className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
 selectedWardId === ward.id 
 ? 'bg-primary dark:bg-primary border-primary dark:border-primary text-white -emerald-500/20 scale-100' 
 : 'bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:border-primary dark:border-slate-200 scale-95'
}`}
 >
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
 selectedWardId === ward.id ? 'bg-white dark:bg-slate-900/40 dark:bg-slate-900/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70'
}`}>
 {ward.title.charAt(0)}
 </div>
 <div>
 <h4 className="font-bold">{ward.title}</h4>
 <p className={`text-xs ${selectedWardId === ward.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
 {ward.data?.classRoom || 'Form 1'}
 </p>
 </div>
 </button>
 ))}
 </div>

 <div className="lg:col-span-3 space-y-6">
 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
 <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
 <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
 <CalendarIcon className="w-5 h-5 text-primary dark:text-primary/70" /> Recent Attendance Log
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {wardRecords.length === 0 ? (
 <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
 No attendance records found for this student.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Date</th>
 <th className="px-6 py-4">Register Type</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {wardRecords.map((record, i) => (
 <tr key={i} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">
 {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
 {record.type}
 </td>
 <td className="px-6 py-4 text-right">
 <Badge variant="outline" className={`gap-1.5 ${getStatusColor(record.status)}`}>
 {getStatusIcon(record.status)} {record.status}
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
 </div>

 </div>
 )}
 </div>
 );
}
