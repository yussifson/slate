import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ClipboardCheck, Star, UserCircle, Briefcase, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VEmployerEvaluations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEval, setSelectedEval] = useState(null);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_evaluation', user?.company_id);
      setEvaluations(records);
      if (records.length > 0 && !selectedEval) {
        setSelectedEval(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEvaluations();
    }
  }, [user]);

  const filteredEvals = evaluations.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.data?.employer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Employer Evaluations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Review performance feedback from internship hosts and employers.
          </p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-teal-200 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Request Evaluation
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
          <div className="p-4 border-b border-primary/5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Search evaluations..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-primary/30 text-sm">Loading evaluations...</div>
            ) : filteredEvals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No evaluations found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredEvals.map(evaluation => (
                  <button
                    key={evaluation.id}
                    onClick={() => setSelectedEval(evaluation)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedEval?.id === evaluation.id 
                        ? 'bg-primary text-white shadow-md shadow-teal-500/20' 
                        : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedEval?.id === evaluation.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-slate-100 text-primary'
                    }`}>
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{evaluation.data?.student_name || evaluation.title}</p>
                      <p className={`text-xs truncate ${selectedEval?.id === evaluation.id ? 'text-primary/20' : 'text-slate-500 dark:text-slate-400'}`}>
                        {evaluation.data?.employer_name || 'Unknown Employer'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
          {selectedEval ? (
            <>
              <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <ClipboardCheck className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedEval.data?.student_name || selectedEval.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> {selectedEval.data?.employer_name || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {selectedEval.data?.date || new Date(selectedEval.created_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-6 rounded-2xl bg-slate-500 border border-slate-200 flex flex-col items-center justify-center text-center">
                        <p className="text-sm font-semibold text-primary uppercase mb-2">Overall Rating</p>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-8 h-8 fill-current" />
                          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 ml-2">{selectedEval.data?.rating || 'N/A'}/5</span>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Supervisor Feedback</h3>
                        <p className="text-slate-600 italic">
                          "{selectedEval.data?.feedback || 'No written feedback provided for this evaluation.'}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Skill Assessment breakdown</h3>
                      <div className="space-y-4">
                        {['Technical Skills', 'Punctuality', 'Teamwork', 'Problem Solving'].map(skill => (
                          <div key={skill} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">{skill}</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-4 h-4 ${star <= (selectedEval.data?.[skill.toLowerCase().replace(' ', '_')] || 0) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        ))}
                        {(!selectedEval.data || !Object.keys(selectedEval.data).some(k => ['technical_skills', 'punctuality', 'teamwork', 'problem_solving'].includes(k))) && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Detailed metrics not available in this record.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <ClipboardCheck className="w-10 h-10 text-primary/30" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Evaluation Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Select an employer evaluation to view the student's ratings and feedback.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
