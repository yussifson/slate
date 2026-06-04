import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { Building2, Plus, Trash2, Pencil, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

export default function SHSHouses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', capacity: '', housemaster: '', color: '#3b82f6'
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_houses", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_house' }), 
    enabled: !!companyId 
  });

  const mutateHouse = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_houses", companyId] });
      toast.success("House saved successfully");
      setShowModal(false);
    }
  });

  const deleteHouse = useMutation({
    mutationFn: (id) => base44.entities.LegalCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_houses", companyId] });
      toast.success("House deleted");
    }
  });

  const houses = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.case_title,
      capacity: extra.capacity || '0',
      housemaster: extra.housemaster || 'Unassigned',
      color: extra.color || '#3b82f6'
    };
  });

  const handleSave = () => {
    if (!formData.name) return toast.error("House name is required");
    mutateHouse.mutate({
      id: editingId,
      company_id: companyId,
      case_type: 'shs_house',
      case_title: formData.name,
      status: 'active',
      notes: JSON.stringify({
        capacity: formData.capacity,
        housemaster: formData.housemaster,
        color: formData.color
      })
    });
  };

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("house_management", "House Management")} 
        subtitle="Manage boarding houses, capacity, and Housemasters." 
        metrics={[
          { title: "Total Houses", value: houses.length, icon: Building2 }
        ]}
      />
      
      <div className="flex justify-end">
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', capacity: '', housemaster: '', color: '#3b82f6' });
          setShowModal(true);
        }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add House
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {houses.map(h => (
          <div key={h.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="h-2 w-full" style={{ backgroundColor: h.color }}></div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{h.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Users className="w-3 h-3" /> Capacity: {h.capacity}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(h.id);
                      setFormData({ ...h });
                      setShowModal(true);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => {
                      if (window.confirm("Delete this house?")) deleteHouse.mutate(h.id);
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Housemaster</span>
                <span className="text-slate-600 truncate max-w-[120px]" title={h.housemaster}>{h.housemaster}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit House' : 'Add House'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">House Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Aggrey House" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Capacity</label>
                <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="e.g. 150" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Housemaster</label>
                <Input value={formData.housemaster} onChange={e => setFormData({...formData, housemaster: e.target.value})} placeholder="e.g. Mr. Koomson" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">House Color</label>
                <div className="flex gap-3 mt-1">
                  <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="h-10 w-12 cursor-pointer border-0 p-0 rounded bg-transparent" />
                  <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="flex-1 font-mono" />
                </div>
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
