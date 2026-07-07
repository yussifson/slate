import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Search, Edit, Eye, UserCheck, Droplet, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Milestones() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [milestones, setMilestones] = useState([]);
  const [members, setMembers] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT m.*, u.name as member_name FROM univ_religion_milestones m LEFT JOIN univ_religion_members u ON m.member_id = u.id WHERE m.company_id = ? ORDER BY m.created_at DESC', [companyId]);
        if(active) setMilestones(res.rows._array || Array.from(res.rows));

        const memRes = await powerSync.execute('SELECT id, name FROM univ_religion_members WHERE company_id = ? ORDER BY name ASC', [companyId]);
        if(active) setMembers(memRes.rows._array || Array.from(memRes.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchAll();
    return () => { active = false; };
  }, [companyId]);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  const [formData, setFormData] = useState({
    member_id: '',
    milestone_type: 'Baptism',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const openEdit = (record) => {
    setEditRecord(record);
    setFormData({
      member_id: record.member_id || '',
      milestone_type: record.milestone_type || 'Baptism',
      date: record.date || new Date().toISOString().split('T')[0],
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handleCreateMilestone = async () => {
    if (!formData.member_id) {
      return toast.error("Please select a member");
    }

    try {
      if (editRecord) {
        await powerSync.execute(`UPDATE univ_religion_milestones SET member_id=?, milestone_type=?, date=?, notes=? WHERE id=?`, 
          [formData.member_id, formData.milestone_type, formData.date, formData.notes, editRecord.id]
        );
        toast.success('Milestone updated successfully!');
      } else {
        await powerSync.execute(`INSERT INTO univ_religion_milestones (id, created_at, company_id, member_id, milestone_type, date, notes) VALUES (gen_random_uuid(), datetime('now'), ?, ?, ?, ?, ?)`, 
          [companyId, formData.member_id, formData.milestone_type, formData.date, formData.notes]
        );
        toast.success('Milestone added successfully!');
      }
      setShowModal(false);
      setEditRecord(null);
      setFormData({ member_id: '', milestone_type: 'Baptism', date: new Date().toISOString().split('T')[0], notes: '' });
      
      const res = await powerSync.execute('SELECT m.*, u.name as member_name FROM univ_religion_milestones m LEFT JOIN univ_religion_members u ON m.member_id = u.id WHERE m.company_id = ? ORDER BY m.created_at DESC', [companyId]);
      setMilestones(res.rows._array || Array.from(res.rows));
    } catch (err) {
      toast.error('Failed to add milestone: ' + err.message);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_religion_milestones WHERE id=?`, [deleteTargetId]);
      toast.success('Milestone removed successfully!');
      setDeleteTargetId(null);
      setMilestones(milestones.filter(m => m.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to remove milestone: ' + err.message);
    }
  };

  const filtered = milestones.filter(m =>
    m.member_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.milestone_type?.toLowerCase().includes(search.toLowerCase()) ||
    m.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case 'Baptism': return <Droplet className="w-5 h-5 text-blue-500" />;
      case 'Membership': return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'Ordination': return <Award className="w-5 h-5 text-purple-500" />;
      case 'Confirmation': return <BookOpen className="w-5 h-5 text-orange-500" />;
      default: return <Users className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("milestones", "Milestones")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_spiritual_milestones", "Manage spiritual milestones and significant life events")}</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setFormData({ member_id: '', milestone_type: 'Baptism', date: new Date().toISOString().split('T')[0], notes: '' }); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("add_milestone", "Add Milestone")}
        </Button>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input placeholder="Search milestones..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted" />
        </div>
      </div>

      {isDbLoading ? (
        <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_milestones", "Loading milestones...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
          <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_milestones", "No milestones tracked")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "start_tracking_spiritual_journeys",
            "Start tracking the spiritual journeys of your congregation."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(milestone => (
            <div key={milestone.id} className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden relative flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-xl">
                      {getIcon(milestone.milestone_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{milestone.milestone_type}</h3>
                      <p className="text-xs text-[#71717a] dark:text-gray-400">{milestone.date}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(milestone)}>
                        <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTargetId(milestone.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-3 mt-5 border-t border-primary/10 pt-5">
                  <div>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-widest mb-1">Member</p>
                    <p className="font-medium text-foreground">{milestone.member_name || 'Unknown Member'}</p>
                  </div>
                  {milestone.notes && (
                    <div>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-sm text-foreground line-clamp-2">{milestone.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <Award className="w-5 h-5 text-primary" /> {editRecord ? 'Edit Milestone' : 'Add Milestone'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("member", "Member")}</label>
                <select
                  value={formData.member_id}
                  onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select Member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("milestone_type", "Type")}</label>
                  <select
                    value={formData.milestone_type}
                    onChange={e => setFormData({ ...formData, milestone_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>Baptism</option>
                    <option>Membership</option>
                    <option>Ordination</option>
                    <option>Confirmation</option>
                    <option>Marriage</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("date", "Date")}</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("notes", "Notes")}</label>
                <Input
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateMilestone}>{editRecord ? 'Update' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message="Are you sure you want to remove this milestone? This action cannot be undone."
      />
    </div>
  );
}
