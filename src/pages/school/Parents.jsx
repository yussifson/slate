import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Plus, Trash2, Edit2, Heart, Phone, Mail, Link as LinkIcon, X, UserPlus, MoreHorizontal } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { statCardStyle, tableContainerStyle, filterBarStyle, iconBadgeStyle, STAT_COLORS, addButtonStyle, tableHeaderStyle, tableCellStyle } from '@/components/school/premiumStyles';

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
    return { total, linked };
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
  const avatarBgs = ['#EEF2FF', '#ECFDF5', '#FFF7ED', '#FFF1F2', '#F0F9FF', '#F5F3FF'];
  const avatarFgs = ['#4F46E5', '#059669', '#D97706', '#E11D48', '#0284C7', '#7C3AED'];
  const getAvatarIdx = (name) => (name?.charCodeAt(0) || 0) % avatarBgs.length;

  return (
    <SchoolPageShell
      title="Parents & Guardians"
      subtitle="Manage emergency contacts and student family relationships"
      breadcrumb={['School', 'Parents & Guardians']}
      actions={
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white" style={addButtonStyle}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Parent
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {[
          { label: 'Total Parents', value: stats.total, sub: 'Registered contacts', icon: Users, color: STAT_COLORS.blue },
          { label: 'Linked Students', value: stats.linked, sub: 'Parents connected to students', icon: Heart, color: STAT_COLORS.rose },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={statCardStyle} className="group hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div style={iconBadgeStyle(color.bg)}>
                <Icon style={{ width: 22, height: 22, color: color.icon }} />
              </div>
              <div className="flex-1">
                <p style={{ color: color.label, fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
                <p className="text-foreground" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</p>
                <p className="text-muted-foreground/60" style={{ fontSize: '12px', marginTop: '6px' }}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={filterBarStyle} className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input 
            placeholder="Search by name, phone, or child..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/40 text-sm h-9"
            style={{ borderRadius: '10px' }}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>Clear</button>
        )}
        <div className="ml-auto text-xs text-muted-foreground/60 font-medium">{filteredParents.length} parents</div>
      </div>

      {/* ── Table ── */}
      <div style={tableContainerStyle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Parent Name', 'Contact', 'Relationship', 'Linked Children', ''].map((h, i) => (
                  <th key={h || i} style={{ ...tableHeaderStyle, textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isParentsLoading ? (
                <tr><td colSpan={5} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span className="text-muted-foreground/60" style={{ fontSize: '14px' }}>Loading parents…</span>
                  </div>
                </td></tr>
              ) : filteredParents.length === 0 ? (
                <tr><td colSpan={5} style={{ ...tableCellStyle, textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'hsl(var(--muted) / 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users style={{ width: '24px', height: '24px', color: 'hsl(var(--muted-foreground) / 0.3)' }} />
                    </div>
                    <p className="text-muted-foreground font-medium" style={{ fontSize: '15px' }}>No parents found</p>
                    <button onClick={handleOpenAdd} style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Add your first parent record →</button>
                  </div>
                </td></tr>
              ) : filteredParents.map(parent => {
                const idx = getAvatarIdx(parent.name);
                return (
                  <tr key={parent.id} className="group" style={{ borderBottom: '1px solid hsl(var(--border) / 0.2)', transition: 'background-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatarBgs[idx], color: avatarFgs[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(parent.name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--foreground))' }}>{parent.name}</p>
                          <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>{parent.occupation || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 text-muted-foreground/60" /> {parent.phone}
                        </div>
                        {parent.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                            <Mail className="w-3 h-3 text-muted-foreground/60" /> {parent.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#6366f1'
                      }}>
                        <Heart className="w-3 h-3" /> {parent.relationship}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {parent.children_names ? (
                        <div className="flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-xs text-foreground font-medium">{parent.children_names}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Not linked</span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: '6px', borderRadius: '8px', color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleOpenEdit(parent)}><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(parent.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
