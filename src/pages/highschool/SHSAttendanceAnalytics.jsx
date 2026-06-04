import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart, TrendingUp, AlertTriangle, UserX, Clock, CalendarCheck } from 'lucide-react';

export default function SHSAttendanceAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [dailyAtt, setDailyAtt] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const records = await base44.getEntities('shs_daily_attendance', user?.company_id);
        setDailyAtt(records);
      } catch (error) {
        console.error('Failed to fetch attendance analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  // Aggregate mock metrics based on fetched attendance records
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalRecordsAnalyzed = 0;

  dailyAtt.forEach(a => {
    if(a.data?.records) {
      a.data.records.forEach(r => {
        totalRecordsAnalyzed++;
        if (r.status === 'Present') totalPresent++;
        if (r.status === 'Absent') totalAbsent++;
        if (r.status === 'Late') totalLate++;
      });
    }
  });

  const presentRate = totalRecordsAnalyzed > 0 ? (totalPresent / totalRecordsAnalyzed) * 100 : 0;
  const absentRate = totalRecordsAnalyzed > 0 ? (totalAbsent / totalRecordsAnalyzed) * 100 : 0;
  const lateRate = totalRecordsAnalyzed > 0 ? (totalLate / totalRecordsAnalyzed) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Attendance Trends
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Analyze school-wide daily presence, tardiness, and truancy rates.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardContent className="p-20 text-center text-slate-400">Loading attendance analytics...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-200 uppercase tracking-wider">Average Presence</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white">{presentRate.toFixed(1)}%</h3>
                <p className="text-xs text-purple-200 mt-2 font-medium">Of total recorded sessions</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-rose-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-600/70 uppercase tracking-wider">Absent Rate</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-rose-700">{absentRate.toFixed(1)}%</h3>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, absentRate)}%` }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-600/70 uppercase tracking-wider">Tardiness Rate</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-amber-700">{lateRate.toFixed(1)}%</h3>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, lateRate)}%` }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Records Analyzed</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-slate-800">{totalRecordsAnalyzed.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Individual student roll calls</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#6F00FF]" /> Attendance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-16 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 mx-auto flex items-center justify-center border border-slate-100">
                    <TrendingUp className="w-10 h-10 text-[#6F00FF]" />
                  </div>
                  <p className="text-slate-500 font-medium">Connect a charting library to view interactive time-series.</p>
                  
                  {/* CSS Mock Chart */}
                  <div className="w-full max-w-sm mx-auto h-24 border-b border-l border-slate-200 mt-8 relative">
                    <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10" fill="none" stroke="#6F00FF" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                      <path d="M0,90 L20,95 L40,85 L60,95 L80,80 L100,90" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 text-xs font-bold">
                    <span className="flex items-center gap-2"><span className="w-3 h-1 bg-[#6F00FF]"></span> Present</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-1 bg-rose-500 border-t border-b border-dashed"></span> Absent</span>
                  </div>

                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-[#6F00FF]" /> Highest Truancy by Form
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Mock subject trends */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Form 3 (Graduating Class)</span>
                      <span className="font-bold text-rose-600">8.5% Absent</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: '8.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Form 2</span>
                      <span className="font-bold text-rose-400">4.1% Absent</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400" style={{ width: '4.1%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Form 1 (Freshmen)</span>
                      <span className="font-bold text-emerald-500">1.2% Absent</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '1.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm">Truancy Alert</h4>
                      <p className="text-xs text-amber-700 mt-1">Form 3 absenteeism is unusually high. This often correlates with unauthorized 'study leaves' near final exams. Consider sending an automated SMS blast to parents.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
