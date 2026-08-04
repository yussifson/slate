import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Trash2, Edit, Heart, Phone, Mail, Link as LinkIcon, X, UserPlus } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';

const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Other'];

export default function Parents() {
  const { t } = useTranslation();
  
  const { data: parentRecords = [], isLoading: isParentsLoading } = useIndustryRecords('school_parent');
  const { data: studentRecords = [] } = useIndustryRecords('school_student');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    relationship: 'Father',
    occupation: '',
    address: '',
    children_ids: '[]',
    children_names: ''
  });

  const [selectedChildren, setSelectedChildren] = useState([]);

  const parents = useMemo(() => parentRecords.map(r => ({ id: r.id, ...r.data })), [parentRecords]);
  const students = useMemo(() => studentRecords.map(r => ({ id: r.id, ...r.data })), [studentRecords]);

  const filteredParents = useMemo(() => {
    return parents.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.phone?.includes(search) ||
      p.children_names?.toLowerCase().includes(search.toLowerCase())
    );
  }, [parents, search]);

  const parentsLinkedToStudentsCount = parents.filter(p => {
    try {
      const ids = JSON.parse(p.children_ids || '[]');
      return ids.length > 0;
    } catch {
      return false;
    }
  }).length;

  const handleOpenAdd = () => {
    setFormData({
      name: '', email: '', phone: '', whatsapp: '', relationship: 'Father', occupation: '', address: '', children_ids: '[]', children_names: ''
    });
    setSelectedChildren([]);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (parent) => {
    setFormData({
      name: parent.name || '',
      email: parent.email || '',
      phone: parent.phone || '',
      whatsapp: parent.whatsapp || '',
      relationship: parent.relationship || 'Father',
      occupation: parent.occupation || '',
      address: parent.address || '',
      children_ids: parent.children_ids || '[]',
      children_names: parent.children_names || ''
    });
    
    try {
      const ids = JSON.parse(parent.children_ids || '[]');
      setSelectedChildren(ids);
    } catch {
      setSelectedChildren([]);
    }
    
    setEditingId(parent.id);
    setShowModal(true);
  };

  const toggleChildSelection = (studentId) => {
    setSelectedChildren(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      return toast.error("Name and Phone are required");
    }

    const linkedStudentNames = students
      .filter(s => selectedChildren.includes(s.id))
      .map(s => s.name || s.full_name || 'Unknown Student')
      .join(', ');

    const payload = { 
      ...formData,
      children_ids: JSON.stringify(selectedChildren),
      children_names: linkedStudentNames
    };
    
    mutate.mutate(
      {
        id: editingId,
        recordType: 'school_parent',
        payload
      },
      {
        onSuccess: () => {
          toast.success(editingId ? "Parent updated successfully" : "Parent added successfully");
          setShowModal(false);
        },
        onError: () => {
          toast.error("Failed to save parent");
        }
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate(
      { id: deleteTargetId, recordType: 'school_parent' },
      {
        onSuccess: () => {
          toast.success("Parent removed");
          setDeleteTargetId(null);
        },
        onError: () => {
          toast.error("Failed to remove parent");
          setDeleteTargetId(null);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parents & Guardians</h1>
            <p className="text-slate-500 mt-1">Manage emergency contacts and relationships</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block border-r border-slate-200 pr-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold text-slate-900">{parents.length}</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked</p>
              <p className="text-lg font-bold text-slate-900">{parentsLinkedToStudentsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, phone, or child..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 bg-slate-50 border-slate-200 shadow-sm transition-colors focus:bg-white"
            />
          </div>
          <Button onClick={handleOpenAdd} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm w-full md:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Parent
          </Button>
        </div>

      {isParentsLoading ? (
        <div className="flex items-center justify-center py-20 text-blue-800 font-bold uppercase tracking-widest animate-pulse">Loading Parents...</div>
      ) : filteredParents.length === 0 ? (
        <div className="py-20 text-center text-gray-500 font-medium bg-white border-2 border-blue-100 p-8">No parents found. Add your first parent record!</div>
      ) : (
        <div className="bg-white border-2 border-blue-300 shadow-md overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-100 border-b-4 border-blue-300 text-blue-900">
                <th className="p-4 font-black uppercase tracking-widest text-sm">Parent Name</th>
                <th className="p-4 font-black uppercase tracking-widest text-sm">Contact</th>
                <th className="p-4 font-black uppercase tracking-widest text-sm">Relationship</th>
                <th className="p-4 font-black uppercase tracking-widest text-sm">Linked Children</th>
                <th className="p-4 font-black uppercase tracking-widest text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent, idx) => (
                <tr key={parent.id} className={`border-b-2 border-blue-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F0F4FF]/50'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-200 border-2 border-blue-400 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-800" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-900 text-lg">{parent.name}</div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">{parent.occupation || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone className="w-4 h-4 text-emerald-600" /> {parent.phone}
                    </div>
                    {parent.email && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Mail className="w-4 h-4 text-blue-500" /> {parent.email}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 font-black uppercase text-xs tracking-wider border border-purple-300">
                      <Heart className="w-3 h-3" /> {parent.relationship}
                    </span>
                  </td>
                  <td className="p-4">
                    {parent.children_names ? (
                      <div className="flex items-start gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-sm font-bold text-blue-900 leading-tight">
                          {parent.children_names}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400 italic">No children linked</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(parent)} className="h-8 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white rounded-none font-bold uppercase text-xs tracking-wider">
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(parent.id)} className="h-8 bg-red-50 border-red-300 text-red-700 hover:bg-red-600 hover:text-white rounded-none font-bold uppercase text-xs tracking-wider">
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A8A]/80 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white border-4 border-blue-500 w-full max-w-2xl p-6 space-y-6 rounded-none my-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-blue-800 hover:bg-blue-100 p-1">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-blue-900 uppercase tracking-wider border-b-4 border-blue-200 pb-2">
              {editingId ? 'Edit Parent Profile' : 'New Parent Profile'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. Mary Mensah"
                />
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Phone Number <span className="text-red-500">*</span></label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. 0244123456"
                />
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">WhatsApp Number (Optional)</label>
                <Input 
                  value={formData.whatsapp} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. 0244123456"
                />
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Email Address</label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. mary@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Relationship to Student</label>
                <select 
                  value={formData.relationship} 
                  onChange={e => setFormData({...formData, relationship: e.target.value})} 
                  className="mt-1 w-full border-2 border-blue-200 bg-[#F0F4FF] px-3 py-2.5 text-sm font-bold text-blue-900 rounded-none focus:outline-none focus:border-blue-500 h-11"
                >
                  {RELATIONSHIP_OPTIONS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Occupation</label>
                <Input 
                  value={formData.occupation} 
                  onChange={e => setFormData({...formData, occupation: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. Teacher, Trader"
                />
              </div>

              <div>
                <label className="text-xs font-black text-blue-800 uppercase tracking-widest">Home Address</label>
                <Input 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="mt-1 border-2 border-blue-200 bg-[#F0F4FF] rounded-none font-bold text-blue-900 h-11" 
                  placeholder="e.g. House No. 4, Accra"
                />
              </div>
              
              <div className="md:col-span-2 mt-4 pt-4 border-t-2 border-blue-100">
                <label className="text-sm font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4"/> Link Students (Children)
                </label>
                <div className="bg-[#F0F4FF] border-2 border-blue-200 p-4 max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-sm font-semibold text-gray-500 italic">No students found to link.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {students.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-blue-100 cursor-pointer border border-transparent hover:border-blue-300 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedChildren.includes(student.id)}
                            onChange={() => toggleChildSelection(student.id)}
                            className="w-5 h-5 text-blue-600 border-2 border-blue-400 rounded-none focus:ring-blue-500"
                          />
                          <span className="font-bold text-blue-900 text-sm">{student.name || student.full_name} <span className="text-xs font-semibold text-blue-600 block">{student.class_name || 'No Class'}</span></span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-4 border-blue-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-blue-300 font-bold text-blue-800 hover:bg-[#F0F4FF] uppercase tracking-widest h-12" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest border-2 border-emerald-900 h-12" onClick={handleSave} disabled={mutate.isPending}>
                {mutate.isPending ? 'Saving...' : 'Save Parent'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteTargetId !== null} 
        onClose={() => setDeleteTargetId(null)} 
        onConfirm={handleDelete} 
        title="Remove Parent" 
        message="Are you sure you want to permanently remove this parent record? This cannot be undone." 
      />
      </div>
    </div>
  );
}
