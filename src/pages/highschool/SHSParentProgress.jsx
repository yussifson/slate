import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, BookOpen, Download, LineChart, FileText, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSParentProgress() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  
  const [reportCards, setReportCards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Filter for this parent's wards
        // In a real app, we filter by parentId. Here we just take a few students.
        const students = await base44.getEntities('shs_student', user?.company_id);
        const myWards = students.slice(0, 2); // Simulating 2 children
        setWards(myWards);
        if (myWards.length > 0) setSelectedWardId(myWards[0].id);
        
        // Fetch published report cards for these wards
        const reports = await base44.getEntities('shs_report_card', user?.company_id);
        setReportCards(reports.filter(r => r.status === 'Published'));
        
      } catch (error) {
        console.error('Failed to fetch parent progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  const selectedWard = wards.find(w => w.id === selectedWardId);
  const wardReports = reportCards.filter(r => r.data?.studentId === selectedWardId);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Academic Progress
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            View termly report cards and academic trends for your children.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardContent className="p-20 text-center text-slate-400 dark:text-slate-500">Loading academic records...</CardContent>
        </Card>
      ) : wards.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardContent className="p-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary dark:text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Wards Linked</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Contact the school administration to link your child's account.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">Select Child</h3>
            {wards.map(ward => (
              <button
                key={ward.id}
                onClick={() => setSelectedWardId(ward.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
                  selectedWardId === ward.id 
                    ? 'bg-primary dark:bg-primary border-primary dark:border-primary text-white shadow-lg shadow-emerald-500/20 scale-100' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary dark:border-primary/50 scale-95'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  selectedWardId === ward.id ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70'
                }`}>
                  {ward.title.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{ward.title}</h4>
                  <p className={`text-xs ${selectedWardId === ward.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                    {ward.data?.classRoom || 'Form 1'} • {ward.data?.programmeName || 'General'}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white overflow-hidden">
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black mb-1">{selectedWard?.title}'s Performance</h2>
                    <p className="text-primary/20 dark:text-primary/80 text-sm">Overall Academic Standing: Excellent</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/10 flex items-center justify-center">
                    <LineChart className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary dark:text-primary/70" /> Published Report Cards
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {wardReports.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    No report cards have been published for this student yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {wardReports.map(report => (
                      <div key={report.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <Award className="w-6 h-6 text-primary dark:text-primary/70" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{report.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{report.data?.academicYear} • {report.data?.term}</p>
                            <div className="flex gap-4 mt-2 text-sm font-semibold">
                              <span className="text-primary">Avg: {report.data?.overallAverage}%</span>
                              <span className="text-primary">Pos: {report.data?.positionInClass} / {report.data?.totalInClass}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="shrink-0 h-10 gap-2 rounded-xl border-primary dark:border-primary/20 text-primary dark:text-primary/70 hover:bg-primary/5 dark:bg-slate-800">
                          <Download className="w-4 h-4" /> Download PDF
                        </Button>
                      </div>
                    ))}
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
