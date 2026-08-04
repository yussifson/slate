import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Trash2, Edit, Heart, Phone, Mail, Link as LinkIcon, X, UserPlus } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Parents & Guardians</h1>
            <p className="text-muted-foreground mt-2">Manage emergency contacts and relationships</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0 rounded-xl">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input 
              placeholder="Search by name, phone, or child..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
        </Card>

      {isParentsLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading Parents...</div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl border-border">No parents found. Add your first parent record!</div>
      ) : (
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 font-semibold text-foreground">Parent Name</th>
                  <th className="p-4 font-semibold text-foreground">Contact</th>
                  <th className="p-4 font-semibold text-foreground">Relationship</th>
                  <th className="p-4 font-semibold text-foreground">Linked Children</th>
                  <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredParents.map((parent, idx) => (
                  <tr key={parent.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-foreground">{parent.name}</p>
                      <p className="text-xs text-muted-foreground">{parent.occupation || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {parent.phone}
                      </div>
                      {parent.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {parent.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        <Heart className="w-3 h-3" /> {parent.relationship}
                      </span>
                    </td>
                    <td className="p-4">
                      {parent.children_names ? (
                        <div className="flex items-start gap-2 text-foreground">
                          <LinkIcon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm font-medium leading-tight">
                            {parent.children_names}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No children linked</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(parent)} className="h-8 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white rounded-none font-bold uppercase text-xs tracking-wider">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(parent)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(parent.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border w-full max-w-2xl p-6 space-y-6 rounded-2xl my-8 relative shadow-xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? 'Edit Parent Profile' : 'New Parent Profile'}
              </h2>
              <p className="text-muted-foreground mt-1">Enter the parent's information below.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. Mary Mensah"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Phone Number <span className="text-destructive">*</span></label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. 0244123456"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">WhatsApp Number (Optional)</label>
                <Input 
                  value={formData.whatsapp} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. 0244123456"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. mary@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Relationship to Student</label>
                <select 
                  value={formData.relationship} 
                  onChange={e => setFormData({...formData, relationship: e.target.value})} 
                  className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {RELATIONSHIP_OPTIONS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Occupation</label>
                <Input 
                  value={formData.occupation} 
                  onChange={e => setFormData({...formData, occupation: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. Teacher, Trader"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Home Address</label>
                <Input 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. House No. 4, Accra"
                />
              </div>
              
              <div className="md:col-span-2 mt-2 pt-6 border-t border-border">
                <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4"/> Link Students (Children)
                </label>
                <div className="bg-muted/30 border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No students found to link.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {students.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedChildren.includes(student.id)}
                            onChange={() => toggleChildSelection(student.id)}
                            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                          />
                          <span className="font-medium text-foreground text-sm">{student.name || student.full_name} <span className="text-xs text-muted-foreground block">{student.class_name || 'No Class'}</span></span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0" onClick={handleSave} disabled={mutate.isPending}>
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
