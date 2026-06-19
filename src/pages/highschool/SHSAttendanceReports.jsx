import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Calendar as CalendarIcon, FileSpreadsheet, PieChart, TrendingUp, Users, Briefcase} from 'lucide-react';
import { Badge} from '@/components/ui/badge';

export default function SHSAttendanceReports() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [loading, setLoading] = useState(true);
 const [studentStats, setStudentStats] = useState({ present: 0, absent: 0, late: 0, excused: 0});
 const [teacherStats, setTeacherStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0});
 
 const [startDate, setStartDate] = useState(() => {
 const d = new Date();
 d.setDate(d.getDate() - 30);
 return d.toISOString().split('T')[0];
});
 const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

 useEffect(() => {
 const fetchReports = async () => {
 setLoading(true);
 try {
 const [studentRecords, teacherRecords] = await Promise.all([
 base44.getEntities('shs_daily_attendance', user?.company_id),
 base44.getEntities('shs_teacher_attendance', user?.company_id)
 ]);

 // Filter by date range
 const sFiltered = studentRecords.filter(r => r.data?.date >= startDate && r.data?.date <= endDate);
 const tFiltered = teacherRecords.filter(r => r.data?.date >= startDate && r.data?.date <= endDate);

 // Aggregate student stats
 const sAgg = { present: 0, absent: 0, late: 0, excused: 0};
 sFiltered.forEach(r => {
 if (r.data?.summary) {
 sAgg.present += r.data.summary.present || 0;
 sAgg.absent += r.data.summary.absent || 0;
 sAgg.late += r.data.summary.late || 0;
 sAgg.excused += r.data.summary.excused || 0;
}
});
 setStudentStats(sAgg);

 // Aggregate teacher stats
 const tAgg = { present: 0, absent: 0, late: 0, onLeave: 0};
 tFiltered.forEach(r => {
 if (r.data?.summary) {
 tAgg.present += r.data.summary.present || 0;
 tAgg.absent += r.data.summary.absent || 0;
 tAgg.late += r.data.summary.late || 0;
 tAgg.onLeave += r.data.summary.onLeave || 0;
}
});
 setTeacherStats(tAgg);

} catch (error) {
 console.error('Failed to fetch attendance reports:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id && startDate && endDate) {
 fetchReports();
}
}, [startDate, endDate, user]);

 const sTotal = studentStats.present + studentStats.absent + studentStats.late + studentStats.excused;
 const sPresentRate = sTotal > 0 ? Math.round(((studentStats.present + studentStats.late) / sTotal) * 100) : 0;

 const tTotal = teacherStats.present + teacherStats.absent + teacherStats.late + teacherStats.onLeave;
 const tPresentRate = tTotal > 0 ? Math.round(((teacherStats.present + teacherStats.late) / tTotal) * 100) : 0;

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Attendance Reports
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Analyze historical attendance data for students and staff.
 </p>
 </div>
 <Button className="h-9 gap-2 rounded-md-xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <FileSpreadsheet className="w-4 h-4" /> Export Report
 </Button>
 </div>

 <Card className="rounded-md-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
 <div className="flex flex-col sm:flex-row gap-6 items-end">
 <div className="space-y-2 flex-1">
 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <CalendarIcon className="w-4 h-4 text-primary dark:text-primary/70" /> Start Date
 </label>
 <Input 
 type="date"
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 />
 </div>
 <div className="space-y-2 flex-1">
 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <CalendarIcon className="w-4 h-4 text-primary dark:text-primary/70" /> End Date
 </label>
 <Input 
 type="date"
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 />
 </div>
 <Button className="h-11 px-6 rounded-md-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold">
 <TrendingUp className="w-4 h-4 mr-2" /> Generate
 </Button>
 </div>
 </CardHeader>
 
 <CardContent className="p-8">
 {loading ? (
 <div className="py-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Aggregating attendance data...</div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Student Stats */}
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Student Attendance</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Aggregated roll call records</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-5 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">Average Rate</p>
 <p className={`text-3xl font-black ${sPresentRate >= 90 ? 'text-primary' : sPresentRate >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
 {sPresentRate}%
 </p>
 </div>
 <div className="p-5 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Present</p>
 <p className="text-3xl font-black text-primary tracking-[-0.02em]">{studentStats.present}</p>
 </div>
 <div className="p-5 rounded-md-2xl bg-amber-50 border-[0.5px] border-black/9 dark:border-white/8 border-amber-100 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Late</p>
 <p className="text-3xl font-black text-amber-600 tracking-[-0.02em]">{studentStats.late}</p>
 </div>
 <div className="p-5 rounded-md-2xl bg-rose-50 border-[0.5px] border-black/9 dark:border-white/8 border-rose-100 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-rose-600/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Absent</p>
 <p className="text-3xl font-black text-rose-600 tracking-[-0.02em]">{studentStats.absent}</p>
 </div>
 </div>
 </div>

 {/* Teacher Stats */}
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-primary">
 <Briefcase className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Staff Attendance</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Aggregated staff register</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-5 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">Average Rate</p>
 <p className={`text-3xl font-black ${tPresentRate >= 95 ? 'text-primary' : tPresentRate >= 85 ? 'text-amber-500' : 'text-rose-500'}`}>
 {tPresentRate}%
 </p>
 </div>
 <div className="p-5 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Present</p>
 <p className="text-3xl font-black text-primary tracking-[-0.02em]">{teacherStats.present}</p>
 </div>
 <div className="p-5 rounded-md-2xl bg-orange-50 border-[0.5px] border-black/9 dark:border-white/8 border-orange-100 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-orange-600/70 uppercase tracking-wider mb-1 tracking-[0.04em]">Total Late</p>
 <p className="text-3xl font-black text-orange-600 tracking-[-0.02em]">{teacherStats.late}</p>
 </div>
 <div className="p-5 rounded-md-2xl bg-slate-100 dark:bg-slate-800 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 flex flex-col justify-center items-center text-center">
 <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 tracking-[0.04em]">On Leave / Absent</p>
 <p className="text-3xl font-black text-slate-700 dark:text-slate-300 dark:text-slate-200 tracking-[-0.02em]">{teacherStats.onLeave + teacherStats.absent}</p>
 </div>
 </div>
 </div>

 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
