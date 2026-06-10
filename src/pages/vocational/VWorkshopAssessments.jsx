import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ClipboardCheck, Wrench, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VWorkshopAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_assessment', user?.company_id);
      setAssessments(records);
      if (records.length > 0 && !selectedAssessment) {
        setSelectedAssessment(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch workshop assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchAssessments();
    }
  }, [user]);

  const filteredAssessments = assessments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.data?.workshop_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-primary to-slate-900 bg-clip-text text-transparent">
            Workshop Assessments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Evaluate workshop safety, tool usage, and overall environment standards.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50">
          <div className="p-4 border-b border-primary/5 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input 
                placeholder="Search assessments..." 
                className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-primary/50 text-sm">Loading assessments...</div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">No assessments found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAssessments.map(assessment => (
                  <button
                    key={assessment.id}
                    onClick={() => setSelectedAssessment(assessment)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedAssessment?.id === assessment.id 
                        ? 'bg-primary text-white shadow-md shadow-indigo-500/20' 
                        : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedAssessment?.id === assessment.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-slate-100 dark:bg-slate-800 text-primary'
                    }`}>
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{assessment.title}</p>
                      <p className={`text-xs truncate ${selectedAssessment?.id === assessment.id ? 'text-primary/10' : 'text-slate-500 dark:text-slate-400'}`}>
                        {assessment.data?.workshop_name || 'General Workshop'} • {new Date(assessment.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative">
          {selectedAssessment ? (
            <>
              <div className="h-32 bg-gradient-to-r from-primary to-primary relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center text-primary">
                        <Wrench className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedAssessment.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-primary/20 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-primary">{selectedAssessment.data?.workshop_name}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">Inspector: {selectedAssessment.data?.inspector || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Safety Score</CardTitle>
                            <CardDescription>Overall safety compliance</CardDescription>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {selectedAssessment.data?.safety_score || 'N/A'}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Issues Found</CardTitle>
                            <CardDescription>Items needing attention</CardDescription>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {selectedAssessment.data?.issues_count || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-5 rounded-2xl bg-primary/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Assessment Details</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Equipment Condition</p>
                          <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> {selectedAssessment.data?.equipment_condition || 'Good'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">General Notes</p>
                          <p className="font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                            {selectedAssessment.data?.notes || 'No specific notes recorded for this assessment.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 flex items-center justify-center mb-6">
                <ClipboardCheck className="w-10 h-10 text-primary/30" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Assessment Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                Select an assessment to review workshop safety and equipment condition.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
