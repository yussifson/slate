import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, UserPlus, Phone, Activity, Heart, Stethoscope, Trash2, Pencil, MoreVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles } from 'lucide-react';

const statusColors = {
  Admitted: 'bg-red-100 text-red-700',
  Outpatient: 'bg-slate-100 text-primary/90',
  Discharged: 'bg-slate-100 text-primary/90'
};

const BLANK_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'Male',
  bloodType: 'O+',
  phone: '',
  email: '',
  address: '',
  status: 'Outpatient'
};

export default function Patients() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['univ_patients', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        'SELECT * FROM univ_patients WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: medicalHistory = [] } = useQuery({
    queryKey: ['univ_medical_history', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        'SELECT * FROM univ_medical_history WHERE company_id = ? ORDER BY record_date DESC',
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);

  const [showEhrModal, setShowEhrModal] = useState(false);
  const [ehrTargetId, setEhrTargetId] = useState(null);
  const [ehrForm, setEhrForm] = useState({ type: 'General', vitals_bp: '', vitals_hr: '', vitals_temp: '', vitals_weight: '', soap_subjective: '', soap_objective: '', soap_assessment: '', soap_plan: '', notes: '' });

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        await powerSync.execute(
          `UPDATE univ_patients SET 
             first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, blood_group = ?, 
             phone = ?, email = ?, address = ?, status = ?
           WHERE id = ? AND company_id = ?`,
          [payload.first_name, payload.last_name, payload.date_of_birth, payload.gender, payload.blood_group, payload.phone, payload.email, payload.address, payload.status, payload.id, companyId]
        );
      } else {
        await powerSync.execute(
          `INSERT INTO univ_patients (id, created_at, company_id, patient_number, first_name, last_name, date_of_birth, gender, blood_group, phone, email, address, status)
           VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [companyId, payload.patient_number, payload.first_name, payload.last_name, payload.date_of_birth, payload.gender, payload.blood_group, payload.phone, payload.email, payload.address, payload.status]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_patients']);
      toast.success(editingPatient ? 'Patient updated!' : 'Patient registered!');
      setShowModal(false);
    },
    onError: (err) => toast.error('Failed: ' + err.message)
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_patients WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_patients']);
      toast.success('Patient deleted!');
      setDeleteTargetId(null);
    },
    onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null); }
  });

  const mutateEhr = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_medical_history (id, created_at, company_id, patient_id, record_date, type, vitals_bp, vitals_hr, vitals_temp, vitals_weight, soap_subjective, soap_objective, soap_assessment, soap_plan, notes)
         VALUES (uuid(), datetime('now'), ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyId, payload.patient_id, payload.type, payload.vitals_bp, payload.vitals_hr, payload.vitals_temp, payload.vitals_weight, payload.soap_subjective, payload.soap_objective, payload.soap_assessment, payload.soap_plan, payload.notes]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medical_history']);
      toast.success('EHR Entry added!');
      setShowEhrModal(false);
      setEhrForm({ type: 'General', vitals_bp: '', vitals_hr: '', vitals_temp: '', vitals_weight: '', soap_subjective: '', soap_objective: '', soap_assessment: '', soap_plan: '', notes: '' });
    },
    onError: (err) => toast.error('Failed: ' + err.message)
  });

  const openAdd = () => {
    setEditingPatient(null);
    setFormData(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingPatient(p);
    setFormData({
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      dateOfBirth: p.date_of_birth || '',
      gender: p.gender || 'Male',
      bloodType: p.blood_group || 'O+',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      status: p.status || 'Outpatient'
    });
    setShowModal(true);
  };

  const openEhr = (p) => {
    setEhrTargetId(p.id);
    setShowEhrModal(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) return toast.error('Please enter patient name');
    const patientNumber = editingPatient?.patient_number || `PAT-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    mutateRecord.mutate({
      id: editingPatient?.id,
      patient_number: patientNumber,
      first_name: formData.firstName,
      last_name: formData.lastName,
      date_of_birth: formData.dateOfBirth,
      gender: formData.gender,
      blood_group: formData.bloodType,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      status: formData.status
    });
  };

  const handleSaveEhr = () => {
    mutateEhr.mutate({ ...ehrForm, patient_id: ehrTargetId });
  };

  const confirmDelete = () => {
    deleteRecord.mutate(deleteTargetId);
  };

  const handleAiSummary = async (patient) => {
    setIsGeneratingAi(true);
    setAiSummary('');
    try {
      const pHistory = medicalHistory.filter(m => m.patient_id === patient.id);
      const prompt = `You are an expert AI clinical assistant. Analyze the following patient history and provide a concise, professional clinical summary. Identify any risks, trends, or recommended follow-ups.
Patient: ${patient.first_name} ${patient.last_name}, DOB: ${patient.date_of_birth}, Gender: ${patient.gender}.
History records: ${JSON.stringify(pHistory)}
Return ONLY the summary in markdown format.`;
      const response = await generateText(prompt);
      setAiSummary(response);
    } catch (error) {
      toast.error('Failed to generate AI summary.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filtered = patients.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || p.patient_number?.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_patients", "Loading patients...")}</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("patient_registry", "Patient Registry")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_patient_records_and_cli", "Manage patient records and clinical EHR history")}</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <UserPlus className="w-4 h-4" /> {t("register_patient", "Register Patient")}
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{patients.length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("total_patients", "Total Patients")}</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><Activity className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{patients.filter(p => p.status === 'Admitted').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("currently_admitted", "Currently Admitted")}</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Stethoscope className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{patients.filter(p => p.status === 'Outpatient').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("outpatients", "Outpatients")}</p></div>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Heart className="w-5 h-5" /></div>
          <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{patients.filter(p => p.status === 'Discharged').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("discharged", "Discharged")}</p></div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
            <Input placeholder="Search patient name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Demographics</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Contact</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">EHR Records</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const pHistory = medicalHistory.filter(m => m.patient_id === p.id);
                return (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-card-foreground">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{p.patient_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-foreground font-medium">{p.date_of_birth} • {p.gender}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Blood: <span className="font-semibold text-red-600">{p.blood_group}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[#71717a] dark:text-gray-400">
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{p.phone || '—'}</span></div>
                        <span className="text-xs">{p.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-primary font-medium">{pHistory.length} entries</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-slate-100 text-primary/90'}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewPatient(p)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEhr(p)}><FileText className="w-4 h-4 mr-2"/> Add EHR Note</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(p.id)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#71717a] dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No patients found.</p>
              <p className="text-sm mt-1">Click "Register Patient" to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">{editingPatient ? 'Edit Patient' : 'Register New Patient'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">First Name</label>
                <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Last Name</label>
                <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Date of Birth</label>
                <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Blood Type</label>
                <select value={formData.bloodType} onChange={e => setFormData({ ...formData, bloodType: e.target.value })} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Phone Number</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Admission Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
                  <option>Outpatient</option><option>Admitted</option><option>Discharged</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EHR Modal */}
      {showEhrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-card-foreground">Add Medical Record (SOAP Note)</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">BP (mmHg)</label>
                  <Input value={ehrForm.vitals_bp} onChange={e => setEhrForm({...ehrForm, vitals_bp: e.target.value})} placeholder="120/80" className="mt-1"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">HR (bpm)</label>
                  <Input value={ehrForm.vitals_hr} onChange={e => setEhrForm({...ehrForm, vitals_hr: e.target.value})} placeholder="72" className="mt-1"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Temp (°C)</label>
                  <Input value={ehrForm.vitals_temp} onChange={e => setEhrForm({...ehrForm, vitals_temp: e.target.value})} placeholder="36.5" className="mt-1"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Weight (kg)</label>
                  <Input value={ehrForm.vitals_weight} onChange={e => setEhrForm({...ehrForm, vitals_weight: e.target.value})} placeholder="70" className="mt-1"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Subjective (Symptoms)</label>
                <textarea value={ehrForm.soap_subjective} onChange={e => setEhrForm({...ehrForm, soap_subjective: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm" rows="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Objective (Observations)</label>
                <textarea value={ehrForm.soap_objective} onChange={e => setEhrForm({...ehrForm, soap_objective: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm" rows="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Assessment (Diagnosis)</label>
                <textarea value={ehrForm.soap_assessment} onChange={e => setEhrForm({...ehrForm, soap_assessment: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm" rows="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Plan (Treatment)</label>
                <textarea value={ehrForm.soap_plan} onChange={e => setEhrForm({...ehrForm, soap_plan: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm" rows="2" />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowEhrModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={handleSaveEhr} disabled={mutateEhr.isPending}>Save EHR Note</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} onConfirm={confirmDelete} title="Delete Patient Record" message="Are you sure you want to permanently delete this patient record?" confirmText="Delete" confirmVariant="destructive" />
      
      {/* View Modal */}
      <Sheet open={!!viewPatient} onOpenChange={(open) => !open && setViewPatient(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Patient File: {viewPatient?.first_name} {viewPatient?.last_name}</SheetTitle>
            <div className="flex items-center justify-between">
              <SheetDescription>ID: {viewPatient?.patient_number}</SheetDescription>
              <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => handleAiSummary(viewPatient)} disabled={isGeneratingAi}>
                {isGeneratingAi ? <Sparkles className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {isGeneratingAi ? 'Analyzing...' : 'AI Health Summary'}
              </Button>
            </div>
          </SheetHeader>
          {viewPatient && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><h3 className="text-sm text-gray-500">DOB / Gender</h3><p className="font-medium">{viewPatient.date_of_birth} ({viewPatient.gender})</p></div>
                <div><h3 className="text-sm text-gray-500">Blood Type</h3><p className="font-medium text-red-600">{viewPatient.blood_group}</p></div>
                <div><h3 className="text-sm text-gray-500">Contact</h3><p className="font-medium">{viewPatient.phone}</p><p className="text-sm">{viewPatient.email}</p></div>
                <div><h3 className="text-sm text-gray-500">Status</h3><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[viewPatient.status] || 'bg-slate-100'}`}>{viewPatient.status}</span></div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Medical History (EHR)</h3>
                
                {aiSummary && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-primary">AI Clinical Summary</h4>
                    </div>
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      {aiSummary}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {medicalHistory.filter(m => m.patient_id === viewPatient.id).length === 0 && <p className="text-sm text-gray-500">No medical history records found.</p>}
                  {medicalHistory.filter(m => m.patient_id === viewPatient.id).map(m => (
                    <div key={m.id} className="bg-muted/30 p-4 rounded-xl border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{new Date(m.record_date).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                        <div className="bg-card p-1.5 rounded border text-center">BP: {m.vitals_bp || '-'}</div>
                        <div className="bg-card p-1.5 rounded border text-center">HR: {m.vitals_hr || '-'}</div>
                        <div className="bg-card p-1.5 rounded border text-center">Temp: {m.vitals_temp || '-'}</div>
                        <div className="bg-card p-1.5 rounded border text-center">Wt: {m.vitals_weight || '-'}</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>S:</strong> {m.soap_subjective || 'None'}</p>
                        <p><strong>O:</strong> {m.soap_objective || 'None'}</p>
                        <p><strong>A:</strong> {m.soap_assessment || 'None'}</p>
                        <p><strong>P:</strong> {m.soap_plan || 'None'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
