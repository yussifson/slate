import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Search, UserPlus, ChevronLeft, ChevronRight, Activity, Calendar, GraduationCap, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const map = {
    'Active': 'bg-primary/10 text-primary',
    'Graduated': 'bg-blue-500/10/10 text-blue-500',
    'Suspended': 'bg-red-500/10/10 text-red-500',
    'On Placement': 'bg-amber-500/10 text-amber-500',
    'Employed': 'bg-emerald-500/10/10 text-emerald-500'
  };
  return (
    <span className={`px-2.5 py-1 rounded-md-full text-xs font-semibold ${map[status] || map.Active}`}>
      {status || 'Active'}
    </span>
  );
};

export default function VTraineeProfiles() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [trainees, setTrainees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [view, setView] = useState('table'); // table, profile, wizard
  const [selected, setSelected] = useState(null);
  const [assessments, setAssessments] = useState([]);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [newTrainee, setNewTrainee] = useState({ name: '', case_number: '', trade: '', cohort: '' });

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [tData, cData] = await Promise.all([
        base44.getEntities('voc_trainee', user.company_id),
        base44.getEntities('voc_course', user.company_id)
      ]);
      setTrainees(tData);
      setCourses(cData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load trainees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const loadProfileData = async (trainee) => {
    setSelected(trainee);
    setView('profile');
    try {
      // Load real assessments
      const assessData = await base44.getEntities('voc_assessment', user.company_id);
      setAssessments(assessData.filter(a => a.data?.trainee === trainee.title));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEnroll = async () => {
    if (!newTrainee.name || !newTrainee.trade) {
      toast.error('Name and Program are required');
      return;
    }
    try {
      await base44.createEntity('voc_trainee', {
        title: newTrainee.name,
        case_number: newTrainee.case_number || `TR-${Math.floor(Date.now() / 1000)}`,
        status: 'Active',
        data: {
          trade: newTrainee.trade,
          cohort: newTrainee.cohort,
          progress: 0,
          competency_level: 'Novice'
        }
      }, user.company_id);
      toast.success('Trainee enrolled successfully');
      setView('table');
      setWizardStep(1);
      setNewTrainee({ name: '', case_number: '', trade: '', cohort: '' });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to enroll trainee');
    }
  };

  const filtered = trainees.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || (t.status || 'Active') === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {view !== 'table' && (
            <Button variant="ghost" className="mb-2 -ml-3 text-[#71717a] dark:text-gray-400 hover:text-primary" onClick={() => setView('table')}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('back_to_trainees', 'Back to Trainees')}
            </Button>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {view === 'profile' ? selected?.title : view === 'wizard' ? t('enroll_trainee', 'Enroll Trainee') : t('trainee_profiles', 'Trainee Profiles')}
          </h1>
          {view === 'profile' && <p className="text-[#71717a] dark:text-gray-400">{selected?.data?.trade} • {selected?.case_number}</p>}
        </div>
        {view === 'table' && (
          <Button onClick={() => setView('wizard')} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
            <UserPlus className="w-4 h-4 mr-2" /> {t('enroll_trainee', 'Enroll Trainee')}
          </Button>
        )}
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search trainees..." 
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none focus-visible:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Active', 'On Placement', 'Graduated'].map(s => (
                <Button 
                  key={s} 
                  variant={filterStatus === s ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none ${filterStatus !== s ? 'border-primary/40 text-[#71717a] dark:text-gray-400' : 'bg-primary text-white hover:bg-primary/90'}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary/5 text-[#71717a] dark:text-gray-400 font-semibold border-b border-primary/10">
                <tr>
                  <th className="px-6 py-4">{t('trainee', 'Trainee')}</th>
                  <th className="px-6 py-4">{t('id', 'ID')}</th>
                  <th className="px-6 py-4">{t('program', 'Program')}</th>
                  <th className="px-6 py-4">{t('status', 'Status')}</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-[#71717a] dark:text-gray-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-[#71717a] dark:text-gray-400">No trainees found.</td></tr>
                ) : (
                  filtered.map(t => (
                    <tr key={t.id} onClick={() => loadProfileData(t)} className="hover:bg-primary/5 cursor-pointer transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {(t.title || 'T')[0]}
                        </div>
                        {t.title}
                      </td>
                      <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{t.case_number || '—'}</td>
                      <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{t.data?.trade || 'Unassigned'}</td>
                      <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                      <td className="px-6 py-4 text-right text-[#71717a] dark:text-gray-400"><ChevronRight className="w-4 h-4 inline" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PROFILE VIEW */}
      {view === 'profile' && selected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <CardHeader className="border-b border-primary/10">
                <CardTitle>{t('assessments', 'Recent Assessments')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {assessments.length === 0 ? (
                  <div className="p-8 text-center text-[#71717a] dark:text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No assessments recorded yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-primary/10">
                    {assessments.map(a => (
                      <li key={a.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{a.title}</p>
                          <p className="text-sm text-[#71717a] dark:text-gray-400">{new Date(a.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{a.data?.score ? `${a.data.score}%` : 'Pending'}</p>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Score</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <CardHeader className="border-b border-primary/10">
                <CardTitle>{t('quick_stats', 'Quick Stats')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#71717a] dark:text-gray-400">Status</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#71717a] dark:text-gray-400">Competency</span>
                  <span className="font-semibold">{selected.data?.competency_level || 'Novice'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#71717a] dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-primary">{selected.data?.progress || 0}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* WIZARD VIEW */}
      {view === 'wizard' && (
        <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card max-w-2xl mx-auto overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex bg-primary/5 border-b border-primary/10">
            {[1, 2, 3].map(step => (
              <div key={step} className={`flex-1 p-4 text-center text-sm font-semibold border-b-2 ${wizardStep === step ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-[#71717a] dark:text-gray-400'}`}>
                Step {step}
              </div>
            ))}
          </div>
          <CardContent className="p-6">
            {wizardStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={newTrainee.name} onChange={e => setNewTrainee({...newTrainee, name: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trainee ID (Optional)</label>
                  <Input value={newTrainee.case_number} onChange={e => setNewTrainee({...newTrainee, case_number: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" placeholder="TR-001" />
                </div>
              </motion.div>
            )}
            {wizardStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program / Trade</label>
                  <Select value={newTrainee.trade} onValueChange={v => setNewTrainee({...newTrainee, trade: v})}>
                    <SelectTrigger className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length > 0 ? courses.map(c => (
                        <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                      )) : <SelectItem value="General">General Trade (No courses found)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cohort</label>
                  <Input value={newTrainee.cohort} onChange={e => setNewTrainee({...newTrainee, cohort: e.target.value})} className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" placeholder="e.g. Fall 2026" />
                </div>
              </motion.div>
            )}
            {wizardStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 text-center py-6">
                <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Review & Confirm</h3>
                <p className="text-[#71717a] dark:text-gray-400">You are about to enroll <strong>{newTrainee.name}</strong> into <strong>{newTrainee.trade}</strong>.</p>
              </motion.div>
            )}
          </CardContent>
          <div className="p-4 border-t border-primary/10 bg-primary/5 flex justify-between">
            <Button variant="outline" className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : setView('table')}>
              {wizardStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {wizardStep < 3 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)} className="rounded-md-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Next</Button>
            ) : (
              <Button onClick={handleEnroll} className="rounded-md-xl bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Confirm & Enroll</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
