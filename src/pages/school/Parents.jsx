import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, MoreVertical, Settings, MapPin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { motion, AnimatePresence } from 'framer-motion';
import IDFormatSettings from '@/components/school/IDFormatSettings';

export default function Parents() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "student"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }),
    enabled: !!companyId
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["clients", companyId, "parent"], 
    queryFn: () => powerSync.execute('SELECT * FROM school_parents WHERE company_id = ?', [companyId]).then(r => r.rows._array), 
    enabled: !!companyId 
  });

  const { data: schoolSettings } = useQuery({
    queryKey: ['school_settings', companyId],
    queryFn: async () => {
      const records = await base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'school_settings' });
      let data = { parentPrefix: 'PAR', parentIncludeYear: true };
      if (records.length > 0 && records[0].notes) {
        try { data = typeof records[0].notes === 'string' ? JSON.parse(records[0].notes) : records[0].notes; } catch(e) {}
      }
      return data;
    },
    enabled: !!companyId
  });

  const mutateParent = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const deleteParent = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', parentId: '', linkedStudentId: '' });

  const parents = records.map(r => {
    return {
      id: r.id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      phone: r.phone || '',
      email: r.email || '',
      status: r.status || 'Active',
      children: [],
      address: '',
      occupation: '',
      emergencyContact: r.phone || '',
      avatar: (r.first_name || 'U').substring(0, 2).toUpperCase()
    };
  });

  const filtered = parents.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.parentId?.includes(search));

  const handleEnroll = () => {
    if (!companyId) return toast.error("Workspace not loaded.");
    if (!formData.name) return toast.error("Please enter parent name");
    
    let finalParentId = formData.parentId;
    if (!finalParentId) {
      const prefix = schoolSettings?.parentPrefix || 'PAR';
      if (formData.linkedStudentId) {
        const parts = formData.linkedStudentId.split('-');
        parts[0] = prefix;
        finalParentId = parts.join('-');
      } else {
        const seq = Math.floor(1000 + Math.random() * 9000);
        finalParentId = `${prefix}-${seq}`;
      }
    }
    
    const payload = {
      company_id: companyId, type: 'parent', name: formData.name, id_number: finalParentId,
      phone: formData.phone, status: 'active',
      notes: JSON.stringify({ email: formData.email, address: formData.address, linkedStudentId: formData.linkedStudentId, avatar: formData.name.substring(0,2).toUpperCase() })
    };

    const onDone = {
      onSuccess: () => {
        toast.success(editingId ? "Parent updated successfully!" : `Parent added! Default Password: password123`);
        setShowModal(false); setEditingId(null);
        setFormData({ name: '', phone: '', email: '', address: '', parentId: '', linkedStudentId: '' });
      },
      onError: (err) => toast.error(err?.message || "Failed to save parent")};

    if (editingId) {
      mutateParent.mutate({ id: editingId, ...payload }, onDone);
    } else {
      mutateParent.mutate(payload, onDone);
    }
  };

  return (
    <div className="space-y-8 font-dmsans max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-emerald-600 p-10 rounded-3xl text-white">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight tracking-[-0.02em]">{t("parents", "Parents Directory")}</h1>
          <p className="text-emerald-100 text-lg mt-2 font-medium">{t("manage_parent_directory", "Manage parent directory (Parents are enrolled automatically with Students)")}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="h-14 px-6 text-lg font-semibold bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl border-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <Settings className="w-5 h-5 mr-2" /> ID Settings
          </Button>
        </div>
      </div>
      
      {showSettings && <div className="bg-[#F0F4FF] dark:bg-blue-900/20 p-6 rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100"><IDFormatSettings /></div>}

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
          <Input 
            placeholder="Search by name or ID..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-16 h-16 bg-white border-2 border-emerald-100 text-lg rounded-2xl focus-visible:ring-emerald-400 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <Users className="w-20 h-20 mx-auto mb-6 text-emerald-200" />
          <p className="text-2xl font-extrabold text-emerald-900 tracking-[-0.02em]">No parents found</p>
          <p className="text-emerald-500 text-lg font-medium mt-2">Adjust your search to try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={p.id} 
              className="bg-white border-2 border-emerald-100 rounded-3xl p-8 hover:border-emerald-300 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
            >
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#1E3A8A] dark:text-blue-400 font-extrabold text-2xl tracking-[-0.02em]">
                  {p.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-xl text-emerald-900 line-clamp-1">{p.name}</h3>
                  <p className="text-emerald-500 font-semibold font-mono text-sm uppercase tracking-widest mt-1 tracking-[0.04em]">{p.parentId}</p>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-emerald-800 bg-[#F0F4FF] dark:bg-blue-900/20 p-3 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-sm truncate">Student: {students.find(s => s.id_number === p.linkedStudentId)?.name || 'Unlinked'}</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-800">
                  <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-sm">{p.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-800">
                  <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-sm truncate">{p.email || 'No email'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-emerald-100">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 font-semibold"
                  onClick={() => {
                    setEditingId(p.id);
                    setFormData({ name: p.name || '', phone: p.phone || '', email: p.email || '', address: p.address || '', parentId: p.parentId || '', linkedStudentId: p.linkedStudentId || '' });
                    setShowModal(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 w-12 p-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => { if (window.confirm("Are you sure?")) deleteParent.mutate(p.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-xl p-10 space-y-6 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 max-h-[90vh] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-3xl font-extrabold text-emerald-900 tracking-[-0.02em]">Edit Parent</h2>
            
            <div className="flex gap-4 border-b-2 border-emerald-100 pb-2">
              {['personal', 'linking'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-lg font-semibold capitalize transition-colors ${activeTab === tab ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-emerald-400 hover:text-[#1E3A8A] dark:text-blue-400'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'personal' && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Full Name</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-2 h-14 text-lg border-emerald-200 bg-[#F0F4FF] dark:bg-blue-900/20/50 rounded-xl focus-visible:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Phone</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-2 h-14 text-lg border-emerald-200 bg-[#F0F4FF] dark:bg-blue-900/20/50 rounded-xl focus-visible:ring-emerald-500" /></div>
                  <div><label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Email</label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-2 h-14 text-lg border-emerald-200 bg-[#F0F4FF] dark:bg-blue-900/20/50 rounded-xl focus-visible:ring-emerald-500" type="email" /></div>
                </div>
                <div><label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Address</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-2 h-14 text-lg border-emerald-200 bg-[#F0F4FF] dark:bg-blue-900/20/50 rounded-xl focus-visible:ring-emerald-500" /></div>
              </div>
            )}

            {activeTab === 'linking' && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Linked Student</label>
                  <select value={formData.linkedStudentId} onChange={e => setFormData({...formData, linkedStudentId: e.target.value})} className="mt-2 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 bg-[#F0F4FF] dark:bg-blue-900/20/50 px-4 py-3 h-14 text-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">-- No Student Selected --</option>
                    {students.map(s => <option key={s.id} value={s.id_number}>{s.name} ({s.id_number})</option>)}
                  </select>
                </div>
                <div className="pt-4 border-t border-emerald-100">
                  <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Parent ID</label>
                  <Input value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className="mt-2 h-14 text-lg border-emerald-200 bg-emerald-100 rounded-xl text-emerald-900" disabled />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-6 border-t border-emerald-100">
              <Button variant="outline" className="flex-1 h-14 text-lg font-semibold border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              {activeTab !== 'linking' ? (
                <Button className="flex-1 h-14 text-lg font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-xl" onClick={() => setActiveTab('linking')}>Next Step &rarr;</Button>
              ) : (
                <Button className="flex-1 h-14 text-lg font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-xl" onClick={handleEnroll} disabled={mutateParent.isPending}>{mutateParent.isPending ? 'Saving...' : 'Save Changes'}</Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
