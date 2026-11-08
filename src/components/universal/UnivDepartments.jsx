import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, Building } from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { useCompanyId, useCompany } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';

export default function CustomDepartmentsSettings() {
  const companyId = useCompanyId();
  const { company } = useCompany();
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', description: '' });

  useEffect(() => {
    if (companyId) fetchDepartments();
  }, [companyId]);

  const fetchDepartments = async () => {
    try {
      const res = await powerSync.execute('SELECT * FROM univ_hr_departments WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      const customDepts = res.rows._array || Array.from(res.rows);

      // Get predefined departments for active industry
      let predefinedDepts = [];
      try {
        const ind = await import('@/config/industries');
        const activeIndustry = sessionStorage.getItem('slate_industry_override') || company?.industry_type || user?.company_industry || 'law';
        const defaultDepts = ind.INDUSTRIES[activeIndustry]?.departments || ind.INDUSTRIES.law.departments || [];
        predefinedDepts = defaultDepts.map(d => ({
          id: d.value || d.label,
          name: d.label,
          description: 'Predefined industry department',
          is_predefined: true
        }));
      } catch(e) {}

      setDepartments([...predefinedDepts, ...customDepts]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await powerSync.execute('UPDATE univ_hr_departments SET name = ?, description = ? WHERE id = ?', 
          [formData.name, formData.description, formData.id]);
        toast.success('Department updated');
      } else {
        await powerSync.execute("INSERT INTO univ_hr_departments (id, company_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)", 
          [crypto.randomUUID(), companyId, formData.name, formData.description, new Date().toISOString()]);
        toast.success('Department created');
      }
      setIsModalOpen(false);
      setFormData({ id: '', name: '', description: '' });
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to save department');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
      await powerSync.execute('DELETE FROM univ_hr_departments WHERE id = ?', [id]);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Custom Departments</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage global departments for your organization.</p>
        </div>
        <button onClick={() => { setFormData({id:'', name:'', description:''}); setIsModalOpen(true); }} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4"/> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border-[0.5px] border-primary/20 rounded-xl">
            <Building className="w-10 h-10 mx-auto mb-3 opacity-20"/>
            No custom departments found. Add one to get started.
          </div>
        ) : departments.map(d => (
          <div key={d.id} className="bg-card border-[0.5px] border-primary/20 p-5 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-lg tracking-tight">{d.name}</h3>
                {d.is_predefined && <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full uppercase tracking-wider">Default</span>}
              </div>
              {!d.is_predefined && (
                <div className="flex gap-1">
                  <button onClick={() => { setFormData(d); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{d.description || 'No description provided.'}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border-[0.5px] border-primary/20 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">{formData.id ? 'Edit' : 'Create'} Department</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Department Name</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
                <textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80">Cancel</button>
                <button type="submit" className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
