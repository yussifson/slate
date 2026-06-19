import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, GraduationCap, Building2, UserCheck, Plus, Download, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function VDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    trades: 0,
    trainees: 0,
    placements: 0,
    loading: true
  });

  const [recentGrads, setRecentGrads] = useState([]);
  const [employers, setEmployers] = useState([]);
  
  // Placement Modal
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [placementForm, setPlacementForm] = useState({ trainee: '', employer: '', trade: '', salary: '' });
  const [availableTrainees, setAvailableTrainees] = useState([]);

  const fetchDashboardStats = async () => {
    if (!user?.company_id) return;
    try {
      const [tradeData, traineeData, placementData, employerData] = await Promise.all([
        base44.getEntities('voc_trade', user.company_id),
        base44.getEntities('voc_trainee', user.company_id),
        base44.getEntities('voc_placement', user.company_id),
        base44.getEntities('voc_employer', user.company_id)
      ]);
      
      setStats({
        trades: tradeData.length,
        trainees: traineeData.length,
        placements: placementData.length,
        loading: false
      });

      // Filter graduates
      const grads = traineeData.filter(tr => tr.status?.toLowerCase() === 'graduated').slice(0, 5);
      setRecentGrads(grads);
      
      // Top employers
      setEmployers(employerData.slice(0, 5));

      // For Placement Modal
      setAvailableTrainees(traineeData.filter(tr => tr.status?.toLowerCase() !== 'placed'));
      
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      setStats(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  const handleCreatePlacement = async () => {
    if (!placementForm.trainee || !placementForm.employer) {
      toast.error('Trainee and Employer are required');
      return;
    }
    try {
      await base44.createEntity('voc_placement', {
        title: `Placement - ${placementForm.trainee}`,
        status: 'active',
        data: {
          trainee: placementForm.trainee,
          employer: placementForm.employer,
          trade: placementForm.trade,
          salary: placementForm.salary,
          placement_date: new Date().toISOString()
        }
      }, user.company_id);
      toast.success('Placement created successfully!');
      setIsPlacementOpen(false);
      setPlacementForm({ trainee: '', employer: '', trade: '', salary: '' });
      fetchDashboardStats(); // Refresh
    } catch (error) {
      console.error(error);
      toast.error('Failed to create placement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('vocational_overview', 'Vocational Overview')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('vocational_desc', 'Monitor training programs, trainee progress, and placement rates.')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-primary hover:bg-primary/5 rounded-md-xl">
            <Download className="w-4 h-4 mr-2" /> {t('download_report', 'Report')}
          </Button>
          <Button onClick={() => setIsPlacementOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
            <Plus className="w-4 h-4 mr-2" /> {t('new_placement', 'New Placement')}
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4">
              <Users className="w-32 h-32 text-primary" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#71717a] dark:text-gray-400 font-medium mb-1">{t('total_trainees', 'Total Trainees')}</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{stats.loading ? '...' : stats.trainees}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-md-2xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4">
              <Wrench className="w-32 h-32 text-primary" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#71717a] dark:text-gray-400 font-medium mb-1">{t('active_trades', 'Active Trades')}</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{stats.loading ? '...' : stats.trades}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-md-2xl">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="absolute right-0 top-0 opacity-5 translate-x-4 -translate-y-4">
              <Building2 className="w-32 h-32 text-primary" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#71717a] dark:text-gray-400 font-medium mb-1">{t('job_placements', 'Job Placements')}</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{stats.loading ? '...' : stats.placements}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-md-2xl">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> {t('recent_graduates', 'Recent Graduates')}
              </CardTitle>
              <CardDescription>{t('recent_graduates_desc', 'Trainees who recently completed their slates')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentGrads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <GraduationCap className="w-12 h-12 text-[#71717a] dark:text-gray-400/30 mb-3" />
                  <p className="text-[#71717a] dark:text-gray-400 font-medium">{t('no_graduates', 'No recent graduates to display.')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-primary/10">
                  {recentGrads.map(g => (
                    <li key={g.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {g.title?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{g.title}</p>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{g.data?.trade || 'Unknown Trade'}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md-full font-medium tracking-[0.04em]">
                        {t('graduated', 'Graduated')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <Card className="rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> {t('partner_employers', 'Partner Employers')}
              </CardTitle>
              <CardDescription>{t('partner_employers_desc', 'Top companies hiring our trainees')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {employers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Building2 className="w-12 h-12 text-[#71717a] dark:text-gray-400/30 mb-3" />
                  <p className="text-[#71717a] dark:text-gray-400 font-medium">{t('no_employers', 'No employer data available.')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-primary/10">
                  {employers.map(emp => (
                    <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          <Briefcase className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{emp.title}</p>
                          <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{emp.data?.industry || 'General'}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* New Placement Dialog */}
      <Dialog open={isPlacementOpen} onOpenChange={setIsPlacementOpen}>
        <DialogContent className="sm:max-w-[425px] border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-md-2xl">
          <DialogHeader>
            <DialogTitle>{t('record_placement', 'Record New Placement')}</DialogTitle>
            <DialogDescription>{t('record_placement_desc', 'Add a job placement for a trainee.')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('trainee', 'Trainee')}</label>
              <Select value={placementForm.trainee} onValueChange={(v) => setPlacementForm({...placementForm, trainee: v})}>
                <SelectTrigger className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none focus:ring-primary">
                  <SelectValue placeholder="Select trainee" />
                </SelectTrigger>
                <SelectContent>
                  {availableTrainees.map(t => (
                    <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('employer', 'Employer')}</label>
              <Select value={placementForm.employer} onValueChange={(v) => setPlacementForm({...placementForm, employer: v})}>
                <SelectTrigger className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none focus:ring-primary">
                  <SelectValue placeholder="Select employer" />
                </SelectTrigger>
                <SelectContent>
                  {employers.map(e => (
                    <SelectItem key={e.id} value={e.title}>{e.title}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other / Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('role_trade', 'Role / Trade')}</label>
              <Input 
                value={placementForm.trade} 
                onChange={(e) => setPlacementForm({...placementForm, trade: e.target.value})}
                placeholder="e.g. Junior Electrician"
                className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none focus-visible:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('starting_salary', 'Starting Salary')}</label>
              <Input 
                value={placementForm.salary} 
                onChange={(e) => setPlacementForm({...placementForm, salary: e.target.value})}
                placeholder="e.g. $45,000"
                className="rounded-md-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlacementOpen(false)} className="rounded-md-xl border-primary/40">Cancel</Button>
            <Button onClick={handleCreatePlacement} className="bg-primary text-white hover:bg-primary/90 rounded-md-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">Save Placement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
