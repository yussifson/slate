import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Search, Plus, FileText, Printer, ShieldCheck, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

export default function Prescriptions() {
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('prescription');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  // Map database records
  const prescriptions = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewRx, setViewRx] = useState(null);
  const [editingRx, setEditingRx] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patient: '',
    drug: '',
    dosage: '1 tablet',
    frequency: '3 times daily',
    duration: '7 days',
    doctor: 'Dr. John Mensah'
  });

  // Generic Save Handler for real DB persistence
  const handleSaveToDb = () => {
    if (!formData.patient.trim()) return toast.error("Please enter a patient name");
    if (!formData.drug.trim()) return toast.error("Please enter a drug name");

    const rxId = editingRx ? editingRx.rxId : `RX-${Math.floor(1000 + Math.random() * 9000)}`;
    const date = editingRx ? editingRx.date : new Date().toISOString().split('T')[0];
    const status = editingRx ? editingRx.status : 'Active';

    const payload = {
      rxId,
      patient: formData.patient,
      drug: formData.drug,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      doctor: formData.doctor,
      date,
      status
    };

    mutateRecord.mutate({
      id: editingRx?.id,
      recordType: 'prescription',
      payload,
      status: 'Active',
      searchText: `${formData.patient} ${formData.drug} ${rxId}`
    }, {
      onSuccess: () => {
        toast.success(editingRx ? 'Prescription updated!' : 'Prescription issued successfully!');
        setShowModal(false);
        setEditingRx(null);
        setFormData({
          patient: '',
          drug: '',
          dosage: '1 tablet',
          frequency: '3 times daily',
          duration: '7 days',
          doctor: 'Dr. John Mensah'
        });
      },
      onError: (err) => {
        toast.error('Failed to issue prescription: ' + err.message);
      }
    });
  };

  // Dispense Medication
  const handleDispense = (rx) => {
    const updatedPayload = { ...rx, status: 'Completed' };
    delete updatedPayload.id;

    mutateRecord.mutate({
      id: rx.id,
      recordType: 'prescription',
      payload: updatedPayload,
      status: 'Completed',
      searchText: `${rx.patient} ${rx.drug}`
    }, {
      onSuccess: () => {
        toast.success('Medication marked as Dispensed!');
      }
    });
  };

  // Generic Delete Handler for real DB persistence
  const handleDeleteFromDb = (id) => {
    if (window.confirm('Are you sure you want to delete this prescription record?')) {
      deleteRecord.mutate({ id, recordType: 'prescription' }, {
        onSuccess: () => {
          toast.success('Prescription deleted successfully!');
        },
        onError: (err) => {
          toast.error('Failed to delete prescription: ' + err.message);
        }
      });
    }
  };

  const filtered = prescriptions.filter(rx =>
    rx.patient?.toLowerCase().includes(search.toLowerCase()) ||
    rx.drug?.toLowerCase().includes(search.toLowerCase()) ||
    rx.rxId?.includes(search)
  );

  const openEdit = (rx) => {
    setEditingRx(rx);
    setFormData({
      patient: rx.patient || '',
      drug: rx.drug || '',
      dosage: rx.dosage || '1 tablet',
      frequency: rx.frequency || '3 times daily',
      duration: rx.duration || '7 days',
      doctor: rx.doctor || 'Dr. John Mensah'
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage patient medications and pharmacy orders</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Issue Prescription
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search patient or drug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">RX ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Medication Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Prescriber</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(rx => (
                <tr key={rx.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{rx.rxId}</td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">
                    <Link to="/hospital/patients" className="text-blue-600 hover:underline">{rx.patient}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-card-foreground flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-blue-500"/> 
                      <Link to="/hospital/pharmacy" className="text-blue-600 hover:underline">{rx.drug}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-foreground font-medium">{rx.doctor}</p>
                     <p className="text-xs text-muted-foreground">{rx.date}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rx.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    {rx.status === 'Active' && (
                      <Button onClick={() => handleDispense(rx)} size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1"/> Dispense
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewRx(rx)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(rx)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFromDb(rx.id)} className="text-red-600">
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
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No prescriptions found. Click "Issue Prescription" to add one.</p>
            </div>
          )}
        </div>
      </div>

       {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/> New Prescription</h2>
            <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Patient Name</label>
                 <Input value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })} className="mt-1" placeholder="Search patient..." />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Drug Name & Strength</label>
                 <Input value={formData.drug} onChange={e => setFormData({ ...formData, drug: e.target.value })} className="mt-1" placeholder="e.g. Paracetamol 500mg" />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Dosage</label>
                    <Input value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value })} className="mt-1" placeholder="e.g. 2 tablets" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Frequency</label>
                    <Input value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })} className="mt-1" placeholder="e.g. 3 times daily" />
                  </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Duration</label>
                 <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="mt-1" placeholder="e.g. 5 days" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Prescribing Doctor</label>
                 <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>Dr. John Mensah</option>
                   <option>Dr. Jane Doe</option>
                   <option>Dr. Sarah Connor</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingRx(null); }}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveToDb}>Sign & Issue</Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={!!viewRx} onOpenChange={(open) => !open && setViewRx(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Prescription Details</SheetTitle>
            <SheetDescription>View complete prescription information</SheetDescription>
          </SheetHeader>
          {viewRx && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">RX ID</h3>
                <p className="text-base font-semibold">{viewRx.rxId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Patient</h3>
                <Link to="/hospital/patients" className="text-base font-semibold text-blue-600 hover:underline">{viewRx.patient}</Link>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Medication</h3>
                <Link to="/hospital/pharmacy" className="text-base font-semibold text-blue-600 hover:underline">{viewRx.drug}</Link>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dosage & Frequency</h3>
                <p className="text-base">{viewRx.dosage} • {viewRx.frequency}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                <p className="text-base">{viewRx.duration}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Prescribing Doctor</h3>
                <p className="text-base">{viewRx.doctor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="text-base">{viewRx.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date Issued</h3>
                <p className="text-base">{viewRx.date}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

