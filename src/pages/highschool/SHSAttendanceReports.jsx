import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, FileSpreadsheet, PieChart, TrendingUp, Users, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSAttendanceReports() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  const [teacherStats, setTeacherStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  
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
        const sAgg = { present: 0, absent: 0, late: 0, excused: 0 };
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
        const tAgg = { present: 0, absent: 0, late: 0, onLeave: 0 };
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
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Analyze historical attendance data for students and staff.
          </p>
        </div>
        <Button className="h-9 gap-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50">
          <FileSpreadsheet className="w-4 h-4" /> Export Report
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#6F00FF]" /> Start Date
              </label>
              <Input 
                type="date"
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] font-semibold text-slate-700"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#6F00FF]" /> End Date
              </label>
              <Input 
                type="date"
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] font-semibold text-slate-700"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button className="h-11 px-6 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md font-bold">
              <TrendingUp className="w-4 h-4 mr-2" /> Generate
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Aggregating attendance data...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Student Stats */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6F00FF]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Student Attendance</h3>
                    <p className="text-sm text-slate-500">Aggregated roll call records</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Rate</p>
                    <p className={`text-3xl font-black ${sPresentRate >= 90 ? 'text-emerald-500' : sPresentRate >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {sPresentRate}%
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Total Present</p>
                    <p className="text-3xl font-black text-emerald-600">{studentStats.present}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-amber-600/70 uppercase tracking-wider mb-1">Total Late</p>
                    <p className="text-3xl font-black text-amber-600">{studentStats.late}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-rose-600/70 uppercase tracking-wider mb-1">Total Absent</p>
                    <p className="text-3xl font-black text-rose-600">{studentStats.absent}</p>
                  </div>
                </div>
              </div>

              {/* Teacher Stats */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Staff Attendance</h3>
                    <p className="text-sm text-slate-500">Aggregated staff register</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Rate</p>
                    <p className={`text-3xl font-black ${tPresentRate >= 95 ? 'text-emerald-500' : tPresentRate >= 85 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {tPresentRate}%
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">Total Present</p>
                    <p className="text-3xl font-black text-blue-600">{teacherStats.present}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-orange-600/70 uppercase tracking-wider mb-1">Total Late</p>
                    <p className="text-3xl font-black text-orange-600">{teacherStats.late}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">On Leave / Absent</p>
                    <p className="text-3xl font-black text-slate-700">{teacherStats.onLeave + teacherStats.absent}</p>
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
