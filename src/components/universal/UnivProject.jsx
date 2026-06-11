import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyId } from '@/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderKanban, Plus, Search, Trash2, Edit2, Loader2, Calendar, Target,
  XCircle, Play, Pause, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivProject() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'planning', progress: 0, due_date: '' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['univ_projects', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_projects').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return await base44.db.from('univ_projects').update(payload).eq('id', editingId);
      return await base44.db.from('univ_projects').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_projects']);
      toast.success(editingId ? "Project updated" : "Project created");
      setIsModalOpen(false);
      setEditingId(null);
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => await base44.db.from('univ_projects').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_projects']);
      toast.success("Project deleted");
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
      setFormData({ name: '', description: '', status: 'planning', progress: 0, due_date: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const filteredData = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-primary" /> Projects
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Track and manage your company projects.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-black">{projects.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Active</p>
          <p className="text-2xl font-black text-blue-700">{projects.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-black text-emerald-700">{projects.filter(p => p.status === 'completed').length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">On Hold</p>
          <p className="text-2xl font-black text-amber-700">{projects.filter(p => p.status === 'on_hold').length}</p>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search projects..." 
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-card border border-border rounded-2xl shadow-sm p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredData.map(p => (
              <div key={p.id} className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-foreground line-clamp-1">{p.name}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                    p.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'planning' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status === 'active' && <Play className="w-3 h-3" />}
                    {p.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {p.status === 'planning' && <Target className="w-3 h-3" />}
                    {p.status === 'on_hold' && <Pause className="w-3 h-3" />}
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{p.description || 'No description provided.'}</p>
                
                <div className="space-y-3 mt-auto">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-muted-foreground uppercase">Progress</span>
                      <span className="text-primary">{p.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Calendar className="w-4 h-4" /> Due: {p.due_date || 'N/A'}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(p)} className="p-1.5 text-slate-400 hover:text-primary bg-muted rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteRecord.mutate(p.id)} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
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
              <h2 className="text-xl font-black text-foreground">{editingId ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Project Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Due Date</label>
                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 flex justify-between">
                    <span>Progress ({formData.progress}%)</span>
                  </label>
                  <input type="range" min="0" max="100" value={formData.progress} onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} className="w-full accent-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={mutateRecord.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{mutateRecord.isPending ? 'Saving...' : 'Save Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
