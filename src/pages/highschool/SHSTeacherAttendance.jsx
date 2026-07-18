import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Calendar, CheckCircle2, XCircle, Clock, Save, UserCheck, Briefcase} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSTeacherAttendance() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [teachers, setTeachers] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
 const [searchQuery, setSearchQuery] = useState('');
 
 // teacherId -> 'Present' | 'Absent' | 'Late' | 'On Leave'
 const [attendanceState, setAttendanceState] = useState({});
 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState(false);

 useEffect(() => {
 const fetchTeachersAndAttendance = async () => {
 setLoading(true);
 try {
 // 1. Fetch active teachers
 const teacherRecords = await base44.getEntities('shs_teacher', user?.company_id);
 const activeTeachers = teacherRecords.filter(t => t.status === 'Active');
 
 // 2. Fetch existing attendance for this date
 const attendanceRecords = await base44.getEntities('shs_teacher_attendance', user?.company_id);
 const existingRecord = attendanceRecords.find(a => a.data?.date === selectedDate);

 setTeachers(activeTeachers);
 
 // 3. Initialize state
 const newState = {};
 if (existingRecord && existingRecord.data?.records) {
 existingRecord.data.records.forEach(r => {
 newState[r.teacherId] = r.status;
});
 activeTeachers.forEach(t => {
 if (!newState[t.id]) newState[t.id] = 'Present'; 
});
} else {
 activeTeachers.forEach(t => {
 newState[t.id] = 'Present';
});
}
 
 setAttendanceState(newState);
 setSaveSuccess(false);
} catch (error) {
 console.error('Failed to fetch teacher attendance:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id && selectedDate) {
 fetchTeachersAndAttendance();
}
}, [selectedDate, user]);

 const handleStatusChange = (teacherId, status) => {
 setAttendanceState(prev => ({
 ...prev,
 [teacherId]: status
}));
 setSaveSuccess(false);
};

 const handleMarkAll = (status) => {
 const newState = {};
 teachers.forEach(t => {
 newState[t.id] = status;
});
 setAttendanceState(newState);
 setSaveSuccess(false);
};

 const handleSaveAttendance = async () => {
 setIsSaving(true);
 try {
 const attendanceRecords = await base44.getEntities('shs_teacher_attendance', user?.company_id);
 const existingRecord = attendanceRecords.find(a => a.data?.date === selectedDate);

 const recordsArray = Object.entries(attendanceState).map(([teacherId, status]) => ({
 teacherId,
 status
}));

 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_teacher_attendance',
 title: `Staff Attendance - ${selectedDate}`,
 case_number: `TATT-${selectedDate.replace(/-/g, '')}`,
 status: 'Logged',
 data: {
 date: selectedDate,
 records: recordsArray,
 summary: {
 total: teachers.length,
 present: recordsArray.filter(r => r.status === 'Present').length,
 absent: recordsArray.filter(r => r.status === 'Absent').length,
 late: recordsArray.filter(r => r.status === 'Late').length,
 onLeave: recordsArray.filter(r => r.status === 'On Leave').length}
}
};

 if (existingRecord) {
 await base44.updateEntity(existingRecord.id, payload);
} else {
 await base44.createEntity(payload);
}
 
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 3000);
} catch (error) {
 console.error('Failed to save teacher attendance:', error);
} finally {
 setIsSaving(false);
}
};

 const presentCount = Object.values(attendanceState).filter(s => s === 'Present').length;
 const absentCount = Object.values(attendanceState).filter(s => s === 'Absent').length;
 const lateCount = Object.values(attendanceState).filter(s => s === 'Late').length;
 const leaveCount = Object.values(attendanceState).filter(s => s === 'On Leave').length;

 const filteredTeachers = teachers.filter(t => 
 t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 t.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Staff Attendance
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Monitor daily presence, absences, and leave for teaching staff.
 </p>
 </div>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 p-6">
 <div className="flex flex-col md:flex-row justify-between gap-6">
 <div className="flex-1 flex flex-col sm:flex-row gap-4">
 <div className="space-y-2 flex-1 max-w-xs">
 <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <Calendar className="w-4 h-4 text-primary dark:text-primary/70" /> Select Date
 </label>
 <Input 
 type="date"
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-foreground dark:text-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 max={new Date().toISOString().split('T')[0]}
 />
 </div>
 
 <div className="space-y-2 flex-1 max-w-xs">
 <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <Search className="w-4 h-4 text-primary dark:text-primary/70" /> Search Staff
 </label>
 <Input 
 placeholder="Name or ID..."
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>

 <div className="flex items-end pb-1">
 <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-card/40 dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="text-center">
 <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 dark:text-muted-foreground uppercase tracking-wider tracking-[0.04em]">Total</p>
 <p className="text-xl font-black text-slate-700 dark:text-foreground dark:text-foreground">{teachers.length}</p>
 </div>
 <div className="w-px bg-slate-100 dark:bg-secondary"></div>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Present</p>
 <p className="text-xl font-black text-primary">{presentCount}</p>
 </div>
 <div className="w-px bg-slate-100 dark:bg-secondary"></div>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider tracking-[0.04em]">Absent</p>
 <p className="text-xl font-black text-rose-600">{absentCount}</p>
 </div>
 </div>
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="p-0">
 {loading ? (
 <div className="p-16 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground">Loading staff register...</div>
 ) : teachers.length === 0 ? (
 <div className="p-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary mx-auto flex items-center justify-center mb-4">
 <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-muted-foreground" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No staff found</h3>
 <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground max-w-sm mx-auto mt-2">
 There are no active teachers registered in the system.
 </p>
 </div>
 ) : (
 <div>
 <div className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/80 p-3 flex justify-between items-center border-b border-primary/40 dark:border-primary/40 dark:border-primary/40">
 <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground pl-3 tracking-[0.04em]">Quick Actions:</p>
 <div className="flex gap-2 pr-3">
 <Button variant="outline" size="sm" onClick={() => handleMarkAll('Present')} className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-slate-50 tracking-[0.04em]">
 All Present
 </Button>
 </div>
 </div>

 <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
 {filteredTeachers.map((teacher, index) => {
 const status = attendanceState[teacher.id];
 return (
 <div key={teacher.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50 transition-colors">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center font-semibold text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">
 {teacher.title.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-slate-800 dark:text-slate-100">{teacher.title}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <Badge variant="outline" className="text-[10px] bg-white dark:bg-card/40 dark:bg-card text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground border-primary/40 dark:border-primary/40 py-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{teacher.case_number}</Badge>
 <span className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">{teacher.data?.department || 'General'}</span>
 </div>
 </div>
 </div>
 
 <div className="flex bg-slate-100 dark:bg-secondary p-1 rounded-xl gap-2 self-start lg:self-auto">
 <button
 onClick={() => handleStatusChange(teacher.id, 'Present')}
 className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
 status === 'Present' 
 ? 'bg-white dark:bg-card/40 dark:bg-card text-primary ring-1 ring-primary/50' 
 : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:text-foreground dark:text-foreground hover:bg-slate-200 dark:bg-slate-700'
}`}
 >
 <CheckCircle2 className="w-3.5 h-3.5" /> Present
 </button>
 <button
 onClick={() => handleStatusChange(teacher.id, 'Late')}
 className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
 status === 'Late' 
 ? 'bg-white dark:bg-card/40 dark:bg-card text-amber-600 ring-1 ring-amber-200/50' 
 : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:text-foreground dark:text-foreground hover:bg-slate-200 dark:bg-slate-700'
}`}
 >
 <Clock className="w-3.5 h-3.5" /> Late
 </button>
 <button
 onClick={() => handleStatusChange(teacher.id, 'Absent')}
 className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
 status === 'Absent' 
 ? 'bg-white dark:bg-card/40 dark:bg-card text-rose-600 ring-1 ring-rose-200/50' 
 : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:text-foreground dark:text-foreground hover:bg-slate-200 dark:bg-slate-700'
}`}
 >
 <XCircle className="w-3.5 h-3.5" /> Absent
 </button>
 <button
 onClick={() => handleStatusChange(teacher.id, 'On Leave')}
 className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
 status === 'On Leave' 
 ? 'bg-white dark:bg-card/40 dark:bg-card text-primary ring-1 ring-primary/50' 
 : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:text-foreground dark:text-foreground hover:bg-slate-200 dark:bg-slate-700'
}`}
 >
 <UserCheck className="w-3.5 h-3.5" /> On Leave
 </button>
 </div>
 </div>
 );
})}
 {filteredTeachers.length === 0 && searchQuery && (
 <div className="p-8 text-center text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground">No teachers match your search.</div>
 )}
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex items-center justify-between">
 <div>
 {saveSuccess && (
 <Badge className="bg-slate-100 text-primary/90 border-none px-3 py-1 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
 <CheckCircle2 className="w-4 h-4" /> Staff Attendance Saved
 </Badge>
 )}
 </div>
 
 <Button 
 onClick={handleSaveAttendance}
 disabled={isSaving || teachers.length === 0}
 className="h-12 px-8 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20 font-semibold"
 >
 {isSaving ? 'Saving...' : (
 <><Save className="w-5 h-5 mr-2" /> Submit Staff Register</>
 )}
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 </div>
 );
}
