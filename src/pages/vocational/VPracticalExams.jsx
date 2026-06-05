import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PenTool, CheckCircle, XCircle, Award, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VPracticalExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_exam', user?.company_id);
      setExams(records);
      if (records.length > 0 && !selectedExam) {
        setSelectedExam(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch practical exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchExams();
    }
  }, [user]);

  const filteredExams = exams.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-rose-600 via-pink-600 to-slate-900 bg-clip-text text-transparent">
            Practical Exams
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage scheduling and grading for hands-on practical examinations.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50">
          <div className="p-4 border-b border-rose-50 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
              <Input 
                placeholder="Search exams..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900 border-rose-100 dark:border-slate-700 rounded-xl focus-visible:ring-rose-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-rose-500/50 text-sm">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No exams found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredExams.map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedExam?.id === exam.id 
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                        : 'hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedExam?.id === exam.id ? 'bg-white/20' : 'bg-rose-100 dark:bg-slate-800 text-rose-600'
                    }`}>
                      <PenTool className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{exam.title}</p>
                      <p className={`text-xs truncate ${selectedExam?.id === exam.id ? 'text-rose-100' : 'text-slate-500'}`}>
                        {exam.data?.trainee_name || 'Trainee'} • {exam.data?.date || 'Unscheduled'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50 overflow-hidden relative">
          {selectedExam ? (
            <>
              <div className="h-32 bg-gradient-to-r from-rose-500 to-pink-600 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-rose-50 dark:bg-slate-800 flex items-center justify-center text-rose-600">
                        <Award className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedExam.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-rose-200 dark:border-slate-600 bg-rose-50 dark:bg-slate-800 text-rose-600">{selectedExam.data?.trainee_name}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-rose-500" /> {selectedExam.data?.date || 'No date set'}</span>
                        <span>•</span>
                        <Badge className={selectedExam.data?.result === 'Pass' ? 'bg-emerald-500' : selectedExam.data?.result === 'Fail' ? 'bg-red-500' : 'bg-slate-500'}>
                          {selectedExam.data?.result || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Examiner</h3>
                          <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{selectedExam.data?.examiner || 'Not Assigned'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Final Score</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{selectedExam.data?.score || '--'}</span>
                            <span className="text-slate-500">/ 100</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Feedback & Comments</h3>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[100px]">
                          <p className="text-slate-700 dark:text-slate-300">
                            {selectedExam.data?.feedback || 'No feedback provided yet.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline" className="text-slate-600">Print Certificate</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white">Edit Exam Result</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <PenTool className="w-10 h-10 text-rose-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Exam Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select an exam from the list to view the score, examiner feedback, and pass/fail status.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
