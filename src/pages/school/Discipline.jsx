import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Scale, Search, Plus, Calendar, MoreVertical, ShieldAlert } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";

export default function Discipline() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('discipline');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    studentName: '', type: 'Infraction', date: '', description: '', actionTaken: ''
  });

  const logs = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const filtered = logs.filter(l =>
    l.studentName?.toLowerCase().includes(search.toLowerCase()) || 
    l.type?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.studentName || !formData.description) return toast.error("Student name and description required");
    
    const payload = {
      studentName: formData.studentName,
      type: formData.type,
      date: formData.date || new Date().toISOString(),
      description: formData.description,
      actionTaken: formData.actionTaken,
      status: 'Recorded'
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId, recordType: 'discipline', payload, status: 'active',
        searchText: `${formData.studentName} ${formData.type}`
      }, {
        onSuccess: () => { toast.success("Record updated"); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'discipline', payload, status: 'active',
        searchText: `${formData.studentName} ${formData.type}`
      }, {
        onSuccess: () => { toast.success("Record saved"); setShowModal(false); }
      });
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("discipline", "Discipline & Behavior")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_discipline", "Track student conduct, merits, and infractions")}</p>
        </div>
        <Button onClick={() => { setFormData({studentName: '', type: 'Infraction', date: '', description: '', actionTaken: ''}); setShowModal(true); }} className="gap-2 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> {t("add_record", "Add Record")}
        </Button>
      </div>
      
      <div className="school-card p-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 school-card">
          <Scale className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#1E3A8A]" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_records", "No disciplinary records found")}</p>
        </div>
      ) : (
        <div className="school-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4FF]/60 dark:bg-slate-800/40 border-b border-emerald-100 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Action Taken</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-card-foreground">{l.studentName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${l.type === 'Merit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.date ? format(new Date(l.date), 'MMM d, yyyy') : '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={l.description}>{l.description}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate" title={l.actionTaken}>{l.actionTaken}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(l.id);
                          setFormData({ studentName: l.studentName, type: l.type, date: l.date, description: l.description, actionTaken: l.actionTaken });
                          setShowModal(true);
                        }}>{t("edit", "Edit")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteRecord.mutate({ id: l.id, recordType: 'discipline' })}>{t("delete", "Delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Record' : 'Add Disciplinary Record'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("student_name", "Student Name")}</label><Input value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("type", "Type")}</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>Infraction</option>
                    <option>Merit</option>
                  </select>
                </div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("date", "Date")}</label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1" /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("description", "Description")}</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-20" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("action_taken", "Action Taken")}</label>
                <textarea value={formData.actionTaken} onChange={e => setFormData({...formData, actionTaken: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-16" placeholder="Warning, Suspension, etc." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
