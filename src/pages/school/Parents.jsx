import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Trash2, Edit2, Heart, Phone, Mail, Link as LinkIcon, X, UserPlus, MoreHorizontal, ArrowUpRight, ArrowDownRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SchoolPageShell from '@/components/school/SchoolPageShell';
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
    name: '', email: '', phone: '', whatsapp: '',
    relationship: 'Father', occupation: '', address: '',
    emergency_contact: false, notes: '', linked_student_ids: []
  });

  const parents = useMemo(() => parentRecords.map(r => ({ id: r.id, ...r.data })), [parentRecords]);
  const students = useMemo(() => studentRecords.map(r => ({ id: r.id, name: r.data?.name || 'Unnamed Student' })), [studentRecords]);

  const stats = useMemo(() => {
    const total = parents.length;
    const linked = parents.filter(p => p.linked_student_ids?.length > 0 || p.children_names).length;
    const emergency = parents.filter(p => p.emergency_contact || p.relationship === 'Father' || p.relationship === 'Mother').length;
    const activeCoverage = total > 0 ? Math.round((linked / total) * 100) : 100;
    return { total, linked, emergency, activeCoverage };
  }, [parents]);

  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase();
    return parents.filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.children_names?.toLowerCase().includes(q)
    );
  }, [parents, search]);

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '', whatsapp: '', relationship: 'Father', occupation: '', address: '', emergency_contact: false, notes: '', linked_student_ids: [] });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (parent) => {
    setFormData({
      name: parent.name || '', email: parent.email || '', phone: parent.phone || '',
      whatsapp: parent.whatsapp || '', relationship: parent.relationship || 'Father',
      occupation: parent.occupation || '', address: parent.address || '',
      emergency_contact: !!parent.emergency_contact, notes: parent.notes || '',
      linked_student_ids: parent.linked_student_ids || []
    });
    setEditingId(parent.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone number are required');
      return;
    }

    const linkedNames = students
      .filter(s => formData.linked_student_ids.includes(s.id))
      .map(s => s.name)
      .join(', ');

    const payload = {
      recordType: 'school_parent',
      payload: { ...formData, children_names: linkedNames },
      status: 'Active',
      searchText: `${formData.name} ${formData.phone} ${linkedNames}`
    };

    try {
      if (editingId) {
        await mutate.mutateAsync({ id: editingId, ...payload });
        toast.success('Parent updated successfully');
      } else {
        await mutate.mutateAsync(payload);
        toast.success('Parent added successfully');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to save parent record');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteRecord.mutateAsync({ id: deleteTargetId, recordType: 'school_parent' });
      toast.success('Parent deleted');
    } catch (err) {
      toast.error('Failed to delete parent');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const toggleStudentLink = (studentId) => {
    setFormData(prev => {
      const exists = prev.linked_student_ids.includes(studentId);
      return {
        ...prev,
        linked_student_ids: exists
          ? prev.linked_student_ids.filter(id => id !== studentId)
          : [...prev.linked_student_ids, studentId]
      };
    });
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';

  return (
    <SchoolPageShell
      title="Parents & Guardians"
      subtitle="Manage emergency contacts and student family relationships"
      breadcrumb={['School', 'Parents & Guardians']}
      actions={
        <Button onClick={handleOpenAdd} className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 h-10 text-sm font-semibold transition-all hover:scale-[1.02] hover:-translate-y-0.5">
          <UserPlus className="w-4 h-4 mr-2" /> Add Parent
        </Button>
      }
    >
      {/* ── Top-Line Clean Stat Cards (Reference Tickets.ID Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat 1: Total Parents */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Parents</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.total}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.9%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">vs last yr</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 2: Linked Students */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Linked Students</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.linked}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +5.4%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">this term</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 3: Primary Guardians */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Primary Guardians</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.emergency}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 98%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">verified</span>
            </span>
          </div>
        </motion.div>

        {/* Stat 4: Family Coverage */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-card dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Family Coverage</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-300 dark:text-zinc-600 cursor-pointer" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{stats.activeCoverage}%</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.9%
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal ml-1">this week</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, phone, or child..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0066fe] transition-all"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors ml-2">Clear</button>
        )}
        <div className="ml-auto text-xs text-slate-400 dark:text-zinc-500 font-bold">{filteredParents.length} parents</div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.2rem] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-800/60 border-b border-slate-100/80 dark:border-zinc-800/80 uppercase tracking-widest">
              <tr>
                {['Parent Name', 'Contact', 'Relationship', 'Linked Children', ''].map((h, i) => (
                  <th key={h || i} className={`px-5 py-4.5 font-bold ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-zinc-800/60">
              {isParentsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0066fe] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold mt-1">Loading parents…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-slate-400 dark:text-zinc-500 text-sm font-semibold">No parents found</p>
                    <button onClick={handleOpenAdd} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors mt-2 block mx-auto">Add your first parent record →</button>
                  </td>
                </tr>
              ) : filteredParents.map(parent => {
                const initials = getInitials(parent.name);
                const colors = [
                  'from-blue-400 to-indigo-500 text-blue-50 shadow-blue-500/10',
                  'from-emerald-400 to-teal-500 text-emerald-50 shadow-emerald-500/10',
                  'from-amber-400 to-orange-500 text-amber-50 shadow-amber-500/10',
                  'from-pink-400 to-rose-500 text-pink-50 shadow-pink-500/10',
                  'from-purple-400 to-violet-500 text-purple-50 shadow-purple-500/10',
                ];
                const colorIndex = (parent.name || 'P').charCodeAt(0) % colors.length;
                const gradColor = colors[colorIndex];
                
                return (
                  <tr key={parent.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-br ${gradColor} flex items-center justify-center text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{parent.name}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">{parent.occupation || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" /> {parent.phone}
                        </div>
                        {parent.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            <Mail className="w-3 h-3 text-slate-400" /> {parent.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/30 dark:border-blue-850/30">
                        <Heart className="w-3 h-3 mr-1" /> {parent.relationship}
                      </span>
                    </td>
                    <td className="px-5 py-4.5">
                      {parent.children_names ? (
                        <div className="flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-[#0066fe] flex-shrink-0" />
                          <span className="text-xs text-slate-700 dark:text-zinc-300 font-bold">{parent.children_names}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium italic">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleOpenEdit(parent)} className="cursor-pointer font-medium text-xs"><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(parent.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 cursor-pointer font-medium text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Record</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Form ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Parent Record' : 'Add New Parent'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Relationship</label>
                  <select value={formData.relationship} onChange={e => setFormData({ ...formData, relationship: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md h-9 px-3 text-sm text-foreground">
                    {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number *</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="+1234567890" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp Number</label>
                  <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="parent@example.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Occupation</label>
                  <Input value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="e.g. Engineer" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Link Students</label>
                <div className="max-h-32 overflow-y-auto border border-border/40 rounded-lg p-2 space-y-1.5 bg-background">
                  {students.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No students available to link</p>
                  ) : (
                    students.map(s => {
                      const isLinked = formData.linked_student_ids.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-muted/30 p-1 rounded transition-colors">
                          <input type="checkbox" checked={isLinked} onChange={() => toggleStudentLink(s.id)} className="rounded border-border/40 text-indigo-600 focus:ring-indigo-600" />
                          <span>{s.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 text-xs font-medium">{editingId ? 'Save Changes' : 'Add Parent'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTargetId}
        onOpenChange={(op) => !op && setDeleteTargetId(null)}
        title="Delete Parent Record"
        description="Are you sure you want to delete this parent record? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        destructive
      />
    </SchoolPageShell>
  );
}
