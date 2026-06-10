import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Plus, Shield, Music, HeartHandshake, Trash2, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

const COLOR_SCHEMES = [
  { border: 'border-primary/20 dark:border-primary/70', bg: 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20', text: 'text-primary', name: 'Blue' },
  { border: 'border-primary/20 dark:border-primary/70', bg: 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20', text: 'text-primary', name: 'Pink' },
  { border: 'border-primary/20 dark:border-primary/70', bg: 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20', text: 'text-primary', name: 'Purple' },
  { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-500', name: 'Amber' },
  { border: 'border-primary/20 dark:border-primary/70', bg: 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20', text: 'text-primary', name: 'Emerald' }
];

export default function Groups() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('group');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const groups = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    leader: '',
    members: 10,
    schedule: 'Sundays, 9:00 AM',
    schemeIndex: 0
  });


  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleCreateGroup = () => {
    if (!formData.name.trim() || !formData.leader.trim()) {
      return toast.error("Please enter a group name and leader");
    }

    const scheme = COLOR_SCHEMES[formData.schemeIndex];
    const payload = {
      name: formData.name,
      leader: formData.leader,
      members: parseInt(formData.members) || 0,
      schedule: formData.schedule,
      color: `${scheme.border} ${scheme.bg}`,
      iconType: formData.schemeIndex // mapped to icon index
    };

    mutateRecord.mutate({
      ...(editRecord ? { id: editRecord.id } : {}),
      recordType: 'group',
      payload,
      status: 'active',
      searchText: `${formData.name} ${formData.leader}`
    }, {
      onSuccess: () => {
        toast.success('Group department configured successfully!');
        setShowModal(false);
        setEditRecord(null);
        setFormData({ name: '', leader: '', members: 10, schedule: 'Sundays, 9:00 AM', schemeIndex: 0 });
      },
      onError: (err) => {
        toast.error('Failed to configure group: ' + err.message);
      }
    });
  };

  const handleDeleteGroup = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'group' }, {
      onSuccess: () => {
        toast.success('Group department deleted successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to delete group: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 0: return <Users className="w-6 h-6 text-primary" />;
      case 1: return <HeartHandshake className="w-6 h-6 text-primary" />;
      case 2: return <Music className="w-6 h-6 text-primary" />;
      case 3: return <Shield className="w-6 h-6 text-amber-500" />;
      default: return <Users className="w-6 h-6 text-primary" />;
    }
  };

  const filtered = groups.filter(min =>
    min.name?.toLowerCase().includes(search.toLowerCase()) ||
    min.leader?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("groups", "Groups")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_religion_departments_and_", "Manage religion departments and groups")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("add_group", "Add Group")}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search groups and leaders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_departments", "Loading departments...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_groups_configured", "No groups configured")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "establish_departments_choir_le",
            "Establish departments, choir leaders, youth fellowships, and meeting routines using the top-right button."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(min => {
            return (
              <div key={min.id} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${min.color || 'border-border bg-muted'}`}>
                    {getIcon(min.iconType)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewRecord(min)}>
                        <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(min)}>
                        <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTargetId(min.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-1">{min.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("leader", "Leader:")} <Link to="/religion/members" className="font-bold text-primary hover:underline">{min.leader}</Link></p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center py-2 border-t border-border">
                    <span>{t("members", "Members")}</span>
                    <span className="font-bold bg-muted px-2.5 py-0.5 rounded-full text-card-foreground">{min.members}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-border">
                    <span>{t("meetings", "Meetings")}</span>
                    <span className="font-medium text-card-foreground text-right">{min.schedule}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-primary" /> {t("create_group_dept", "Create Group")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("group_name", "Group Name")}</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Choir Department"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("assign_leader", "Assign Leader")}</label>
                <Input
                  value={formData.leader}
                  onChange={e => setFormData({ ...formData, leader: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("initial_members", "Initial Members")}</label>
                  <Input
                    type="number"
                    value={formData.members}
                    onChange={e => setFormData({ ...formData, members: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("theme_preset", "Theme Preset")}</label>
                  <select
                    value={formData.schemeIndex}
                    onChange={e => setFormData({ ...formData, schemeIndex: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {COLOR_SCHEMES.map((scheme, i) => {
                      return (<option key={i} value={i}>{scheme.name}</option>);
                    })}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("meeting_schedule", "Meeting Schedule")}</label>
                <Input
                  value={formData.schedule}
                  onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Saturdays, 4:00 PM"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateGroup}>{editRecord ? 'Update' : 'Save Dept'}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to completely disband this group group? This will remove all associated meeting schedules permanently."
      />
      <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
            <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => {
              return (
                <div key={key} className="border-b border-border pb-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="mt-1 text-base text-foreground font-semibold">
                    {key === 'leader' ? (
                      <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
                    ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
