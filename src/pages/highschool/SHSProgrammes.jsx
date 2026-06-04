import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { BookOpen, Plus, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

export default function SHSProgrammes() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', coreSubjects: '', electiveSubjects: ''
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_programmes", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_programme' }), 
    enabled: !!companyId 
  });

  const mutateProgramme = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_programmes", companyId] });
      toast.success("Programme saved successfully");
      setShowModal(false);
    }
  });

  const deleteProgramme = useMutation({
    mutationFn: (id) => base44.entities.LegalCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_programmes", companyId] });
      toast.success("Programme deleted");
    }
  });

  const programmes = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.case_title,
      code: extra.code || '',
      description: extra.description || '',
      coreSubjects: extra.coreSubjects || '',
      electiveSubjects: extra.electiveSubjects || '',
    };
  });

  const handleSave = () => {
    if (!formData.name) return toast.error("Programme name is required");
    mutateProgramme.mutate({
      id: editingId,
      company_id: companyId,
      case_type: 'shs_programme',
      case_title: formData.name,
      status: 'active',
      notes: JSON.stringify({
        code: formData.code,
        description: formData.description,
        coreSubjects: formData.coreSubjects,
        electiveSubjects: formData.electiveSubjects
      })
    });
  };

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("academic_programmes", "Academic Programmes")} 
        subtitle="Manage Sciences, Arts, Business, and Core vs Elective subjects." 
        metrics={[
          { title: "Total Programmes", value: programmes.length, icon: BookOpen }
        ]}
      />
      
      <div className="flex justify-end">
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', code: '', description: '', coreSubjects: '', electiveSubjects: '' });
          setShowModal(true);
        }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> Add Programme
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programmes.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md mt-1 inline-block">{p.code || 'NO CODE'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditingId(p.id);
                    setFormData({ ...p });
                    setShowModal(true);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => {
                    if (window.confirm("Delete this programme?")) deleteProgramme.mutate(p.id);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{p.description}</p>
            <div className="space-y-2">
              <div className="bg-slate-50 p-2 rounded text-xs">
                <span className="font-bold text-slate-700">Core:</span> <span className="text-slate-600">{p.coreSubjects || 'Not specified'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded text-xs">
                <span className="font-bold text-slate-700">Electives:</span> <span className="text-slate-600">{p.electiveSubjects || 'Not specified'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Programme' : 'Add Programme'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Programme Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. General Science" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Programme Code</label>
                <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. SCI" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none h-20" placeholder="Brief description..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Core Subjects</label>
                <Input value={formData.coreSubjects} onChange={e => setFormData({...formData, coreSubjects: e.target.value})} placeholder="Math, English, Science, Social" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Elective Subjects</label>
                <Input value={formData.electiveSubjects} onChange={e => setFormData({...formData, electiveSubjects: e.target.value})} placeholder="Physics, Chemistry, Biology, E-Math" className="mt-1" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
