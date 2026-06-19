import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Link} from 'react-router-dom';
import { Users, Search, Plus, UserPlus, Phone, Activity, Heart, Stethoscope, Trash2, Pencil, MoreVertical} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useContracts} from "@/hooks/integrations/useContracts";
import { FileSignature} from "lucide-react";
import { useCompanyId} from "@/hooks/useCompanyId";

const statusColors = {
 Admitted: 'bg-red-100 text-red-700',
 Outpatient: 'bg-slate-100 text-primary/90',
 Discharged: 'bg-slate-100 text-primary/90'};

const BLANK_FORM = {
 firstName: '',
 lastName: '',
 dateOfBirth: '',
 gender: 'Male',
 bloodType: 'O+',
 phone: '',
 diagnosis: '',
 status: 'Outpatient'};

export default function Patients() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { sendContract} = useContracts();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('patient');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const patients = dbRecords.map(r => ({ id: r.id, status: r.status || 'Outpatient', ...r.data}));

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
 status: p.status || 'Outpatient'});
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
 lastVisit: new Date().toISOString().split('T')[0]};

 mutateRecord.mutate({
 id: editingPatient?.id,
 recordType: 'patient',
 payload,
 status: formData.status,
 searchText: `${name} ${patientId}`}, {
 onSuccess: () => {
 toast.success(editingPatient ? 'Patient updated!' : 'Patient registered!');
 setShowModal(false);
 setFormData(BLANK_FORM);
 setEditingPatient(null);
},
 onError: (err) => toast.error('Failed: ' + err.message)});
};

 const confirmDelete = () => {
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'patient'}, {
 onSuccess: () => { toast.success('Patient deleted!'); setDeleteTargetId(null);},
 onError: (err) => { toast.error('Failed: ' + err.message); setDeleteTargetId(null);}});
};

 const filtered = patients.filter(p =>
 p.name?.toLowerCase().includes(search.toLowerCase()) ||
 p.patientId?.toLowerCase().includes(search.toLowerCase())
 );

 if (isLoading) return <div className="flex items-center justify-center h-64 text-[#71717a] dark:text-gray-400">{t("loading_patients", "Loading patients...")}</div>;

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("patient_registry", "Patient Registry")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "manage_patient_records_and_cli",
 "Manage patient records and clinical history"
 )}</p>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <UserPlus className="w-4 h-4" /> {t("register_patient", "Register Patient")}
 </Button>
 </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Users className="w-5 h-5" /></div>
 <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{patients.length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("total_patients", "Total Patients")}</p></div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><Activity className="w-5 h-5" /></div>
 <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{patients.filter(p => p.status === 'Admitted').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("currently_admitted", "Currently Admitted")}</p></div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Stethoscope className="w-5 h-5" /></div>
 <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{patients.filter(p => p.status === 'Outpatient').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("outpatients", "Outpatients")}</p></div>
 </div>
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><Heart className="w-5 h-5" /></div>
 <div><p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{patients.filter(p => p.status === 'Discharged').length}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("discharged", "Discharged")}</p></div>
 </div>
 </div>
 {/* Table */}
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search patient name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("patient", "Patient")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("demographics", "Demographics")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact", "Contact")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("diagnosis", "Diagnosis")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("last_visit", "Last Visit")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(p => {
 return (
 <tr key={p.id} className="hover:bg-muted/50">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{p.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-mono tracking-[0.04em]">{p.patientId}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-foreground font-medium">{p.age} {t("yrs", "yrs •")} {p.gender}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("blood", "Blood:")} <span className="font-semibold text-red-600">{p.bloodType}</span></p>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2 text-[#71717a] dark:text-gray-400">
 <Phone className="w-3.5 h-3.5" /><span>{p.phone || '—'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 text-sm">{p.diagnosis || '—'}</td>
 <td className="px-6 py-4 text-center text-[#71717a] dark:text-gray-400 font-medium">{p.lastVisit}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-slate-100 text-primary/90'}`}>{p.status}</span>
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
 {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(p)}>
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(p.id)} className="text-red-600">
 {t("delete", "Delete")}
 </DropdownMenuItem>
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
 <p className="font-medium">{t("no_patients_found", "No patients found.")}</p>
 <p className="text-sm mt-1">{t("click_register_patient_to_add_", "Click \"Register Patient\" to add one.")}</p>
 </div>
 )}
 </div>
 </div>
 {/* Add / Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {editingPatient ? 'Edit Patient' : 'Register New Patient'}
 </h2>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("first_name", "First Name")}</label>
 <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value})} className="mt-1" placeholder="John" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("last_name", "Last Name")}</label>
 <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value})} className="mt-1" placeholder="Doe" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("date_of_birth", "Date of Birth")}</label>
 <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value})} className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("gender", "Gender")}</label>
 <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("male", "Male")}</option>
 <option>{t("female", "Female")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("blood_type", "Blood Type")}</label>
 <select value={formData.bloodType} onChange={e => setFormData({ ...formData, bloodType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("a", "A+")}</option><option>{t("a", "A-")}</option><option>{t("b", "B+")}</option><option>{t("b", "B-")}</option>
 <option>{t("ab", "AB+")}</option><option>{t("ab", "AB-")}</option><option>{t("o", "O+")}</option><option>{t("o", "O-")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone_number", "Phone Number")}</label>
 <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value})} className="mt-1" placeholder="+233..." />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("diagnosis_chief_complaint", "Diagnosis / Chief Complaint")}</label>
 <Input value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value})} className="mt-1" placeholder="e.g. Malaria, Hypertension..." />
 </div>
 <div className="col-span-2">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("admission_status", "Admission Status")}</label>
 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("outpatient", "Outpatient")}</option>
 <option>{t("admitted", "Admitted")}</option>
 <option>{t("discharged", "Discharged")}</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingPatient(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={mutateRecord.isPending}>
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
 <SheetTitle>{t("patient_details", "Patient Details")}</SheetTitle>
 <SheetDescription>{t("view_complete_patient_informat", "View complete patient information")}</SheetDescription>
 </SheetHeader>
 {viewPatient && (
 <div className="mt-6 space-y-4">
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("name", "Name")}</h3>
 <p className="text-base font-semibold">{viewPatient.name}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("patient_id", "Patient ID")}</h3>
 <p className="text-base font-semibold">{viewPatient.patientId}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("demographics", "Demographics")}</h3>
 <p className="text-base">{viewPatient.age} {t("yrs", "yrs •")} {viewPatient.gender}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("blood_type", "Blood Type")}</h3>
 <p className="text-base font-semibold text-red-600">{viewPatient.bloodType}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("contact", "Contact")}</h3>
 <p className="text-base">{viewPatient.phone || '—'}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("diagnosis", "Diagnosis")}</h3>
 <p className="text-base">{viewPatient.diagnosis || '—'}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("status", "Status")}</h3>
 <p className="text-base">{viewPatient.status}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("last_visit", "Last Visit")}</h3>
 <p className="text-base">{viewPatient.lastVisit}</p>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}
