import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BedDouble, CheckCircle2, AlertTriangle, Settings, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useNotifications } from '@/hooks/integrations/useNotifications';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

const bedColors = {
  Occupied: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100/50',
  Available: 'bg-slate-50 dark:bg-slate-800/50 border-primary/20 text-primary/90 hover:bg-slate-500',
  Maintenance: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
};

const bedIcons = {
  Occupied: <BedDouble className="w-6 h-6 text-red-500" />,
  Available: <CheckCircle2 className="w-6 h-6 text-primary" />,
  Maintenance: <Settings className="w-6 h-6 text-amber-500" />
};

export default function Wards() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifyTeam } = useNotifications();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  // 1. Fetch Wards
  const { data: wards = [], isLoading: isWardsLoading } = useQuery({
    queryKey: ['univ_wards', companyId],
    queryFn: async () => {
      if (!companyId) return [];
        const res = await powerSync.execute(
          'SELECT *, ward_name AS name FROM univ_wards WHERE company_id = ? ORDER BY ward_name ASC',
          [companyId]
        );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 2. Fetch Active Admissions (Occupied Beds)
  const { data: admissions = [], isLoading: isAdmissionsLoading } = useQuery({
    queryKey: ['univ_admissions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        "SELECT a.*, p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name FROM univ_admissions a LEFT JOIN univ_patients p ON a.patient_id = p.id WHERE a.company_id = ? AND a.status = 'Active'",
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 3. Fetch Patients for Dropdown
  const { data: patientsList = [] } = useQuery({
    queryKey: ['univ_patients_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute("SELECT id, COALESCE(first_name, 'Unknown') || ' ' || COALESCE(last_name, 'Patient') as name FROM univ_patients WHERE company_id = ?", [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const mutateWard = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_wards (id, created_at, company_id, ward_name, type, capacity, bed_number, status)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, 'N/A', 'Active')`,
        [companyId, payload.name, payload.type, payload.capacity]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_wards']);
      toast.success('Ward created successfully!');
      setShowNewWardModal(false);
      setNewWardData({ name: '', type: 'General', capacity: 10 });
    },
    onError: (err) => toast.error('Failed to create ward: ' + err.message)
  });

  const mutateAdmission = useMutation({
    mutationFn: async (payload) => {
      if (payload.action === 'discharge') {
        await powerSync.execute(
          `UPDATE univ_admissions SET status = 'Discharged', discharge_date = datetime('now') WHERE id = ?`,
          [payload.admission_id]
        );
        // Also update patient status
        await powerSync.execute(`UPDATE univ_patients SET status = 'Discharged' WHERE id = ?`, [payload.patient_id]);
      } else {
        await powerSync.execute(
          `INSERT INTO univ_admissions (id, created_at, company_id, patient_id, ward_id, bed_number, admission_date, reason_for_admission, status)
           VALUES (uuid(), datetime('now'), ?, ?, ?, ?, datetime('now'), ?, 'Active')`,
          [companyId, payload.patient_id, payload.ward_id, payload.bed_number, payload.reason_for_admission]
        );
        // Update patient status to Admitted
        await powerSync.execute(`UPDATE univ_patients SET status = 'Admitted' WHERE id = ?`, [payload.patient_id]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_admissions']);
      queryClient.invalidateQueries(['univ_patients']);
      toast.success('Bed status updated successfully!');
      setShowModal(false);
      setSelectedBed(null);
    },
    onError: (err) => toast.error('Failed to update: ' + err.message)
  });

  const [selectedBed, setSelectedBed] = useState(null); // { ward, bedNumber, currentAdmission }
  const [showModal, setShowModal] = useState(false);
  const [showNewWardModal, setShowNewWardModal] = useState(false);
  const [newWardData, setNewWardData] = useState({ name: '', type: 'General', capacity: 10 });
  const [formData, setFormData] = useState({ patient_id: '', reason: '' });

  const handleBedClick = (ward, bedNumber, currentAdmission) => {
    setSelectedBed({ ward, bedNumber, currentAdmission });
    setFormData({ patient_id: '', reason: '' });
    setShowModal(true);
  };

  const handleSaveBedStatus = () => {
    if (!selectedBed) return;
    
    if (selectedBed.currentAdmission) {
      // Discharge
      mutateAdmission.mutate({
        action: 'discharge',
        admission_id: selectedBed.currentAdmission.id,
        patient_id: selectedBed.currentAdmission.patient_id
      });
    } else {
      // Admit
      if (!formData.patient_id) return toast.error("Please select a patient");
      mutateAdmission.mutate({
        action: 'admit',
        patient_id: formData.patient_id,
        ward_id: selectedBed.ward.id,
        bed_number: selectedBed.bedNumber,
        reason_for_admission: formData.reason
      });
    }
  };

  const handleCreateWard = () => {
    if (!newWardData.name || !newWardData.capacity) return toast.error('Ward name and capacity are required');
    mutateWard.mutate(newWardData);
  };

  if (isWardsLoading) return <div className="flex items-center justify-center h-64 text-[#71717a]">Loading wards...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("ward_management", "Ward Management")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_inpatient_bed_allocatio", "Manage inpatient bed allocation and admissions")}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowNewWardModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> {t("add_ward", "Add Ward")}
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-sm text-[#71717a] font-medium">{t("available", "Available")}</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/10 border border-red-500"></div><span className="text-sm text-[#71717a] font-medium">{t("occupied", "Occupied")}</span></div>
      </div>

      <div className="space-y-8">
        {wards.length === 0 && (
           <div className="text-center py-16 text-[#71717a]">
            <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No wards configured.</p>
            <p className="text-sm mt-1">Click "Add Ward" to create one.</p>
          </div>
        )}

        {wards.map((ward) => {
          const wardAdmissions = admissions.filter(a => a.ward_id === ward.id);
          const occupiedCount = wardAdmissions.length;
          const capacity = ward.capacity || 0;
          const occupancyRate = capacity > 0 ? (occupiedCount / capacity) * 100 : 0;
          const isCritical = occupancyRate >= 90;

          // Generate bed numbers 1 to capacity
          const beds = Array.from({ length: capacity }).map((_, i) => {
            const bedNumber = `B${(i + 1).toString().padStart(2, '0')}`;
            const currentAdmission = wardAdmissions.find(a => a.bed_number === bedNumber);
            return {
              bedNumber,
              currentAdmission,
              status: currentAdmission ? 'Occupied' : 'Available'
            };
          });

          return (
            <div key={ward.id} className={`bg-card rounded-xl border-[0.5px] overflow-hidden transition-colors ${isCritical ? 'border-red-300' : 'border-primary/40'}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isCritical ? 'bg-red-50/80 border-red-200' : 'bg-muted/50 border-primary/40'}`}>
                <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <BedDouble className={`w-5 h-5 ${isCritical ? 'text-red-500' : 'text-primary'}`}/> 
                  {ward.name} <span className="text-sm font-normal text-[#71717a]">({ward.type})</span>
                </h2>
                <div className="flex items-center gap-4">
                  {isCritical && <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold bg-white px-2 py-1 rounded-md border border-red-200 shadow-sm"><AlertTriangle className="w-4 h-4"/> Critical Occupancy</div>}
                  <div className="text-sm font-medium"><span className={isCritical ? 'text-red-600' : 'text-primary'}>{occupiedCount}</span> / {capacity} {t("beds_occupied", "Beds Occupied")}</div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {beds.map((b) => (
                    <div
                      key={b.bedNumber}
                      onClick={() => handleBedClick(ward, b.bedNumber, b.currentAdmission)}
                      className={`relative flex flex-col p-4 rounded-xl border-[0.5px] cursor-pointer transition-all ${bedColors[b.status]}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold">{b.bedNumber}</span>
                        {bedIcons[b.status]}
                      </div>
                      <div className="mt-auto">
                        <p className="text-xs font-semibold uppercase tracking-[0.04em] mb-1 opacity-70">{b.status}</p>
                        <p className="text-sm font-medium truncate" title={b.currentAdmission?.patient_name || ''}>
                          {b.currentAdmission?.patient_name || 'Empty'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Bed/Admission Modal */}
      {showModal && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">
              {selectedBed.ward.name} - Bed {selectedBed.bedNumber}
            </h2>
            
            {selectedBed.currentAdmission ? (
              <div className="space-y-4 bg-red-50 p-4 rounded-xl border border-red-200">
                <div>
                  <label className="text-xs font-semibold text-red-700 uppercase">Current Patient</label>
                  <p className="text-red-900 font-medium">{selectedBed.currentAdmission.patient_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-red-700 uppercase">Reason for Admission</label>
                  <p className="text-red-900 text-sm">{selectedBed.currentAdmission.reason_for_admission}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-red-700 uppercase">Admission Date</label>
                  <p className="text-red-900 text-sm">{new Date(selectedBed.currentAdmission.admission_date).toLocaleString()}</p>
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleSaveBedStatus} disabled={mutateAdmission.isPending}>
                    {mutateAdmission.isPending ? 'Discharging...' : 'Discharge Patient & Free Bed'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Action</label>
                  <select disabled className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option>Admit Patient</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Select Patient</label>
                  <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option value="">-- Choose Patient --</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Reason for Admission</label>
                  <Input value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="mt-1" placeholder="e.g. Observation, Surgery..." />
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={handleSaveBedStatus} disabled={mutateAdmission.isPending}>
                    {mutateAdmission.isPending ? 'Processing...' : 'Admit Patient'}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" className="w-full" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Ward Modal */}
      {showNewWardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">{t("add_new_ward", "Add New Ward")}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">{t("ward_name", "Ward Name")}</label>
                <Input value={newWardData.name} onChange={e => setNewWardData({ ...newWardData, name: e.target.value})} className="mt-1" placeholder="e.g. Maternity Ward" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Ward Type</label>
                <select value={newWardData.type} onChange={e => setNewWardData({ ...newWardData, type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>General</option>
                  <option>ICU</option>
                  <option>Maternity</option>
                  <option>Pediatric</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">{t("number_of_beds", "Number of Beds Capacity")}</label>
                <Input type="number" min="1" max="100" value={newWardData.capacity} onChange={e => setNewWardData({ ...newWardData, capacity: parseInt(e.target.value) || 0})} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewWardModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateWard} disabled={mutateWard.isPending}>
                {mutateWard.isPending ? 'Saving...' : 'Create Ward'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
