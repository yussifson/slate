import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyId } from '@/lib/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, Clock, User, FileText, Plus, Search, 
  Trash2, Edit2, Loader2, CheckCircle2, XCircle, LayoutGrid, List
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function UnivAppointments() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingData, setViewingData] = useState(null);
  const [formData, setFormData] = useState({ title: '', client_name: '', appointment_date: '', appointment_time: '', duration: 60, status: 'upcoming', notes: '' });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['univ_appointments', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_appointments')
        .select('*')
        .eq('company_id', companyId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (editingId) {
        return await base44.db.from('univ_appointments').update(payload).eq('id', editingId);
      }
      return await base44.db.from('univ_appointments').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_appointments']);
      toast.success(editingId ? "Appointment updated" : "Appointment scheduled");
      setIsModalOpen(false);
      setEditingId(null);
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => await base44.db.from('univ_appointments').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_appointments']);
      toast.success("Appointment deleted");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutateRecord.mutate(formData);
  };

  const openModal = (record = null) => {
    if (record) {
      setFormData(record);
      setEditingId(record.id);
    } else {
      setFormData({ title: '', client_name: '', appointment_date: '', appointment_time: '', duration: 60, status: 'upcoming', notes: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const filteredData = appointments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcoming = appointments.filter(a => a.status === 'upcoming').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary" /> Appointments
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage scheduling and client meetings.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-xl flex">
            <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>List</button>
            <button onClick={() => setViewMode('grid')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Grid</button>
          </div>
          <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Appointments</p><p className="text-3xl font-black text-foreground mt-1">{appointments.length}</p></div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><CalendarIcon className="w-6 h-6" /></div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</p><p className="text-3xl font-black text-emerald-700 mt-1">{completed}</p></div>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Upcoming</p><p className="text-3xl font-black text-blue-700 mt-1">{upcoming}</p></div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Clock className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search appointments..." 
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-card border border-border rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : viewMode === 'list' ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Title / Client</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map(a => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewingData(a)}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.client_name}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{a.appointment_date} <span className="text-muted-foreground ml-1">{a.appointment_time}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openModal(a); }} className="p-2 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecord.mutate(a.id); }} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredData.map(a => (
              <div key={a.id} onClick={() => setViewingData(a)} className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-foreground truncate">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.client_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium bg-muted/50 p-2.5 rounded-lg mb-4">
                  <CalendarIcon className="w-4 h-4 text-primary" /> {a.appointment_date} <Clock className="w-4 h-4 ml-2 text-primary" /> {a.appointment_time}
                </div>
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button onClick={(e) => { e.stopPropagation(); openModal(a); }} className="p-1.5 text-muted-foreground hover:text-primary bg-muted rounded-md"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRecord.mutate(a.id); }} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-foreground">{editingId ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Client Name</label>
                  <input type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Date</label>
                  <input required type="date" value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Time</label>
                  <input required type="time" value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Duration (mins)</label>
                  <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label>
                  <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={mutateRecord.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{mutateRecord.isPending ? 'Saving...' : 'Save Appointment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet */}
      <Sheet open={!!viewingData} onOpenChange={(open) => !open && setViewingData(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="pb-6 border-b border-border">
            <SheetTitle className="text-2xl font-black">{viewingData?.title}</SheetTitle>
            <SheetDescription className="text-sm font-medium flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md border ${viewingData?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{viewingData?.status}</span>
            </SheetDescription>
          </SheetHeader>
          {viewingData && (
            <div className="mt-6 space-y-6">
              <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-4">
                <div><p className="text-[11px] font-bold text-muted-foreground uppercase">Client</p><p className="font-semibold mt-1">{viewingData.client_name || '-'}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[11px] font-bold text-muted-foreground uppercase">Date</p><p className="font-semibold mt-1">{viewingData.appointment_date}</p></div>
                  <div><p className="text-[11px] font-bold text-muted-foreground uppercase">Time</p><p className="font-semibold mt-1">{viewingData.appointment_time}</p></div>
                </div>
                <div><p className="text-[11px] font-bold text-muted-foreground uppercase">Duration</p><p className="font-semibold mt-1">{viewingData.duration} mins</p></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase mb-2">Notes</p>
                <div className="bg-card p-4 rounded-xl border border-border text-sm min-h-[100px] whitespace-pre-wrap">{viewingData.notes || 'No notes provided.'}</div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
