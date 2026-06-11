import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Search, Trash2, Edit2, Loader2, XCircle, CheckCircle2, LogIn, LogOut, Calendar, User, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = { Present: 'bg-emerald-50 text-emerald-700 border-emerald-200', Late: 'bg-amber-50 text-amber-700 border-amber-200', Absent: 'bg-red-50 text-red-700 border-red-200', 'Half Day': 'bg-blue-50 text-blue-700 border-blue-200' };
const EMPTY_FORM = { employee_name: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'Present', notes: '' };

export default function UnivAttendance() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateFilter, setDateFilter] = useState('');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['univ_attendance', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_attendance').select('*').eq('company_id', companyId).order('date', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const saveRecord = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return base44.db.from('univ_attendance').update(payload).eq('id', editingId);
      return base44.db.from('univ_attendance').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => { queryClient.invalidateQueries(['univ_attendance']); toast.success(editingId ? 'Updated!' : 'Record added!'); closeModal(); },
    onError: () => toast.error('Failed to save')
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => base44.db.from('univ_attendance').delete().eq('id', id),
    onSuccess: () => { queryClient.invalidateQueries(['univ_attendance']); toast.success('Deleted'); }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => base44.db.from('univ_attendance').update({ status }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries(['univ_attendance'])
  });

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = records.filter(r => {
    const matchSearch = `${r.employee_name} ${r.status}`.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || r.date === dateFilter;
    return matchSearch && matchDate;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Clock className="w-7 h-7 text-primary" /> Attendance</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Track daily employee attendance and hours.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Mark Attendance</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Today's Records", value: todayRecords.length, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Present Today', value: todayRecords.filter(r => r.status === 'Present').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Late Today', value: todayRecords.filter(r => r.status === 'Late').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Absent Today', value: todayRecords.filter(r => r.status === 'Absent').length, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map((k, i) => (
          <div key={i} className={`border p-4 rounded-2xl shadow-sm ${k.bg}`}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 shadow-sm">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-11 bg-transparent text-sm focus:outline-none text-foreground" />
          {dateFilter && <button onClick={() => setDateFilter('')} className="text-muted-foreground hover:text-foreground"><XCircle className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-3">Employee</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Check In</div>
          <div className="col-span-2">Check Out</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No attendance records found.</p></div>
          ) : filtered.map(r => (
            <div key={r.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">{(r.employee_name||'?').charAt(0).toUpperCase()}</div>
                <span className="font-bold text-sm text-foreground">{r.employee_name}</span>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.date}</div>
              <div className="col-span-2 text-sm font-mono">{r.check_in ? <span className="text-emerald-600 flex items-center gap-1"><LogIn className="w-3.5 h-3.5" />{r.check_in}</span> : <span className="text-muted-foreground">—</span>}</div>
              <div className="col-span-2 text-sm font-mono">{r.check_out ? <span className="text-red-500 flex items-center gap-1"><LogOut className="w-3.5 h-3.5" />{r.check_out}</span> : <span className="text-muted-foreground">—</span>}</div>
              <div className="col-span-2">
                <select value={r.status} onChange={e => updateStatus.mutate({ id: r.id, status: e.target.value })} className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none ${STATUS_COLORS[r.status] || 'bg-muted border-border'}`}>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteRecord.mutate(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-black">{editingId ? 'Edit Record' : 'Mark Attendance'}</h2>
              <button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveRecord.mutate(form); }} className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employee Name *</label><input required type="text" value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Date *</label><input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Check In Time</label><input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Check Out Time</label><input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label><textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveRecord.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold">{saveRecord.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
