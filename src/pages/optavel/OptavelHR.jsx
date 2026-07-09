import React, { useState } from 'react';
import { Users, UserPlus, Clock, X, Briefcase, Plus, Heart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/api/supabaseClient';
import { registerSchoolUser } from '@/api/authUtils';

const CARD = 'bg-card border border-border rounded-2xl p-6 shadow-sm';
const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';

export default function OptavelHR() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [empModal, setEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', role: '', department: '', email: '', phone: '', status: 'active', start_date: new Date().toISOString().split('T')[0] });
  const [createLogin, setCreateLogin] = useState(false);
  const [loginMethod, setLoginMethod] = useState('invite'); // 'invite' | 'password'
  const [defaultPassword, setDefaultPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['optavel_employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM optavel_employees WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const submitEmp = async () => {
    if (!empForm.name) return toast.error('Name is required');
    if (createLogin && !empForm.email) return toast.error('Email is required to create a login');
    if (createLogin && loginMethod === 'password' && defaultPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setIsSubmitting(true);
    try {
      if (createLogin) {
        // Register the user in Supabase Auth
        const tempPassword = loginMethod === 'password' ? defaultPassword : Math.random().toString(36).slice(-8) + 'A1!';
        const forceReset = loginMethod === 'password'; // Force reset only if admin set a default password
        
        const { user: newUser, error: regError } = await registerSchoolUser(
          empForm.email,
          tempPassword,
          'employee', // Default role
          companyId,
          empForm.name,
          forceReset
        );

        if (regError && regError.message !== 'already registered in this firm') {
          throw regError;
        }

        if (loginMethod === 'invite') {
          // Send the Supabase password reset email as the "Invite"
          const { currentSubdomain, baseDomain } = await import('@/lib/domainUtils').then(m => m.getSubdomainAndBase());
          const port = window.location.port ? `:${window.location.port}` : '';
          const base = currentSubdomain
            ? `${window.location.protocol}//${currentSubdomain}.${baseDomain}${port}`
            : `${window.location.protocol}//${baseDomain}${port}`;

          await supabase.auth.resetPasswordForEmail(empForm.email, {
            redirectTo: `${base}/reset-password`
          });
        }
      }

      await powerSync.execute(
        `INSERT INTO optavel_employees (id, company_id, name, role, department, email, phone, onboarding_progress, status, start_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), companyId, empForm.name, empForm.role, empForm.department, empForm.email, empForm.phone, 0, empForm.status, empForm.start_date, new Date().toISOString(), new Date().toISOString()]
      );

      toast.success(createLogin ? (loginMethod === 'invite' ? 'Employee added & invite sent!' : 'Employee added & password set!') : 'Employee added!');
      setEmpModal(false);
      setEmpForm({ name: '', role: '', department: '', email: '', phone: '', status: 'active', start_date: new Date().toISOString().split('T')[0] });
      setCreateLogin(false);
      setDefaultPassword('');
      queryClient.invalidateQueries(['optavel_employees']);
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmp = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_employees WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_employees']);
  };

  const activeEmp = employees.filter(e => e.status === 'active').length;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-background text-foreground" >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Heart className="w-7 h-7 text-primary" /></div>
            HR & Team
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Directory · Onboarding · Time Off</p>
        </div>
        <Button onClick={() => setEmpModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <UserPlus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Headcount', val: employees.length, color: 'pink' },
          { label: 'Active', val: activeEmp, color: 'emerald' },
          { label: 'On Leave', val: '0', color: 'blue' },
          { label: 'Open Roles', val: '2', color: 'amber' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${CARD}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <div className={HEAD}><Users className="w-5 h-5 text-primary" /> Employee Directory</div>
        {employees.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No employees yet. Time to hire!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Role & Dept</th><th className="pb-3 pr-4">Contact</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map(emp => (
                <tr key={emp.id} className="group">
                  <td className="py-3 pr-4 font-semibold text-foreground">{emp.name}</td>
                  <td className="py-3 pr-4">
                    <p className="text-foreground">{emp.role}</p>
                    <p className="text-xs text-muted-foreground">{emp.department}</p>
                  </td>
                  <td className="py-3 pr-4">
                    {emp.email && <p className="text-muted-foreground text-xs">✉ {emp.email}</p>}
                    {emp.phone && <p className="text-muted-foreground text-xs">📞 {emp.phone}</p>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${emp.status === 'active' ? 'bg-primary/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-muted-foreground border-slate-500/30'}`}>{emp.status}</span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => deleteEmp(emp.id)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={empModal} onOpenChange={setEmpModal}>
        <DialogContent className="bg-background border border-border text-foreground">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-muted-foreground">Name *</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Full name" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Role</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Job title" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Department</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Engineering" value={empForm.department} onChange={e => setEmpForm({...empForm, department: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Email</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="email@company.com" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} /></div>
              <div><Label className="text-muted-foreground">Phone</Label><Input className="bg-muted border-border text-foreground mt-1" placeholder="Phone" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} /></div>
            </div>

            <div className="border border-border rounded-xl p-4 bg-muted/30 mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-card text-primary" checked={createLogin} onChange={e => setCreateLogin(e.target.checked)} />
                Create Platform Login
              </label>
              
              {createLogin && (
                <div className="mt-4 space-y-4 pl-6 border-l-2 border-border ml-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="radio" name="loginMethod" className="text-primary" checked={loginMethod === 'invite'} onChange={() => setLoginMethod('invite')} />
                      Send Invite Link via Email
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="radio" name="loginMethod" className="text-primary" checked={loginMethod === 'password'} onChange={() => setLoginMethod('password')} />
                      Set Default Password
                    </label>
                  </div>
                  
                  {loginMethod === 'password' && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Default Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-muted border-border text-foreground mt-1 h-9 max-w-xs" 
                        value={defaultPassword} 
                        onChange={e => setDefaultPassword(e.target.value)} 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">User will be forced to change this on their first login.</p>
                    </div>
                  )}
                  {loginMethod === 'invite' && (
                    <p className="text-xs text-muted-foreground">A secure link will be emailed allowing them to set up their account.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter><Button onClick={submitEmp} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">{isSubmitting ? 'Adding...' : 'Add Employee'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
