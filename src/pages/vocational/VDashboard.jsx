import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Users, GraduationCap, Building2, UserCheck,
  Plus, Download, Wrench, TrendingUp, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

export default function VDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState({ trades: 0, trainees: 0, placements: 0, loading: true });
  const [recentGrads, setRecentGrads] = useState([]);
  const [employers, setEmployers] = useState([]);
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
      setStats({ trades: tradeData.length, trainees: traineeData.length, placements: placementData.length, loading: false });
      setRecentGrads(traineeData.filter(tr => tr.status?.toLowerCase() === 'graduated').slice(0, 5));
      setEmployers(employerData.slice(0, 5));
      setAvailableTrainees(traineeData.filter(tr => tr.status?.toLowerCase() !== 'placed'));
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      setStats(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => { fetchDashboardStats(); }, [user]);

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
      fetchDashboardStats();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create placement');
    }
  };

  const placementRate = stats.trainees > 0
    ? Math.round((stats.placements / stats.trainees) * 100)
    : 0;

  return (
    <div className="space-y-6 font-dmsans school-page-enter">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-600 via-orange-500 to-amber-600 p-8 mb-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('vocational_overview', 'Vocational Overview')}</h1>
                <p className="text-white/70 text-sm">Welcome back, {user?.email?.split('@')[0]}</p>
              </div>
            </div>
            <p className="text-white/60 text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 border rounded-xl"
              onClick={() => fetchDashboardStats()}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
            <Button
              onClick={() => setIsPlacementOpen(true)}
              size="sm"
              className="bg-white text-orange-700 hover:bg-white/90 font-semibold rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" /> {t('new_placement', 'New Placement')}
            </Button>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-16 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-32 w-16 h-16 bg-white/5 rounded-full" />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Trainees */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.loading ? <span className="animate-pulse text-muted-foreground">—</span> : stats.trainees}
            </p>
            <p className="text-sm text-muted-foreground">{t('total_trainees', 'Total Trainees')}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">Enrolled across all trade programs</p>
          </div>
        </motion.div>

        {/* Active Trades */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-md">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Running
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.loading ? <span className="animate-pulse text-muted-foreground">—</span> : stats.trades}
            </p>
            <p className="text-sm text-muted-foreground">{t('active_trades', 'Active Trades')}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">Vocational disciplines offered</p>
          </div>
        </motion.div>

        {/* Job Placements */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${placementRate >= 50 ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                <TrendingUp className="w-3 h-3" /> {placementRate}%
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.loading ? <span className="animate-pulse text-muted-foreground">—</span> : stats.placements}
            </p>
            <p className="text-sm text-muted-foreground">{t('job_placements', 'Job Placements')}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">Placement rate across all programs</p>
          </div>
        </motion.div>
      </div>

      {/* ── Secondary Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Graduates */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  {t('recent_graduates', 'Recent Graduates')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('recent_graduates_desc', 'Trainees who recently completed their program')}
                </p>
              </div>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                {recentGrads.length} total
              </span>
            </div>

            {recentGrads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <GraduationCap className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{t('no_graduates', 'No recent graduates to display.')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentGrads.map(g => (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {g.title?.charAt(0) || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
                      <p className="text-xs text-muted-foreground">{g.data?.trade || 'Unknown Trade'}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold shrink-0">
                      {t('graduated', 'Graduated')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Partner Employers */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  {t('partner_employers', 'Partner Employers')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('partner_employers_desc', 'Top companies hiring our trainees')}
                </p>
              </div>
              <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                {employers.length} partners
              </span>
            </div>

            {employers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{t('no_employers', 'No employer data available.')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employers.map((emp, idx) => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{emp.title}</p>
                      <p className="text-xs text-muted-foreground">{emp.data?.industry || 'General Industry'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── New Placement Dialog ── */}
      <Dialog open={isPlacementOpen} onOpenChange={setIsPlacementOpen}>
        <DialogContent className="sm:max-w-[425px] border-primary/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('record_placement', 'Record New Placement')}</DialogTitle>
            <DialogDescription>{t('record_placement_desc', 'Add a job placement for a trainee.')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('trainee', 'Trainee')}</label>
              <Select value={placementForm.trainee} onValueChange={(v) => setPlacementForm({ ...placementForm, trainee: v })}>
                <SelectTrigger className="rounded-xl border-primary/40 focus:ring-primary">
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
              <Select value={placementForm.employer} onValueChange={(v) => setPlacementForm({ ...placementForm, employer: v })}>
                <SelectTrigger className="rounded-xl border-primary/40 focus:ring-primary">
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
                onChange={(e) => setPlacementForm({ ...placementForm, trade: e.target.value })}
                placeholder="e.g. Junior Electrician"
                className="rounded-xl border-primary/40 focus-visible:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('starting_salary', 'Starting Salary')}</label>
              <Input
                value={placementForm.salary}
                onChange={(e) => setPlacementForm({ ...placementForm, salary: e.target.value })}
                placeholder="e.g. $45,000"
                className="rounded-xl border-primary/40 focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlacementOpen(false)} className="rounded-xl border-primary/40">Cancel</Button>
            <Button onClick={handleCreatePlacement} className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:opacity-90 rounded-xl shadow-md">
              Save Placement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
