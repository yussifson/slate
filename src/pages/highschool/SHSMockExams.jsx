import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Calendar, FileText, Award, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSMockExams() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    examName: '',
    academicYear: new Date().getFullYear().toString(),
    targetForm: 'Form 3',
    startDate: '',
    endDate: ''
  });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_exam', user?.company_id);
      // Filter for mock exams specifically
      setExams(records.filter(r => r.data?.type === 'Mock'));
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchExams();
    }
  }, [user]);

  const handleCreateExam = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_exam',
        title: newExam.examName,
        case_number: `MCK-${Math.floor(Math.random() * 10000)}`,
        status: 'Upcoming', // Upcoming, Ongoing, Completed, Published
        data: {
          ...newExam,
          type: 'Mock',
          term: 'Term 3' // Mocks usually in final term
        }
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewExam({
        examName: '', academicYear: new Date().getFullYear().toString(), targetForm: 'Form 3', startDate: '', endDate: ''
      });
      fetchExams();
    } catch (error) {
      console.error('Failed to create mock exam:', error);
    }
  };

  const updateExamStatus = async (examId, newStatus) => {
    try {
      await base44.updateEntity(examId, { status: newStatus });
      fetchExams();
    } catch (error) {
      console.error('Failed to update exam status:', error);
    }
  };

  const filteredExams = exams.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.academicYear?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Mock Examinations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage WASSCE/Final preparatory mock exams for candidate classes.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Schedule Mock
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Scheduled Mocks</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Search mocks..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-emerald-500 dark:text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No mock exams found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Schedule a mock exam for candidate preparation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Exam Name</th>
                    <th className="px-6 py-4">Target Form</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{exam.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{exam.case_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {exam.data?.targetForm || 'Form 3'} Candidates
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{exam.data?.startDate} to {exam.data?.endDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          exam.status === 'Upcoming' ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' :
                          exam.status === 'Ongoing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          exam.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }>
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {exam.status === 'Upcoming' && (
                            <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Ongoing')} className="h-8 text-xs font-semibold">
                              Start Mock
                            </Button>
                          )}
                          {exam.status === 'Ongoing' && (
                            <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Completed')} className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              End Mock
                            </Button>
                          )}
                          {exam.status === 'Completed' && (
                            <Button size="sm" variant="outline" onClick={() => updateExamStatus(exam.id, 'Published')} className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              Publish Results
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Schedule Mock Exam</DialogTitle>
              <DialogDescription className="text-emerald-100 dark:text-emerald-900">
                Setup a preparatory mock cycle for candidates.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Mock Exam Name</label>
              <Input 
                placeholder="e.g. WASSCE Mock 1"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newExam.examName}
                onChange={e => setNewExam({...newExam, examName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Academic Year</label>
                <Input 
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newExam.academicYear}
                  onChange={e => setNewExam({...newExam, academicYear: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Form</label>
                <select 
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500"
                  value={newExam.targetForm}
                  onChange={e => setNewExam({...newExam, targetForm: e.target.value})}
                >
                  <option value="Form 3">Form 3 Candidates</option>
                  <option value="Form 2">Form 2 (Early Mocks)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Start Date</label>
                <Input 
                  type="date"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newExam.startDate}
                  onChange={e => setNewExam({...newExam, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">End Date</label>
                <Input 
                  type="date"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newExam.endDate}
                  onChange={e => setNewExam({...newExam, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateExam} 
              disabled={!newExam.examName || !newExam.startDate || !newExam.endDate}
              className="rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold"
            >
              Save Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
