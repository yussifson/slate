import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, UserPlus, Phone, Activity, Heart, Stethoscope, Trash2, Pencil, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const statusColors = {
  Admitted: 'bg-red-100 text-red-700',
  Outpatient: 'bg-blue-100 text-blue-700',
  Discharged: 'bg-green-100 text-green-700',
};

const BLANK_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'Male',
  bloodType: 'O+',
  phone: '',
  diagnosis: '',
  status: 'Outpatient',
};

export default function Patients() {
  const { data: dbRecords = [], isLoading } = useIndustryRecords('patient');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const patients = dbRecords.map(r => ({ id: r.id, status: r.status || 'Outpatient', ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);

  const openAdd = () => {
    setEditingPatient(null);
    setFormData(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (p) => {
    const [firstName = '', ...rest] = (p.name || '').split(' ');
    const lastName = rest.join(' ');
    setEditingPatient(p);
    setFormData({
      firstName,
      lastName,
      dateOfBirth: '',
      gender: p.gender || 'Male',
      bloodType: p.bloodType || 'O+',
      phone: p.phone || '',
      diagnosis: p.diagnosis || '',
      status: p.status || 'Outpatient',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    if (!name) return toast.error('Please enter a patient name');

    const patientId = editingPatient?.patientId || `PAT-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const age = formData.dateOfBirth
      ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear()
      : editingPatient?.age || 0;

    const payload = {
      patientId,
      name,
      age,
      gender: formData.gender,
      bloodType: formData.bloodType,
      phone: formData.phone || '',
      diagnosis: formData.diagnosis || '',
      lastVisit: new Date().toISOString().split('T')[0],
    };

    mutateRecord.mutate({
      id: editingPatient?.id,
      recordType: 'patient',
      payload,
      status: formData.status,
      searchText: `${name} ${patientId}`,
    }, {
      onSuccess: () => {
        toast.success(editingPatient ? 'Patient updated!' : 'Patient registered!');
        setShowModal(false);
        setFormData(BLANK_FORM);
        setEditingPatient(null);
      },
      onError: (err) => toast.error('Failed: ' + err.message),
    });
  };

  const confirmDelete = () => {
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'patient' }, {
      onSuccess: () => { toast.success('Patient deleted!'); setDeleteTargetId(null); },
      onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); },
    });
  };

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading patients...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Patient Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage patient records and clinical history</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="w-4 h-4" /> Register Patient
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{patients.length}</p><p className="text-xs text-muted-foreground">Total Patients</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><Activity className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{patients.filter(p => p.status === 'Admitted').length}</p><p className="text-xs text-muted-foreground">Currently Admitted</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600"><Stethoscope className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{patients.filter(p => p.status === 'Outpatient').length}</p><p className="text-xs text-muted-foreground">Outpatients</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Heart className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{patients.filter(p => p.status === 'Discharged').length}</p><p className="text-xs text-muted-foreground">Discharged</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search patient name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Demographics</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Diagnosis</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Last Visit</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-card-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.patientId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground font-medium">{p.age} yrs • {p.gender}</p>
                    <p className="text-xs text-muted-foreground">Blood: <span className="font-bold text-red-600">{p.bloodType}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" /><span>{p.phone || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{p.diagnosis || '—'}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground font-medium">{p.lastVisit}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-blue-100 text-blue-700'}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewPatient(p)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTargetId(p.id)} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No patients found.</p>
              <p className="text-sm mt-1">Click "Register Patient" to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">
              {editingPatient ? 'Edit Patient' : 'Register New Patient'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">First Name</label>
                <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="mt-1" placeholder="John" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Last Name</label>
                <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="mt-1" placeholder="Doe" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Date of Birth</label>
                <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Blood Type</label>
                <select value={formData.bloodType} onChange={e => setFormData({ ...formData, bloodType: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" placeholder="+233..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Diagnosis / Chief Complaint</label>
                <Input value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} className="mt-1" placeholder="e.g. Malaria, Hypertension..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Admission Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Outpatient</option>
                  <option>Admitted</option>
                  <option>Discharged</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingPatient(null); }}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient record? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />

      <Sheet open={!!viewPatient} onOpenChange={(open) => !open && setViewPatient(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Patient Details</SheetTitle>
            <SheetDescription>View complete patient information</SheetDescription>
          </SheetHeader>
          {viewPatient && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p className="text-base font-semibold">{viewPatient.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Patient ID</h3>
                <p className="text-base font-semibold">{viewPatient.patientId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Demographics</h3>
                <p className="text-base">{viewPatient.age} yrs • {viewPatient.gender}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Blood Type</h3>
                <p className="text-base font-bold text-red-600">{viewPatient.bloodType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                <p className="text-base">{viewPatient.phone || '—'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Diagnosis</h3>
                <p className="text-base">{viewPatient.diagnosis || '—'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="text-base">{viewPatient.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Visit</h3>
                <p className="text-base">{viewPatient.lastVisit}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
