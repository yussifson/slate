import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CheckCircle2, AlertTriangle, Settings, ArrowRightLeft, Plus } from 'lucide-react';
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
  const { t } = useTranslation();
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
  const [showNewWardModal, setShowNewWardModal] = useState(false);
  const [newWardData, setNewWardData] = useState({ name: '', numBeds: 4 });
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
      status: 'active',
      searchText: `${targetWard.name}`
    }, {
      onSuccess: async () => {
        if (formData.status === 'Occupied' && selectedBed.bed.status !== 'Occupied') {
          await notify({
            recipientEmail: user?.email, // In a real app, this would be the assigned doctor/nurse email
            title: `Bed Assigned: ${targetWard.name}`,
            message: `Bed ${selectedBed.bed.id} has been assigned to patient ${formData.patient}.`,
            type: "WARD_UPDATE",
            data: { actionUrl: "https://slate.com/hospital/wards" }
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

  const handleCreateWard = () => {
    if (!newWardData.name) {
      toast.error('Ward name is required');
      return;
    }
    
    // Create an array of bed objects
    const beds = Array.from({ length: newWardData.numBeds }).map((_, i) => ({
      id: `B${(i + 1).toString().padStart(2, '0')}`,
      status: 'Available',
      patient: null
    }));

    const payload = {
      name: newWardData.name,
      beds: beds
    };

    mutateRecord.mutate({
      recordType: 'ward',
      payload,
      status: 'active',
      searchText: `${newWardData.name}`
    }, {
      onSuccess: () => {
        toast.success('Ward created successfully!');
        setShowNewWardModal(false);
        setNewWardData({ name: '', numBeds: 4 });
      },
      onError: (err) => {
        toast.error('Failed to create ward: ' + err.message);
      }
    });
  };

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("ward_management", "Ward Management")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "manage_inpatient_bed_allocatio",
            "Manage inpatient bed allocation and availability"
          )}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setShowNewWardModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> {t("add_ward", "Add Ward")}
        </Button>
      </div>
      <div className="flex gap-4">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-sm text-muted-foreground font-medium">{t("available", "Available")}</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm text-muted-foreground font-medium">{t("occupied", "Occupied")}</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-sm text-muted-foreground font-medium">{t("maintenance", "Maintenance")}</span></div>
      </div>
      <div className="space-y-8">
        {wards.map((ward, wIdx) => {
          const totalBeds = (ward.beds || []).length;
          const occupiedBeds = (ward.beds || []).filter(b => b.status === 'Occupied').length;
          const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
          const isCritical = occupancyRate >= 90;

          return (
            <div key={wIdx} className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-colors ${isCritical ? 'border-red-300' : 'border-border'}`}>
              <div className={`p-4 border-b flex items-center justify-between transition-colors ${isCritical ? 'bg-red-50/80 border-red-200' : 'bg-muted/50 border-border'}`}>
                 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                   <BedDouble className={`w-5 h-5 ${isCritical ? 'text-red-500' : 'text-teal-500'}`}/> 
                   {ward.name}
                   {isCritical && (
                     <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                       <AlertTriangle className="w-3 h-3" /> {t("near_capacity", "Near Capacity")}
                     </span>
                   )}
                 </h2>
                 <span className="text-sm font-semibold text-muted-foreground">
                   {totalBeds - occupiedBeds}/ {totalBeds} {t("available", "Available")}
                 </span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {(ward.beds || []).map((bed, bIdx) => {
                 return (
                   <div key={bed.id} onClick={() => handleBedClick(wIdx, bIdx, bed, ward.id)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center hover:shadow-md transition-all cursor-pointer ${bedColors[bed.status]}`}>
                     {bedIcons[bed.status]}
                     <p className="font-bold mt-2 text-lg">{bed.id}</p>
                     <p className="text-xs font-semibold uppercase mt-1 opacity-80">{bed.status}</p>
                     {bed.patient && (
                       <Link to="/hospital/patients" onClick={e => e.stopPropagation()} className="text-xs mt-2 truncate w-full px-1 font-bold text-teal-600 hover:underline">
                         {bed.patient}
                       </Link>
                     )}
                   </div>
                 );
               })}
                </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{t("update_bed", "Update Bed")} {selectedBed?.bed.id}</h2>
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("bed_status", "Bed Status")}</label>
                 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>{t("available", "Available")}</option>
                   <option>{t("occupied", "Occupied")}</option>
                   <option>{t("maintenance", "Maintenance")}</option>
                 </select>
               </div>
               {formData.status === 'Occupied' && (
                 <div>
                   <label className="text-xs font-bold text-muted-foreground uppercase">{t("patient_name", "Patient Name")}</label>
                   <input type="text" value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Kwesi Asante" />
                 </div>
               )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSaveBedStatus}>{t("save_changes", "Save Changes")}</Button>
            </div>
          </div>
        </div>
      )}
      {showNewWardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{t("create_new_ward", "Create New Ward")}</h2>
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("ward_name", "Ward Name")}</label>
                 <input type="text" value={newWardData.name} onChange={e => setNewWardData({ ...newWardData, name: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Pediatric Ward" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">{t("initial_number_of_beds", "Initial Number of Beds")}</label>
                 <input type="number" min="1" max="50" value={newWardData.numBeds} onChange={e => setNewWardData({ ...newWardData, numBeds: parseInt(e.target.value) || 1 })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewWardModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleCreateWard}>{t("create_ward", "Create Ward")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
