import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, MapPin, Clock, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function SmallGroups() {
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
    location: '',
    time: 'Wednesdays, 7:00 PM',
    members: 5
  });


  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleCreateGroup = () => {
    if (!formData.name.trim() || !formData.leader.trim() || !formData.location.trim()) {
      return toast.error("Please enter a group name, leader, and location address");
    }

    const payload = {
      name: formData.name,
      leader: formData.leader,
      location: formData.location,
      time: formData.time,
      members: parseInt(formData.members) || 0
    };

    mutateRecord.mutate({
      ...(editRecord ? { id: editRecord.id } : {}),
      recordType: 'group',
      payload,
      status: 'active',
      searchText: `${formData.name} ${formData.leader} ${formData.location}`
    }, {
      onSuccess: () => {
        toast.success('Cell group configured successfully!');
        setShowModal(false);
        setEditRecord(null);
        setFormData({ name: '', leader: '', location: '', time: 'Wednesdays, 7:00 PM', members: 5 });
      },
      onError: (err) => {
        toast.error('Failed to configure small group: ' + err.message);
      }
    });
  };

  const handleDeleteGroup = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'group' }, {
      onSuccess: () => {
        toast.success('Cell group removed successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove cell group: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.leader?.toLowerCase().includes(search.toLowerCase()) ||
    g.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("small_groups", "Small Groups")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "cell_groups_and_home_fellowshi",
            "Cell groups and home fellowship directory"
          )}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("add_group", "Add Group")}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search cells and host locations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_groups", "Loading groups...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_cell_groups_configured", "No cell groups configured")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "register_localized_neighborhoo",
            "Register localized neighborhood study cells and host schedules using the top right button."
          )}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(group => {
            return (
              <div key={group.id} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary/20 transition-colors relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/50 flex items-center justify-center text-primary dark:text-primary/70">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold">{group.members} {t("members", "Members")}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewRecord(group)}>
                          <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(group)}>
                          <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTargetId(group.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-1">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("leader", "Leader:")} <Link to="/church/members" className="font-bold text-primary hover:underline">{group.leader}</Link></p>
                <div className="space-y-3 text-sm text-muted-foreground bg-muted dark:bg-muted/30 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{group.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{group.time}</span>
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
              <Users className="w-5 h-5 text-primary" /> {t("configure_cell_group", "Configure Cell Group")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("group_name", "Group Name")}</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Grace Fellowship"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("group_leader", "Group Leader")}</label>
                <Input
                  value={formData.leader}
                  onChange={e => setFormData({ ...formData, leader: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Brother Kofi"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("host_location_address", "Host Location Address")}</label>
                <Input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Block 4, East Legon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("weekly_meeting_time", "Weekly Meeting Time")}</label>
                  <Input
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. Wednesdays, 7:00 PM"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("initial_members_count", "Initial Members Count")}</label>
                  <Input
                    type="number"
                    value={formData.members}
                    onChange={e => setFormData({ ...formData, members: e.target.value })}
                    className="mt-1"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateGroup}>{editRecord ? 'Update' : 'Save Cell'}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteGroup}
        title="Disband Cell Group"
        message="Are you sure you want to completely disband this localized cell group from the directory? This action is permanent."
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
                      <Link to="/church/members" className="text-primary hover:underline">{String(value)}</Link>
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
