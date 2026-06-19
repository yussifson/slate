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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VEmployerEvaluations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEval, setSelectedEval] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEval, setNewEval] = useState({ student_name: '', employer_name: '', rating: '5', feedback: '' });

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_evaluation', user?.company_id);
      setEvaluations(records);
      if (records.length > 0 && !selectedEval) {
        setSelectedEval(records[0]);
      } else if (selectedEval) {
        const updated = records.find(r => r.id === selectedEval.id);
        if (updated) setSelectedEval(updated);
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEvaluations();
    }
  }, [user]);

  const handleCreateEval = async () => {
    if (!newEval.student_name || !newEval.employer_name) {
      toast.error('Student Name and Employer Name are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_evaluation', {
        title: `${newEval.student_name} - ${newEval.employer_name}`,
        status: 'Completed',
        data: {
          student_name: newEval.student_name,
          employer_name: newEval.employer_name,
          rating: parseInt(newEval.rating) || 5,
          feedback: newEval.feedback,
          date: new Date().toISOString().split('T')[0],
          technical_skills: parseInt(newEval.rating) || 5,
          punctuality: parseInt(newEval.rating) || 5,
          teamwork: parseInt(newEval.rating) || 5,
          problem_solving: parseInt(newEval.rating) || 5
        }
      }, user?.company_id);
      toast.success('Evaluation added');
      setIsDialogOpen(false);
      setNewEval({ student_name: '', employer_name: '', rating: '5', feedback: '' });
      fetchEvaluations();
      setSelectedEval(created);
    } catch (error) {
      console.error('Failed to save evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  };

  const filteredEvals = evaluations.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.data?.employer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('employer_evaluations', 'Employer Evaluations')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('evaluations_desc', 'Review performance feedback from internship hosts and employers.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_evaluation', 'Add Evaluation')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-md-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('record_eval', 'Record Evaluation')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="student">{t('student_name', 'Student Name')}</Label>
                <Input id="student" placeholder="e.g. John Doe" value={newEval.student_name} onChange={e => setNewEval({...newEval, student_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer">{t('employer_name', 'Employer Name')}</Label>
                <Input id="employer" placeholder="e.g. TechCorp" value={newEval.employer_name} onChange={e => setNewEval({...newEval, employer_name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">{t('rating', 'Overall Rating (1-5)')}</Label>
                <Input id="rating" type="number" min="1" max="5" value={newEval.rating} onChange={e => setNewEval({...newEval, rating: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">{t('feedback', 'Feedback')}</Label>
                <textarea 
                  id="feedback" 
                  className="w-full h-24 p-3 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card resize-none text-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
                  placeholder="Supervisor comments..."
                  value={newEval.feedback}
                  onChange={e => setNewEval({...newEval, feedback: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateEval} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Evaluation')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search evaluations..." 
                className="pl-9 h-10 border-primary/40 rounded-md-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading evaluations...</div>
            ) : filteredEvals.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No evaluations found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredEvals.map(evaluation => (
                  <button
                    key={evaluation.id}
                    onClick={() => setSelectedEval(evaluation)}
                    className={`w-full text-left p-3 rounded-md-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedEval?.id === evaluation.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md-xl flex items-center justify-center font-semibold shrink-0 ${
                      selectedEval?.id === evaluation.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate text-sm">{evaluation.data?.student_name || evaluation.title}</p>
                      <p className={`text-xs truncate ${selectedEval?.id === evaluation.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {evaluation.data?.employer_name || 'Unknown Employer'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedEval ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10"></div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="w-full h-full rounded-md-xl bg-primary/5 flex items-center justify-center text-primary">
                        <ClipboardCheck className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedEval.data?.student_name || selectedEval.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-primary" /> {selectedEval.data?.employer_name || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary" /> {selectedEval.data?.date || new Date(selectedEval.created_date || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl flex flex-col items-center justify-center text-center p-6">
                        <p className="text-sm font-semibold text-primary uppercase mb-2 tracking-[0.04em]">Overall Rating</p>
                        <div className="flex items-center gap-2 text-amber-500">
                          <Star className="w-8 h-8 fill-current" />
                          <span className="text-4xl font-black text-slate-900 dark:text-white ml-2 tracking-[-0.02em]">{selectedEval.data?.rating || 'N/A'}/5</span>
                        </div>
                      </Card>
                      
                      <Card className="md:col-span-2 p-6 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Supervisor Feedback</h3>
                        <p className="text-[#71717a] dark:text-gray-400 italic leading-relaxed">
                          "{selectedEval.data?.feedback || 'No written feedback provided for this evaluation.'}"
                        </p>
                      </Card>
                    </div>
                    
                    <Card className="p-6 rounded-md-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider tracking-[0.04em]">Skill Assessment Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {['Technical Skills', 'Punctuality', 'Teamwork', 'Problem Solving'].map(skill => (
                          <div key={skill} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-primary/5 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{skill}</span>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-5 h-5 ${star <= (selectedEval.data?.[skill.toLowerCase().replace(' ', '_')] || 0) ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(!selectedEval.data || !Object.keys(selectedEval.data).some(k => ['technical_skills', 'punctuality', 'teamwork', 'problem_solving'].includes(k))) && (
                        <p className="text-sm text-[#71717a] dark:text-gray-400 text-center py-4">Detailed metrics not available in this record.</p>
                      )}
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-md-full bg-primary/10 flex items-center justify-center mb-6">
                <ClipboardCheck className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Evaluation Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select an employer evaluation from the list to view detailed feedback and skill assessments.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
