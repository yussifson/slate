import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { BookOpen, Plus, Search } from "lucide-react";

export default function SHSClasses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: 'Form 1 Science A', capacity: 40, teacher: '', room: ''
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_classes", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_class' }), 
    enabled: !!companyId 
  });

  const mutateClass = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_classes", companyId] });
      toast.success("Class saved");
      setShowModal(false);
    }
  });

  const classes = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.title,
      capacity: extra.capacity || 40,
      teacher: extra.teacher || 'Unassigned',
      room: extra.room || 'TBD',
    };
  });

  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.teacher.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.name) return toast.error("Class Name is required");
    mutateClass.mutate({
      company_id: companyId,
      case_type: 'shs_class',
      title: formData.name,
      description: 'High School Class',
      notes: JSON.stringify({
        capacity: formData.capacity,
        teacher: formData.teacher,
        room: formData.room
      })
    });
  };

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("classes", "Classes & Sections")} 
        subtitle="Manage class streams, room assignments, and form masters." 
        metrics={[
          { title: "Total Classes", value: classes.length, icon: BookOpen }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => {
          setFormData({ name: '', capacity: 40, teacher: '', room: '' });
          setShowModal(true);
        }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Class Name', 'Form Master / Teacher', 'Room', 'Capacity'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.teacher}</td>
                <td className="px-4 py-3 text-slate-600">{c.room}</td>
                <td className="px-4 py-3 font-medium">{c.capacity} Students</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="4" className="text-center py-8 text-slate-500">No classes found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Class</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Class Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Form 1 Science A" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Capacity</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="40" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Room</label>
                  <Input value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Room 101" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Form Master</label>
                <Input value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} placeholder="Teacher Name" className="mt-1" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Class</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
