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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

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

  const filteredBenefits = benefits.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) || 
    b.provider?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const activeHealth = benefits.filter(b => b.type === 'Health' && b.status === 'Active').length;
  const active401k = benefits.filter(b => b.type === '401k' && b.status === 'Active').length;
  const activeEquity = benefits.filter(b => b.type === 'Equity' && b.status === 'Active').length;
  const totalEmployerContribution = benefits.reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0);

  // Chart data
  const chartData = [
    { name: 'Health', value: benefits.filter(b => b.type === 'Health').reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0) },
    { name: '401k', value: benefits.filter(b => b.type === '401k').reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0) },
    { name: 'Equity', value: benefits.filter(b => b.type === 'Equity').reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0) },
    { name: 'Other', value: benefits.filter(b => !['Health', '401k', 'Equity'].includes(b.type)).reduce((acc, curr) => acc + (curr.employer_contribution || 0), 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6 font-dmsans max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benefits & Rewards</h1>
          <p className="text-slate-500 mt-1">Manage employee health plans, 401k, and equity.</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Benefit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30 dark:text-blue-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Rewards</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">${totalEmployerContribution.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl dark:bg-green-900/30 dark:text-green-400">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Health</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{activeHealth}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl dark:bg-amber-900/30 dark:text-amber-400">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">401k Plans</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{active401k}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30 dark:text-purple-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Equity Options</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{activeEquity}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-800/50">
            <CardTitle className="text-lg font-bold">Active Benefits Portfolio</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search benefits..." 
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-9 rounded-full text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBenefits.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No benefits found</div>
              ) : (
                filteredBenefits.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${b.type === 'Health' ? 'bg-green-100 text-green-600' : b.type === '401k' ? 'bg-amber-100 text-amber-600' : b.type === 'Equity' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {b.type === 'Health' ? <HeartPulse className="w-5 h-5" /> : b.type === '401k' ? <PiggyBank className="w-5 h-5" /> : b.type === 'Equity' ? <TrendingUp className="w-5 h-5" /> : <ShieldPlus className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-base">{b.name}</h4>
                        <p className="text-sm text-slate-500 mt-0.5">{b.provider} • {b.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-8">
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Employer</p>
                        <p className="font-semibold text-slate-900 dark:text-white">${b.employer_contribution}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Employee</p>
                        <p className="font-semibold text-slate-900 dark:text-white">${b.employee_deduction}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${b.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <CardTitle className="text-lg font-bold">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `$${value}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-slate-500">
                No cost data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Add New Benefit</SheetTitle>
            <SheetDescription>
              Create a new benefit plan for employees.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAdd} className="space-y-5 mt-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Plan Name</label>
              <Input 
                required 
                placeholder="e.g. BlueCross PPO" 
                value={newBenefit.name}
                onChange={e => setNewBenefit({...newBenefit, name: e.target.value})}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Provider</label>
              <Input 
                required 
                placeholder="e.g. BlueCross BlueShield" 
                value={newBenefit.provider}
                onChange={e => setNewBenefit({...newBenefit, provider: e.target.value})}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Type</label>
              <select 
                className="w-full h-11 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={newBenefit.type}
                onChange={e => setNewBenefit({...newBenefit, type: e.target.value})}
              >
                <option value="Health">Health</option>
                <option value="401k">401k</option>
                <option value="Equity">Equity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Employer Contribution ($)</label>
                <Input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required 
                  value={newBenefit.employer_contribution}
                  onChange={e => setNewBenefit({...newBenefit, employer_contribution: parseFloat(e.target.value) || 0})}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Employee Deduction ($)</label>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  required 
                  value={newBenefit.employee_deduction}
                  onChange={e => setNewBenefit({...newBenefit, employee_deduction: parseFloat(e.target.value) || 0})}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Status</label>
              <select 
                className="w-full h-11 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={newBenefit.status}
                onChange={e => setNewBenefit({...newBenefit, status: e.target.value})}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full h-11 text-base font-semibold">Create Benefit Plan</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
