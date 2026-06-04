import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { UserPlus, Plus, Search, MoreVertical, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusColors = { 
  'Applied': 'bg-blue-100 text-blue-700', 
  'Testing': 'bg-amber-100 text-amber-700', 
  'Admitted': 'bg-purple-100 text-purple-700', 
  'Rejected': 'bg-red-100 text-red-700' 
};

export default function SHSAdmissions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', previousSchool: '', programmeChoice: 'General Science', status: 'Applied', phone: ''
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_applicants", companyId], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'shs_applicant' }), 
    enabled: !!companyId 
  });

  const mutateApplicant = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_applicants", companyId] });
      toast.success("Applicant saved successfully");
      setShowModal(false);
    }
  });

  const applicants = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      status: r.status || 'Applied',
      previousSchool: extra.previousSchool || 'Unknown',
      programmeChoice: extra.programmeChoice || 'Unknown',
      dateApplied: new Date(r.created_at).toLocaleDateString()
    };
  });

  const filtered = applicants.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.name) return toast.error("Applicant name is required");
    mutateApplicant.mutate({
      id: editingId,
      company_id: companyId,
      type: 'shs_applicant',
      name: formData.name,
      phone: formData.phone,
      status: formData.status,
      notes: JSON.stringify({
        previousSchool: formData.previousSchool,
        programmeChoice: formData.programmeChoice
      })
    });
  };

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("admissions", "Admissions Pipeline")} 
        subtitle="Manage prospective students, entrance exams, and enrollment decisions." 
        metrics={[
          { title: "Total Applicants", value: applicants.length, icon: UserPlus },
          { title: "Admitted", value: applicants.filter(a => a.status === 'Admitted').length, icon: CheckCircle2 }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', previousSchool: '', programmeChoice: 'General Science', status: 'Applied', phone: '' });
          setShowModal(true);
        }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> New Applicant
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Applicant Name', 'Phone', 'Prev. School', 'Prog. Choice', 'Applied Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{a.name}</td>
                <td className="px-4 py-3 text-slate-600">{a.phone}</td>
                <td className="px-4 py-3 text-slate-600">{a.previousSchool}</td>
                <td className="px-4 py-3 font-medium">{a.programmeChoice}</td>
                <td className="px-4 py-3 text-slate-500">{a.dateApplied}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[a.status] || 'bg-slate-100 text-slate-700'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingId(a.id);
                        setFormData({ ...a });
                        setShowModal(true);
                      }}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => mutateApplicant.mutate({ id: a.id, status: 'Admitted' })}>Mark Admitted</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8 text-slate-500">No applicants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Applicant' : 'New Applicant'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ama Mensah" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Previous School</label>
                <Input value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} placeholder="e.g. Ridge JHS" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Programme Choice</label>
                <select value={formData.programmeChoice} onChange={e => setFormData({...formData, programmeChoice: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>General Science</option><option>General Arts</option><option>Business</option><option>Home Economics</option><option>Visual Arts</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
