import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Users, UserPlus, Search, Trash2, Edit2, Loader2, XCircle, Mail, Phone, Building2, Briefcase, DollarSign, LayoutGrid, List, Network, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '', role_title: '', department: '', status: 'Active', salary: '', employment_type: 'Full-Time', hire_date: '' };
const DEPARTMENTS = ['General','Engineering','Marketing','Sales','Finance','HR','Operations','Legal','Design','Support'];
const gradients = ['from-violet-500 to-purple-600','from-cyan-500 to-blue-600','from-emerald-500 to-teal-600','from-orange-500 to-amber-600','from-pink-500 to-rose-600','from-indigo-500 to-blue-700'];
const grad = (n) => gradients[(n||'A').charCodeAt(0) % gradients.length];
const initials = (e) => `${(e.first_name||'?').charAt(0)}${(e.last_name||'?').charAt(0)}`.toUpperCase();
const statusColor = (s) => s==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':s==='Onboarding'?'bg-blue-50 text-blue-700 border-blue-200':'bg-muted text-muted-foreground border-border';

export default function UnivHREmployee() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
      )}

      {isModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Employee':'Add Employee'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5"/></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">First Name *</label><input required type="text" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Last Name *</label><input required type="text" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email *</label><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Role / Title</label><input type="text" value={form.role_title} onChange={e=>setForm({...form,role_title:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Department</label><select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"><option value="">Select...</option>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employment Type</label><select value={form.employment_type} onChange={e=>setForm({...form,employment_type:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"><option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option></select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"><option>Active</option><option>Onboarding</option><option>On Leave</option><option>Terminated</option></select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Salary ($)</label><input type="number" min="0" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Hire Date</label><input type="date" value={form.hire_date} onChange={e=>setForm({...form,hire_date:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update':'Add Employee'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
