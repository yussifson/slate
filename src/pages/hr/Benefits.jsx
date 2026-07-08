import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { usePowerSync, useQuery } from '@powersync/react';
import { 
  HeartPulse, 
  PiggyBank, 
  TrendingUp, 
  Plus, 
  ShieldPlus,
  Gift,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const TYPE_STYLES = {
  'Health': { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', icon: HeartPulse, gradient: 'from-emerald-500 to-teal-600' },
  '401k':   { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', icon: PiggyBank, gradient: 'from-amber-500 to-orange-600' },
  'Equity': { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', icon: TrendingUp, gradient: 'from-purple-500 to-indigo-600' },
  'Other':  { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: Gift, gradient: 'from-blue-500 to-cyan-600' },
};

export default function Benefits() {
  const { t } = useTranslation();
  const powersync = usePowerSync();
  const { data: benefits = [] } = useQuery(`SELECT * FROM univ_erp_benefits WHERE status != 'deleted' OR status IS NULL ORDER BY created_at DESC`);

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState({
    name: '',
    provider: '',
    type: 'Health',
    employer_contribution: 0,
    employee_deduction: 0,
    status: 'Active'
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const id = crypto.randomUUID();
      await powersync.execute(
        `INSERT INTO univ_erp_benefits (id, created_at, name, provider, type, employer_contribution, employee_deduction, status) 
         VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?)`,
        [
          id,
          newBenefit.name, 
          newBenefit.provider, 
          newBenefit.type, 
          newBenefit.employer_contribution, 
          newBenefit.employee_deduction, 
          newBenefit.status
        ]
      );
      setIsAddOpen(false);
      setNewBenefit({ name: '', provider: '', type: 'Health', employer_contribution: 0, employee_deduction: 0, status: 'Active' });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    await powersync.execute(`UPDATE univ_erp_benefits SET status = ? WHERE id = ?`, [newStatus, id]);
  };

  const deleteBenefit = async (id) => {
    await powersync.execute(`UPDATE univ_erp_benefits SET status = 'deleted' WHERE id = ?`, [id]);
  };

  const filteredBenefits = benefits.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) || 
    b.provider?.toLowerCase().includes(search.toLowerCase())
  );

  const activeHealth = benefits.filter(b => b.type === 'Health' && b.status === 'Active').length;
  const active401k = benefits.filter(b => b.type === '401k' && b.status === 'Active').length;
  const activeEquity = benefits.filter(b => b.type === 'Equity' && b.status === 'Active').length;
  const totalEmployerContribution = benefits.reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0);

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-full p-4 lg:p-8 font-dmsans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Benefits & Rewards</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage employee health plans, 401k, and equity.</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4" /> New Benefit
          </Button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Employer Contribution', value: `$${totalEmployerContribution.toLocaleString()}`, icon: Gift, gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Active Health Plans', value: activeHealth, icon: HeartPulse, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: '401k Options', value: active401k, icon: PiggyBank, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Equity Programs', value: activeEquity, icon: TrendingUp, gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map(({ label, value, icon: Icon, gradient, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search benefits..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900 rounded-xl border-[0.5px] border-black/9 dark:border-white/8" />
        </div>

        {/* ── Benefits Grid ── */}
        {filteredBenefits.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
            <ShieldPlus className="w-14 h-14 mx-auto mb-3 opacity-20 text-primary" />
            <p className="font-semibold text-lg text-foreground">No benefits found</p>
            <p className="text-sm mt-1">Create a new benefit program to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBenefits.map(benefit => {
              const typeStyle = TYPE_STYLES[benefit.type] || TYPE_STYLES['Other'];
              const Icon = typeStyle.icon;
              return (
                <div key={benefit.id} className="group bg-white dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative">
                  <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 bg-gradient-to-bl ${typeStyle.gradient} rounded-bl-full pointer-events-none`} />
                  
                  <div className="p-5 flex-1 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeStyle.gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${benefit.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {benefit.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => toggleStatus(benefit.id, benefit.status)}>
                              {benefit.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteBenefit(benefit.id)}>
                              Delete Program
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-1 leading-tight">{benefit.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-4">{benefit.provider}</p>

                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                        <span className="text-muted-foreground font-medium">Employer Covers</span>
                        <span className="font-bold text-foreground">${benefit.employer_contribution?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                        <span className="text-muted-foreground font-medium">Employee Pays</span>
                        <span className="font-bold text-foreground">${benefit.employee_deduction?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Sheet ── */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Add New Benefit</SheetTitle>
            <SheetDescription>Create a new benefit program for your employees.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Benefit Name</label>
              <Input required value={newBenefit.name} onChange={e => setNewBenefit({...newBenefit, name: e.target.value})} placeholder="e.g. Premium Dental" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</label>
              <Input required value={newBenefit.provider} onChange={e => setNewBenefit({...newBenefit, provider: e.target.value})} placeholder="e.g. Delta Dental" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <select className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" value={newBenefit.type} onChange={e => setNewBenefit({...newBenefit, type: e.target.value})}>
                <option>Health</option>
                <option>401k</option>
                <option>Equity</option>
                <option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employer Pays</label>
                <Input type="number" required value={newBenefit.employer_contribution} onChange={e => setNewBenefit({...newBenefit, employer_contribution: Number(e.target.value)})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee Pays</label>
                <Input type="number" required value={newBenefit.employee_deduction} onChange={e => setNewBenefit({...newBenefit, employee_deduction: Number(e.target.value)})} className="mt-1" />
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-white rounded-xl">Create Benefit</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
