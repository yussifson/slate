import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserPlus, Search, Trash2, Edit2, Loader2, XCircle, Mail, Phone,
  Building2, Briefcase, LayoutGrid, List, ChevronDown, DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '', role_title: '',
  department: '', status: 'Active', salary: '', employment_type: 'Full-Time', hire_date: ''
};

const DEPARTMENTS = ['General', 'Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Legal', 'Design', 'Support'];

export default function UnivHREmployee() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['univ_hr_employees', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_hr_employees').select('*').eq('company_id', companyId).order('first_name', { ascending: true });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const saveEmployee = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return base44.db.from('univ_hr_employees').update(payload).eq('id', editingId);
      return base44.db.from('univ_hr_employees').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_hr_employees']);
      toast.success(editingId ? 'Employee updated!' : 'Employee added!');
      closeModal();
    },
    onError: () => toast.error('Failed to save employee')
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id) => base44.db.from('univ_hr_employees').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_hr_employees']); toast.success('Employee deleted'); setSelectedEmployee(null); },
    onError: () => toast.error('Failed to delete')
  });

  const openModal = (emp = null) => {
    setForm(emp ? { ...emp } : EMPTY_FORM);
    setEditingId(emp?.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email} ${e.department} ${e.role_title}`.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (e) => `${(e.first_name || '?').charAt(0)}${(e.last_name || '?').charAt(0)}`.toUpperCase();

  const statusColor = (s) => s === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s === 'Onboarding' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200';

  const gradients = ['from-violet-500 to-purple-600', 'from-cyan-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600', 'from-pink-500 to-rose-600', 'from-indigo-500 to-blue-700'];
  const getGradient = (name) => gradients[name.charCodeAt(0) % gradients.length];

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Employees
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">{employees.length} total employees • {employees.filter(e => e.status === 'Active').length} active</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Staff', value: employees.length, color: 'text-foreground' },
          { label: 'Active', value: employees.filter(e => e.status === 'Active').length, color: 'text-emerald-600' },
          { label: 'Onboarding', value: employees.filter(e => e.status === 'Onboarding').length, color: 'text-blue-600' },
          { label: 'Departments', value: [...new Set(employees.map(e => e.department).filter(Boolean))].length, color: 'text-violet-600' },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, department, role..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm gap-1 shrink-0">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-4 h-4" /> Grid</button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}><List className="w-4 h-4" /> List</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filtered.map(emp => (
              <div key={emp.id} onClick={() => setSelectedEmployee(emp)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-primary/30">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getGradient(emp.first_name || 'A')} flex items-center justify-center text-white text-xl font-black mb-3 shadow-md`}>
                    {initials(emp)}
                  </div>
                  <h3 className="font-bold text-base text-foreground">{emp.first_name} {emp.last_name}</h3>
                  <p className="text-sm font-medium text-primary mt-0.5">{emp.role_title || 'Staff'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Building2 className="w-3 h-3" /> {emp.department || '—'}
                  </div>
                  <div className="mt-3 w-full pt-3 border-t border-border/50 flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusColor(emp.status)}`}>{emp.status}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); openModal(emp); }} className="p-1 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={e => { e.stopPropagation(); deleteEmployee.mutate(emp.id); }} className="p-1 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium">No employees found.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Employee', 'Role / Dept', 'Contact', 'Type', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(emp.first_name || 'A')} flex items-center justify-center text-white text-xs font-black shrink-0`}>{initials(emp)}</div>
                        <div>
                          <p className="font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.hire_date ? `Hired ${emp.hire_date}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{emp.role_title || '—'}</p>
                      <p className="text-xs text-muted-foreground">{emp.department || '—'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {emp.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>}
                        {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{emp.employment_type || 'Full-Time'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusColor(emp.status)}`}>{emp.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(emp)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteEmployee.mutate(emp.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Detail Sidebar */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-black text-lg">Profile</h3>
              <button onClick={() => setSelectedEmployee(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="flex flex-col items-center text-center mb-5">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getGradient(selectedEmployee.first_name || 'A')} flex items-center justify-center text-white text-2xl font-black mb-3 shadow-lg`}>
                  {initials(selectedEmployee)}
                </div>
                <h3 className="font-black text-xl">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                <p className="text-primary font-bold">{selectedEmployee.role_title}</p>
                <span className={`mt-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${statusColor(selectedEmployee.status)}`}>{selectedEmployee.status}</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <Building2 className="w-4 h-4" />, label: 'Department', value: selectedEmployee.department },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Type', value: selectedEmployee.employment_type },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: selectedEmployee.email },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: selectedEmployee.phone },
                  { icon: <DollarSign className="w-4 h-4" />, label: 'Salary', value: selectedEmployee.salary ? `$${Number(selectedEmployee.salary).toLocaleString()}` : '—' },
                ].map((f, i) => f.value ? (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                    <span className="text-primary mt-0.5 shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</p>
                      <p className="text-sm font-medium text-foreground">{f.value}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-2">
              <button onClick={() => { openModal(selectedEmployee); setSelectedEmployee(null); }} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => deleteEmployee.mutate(selectedEmployee.id)} className="flex-1 h-9 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-100">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black">{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveEmployee.mutate(form); }} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">First Name *</label>
                  <input required type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Last Name *</label>
                  <input required type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Role / Title</label>
                  <input type="text" value={form.role_title} onChange={e => setForm({...form, role_title: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Department</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employment Type</label>
                  <select value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option>Active</option><option>Onboarding</option><option>On Leave</option><option>Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Salary ($)</label>
                  <input type="number" min="0" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Hire Date</label>
                  <input type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveEmployee.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">
                  {saveEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
