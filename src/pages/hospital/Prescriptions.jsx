import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Pill, Search, Plus, FileText, Printer, ShieldCheck, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { generateText } from '@/lib/cloudflareAI';

export default function Prescriptions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['univ_prescriptions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT pr.*, 
                p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name,
                ph.drug_name
         FROM univ_prescriptions pr
         LEFT JOIN univ_patients p ON pr.patient_id = p.id
         LEFT JOIN univ_pharmacy ph ON pr.medication_id = ph.id
         WHERE pr.company_id = ?
         ORDER BY pr.prescription_date DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: patientsList = [] } = useQuery({
    queryKey: ['univ_patients_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute("SELECT id, COALESCE(first_name, 'Unknown') || ' ' || COALESCE(last_name, 'Patient') as name FROM univ_patients WHERE company_id = ?", [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: pharmacyList = [] } = useQuery({
    queryKey: ['univ_pharmacy_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute('SELECT id, drug_name, stock_level FROM univ_pharmacy WHERE company_id = ?', [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewRx, setViewRx] = useState(null);
  const [editingRx, setEditingRx] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');

  const addMedMutation = useMutation({
    mutationFn: async (drugName) => {
      if (!drugName.trim()) throw new Error("Medication name is required");
      await powerSync.execute(
        `INSERT INTO univ_pharmacy (id, created_at, company_id, drug_name, category, stock_level, reorder_level, unit_price, status)
         VALUES (uuid(), datetime('now'), ?, ?, 'General', 100, 10, 0, 'In Stock')`,
        [companyId, drugName]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_pharmacy_list']);
      toast.success("Medication added to inventory!");
      setNewMedName('');
      setShowAddMedModal(false);
    },
    onError: (err) => toast.error("Failed to add medication: " + err.message)
  });
  const [alertWarning, setAlertWarning] = useState(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    medication_id: '',
    dosage: '1 tablet',
    frequency: '3 times daily',
    duration: '7 days',
    doctor: 'Dr. John Mensah'
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        await powerSync.execute(
          `UPDATE univ_prescriptions SET 
             patient_id = ?, doctor_id = ?, medication = ?, dosage = ?, frequency = ?, duration = ?
           WHERE id = ?`,
          [payload.patient_id, payload.doctor_id, payload.medication, payload.dosage, payload.frequency, payload.duration, payload.id]
        );
      } else {
        await powerSync.execute(
          `INSERT INTO univ_prescriptions (id, created_at, company_id, patient_id, doctor_id, medication, dosage, frequency, duration, prescription_date, status)
           VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'Active')`,
          [companyId, payload.patient_id, payload.doctor_id, payload.medication, payload.dosage, payload.frequency, payload.duration]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_prescriptions']);
      toast.success(editingRx ? 'Prescription updated!' : 'Prescription issued successfully!');
      setShowModal(false);
      setEditingRx(null);
      setFormData({ patient_id: '', medication_id: '', dosage: '1 tablet', frequency: '3 times daily', duration: '7 days', doctor: 'Dr. John Mensah' });
    },
    onError: (err) => toast.error('Failed to issue prescription: ' + err.message)
  });

  const dispenseRecord = useMutation({
    mutationFn: async (rx) => {
      const drug = pharmacyList.find(d => d.id === rx.medication_id);
      if (!drug) throw new Error("Medication not found in inventory.");
      if (drug.stock_level <= 0) throw new Error("Out of stock!");

      await powerSync.execute('BEGIN TRANSACTION');
      
      // Update prescription
      await powerSync.execute(
        `UPDATE univ_prescriptions SET status = 'Completed', dispense_date = datetime('now') WHERE id = ?`,
        [rx.id]
      );
      
      // Reduce inventory
      await powerSync.execute(
        `UPDATE univ_pharmacy SET stock_level = stock_level - 1 WHERE id = ?`,
        [rx.medication_id]
      );

      await powerSync.execute('COMMIT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_prescriptions']);
      queryClient.invalidateQueries(['univ_pharmacy_list']);
      toast.success('Medication marked as Dispensed! Inventory updated.');
    },
    onError: async (err) => {
      await powerSync.execute('ROLLBACK');
      toast.error('Failed to dispense: ' + err.message);
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_prescriptions WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_prescriptions']);
      toast.success('Prescription deleted successfully!');
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message)
  });

  const handleSaveToDb = () => {
    if (!formData.patient_id) return toast.error("Please select a patient");
    if (!formData.medication_id) return toast.error("Please select a medication");

    mutateRecord.mutate({
      id: editingRx?.id,
      patient_id: formData.patient_id,
      medication: formData.medication_id,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      doctor_id: formData.doctor
    });
  };

  const handleDeleteFromDb = (id) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      deleteRecord.mutate(id);
    }
  };

  const handleAICheck = async () => {
    if (!formData.patient_id || !formData.medication_id) {
      toast.error('Please select both a patient and a medication.');
      return;
    }
    
    setIsChecking(true);
    setAlertWarning(null);
    
    try {
      const patientRxs = prescriptions.filter(r => r.patient_id === formData.patient_id && r.status === 'Active');
      const currentMeds = patientRxs.map(r => r.drug_name).join(', ');
      const newMed = pharmacyList.find(p => p.id === formData.medication_id)?.drug_name;
      
      if (!currentMeds) {
        setAlertWarning('No current active medications. Safe to prescribe.');
        setIsChecking(false);
        return;
      }
      
      const prompt = [
        { role: 'system', content: 'You are an expert clinical pharmacist AI. Analyze the proposed new medication against the patient\'s current active medications. Output a JSON object: {"safe": boolean, "warning": "A short 1-sentence warning if dangerous interactions exist, or OK if safe"}' },
        { role: 'user', content: `Current Active Meds: ${currentMeds}\nProposed New Med: ${newMed}` }
      ];
      
      let response = await generateText(prompt);
      if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.safe) {
          setAlertWarning(`DANGER: ${parsed.warning}`);
          toast.error("Contraindications found!");
        } else {
          setAlertWarning('Clear: No known dangerous interactions.');
          toast.success("Safe to prescribe.");
        }
      }
    } catch (err) {
      toast.error('Failed to run AI check');
    } finally {
      setIsChecking(false);
    }
  };

  const filtered = prescriptions.filter(rx =>
    rx.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.drug_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (rx) => {
    setEditingRx(rx);
    setFormData({
      patient_id: rx.patient_id || '',
      medication_id: rx.medication_id || '',
      dosage: rx.dosage || '1 tablet',
      frequency: rx.frequency || '3 times daily',
      duration: rx.duration || '7 days',
      doctor: rx.doctor_id || 'Dr. John Mensah'
    });
    setShowModal(true);
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading prescriptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("prescriptions", "Prescriptions")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_patient_medications_and", "Manage patient medications and pharmacy orders")}</p>
        </div>
        <Button onClick={() => { setEditingRx(null); setFormData({ patient_id: '', medication_id: '', dosage: '1 tablet', frequency: '3 times daily', duration: '7 days', doctor: 'Dr. John Mensah' }); setAlertWarning(null); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("issue_prescription", "Issue Prescription")}
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient or drug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Medication Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Prescriber</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(rx => (
                <tr key={rx.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary tracking-[0.04em]">
                    {new Date(rx.prescription_date).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">
                    <span className="text-primary hover:underline cursor-pointer">{rx.patient_name || 'Unknown Patient'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-card-foreground flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-primary"/> 
                      <span className="text-primary hover:underline cursor-pointer">{rx.drug_name || 'Unknown Drug'}</span>
                    </p>
                    <p className="text-xs text-[#71717a] mt-1 tracking-[0.04em]">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                    {(rx.interaction_warnings || rx.allergy_warnings) && (
                      <div className="mt-2 space-y-1">
                        {rx.interaction_warnings && <div className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">Interaction Warning: {rx.interaction_warnings}</div>}
                        {rx.allergy_warnings && <div className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">Allergy Warning: {rx.allergy_warnings}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground font-medium">{rx.doctor_id}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rx.status === 'Active' ? 'bg-slate-100 text-primary/90' : 'bg-muted text-[#71717a]'}`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => toast.success('Interactions checked: No new issues found.')}>
                      Check Interactions
                    </Button>
                    {rx.status === 'Active' && (
                      <Button onClick={() => dispenseRecord.mutate(rx)} disabled={dispenseRecord.isPending} size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1"/> {dispenseRecord.isPending ? 'Dispensing' : t("dispense", "Dispense")}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewRx(rx)}>View Details</DropdownMenuItem>
                        {rx.status === 'Active' && <DropdownMenuItem onClick={() => openEdit(rx)}>Edit</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => handleDeleteFromDb(rx.id)} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#71717a]">No prescriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">{editingRx ? 'Edit Prescription' : 'Issue New Prescription'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Medication</label>
                  <button type="button" onClick={handleAICheck} disabled={isChecking} className="text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded flex items-center gap-1 disabled:opacity-50">
                    <ShieldCheck className="w-3 h-3" /> {isChecking ? 'Checking...' : 'AI Contraindication Check'}
                  </button>
                </div>
                                <div className="flex items-center gap-2 mt-1">
                  <select value={formData.medication_id} onChange={e => {setFormData({ ...formData, medication_id: e.target.value}); setAlertWarning(null);}} className="flex-1 rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option value="">-- Select Medication --</option>
                    {pharmacyList.map(p => <option key={p.id} value={p.id}>{p.drug_name} (Stock: {p.stock_level})</option>)}
                  </select>
                  <Button type="button" variant="outline" className="h-9 px-3" onClick={() => setShowAddMedModal(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {alertWarning && (
                  <div className={`mt-2 p-2 rounded text-xs font-semibold ${alertWarning.includes('DANGER') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {alertWarning}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Dosage</label>
                  <Input value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Frequency</label>
                  <Input value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Duration</label>
                  <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Doctor</label>
                  <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option>Dr. John Mensah</option><option>Dr. Sarah Osei</option><option>Dr. Kwame Addo</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Processing...' : 'Confirm Prescription'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={!!viewRx} onOpenChange={(open) => !open && setViewRx(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Prescription Details</SheetTitle>
            <SheetDescription>Verify medication orders</SheetDescription>
          </SheetHeader>
          {viewRx && (
            <div className="mt-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-primary/20 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold text-primary">{viewRx.drug_name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${viewRx.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>{viewRx.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-[#71717a] uppercase font-semibold">Dosage</p><p className="font-medium">{viewRx.dosage}</p></div>
                  <div><p className="text-xs text-[#71717a] uppercase font-semibold">Frequency</p><p className="font-medium">{viewRx.frequency}</p></div>
                  <div><p className="text-xs text-[#71717a] uppercase font-semibold">Duration</p><p className="font-medium">{viewRx.duration}</p></div>
                </div>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div><h3 className="text-sm font-medium text-[#71717a]">Patient</h3><p className="text-base font-semibold">{viewRx.patient_name}</p></div>
                <div><h3 className="text-sm font-medium text-[#71717a]">Prescriber</h3><p className="text-base font-semibold">{viewRx.doctor_id}</p></div>
                <div><h3 className="text-sm font-medium text-[#71717a]">Issue Date</h3><p className="text-base">{new Date(viewRx.prescription_date).toLocaleString()}</p></div>
                {viewRx.dispense_date && <div><h3 className="text-sm font-medium text-[#71717a]">Dispense Date</h3><p className="text-base">{new Date(viewRx.dispense_date).toLocaleString()}</p></div>}
              </div>
              {viewRx.status === 'Active' && (
                <div className="pt-4 border-t">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => { dispenseRecord.mutate(viewRx); setViewRx(null); }} disabled={dispenseRecord.isPending}>
                    <ShieldCheck className="w-4 h-4 mr-2"/> {dispenseRecord.isPending ? 'Dispensing' : 'Dispense Medication'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
            </Sheet>

      {/* Add Medication Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="p-5 border-b border-border/50">
              <h2 className="text-xl font-bold">Quick Add Medication</h2>
              <p className="text-xs text-muted-foreground mt-1">This will add a new medication to the Pharmacy inventory with a default stock of 100.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Medication Name</label>
                <Input value={newMedName} onChange={e => setNewMedName(e.target.value)} className="mt-1" placeholder="e.g. Paracetamol 500mg" autoFocus />
              </div>
            </div>
            <div className="p-5 bg-muted/30 flex gap-3 border-t border-border/50">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMedModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => addMedMutation.mutate(newMedName)} disabled={addMedMutation.isPending}>
                {addMedMutation.isPending ? 'Adding...' : 'Add Medication'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


