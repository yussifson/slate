import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Activity, Search, Plus, Calendar as CalendarIcon, User, Users, CheckCircle2, AlertCircle, FileText, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles } from 'lucide-react';

export default function OperationTheater() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['univ_surgeries', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT s.*, 
                COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name
         FROM univ_surgeries s
         LEFT JOIN univ_patients p ON s.patient_id = p.id
         WHERE s.company_id = ?
         ORDER BY s.scheduled_date DESC`,
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
    surgery_name: '',
    surgeon_name: '',
    scheduled_date: '',
    ot_room: '',
    notes: ''
  });

  const [isPredicting, setIsPredicting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState('');

  const handleAIPredict = async () => {
    if (!formData.surgery_name) return toast.error("Enter procedure / surgery name first.");
    setIsPredicting(true);
    setAiPrediction('');
    try {
      const prompt = `You are an expert Surgical AI. Analyze the surgical procedure "${formData.surgery_name}" with clinical notes: "${formData.notes}". Provide a concise 2-sentence prediction of surgical risks, estimated duration, and key preparation requirements.`;
      const response = await generateText(prompt);
      setAiPrediction(response);
    } catch (e) {
      toast.error('AI Prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_surgeries (id, created_at, company_id, patient_id, surgery_name, surgeon_name, scheduled_date, ot_room, status, notes)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, 'Scheduled', ?)`,
        [companyId, payload.patient_id, payload.surgery_name, payload.surgeon_name, payload.scheduled_date, payload.ot_room, payload.notes]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_surgeries']);
      toast.success('Surgery scheduled successfully!');
      setShowModal(false);
      setFormData({ patient_id: '', surgery_name: '', surgeon_name: '', scheduled_date: '', ot_room: '', notes: '' });
    },
    onError: (err) => toast.error('Failed to schedule: ' + err.message)
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute("UPDATE univ_surgeries SET status = ? WHERE id = ?", [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_surgeries']);
      toast.success('Status updated');
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute("DELETE FROM univ_surgeries WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_surgeries']);
      toast.success('Surgery record deleted');
    }
  });

  const filtered = surgeries.filter(s =>
    (s.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.surgery_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.surgeon_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-[#71717a]">Loading OT Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{t("operation_theater", "Operation Theater")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_ot", "Manage surgeries, OT rooms, and surgical teams")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-pink-600 hover:bg-pink-700 text-white shadow-md">
          <Plus className="w-4 h-4" /> {t("schedule_surgery", "Schedule Surgery")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Scheduled</h3>
            <CalendarIcon className="w-5 h-5 text-teal-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-card-foreground mt-2">
            {surgeries.filter(s => s.status === 'Scheduled').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">In Progress</h3>
            <Activity className="w-5 h-5 text-amber-500 opacity-80 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {surgeries.filter(s => s.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Completed</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {surgeries.filter(s => s.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">OT Rooms Active</h3>
            <Users className="w-5 h-5 text-purple-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(surgeries.filter(s => s.status === 'In Progress' || s.status === 'Scheduled').map(s => s.ot_room)).size}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient, surgery, or surgeon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-black/9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Procedure & Team</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">OT Room</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#71717a]">
                    {new Date(s.scheduled_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-bold text-card-foreground">{s.patient_name}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-pink-700 dark:text-pink-400">{s.surgery_name}</p>
                    <p className="text-xs text-[#71717a] flex items-center gap-1 mt-0.5"><User className="w-3 h-3"/> Dr. {s.surgeon_name}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-[#71717a]">{s.ot_room}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(s.status)}`}>
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
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'In Progress' })} className="text-amber-600 font-medium">Start Surgery</DropdownMenuItem>
                        )}
                        {s.status === 'In Progress' && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Completed' })} className="text-emerald-600 font-medium">Mark Completed</DropdownMenuItem>
                        )}
                        {(s.status === 'Scheduled' || s.status === 'In Progress') && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Cancelled' })} className="text-red-600">Cancel</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete record?')) deleteRecord.mutate(s.id); }} className="text-red-600">Delete Record</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-[#71717a]">No surgeries scheduled.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col p-6 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-card-foreground shrink-0 mb-4">Schedule Surgery</h2>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm font-medium">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Procedure / Surgery Name</label>
                <Input placeholder="e.g. Appendectomy" value={formData.surgery_name} onChange={e => setFormData({ ...formData, surgery_name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Lead Surgeon</label>
                <Input placeholder="e.g. Smith" value={formData.surgeon_name} onChange={e => setFormData({ ...formData, surgeon_name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">OT Room</label>
                <Input placeholder="e.g. OT-01" value={formData.ot_room} onChange={e => setFormData({ ...formData, ot_room: e.target.value})} className="mt-1 font-mono uppercase" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Schedule Date & Time</label>
                <Input type="datetime-local" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value})} className="mt-1" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Clinical Notes & Requirements</label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAIPredict} disabled={isPredicting} className="h-6 text-xs text-pink-600 border-pink-200 bg-pink-50 hover:bg-pink-100">
                    {isPredicting ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Bot className="w-3 h-3 mr-1" />}
                    {isPredicting ? 'Analyzing...' : 'AI Risk Predictor'}
                  </Button>
                </div>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm" placeholder="Blood requirements, special equipment..." />
                {aiPrediction && (
                  <div className="mt-2 bg-pink-50/50 p-3 rounded-lg border border-pink-200/50 text-sm font-medium text-pink-900">
                    <div className="flex items-center gap-1.5 mb-1 text-pink-700">
                      <Bot className="w-4 h-4"/> AI Prediction
                    </div>
                    {aiPrediction}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4 shrink-0 mt-4 border-t border-black/10">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md" onClick={() => mutateRecord.mutate(formData)} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Scheduling...' : 'Schedule Surgery'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
