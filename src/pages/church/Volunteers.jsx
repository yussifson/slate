import { useState } from 'react';
import { Calendar, Users, ClipboardCheck, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Volunteers() {
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('volunteer');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const volunteers = dbRecords.map(r => ({
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
    ministry: 'Ushers',
    role: 'Usher',
    availability: 'Sundays',
    nextService: new Date().toISOString().split('T')[0]
  });

  
  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleCreateVolunteer = () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      return toast.error("Please enter volunteer name and role");
    }

    const payload = {
      name: formData.name,
      ministry: formData.ministry,
      role: formData.role,
      availability: formData.availability,
      nextService: formData.nextService
    };

    mutateRecord.mutate({
      ...(editRecord ? { id: editRecord.id } : {}),
      recordType: 'volunteer',
      payload,
      status: 'Active',
      searchText: `${formData.name} ${formData.ministry} ${formData.role}`
    }, {
      onSuccess: () => {
        toast.success('Volunteer scheduled successfully!');
        setShowModal(false);
        setEditRecord(null);
        setFormData({ name: '', ministry: 'Ushers', role: 'Usher', availability: 'Sundays', nextService: new Date().toISOString().split('T')[0] });
      },
      onError: (err) => {
        toast.error('Failed to schedule volunteer: ' + err.message);
      }
    });
  };

  const handleDeleteVolunteer = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'volunteer' }, {
      onSuccess: () => {
        toast.success('Volunteer removed from schedule successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove volunteer: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = volunteers.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.ministry?.toLowerCase().includes(search.toLowerCase()) ||
    v.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Volunteer Roster</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage church service volunteers and schedules</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" /> Schedule Volunteer
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search volunteers, ministries, or roles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading roster...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-purple-600" />
              <p className="font-semibold text-lg text-card-foreground">No volunteers scheduled</p>
              <p className="text-xs mt-1">Add church members to ushers, tech booths, or teachers using the top right button.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Volunteer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Ministry / Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Availability</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Next Service Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-card-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" /> <Link to="/church/members" className="text-primary hover:underline">{v.name}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/church/ministries" className="font-semibold text-purple-700 dark:text-purple-400 hover:underline block">{v.ministry}</Link>
                      <p className="text-xs text-muted-foreground">{v.role}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{v.availability}</td>
                    <td className="px-6 py-4 text-card-foreground font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" /> {v.nextService}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewRecord(v)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(v)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(v.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" /> Schedule Church Volunteer
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Volunteer Name</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Ama Owusu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ministry</label>
                  <select
                    value={formData.ministry}
                    onChange={e => setFormData({ ...formData, ministry: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>Ushers</option>
                    <option>Childrens Dept</option>
                    <option>Media/Tech</option>
                    <option>Worship/Choir</option>
                    <option>Hospitality</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Specific Role</label>
                  <Input
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. Sound Engineer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Availability</label>
                  <Input
                    value={formData.availability}
                    onChange={e => setFormData({ ...formData, availability: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. Sundays"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Next Service Date</label>
                  <Input
                    type="date"
                    value={formData.nextService}
                    onChange={e => setFormData({ ...formData, nextService: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateVolunteer}>{editRecord ? 'Update' : 'Schedule'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteVolunteer}
        title="Remove Volunteer"
        message="Are you sure you want to remove this volunteer from the schedule? This action is permanent."
      />
    
      <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Details</SheetTitle>
            <SheetDescription>Read-only view of the selected record.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => (
              <div key={key} className="border-b border-border pb-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="mt-1 text-base text-foreground font-semibold">
                  {key === 'name' ? (
                    <Link to="/church/members" className="text-primary hover:underline">{String(value)}</Link>
                  ) : key === 'ministry' ? (
                    <Link to="/church/ministries" className="text-primary hover:underline">{String(value)}</Link>
                  ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
