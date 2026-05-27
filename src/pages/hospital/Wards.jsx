import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CheckCircle2, AlertTriangle, Settings, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/AuthContext';

const bedColors = {
  Occupied: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100/50',
  Available: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50',
  Maintenance: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
};

const bedIcons = {
  Occupied: <BedDouble className="w-6 h-6 text-red-500" />,
  Available: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  Maintenance: <Settings className="w-6 h-6 text-amber-500" />
};

export default function Wards() {
  // Supabase Real-time Sync Hooks
  const { user } = useAuth();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('ward');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  const { notify } = useNotifications();

  // Map database records — always ensure beds is an array to prevent .filter() crash
  const dbWards = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data, beds: r.data?.beds || [] }));

  // Default wards to display or initialize
  const defaultWards = [
    {
      name: 'General Ward A',
      beds: [
        { id: 'A01', status: 'Occupied', patient: 'Kwesi Asante' },
        { id: 'A02', status: 'Occupied', patient: 'Ama Owusu' },
        { id: 'A03', status: 'Available', patient: null },
        { id: 'A04', status: 'Maintenance', patient: null },
      ]
    },
    {
      name: 'Maternity Ward',
      beds: [
        { id: 'M01', status: 'Occupied', patient: 'Efua Darko' },
        { id: 'M02', status: 'Available', patient: null },
        { id: 'M03', status: 'Available', patient: null },
      ]
    },
    {
      name: 'ICU',
      beds: [
        { id: 'I01', status: 'Occupied', patient: 'Kofi Mensah' },
        { id: 'I02', status: 'Available', patient: null },
      ]
    }
  ];

  const wards = dbWards.length > 0 ? dbWards : defaultWards;

  // Selected Bed State
  const [selectedBed, setSelectedBed] = useState(null); // { wardIndex, bedIndex, bed, wardId }
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    status: 'Available',
    patient: ''
  });

  const handleBedClick = (wardIndex, bedIndex, bed, wardId = null) => {
    setSelectedBed({ wardIndex, bedIndex, bed, wardId });
    setFormData({
      status: bed.status,
      patient: bed.patient || ''
    });
    setShowModal(true);
  };

  const handleSaveBedStatus = () => {
    if (!selectedBed) return;

    const { wardIndex, bedIndex, wardId } = selectedBed;
    const targetWard = { ...wards[wardIndex] };
    
    // Update the specific bed details
    targetWard.beds = targetWard.beds.map((b, idx) => {
      if (idx === bedIndex) {
        return {
          ...b,
          status: formData.status,
          patient: formData.status === 'Occupied' ? formData.patient : null
        };
      }
      return b;
    });

    const payload = {
      name: targetWard.name,
      beds: targetWard.beds
    };

    mutateRecord.mutate({
      id: wardId,
      recordType: 'ward',
      payload,
      status: 'Active',
      searchText: `${targetWard.name}`
    }, {
      onSuccess: async () => {
        if (formData.status === 'Occupied' && selectedBed.bed.status !== 'Occupied') {
          await notify({
            recipientEmail: user?.email, // In a real app, this would be the assigned doctor/nurse email
            title: `Bed Assigned: ${targetWard.name}`,
            message: `Bed ${selectedBed.bed.id} has been assigned to patient ${formData.patient}.`,
            type: "WARD_UPDATE",
            data: { actionUrl: "https://optalflow.com/hospital/wards" }
          });
        }
        toast.success('Bed status updated successfully!');
        setShowModal(false);
        setSelectedBed(null);
      },
      onError: (err) => {
        toast.error('Failed to update bed status: ' + err.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Ward Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage inpatient bed allocation and availability</p>
        </div>
      </div>

      <div className="flex gap-4">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-sm text-muted-foreground font-medium">Available</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm text-muted-foreground font-medium">Occupied</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-sm text-muted-foreground font-medium">Maintenance</span></div>
      </div>

      <div className="space-y-8">
        {wards.map((ward, wIdx) => (
           <div key={wIdx} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><BedDouble className="w-5 h-5 text-blue-500"/> {ward.name}</h2>
                 <span className="text-sm font-semibold text-muted-foreground">
                   {(ward.beds || []).filter(b => b.status === 'Available').length} / {(ward.beds || []).length} Available
                 </span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {(ward.beds || []).map((bed, bIdx) => (
                    <div key={bed.id} onClick={() => handleBedClick(wIdx, bIdx, bed, ward.id)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center hover:shadow-md transition-all cursor-pointer ${bedColors[bed.status]}`}>
                       {bedIcons[bed.status]}
                       <p className="font-bold mt-2 text-lg">{bed.id}</p>
                       <p className="text-xs font-semibold uppercase mt-1 opacity-80">{bed.status}</p>
                       {bed.patient && (
                         <Link to="/hospital/patients" onClick={e => e.stopPropagation()} className="text-xs mt-2 truncate w-full px-1 font-bold text-blue-600 hover:underline">
                           {bed.patient}
                         </Link>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">Update Bed {selectedBed?.bed.id}</h2>
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Bed Status</label>
                 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>Available</option>
                   <option>Occupied</option>
                   <option>Maintenance</option>
                 </select>
               </div>
               {formData.status === 'Occupied' && (
                 <div>
                   <label className="text-xs font-bold text-muted-foreground uppercase">Patient Name</label>
                   <input type="text" value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Kwesi Asante" />
                 </div>
               )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveBedStatus}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
