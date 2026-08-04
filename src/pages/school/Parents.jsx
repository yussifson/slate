import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Trash2, Edit2, Heart, Phone, Mail, Link as LinkIcon, X, UserPlus, MoreHorizontal } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SchoolPageShell from '@/components/school/SchoolPageShell';

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
    name: '', email: '', phone: '', whatsapp: '',
    relationship: 'Father', occupation: '', address: '',
    children_ids: '[]', children_names: ''
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

  const parentsLinkedCount = parents.filter(p => {
    try { return JSON.parse(p.children_ids || '[]').length > 0; } catch { return false; }
  }).length;

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '', whatsapp: '', relationship: 'Father', occupation: '', address: '', children_ids: '[]', children_names: '' });
    setSelectedChildren([]);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (parent) => {
    setFormData({
      name: parent.name || '', email: parent.email || '', phone: parent.phone || '',
      whatsapp: parent.whatsapp || '', relationship: parent.relationship || 'Father',
      occupation: parent.occupation || '', address: parent.address || '',
      children_ids: parent.children_ids || '[]', children_names: parent.children_names || ''
    });
    try { setSelectedChildren(JSON.parse(parent.children_ids || '[]')); } catch { setSelectedChildren([]); }
    setEditingId(parent.id);
    setShowModal(true);
  };

  const toggleChildSelection = (studentId) => {
    setSelectedChildren(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) return toast.error("Name and Phone are required");
    const linkedStudentNames = students.filter(s => selectedChildren.includes(s.id)).map(s => s.name || s.full_name || 'Unknown Student').join(', ');
    const payload = { ...formData, children_ids: JSON.stringify(selectedChildren), children_names: linkedStudentNames };
    mutate.mutate(
      { id: editingId, recordType: 'school_parent', payload },
      {
        onSuccess: () => { toast.success(editingId ? "Parent updated" : "Parent added"); setShowModal(false); },
        onError: () => toast.error("Failed to save parent")
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate(
      { id: deleteTargetId, recordType: 'school_parent' },
      { onSuccess: () => { toast.success("Parent removed"); setDeleteTargetId(null); }, onError: () => { toast.error("Failed to remove parent"); setDeleteTargetId(null); } }
    );
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  const avatarColors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <SchoolPageShell
      title="Parents & Guardians"
      subtitle="Manage emergency contacts and family relationships"
      breadcrumb={['School', 'Parents & Guardians']}
      actions={
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <UserPlus className="w-4 h-4 mr-2" /> Add Parent
        </Button>
      }
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Parents', value: parents.length, icon: Users, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Linked to Students', value: parentsLinkedCount, icon: LinkIcon, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Unlinked', value: parents.length - parentsLinkedCount, icon: Heart, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or child name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 text-sm h-9" />
        </div>
        {search && <button onClick={() => setSearch('')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Clear</button>}
        <div className="text-sm text-muted-foreground ml-auto">{filteredParents.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent / Guardian</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Relationship</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Linked Children</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isParentsLoading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Loading parents...</td></tr>
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No parents found</p>
                      <button onClick={handleOpenAdd} className="text-sm text-indigo-600 hover:underline">Add your first parent record →</button>
                    </div>
                  </td>
                </tr>
              ) : filteredParents.map(parent => (
                <tr key={parent.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(parent.name)}`}>
                        {getInitials(parent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{parent.name}</p>
                        <p className="text-xs text-muted-foreground">{parent.occupation || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {parent.phone}
                      </div>
                      {parent.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {parent.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full text-xs font-medium">
                      <Heart className="w-3 h-3" /> {parent.relationship}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {parent.children_names ? (
                      <div className="flex items-start gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground font-medium leading-relaxed">{parent.children_names}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not linked</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleOpenEdit(parent)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTargetId(parent.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-2xl rounded-2xl my-8 relative shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Parent Profile' : 'New Parent Profile'}</h2>
              <p className="text-indigo-100 text-sm mt-0.5">Enter the parent or guardian's information below.</p>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Mary Mensah" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number *</label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. 0244123456" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</label>
                  <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="mt-1.5 h-10" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. mary@example.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Relationship</label>
                  <select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {RELATIONSHIP_OPTIONS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Occupation</label>
                  <Input value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Teacher, Trader" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Home Address</label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. House No. 4, Accra" />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <LinkIcon className="w-3.5 h-3.5" /> Link Children
                </label>
                <div className="bg-muted/30 border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">No students found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {students.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-2.5 hover:bg-card rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border/50">
                          <input type="checkbox" checked={selectedChildren.includes(student.id)} onChange={() => toggleChildSelection(student.id)} className="w-4 h-4 text-indigo-600 border-input rounded" />
                          <span>
                            <span className="font-medium text-foreground text-sm block">{student.name || student.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student.class_name || 'No Class'}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={mutate.isPending}>
                  {mutate.isPending ? 'Saving...' : editingId ? 'Update Parent' : 'Save Parent'}
                </Button>
              </div>
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
    </SchoolPageShell>
  );
}
