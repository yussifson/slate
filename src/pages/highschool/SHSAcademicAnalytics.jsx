import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart, TrendingUp, Award, Target, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSAcademicAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const records = await base44.getEntities('shs_report_card', user?.company_id);
        setReports(records);
      } catch (error) {
        console.error('Failed to fetch academic analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  // Aggregate mock metrics based on fetched reports
  const totalReports = reports.length;
  const avgOverallScore = totalReports > 0 ? reports.reduce((acc, r) => acc + (parseFloat(r.data?.overallAverage) || 0), 0) / totalReports : 0;
  
  const passedReports = reports.filter(r => parseFloat(r.data?.overallAverage) >= 50).length;
  const passRate = totalReports > 0 ? (passedReports / totalReports) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Academic Insights
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Analyze school-wide academic performance trends and subject averages.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardContent className="p-20 text-center text-slate-400">Loading academic analytics...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-200 uppercase tracking-wider">School Average</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white">{avgOverallScore.toFixed(1)}%</h3>
                <p className="text-xs text-purple-200 mt-2 font-medium">Across all generated report cards</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pass Rate (&gt;50%)</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-emerald-600">{passRate.toFixed(1)}%</h3>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${passRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Programme</p>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">General Science</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Avg Score: 78.4%</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-[#6F00FF]">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Records Analyzed</p>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-slate-800">{totalReports}</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Report cards in database</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-[#6F00FF]" /> Form Averages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-16 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 mx-auto flex items-center justify-center border border-slate-100">
                    <BarChart className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Interactive charts require a Charting Provider.</p>
                  
                  {/* CSS Mock Chart */}
                  <div className="flex gap-8 justify-center items-end h-32 mt-8 opacity-60">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 bg-[#6F00FF] rounded-t-lg h-[65%] shadow-lg shadow-purple-500/50"></div>
                      <span className="text-xs font-bold text-slate-500">Form 1</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 bg-[#6F00FF] rounded-t-lg h-[72%] shadow-lg shadow-purple-500/50"></div>
                      <span className="text-xs font-bold text-slate-500">Form 2</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 bg-[#6F00FF] rounded-t-lg h-[85%] shadow-lg shadow-purple-500/50"></div>
                      <span className="text-xs font-bold text-slate-500">Form 3</span>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#6F00FF]" /> Core Subject Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Mock subject trends */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Core Mathematics</span>
                      <span className="font-bold text-emerald-600">68.5%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '68.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Integrated Science</span>
                      <span className="font-bold text-[#6F00FF]">72.1%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6F00FF]" style={{ width: '72.1%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">English Language</span>
                      <span className="font-bold text-amber-500">64.2%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '64.2%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Social Studies</span>
                      <span className="font-bold text-[#6F00FF]">79.8%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6F00FF]" style={{ width: '79.8%' }}></div>
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
