import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Clock, Users, CheckCircle2, FileText, Timer, Save, X, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

export default function VPracticalExams() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [exams, setExams] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState('dashboard'); // dashboard or conduct
  const [activeExam, setActiveExam] = useState(null);
  const [activeTraineeIdx, setActiveTraineeIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [tab, setTab] = useState('upcoming');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', room: '', time: '', assessor: '' });

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [eData, tData] = await Promise.all([
        base44.getEntities('voc_exam', user.company_id),
        base44.getEntities('voc_trainee', user.company_id)
      ]);
      setExams(eData);
      setTrainees(tData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateExam = async () => {
    if (!newExam.title) return;
    try {
      await base44.createEntity('voc_exam', {
        title: newExam.title,
        status: 'scheduled',
        data: {
          room: newExam.room,
          time: newExam.time,
          assessor: newExam.assessor,
          trainees: trainees.length > 0 ? trainees.slice(0, 5).map(t => t.id) : [] // randomly assign first 5 for now
        }
      }, user.company_id);
      toast.success('Exam created');
      setIsCreateOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create exam');
    }
  };

  const metrics = [
    { label: 'Pending Review', value: exams.filter(e => e.status === 'review').length || 0 },
    { label: 'Scheduled', value: exams.filter(e => e.status === 'scheduled').length || 0 },
    { label: 'In Progress', value: exams.filter(e => e.status === 'progress').length || 0 },
    { label: 'Completed', value: exams.filter(e => e.status === 'completed').length || 0 },
  ];

  const criteria = [
    { name: 'PPE correctly worn', weight: 20, maxScore: 5 },
    { name: 'Isolation procedure', weight: 25, maxScore: 5 },
    { name: 'Task execution speed', weight: 20, maxScore: 5 },
    { name: 'Documentation completed', weight: 15, maxScore: 5 },
    { name: 'Clean-up', weight: 20, maxScore: 5 },
  ];

  const startExam = (exam) => {
    setActiveExam(exam);
    setActiveTraineeIdx(0);
    setScores({});
    setView('conduct');
  };

  const setScore = (criterionIdx, value) => {
    setScores(prev => ({
      ...prev,
      [activeTraineeIdx]: { ...(prev[activeTraineeIdx] || {}), [criterionIdx]: value }
    }));
  };

  const getTraineeScore = (tIdx) => {
    const ts = scores[tIdx] || {};
    let total = 0;
    criteria.forEach((c, ci) => {
      const s = ts[ci] || 0;
      total += (s / c.maxScore) * c.weight;
    });
    return Math.round(total);
  };

  const saveExamScores = async () => {
    try {
      // Typically we'd save this to voc_assessment for each trainee, 
      // but for now we'll just mark the exam completed
      await base44.updateEntity('voc_exam', activeExam.id, {
        status: 'completed',
        data: { ...activeExam.data, scores }
      }, user.company_id);
      toast.success('Exam scores saved and finalized');
      setView('dashboard');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save scores');
    }
  };

  // Get active trainees for the exam
  const examTrainees = activeExam?.data?.trainees 
    ? trainees.filter(t => activeExam.data.trainees.includes(t.id))
    : trainees.slice(0, 5);

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* ── DASHBOARD VIEW ── */}
      {view === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
                {t('practical_assessments', 'Practical Assessments')}
              </h1>
              <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
                {exams.length} {t('assessments_registered', 'assessments registered')}
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
                  <Plus className="w-4 h-4 mr-2" /> {t('create_assessment', 'Create Assessment')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <DialogHeader>
                  <DialogTitle>{t('schedule_exam', 'Schedule Practical Exam')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input placeholder="e.g. Arc Welding Final" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room / Bay</label>
                    <Input placeholder="e.g. Workshop C" value={newExam.room} onChange={e => setNewExam({...newExam, room: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Slot</label>
                    <Input placeholder="e.g. 14:00 - 17:00" value={newExam.time} onChange={e => setNewExam({...newExam, time: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assessor</label>
                    <Input placeholder="e.g. M. Asante" value={newExam.assessor} onChange={e => setNewExam({...newExam, assessor: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none border-primary/40">Cancel</Button>
                  <Button onClick={handleCreateExam} className="rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-primary text-white hover:bg-primary/90">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {metrics.map(m => (
              <Card key={m.label} className="rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-semibold text-primary tracking-[-0.02em]">{m.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mt-2 tracking-[0.04em]">{m.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assessment List */}
          <Card className="rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="flex gap-2 p-4 border-b border-primary/10">
              {['upcoming', 'completed'].map(t => (
                <Button key={t} onClick={() => setTab(t)} variant={tab === t ? 'default' : 'ghost'} className={`rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${tab === t ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-[#71717a] dark:text-gray-400'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
            
            <div className="divide-y divide-primary/5">
              {exams.length === 0 ? (
                <div className="text-center py-16 text-[#71717a] dark:text-gray-400 flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>No practical assessments found.</p>
                </div>
              ) : (
                exams.filter(e => tab === 'upcoming' ? e.status !== 'completed' : e.status === 'completed').map((exam) => (
                  <div key={exam.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-primary/5 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {exam.status === 'scheduled' && <Badge variant="outline" className="border-primary bg-primary/10 text-primary">Scheduled</Badge>}
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{exam.title}</h3>
                      </div>
                      <div className="text-sm text-[#71717a] dark:text-gray-400 flex items-center gap-4">
                        <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {exam.data?.trainees?.length || 0} trainees</span>
                        <span>{exam.data?.room || 'TBD'}</span>
                        <span>{exam.data?.time || 'TBD'}</span>
                        <span>Assessor: {exam.data?.assessor || 'TBD'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" className="rounded-xl border-primary/40 text-primary hover:bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">View Details</Button>
                      {exam.status !== 'completed' && (
                        <Button onClick={() => startExam(exam)} className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Conduct Exam</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── CONDUCT VIEW (Full-Screen Assessor) ── */}
      {view === 'conduct' && (
        <div className="h-[calc(100vh-100px)] flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {/* Top bar */}
          <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-[#71717a] dark:text-gray-400 hover:text-primary rounded-xl">
                <X className="w-4 h-4 mr-1" /> Exit
              </Button>
              <div className="w-px h-5 bg-primary/20" />
              <span className="font-semibold text-lg text-slate-900 dark:text-white">EXAM: {activeExam?.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono font-semibold">00:00:00</span>
              </div>
              <Button onClick={saveExamScores} className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
                <Save className="w-4 h-4 mr-2" /> Complete & Save
              </Button>
            </div>
          </div>

          {/* 2-Panel Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Trainee List */}
            <div className="w-[250px] shrink-0 bg-card border-r border-primary/10 overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className="p-4 text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 border-b border-primary/10 tracking-[0.04em]">
                Trainees ({examTrainees.length})
              </div>
              <div className="p-2 space-y-1">
                {examTrainees.map((trainee, i) => {
                  const scored = scores[i] && Object.keys(scores[i]).length === criteria.length;
                  return (
                    <Button 
                      key={i} 
                      variant={activeTraineeIdx === i ? 'default' : 'ghost'}
                      onClick={() => setActiveTraineeIdx(i)}
                      className={`w-full justify-start rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${activeTraineeIdx === i ? 'bg-primary text-white' : 'text-foreground hover:bg-primary/5'}`}
                    >
                      {scored ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2 opacity-50" />}
                      <span className="truncate">{trainee.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Right: Scoring Panel */}
            <div className="flex-1 overflow-y-auto p-8 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-[-0.02em]">{examTrainees[activeTraineeIdx]?.title || 'Unknown Trainee'}</h2>
                    <p className="text-[#71717a] dark:text-gray-400">ID: {examTrainees[activeTraineeIdx]?.case_number || 'TR-000'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#71717a] dark:text-gray-400 uppercase tracking-wider font-semibold mb-1 tracking-[0.04em]">Current Score</div>
                    <div className="text-4xl font-semibold text-primary tracking-[-0.02em]">{getTraineeScore(activeTraineeIdx)}<span className="text-lg text-[#71717a] dark:text-gray-400">/100</span></div>
                  </div>
                </div>

                <div className="space-y-6">
                  {criteria.map((c, ci) => {
                    const currentVal = (scores[activeTraineeIdx] || {})[ci] || 0;
                    return (
                      <div key={ci} className="p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-primary/5">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" /> {c.name}
                          </h4>
                          <Badge variant="outline" className="border-primary/40 bg-card text-primary font-mono hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Weight: {c.weight}%</Badge>
                        </div>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map(val => (
                            <Button
                              key={val}
                              onClick={() => setScore(ci, val)}
                              className={`flex-1 h-12 rounded-xl text-lg font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${currentVal === val ? 'bg-primary text-white border-primary' : 'bg-card text-foreground border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary hover:bg-primary/10'}`}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-[#71717a] dark:text-gray-400 font-medium px-1 tracking-[0.04em]">
                          <span>0 = Fail</span>
                          <span>5 = Perfect</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-4 bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-2xl">
                  <label className="text-sm font-semibold block mb-2">Assessor Remarks</label>
                  <textarea 
                    className="w-full h-24 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none resize-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                    placeholder="Add observations, safety violations, or commendations here..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
