import React, { useState } from 'react';
import { Users, UserPlus, FileSignature, CheckCircle, Briefcase, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

export default function OptavelHR() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['optavel_employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_employees WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: capTable = [] } = useQuery({
    queryKey: ['optavel_cap_table', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_cap_table WHERE company_id = ? ORDER BY equity_percentage DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const addEmployee = useMutation({
    mutationFn: async () => {
      if (!newEmpName || !newEmpRole) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_employees (id, company_id, name, role, department, onboarding_progress, status, start_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, newEmpName, newEmpRole, 'Engineering', 20, 'onboarding', new Date().toISOString()]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['optavel_employees']);
      setNewEmpName('');
      setNewEmpRole('');
    }
  });

  const completeOnboarding = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute(
        `UPDATE optavel_employees SET onboarding_progress = 100, status = 'active' WHERE id = ?`,
        [id]
      );
    },
    onSuccess: () => queryClient.invalidateQueries(['optavel_employees'])
  });

  const onboardingList = employees.filter(e => e.status === 'onboarding');
  const activeList = employees.filter(e => e.status === 'active');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-500" />
          HR & Team
        </h1>
        <p className="text-slate-400 mt-1">Team Directory, Equity Vesting, and Onboarding Workflows.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* New Employee Form */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 lg:col-span-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-500" /> Add New Team Member
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" placeholder="Full Name" 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={newEmpName} onChange={e => setNewEmpName(e.target.value)}
            />
            <input 
              type="text" placeholder="Role / Title" 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)}
            />
            <Button onClick={() => addEmployee.mutate()} disabled={addEmployee.isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
              {addEmployee.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Member
            </Button>
          </div>
        </div>

        {/* Directory List */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" /> Active Team Directory
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading directory...</p>
            ) : activeList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">No active team members yet.</p>
            ) : (
              activeList.map(emp => (
                <div key={emp.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-500">{emp.role} • {emp.department}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">Active</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Onboarding & Cap Table */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" /> Active Onboarding
            </h2>
            <div className="space-y-3">
              {onboardingList.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No pending onboarding.</p>
              ) : (
                onboardingList.map(emp => (
                  <div key={emp.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{emp.name}</h3>
                        <p className="text-xs text-slate-400">{emp.role}</p>
                      </div>
                      <button onClick={() => completeOnboarding.mutate(emp.id)} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Mark Onboarding Complete">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${emp.onboarding_progress}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1 text-slate-500">{emp.onboarding_progress}% Complete</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-emerald-400" /> Cap Table
            </h2>
            <div className="space-y-4">
              {capTable.length === 0 ? (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">Founders Pool</span>
                      <span className="text-emerald-500 font-bold">95%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">Growth Pool</span>
                      <span className="text-emerald-500 font-bold">5%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                </>
              ) : capTable.map(entry => (
                <div key={entry.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">User {entry.user_id?.slice(0,5)}</span>
                    <span className="text-emerald-500 font-bold">{entry.equity_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${entry.equity_percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
