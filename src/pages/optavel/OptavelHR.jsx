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

const CARD = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
const HEAD = 'text-lg font-bold text-white flex items-center gap-2 mb-5';

export default function OptavelHR() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [empModal, setEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', role: '', department: '', email: '', phone: '', status: 'active', start_date: new Date().toISOString().split('T')[0] });

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
    await powerSync.execute(
      `INSERT INTO optavel_employees (id, company_id, name, role, department, email, phone, onboarding_progress, status, start_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), companyId, empForm.name, empForm.role, empForm.department, empForm.email, empForm.phone, 0, empForm.status, empForm.start_date, new Date().toISOString(), new Date().toISOString()]
    );
    toast.success('Employee added!');
    setEmpModal(false);
    setEmpForm({ name: '', role: '', department: '', email: '', phone: '', status: 'active', start_date: new Date().toISOString().split('T')[0] });
    queryClient.invalidateQueries(['optavel_employees']);
  };

  const deleteEmp = async (id) => {
    await powerSync.execute(`DELETE FROM optavel_employees WHERE id=?`, [id]);
    queryClient.invalidateQueries(['optavel_employees']);
  };

  const activeEmp = employees.filter(e => e.status === 'active').length;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'radial-gradient(ellipse at top left, #1d102e 0%, #0a0f1e 50%, #000 100%)' }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-xl"><Heart className="w-7 h-7 text-pink-400" /></div>
            HR & Team
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Directory · Onboarding · Time Off</p>
        </div>
        <Button onClick={() => setEmpModal(true)} className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
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
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-2xl font-black text-${color}-400`}>{val}</p>
          </div>
        ))}
      </div>

      <div className={CARD}>
        <div className={HEAD}><Users className="w-5 h-5 text-pink-400" /> Employee Directory</div>
        {employees.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No employees yet. Time to hire!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Role & Dept</th><th className="pb-3 pr-4">Contact</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map(emp => (
                <tr key={emp.id} className="group">
                  <td className="py-3 pr-4 font-semibold text-white">{emp.name}</td>
                  <td className="py-3 pr-4">
                    <p className="text-white">{emp.role}</p>
                    <p className="text-xs text-slate-400">{emp.department}</p>
                  </td>
                  <td className="py-3 pr-4">
                    {emp.email && <p className="text-slate-300 text-xs">✉ {emp.email}</p>}
                    {emp.phone && <p className="text-slate-400 text-xs">📞 {emp.phone}</p>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize ${emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>{emp.status}</span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => deleteEmp(emp.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={empModal} onOpenChange={setEmpModal}>
        <DialogContent className="bg-[#0f172a] border border-white/10 text-white">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300">Name *</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Full name" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Role</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Job title" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} /></div>
              <div><Label className="text-slate-300">Department</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Engineering" value={empForm.department} onChange={e => setEmpForm({...empForm, department: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Email</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="email@company.com" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} /></div>
              <div><Label className="text-slate-300">Phone</Label><Input className="bg-white/5 border-white/10 text-white mt-1" placeholder="Phone" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={submitEmp} className="bg-pink-600 hover:bg-pink-700 text-white">Add Employee</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
