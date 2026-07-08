import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Video, Search, Plus, Clock, CheckCircle2, UserPlus, Phone, Calendar, Trash2, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles } from 'lucide-react';

export default function Telemedicine() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['univ_telemedicine', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT t.*, 
                COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name
         FROM univ_telemedicine t
         LEFT JOIN univ_patients p ON t.patient_id = p.id
         WHERE t.company_id = ?
         ORDER BY t.scheduled_time DESC`,
        [companyId]
      );
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const { data: patientsList = [] } = useQuery({
    queryKey: ['univ_patients_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute("SELECT id, COALESCE(first_name, 'Unknown') || ' ' || COALESCE(last_name, 'Patient') as name FROM univ_patients WHERE company_id = ?", [companyId]);
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    scheduled_time: '',
    meeting_link: '',
    notes: ''
  });

  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleAISummarize = async () => {
    if (!formData.notes) return toast.error("Enter some rough notes first to summarize.");
    setIsSummarizing(true);
    try {
      const prompt = `You are an expert AI Medical Assistant. Summarize the following rough consultation notes into a professional, concise, structured clinical summary.\nNotes: ${formData.notes}`;
      const response = await generateText(prompt);
      setFormData(prev => ({ ...prev, notes: response }));
    } catch (e) {
      toast.error('AI Summarization failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_telemedicine (id, created_at, company_id, patient_id, scheduled_time, meeting_link, status, notes)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, 'Scheduled', ?)`,
        [companyId, payload.patient_id, payload.scheduled_time, payload.meeting_link, payload.notes]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_telemedicine']);
      toast.success('Telemedicine session scheduled!');
      setShowModal(false);
      setFormData({ patient_id: '', scheduled_time: '', meeting_link: '', notes: '' });
    },
    onError: (err) => toast.error('Failed to schedule: ' + err.message)
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute("UPDATE univ_telemedicine SET status = ? WHERE id = ?", [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_telemedicine']);
      toast.success('Status updated');
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute("DELETE FROM univ_telemedicine WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_telemedicine']);
      toast.success('Session deleted');
    }
  });

  const filtered = sessions.filter(s =>
    (s.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-[#71717a]">Loading Telemedicine Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{t("telemedicine", "Telemedicine")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_virtual_consultations", "Schedule and conduct virtual patient consultations")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md">
          <Video className="w-4 h-4" /> {t("schedule_session", "Schedule Session")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Scheduled Today</h3>
            <Calendar className="w-5 h-5 text-teal-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-card-foreground mt-2">
            {sessions.filter(s => s.status === 'Scheduled' && s.scheduled_time.startsWith(new Date().toISOString().split('T')[0])).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Completed</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {sessions.filter(s => s.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Cancelled</h3>
            <Trash2 className="w-5 h-5 text-red-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {sessions.filter(s => s.status === 'Cancelled').length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient or status..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-black/9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Meeting Link</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#71717a]">
                    {new Date(s.scheduled_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">{s.patient_name}</td>
                  <td className="px-6 py-4">
                    {s.meeting_link ? (
                      <a href={s.meeting_link} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Join Session
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">No link provided</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status === 'Scheduled' && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Completed' })} className="text-emerald-600">Mark Completed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Cancelled' })} className="text-red-600">Cancel Session</DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete session?')) deleteRecord.mutate(s.id); }} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="text-center py-10 text-[#71717a]">No telemedicine sessions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-card-foreground">Schedule Telemedicine</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm font-medium">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Date & Time</label>
                <Input type="datetime-local" value={formData.scheduled_time} onChange={e => setFormData({ ...formData, scheduled_time: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Meeting Link (Zoom/Meet)</label>
                <Input type="url" placeholder="https://zoom.us/j/123..." value={formData.meeting_link} onChange={e => setFormData({ ...formData, meeting_link: e.target.value})} className="mt-1" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Clinical Notes</label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAISummarize} disabled={isSummarizing} className="h-6 text-xs text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100">
                    {isSummarizing ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Bot className="w-3 h-3 mr-1" />}
                    {isSummarizing ? 'Summarizing...' : 'AI Enhance Notes'}
                  </Button>
                </div>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm" placeholder="Reason for consultation..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md" onClick={() => mutateRecord.mutate(formData)} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
