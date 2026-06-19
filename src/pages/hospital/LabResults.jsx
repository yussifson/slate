import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Link} from 'react-router-dom';
import { FlaskConical, Search, Plus, Upload, CheckCircle2, AlertTriangle, FileText, Trash2, MoreVertical, Pencil} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';

const statusColors = {
 Completed: 'bg-slate-100 text-primary/90',
 Abnormal: 'bg-red-100 text-red-700 font-semibold',
 Pending: 'bg-amber-100 text-amber-700'
};

const statusIcons = {
 Completed: <CheckCircle2 className="w-4 h-4 text-primary" />,
 Abnormal: <AlertTriangle className="w-4 h-4 text-red-600" />,
 Pending: <FlaskConical className="w-4 h-4 text-amber-600 animate-pulse" />
};

export default function LabResults() {
 const { t} = useTranslation();
 // Supabase Real-time Sync Hooks
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('result');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 // Map database records
 const labResults = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [viewResult, setViewResult] = useState(null);
 const [editingResult, setEditingResult] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 patient: '',
 testType: 'Complete Blood Count (CBC)',
 result: '',
 range: 'Ref: Standard',
 status: 'Completed'
});

 // Generic Save Handler for real DB persistence
 const handleSaveToDb = () => {
 if (!formData.patient.trim()) return toast.error("Please enter a patient name");
 if (!formData.result.trim()) return toast.error("Please enter findings");

 const resultId = editingResult ? editingResult.resultId : `LR-${Math.floor(2000 + Math.random() * 9000)}`;
 const date = editingResult ? editingResult.date : new Date().toISOString().split('T')[0];

 const payload = {
 resultId,
 patient: formData.patient,
 testType: formData.testType,
 result: formData.result,
 range: formData.range,
 status: formData.status,
 date
};

 mutateRecord.mutate({
 id: editingResult?.id,
 recordType: 'result',
 payload,
 status: formData.status,
 searchText: `${formData.patient} ${formData.testType} ${resultId}`
}, {
 onSuccess: () => {
 toast.success(editingResult ? 'Lab results updated!' : 'Lab results uploaded successfully!');
 setShowModal(false);
 setEditingResult(null);
 setFormData({
 patient: '',
 testType: 'Complete Blood Count (CBC)',
 result: '',
 range: 'Ref: Standard',
 status: 'Completed'
});
},
 onError: (err) => {
 toast.error('Failed to upload results: ' + err.message);
}
});
};

 // Generic Delete Handler for real DB persistence
 const handleDeleteFromDb = (id) => {
 if (window.confirm('Are you sure you want to delete this lab result?')) {
 deleteRecord.mutate({ id, recordType: 'result'}, {
 onSuccess: () => {
 toast.success('Lab result deleted successfully!');
},
 onError: (err) => {
 toast.error('Failed to delete record: ' + err.message);
}
});
}
};

 const filtered = labResults.filter(res =>
 res.patient?.toLowerCase().includes(search.toLowerCase()) ||
 res.testType?.toLowerCase().includes(search.toLowerCase()) ||
 res.resultId?.includes(search)
 );

 const openEdit = (res) => {
 setEditingResult(res);
 setFormData({
 patient: res.patient || '',
 testType: res.testType || 'Complete Blood Count (CBC)',
 result: res.result || '',
 range: res.range || 'Ref: Standard',
 status: res.status || 'Completed'
});
 setShowModal(true);
};

 return (
 <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh"}}>
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("laboratory_results", "Laboratory Results")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "track_and_manage_patient_lab_t",
 "Track and manage patient lab tests and reports"
 )}</p>
 </div>
 <div className="flex gap-3">
 <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
 <Upload className="w-4 h-4" /> {t("upload_results", "Upload Results")}
 </Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 border-l-4 border-l-amber-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-foreground">{t("pending_tests", "Pending Tests")}</h3>
 <p className="text-3xl font-semibold text-amber-600 mt-1 tracking-[-0.02em]">{labResults.filter(r => r.status === 'Pending').length}</p>
 </div>
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 border-l-4 border-l-green-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-foreground">{t("completed", "Completed")}</h3>
 <p className="text-3xl font-semibold text-primary mt-1 tracking-[-0.02em]">{labResults.filter(r => r.status === 'Completed').length}</p>
 </div>
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 border-l-4 border-l-red-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-foreground">{t("critical_abnormal", "Critical / Abnormal")}</h3>
 <p className="text-3xl font-semibold text-red-600 mt-1 tracking-[-0.02em]">{labResults.filter(r => r.status === 'Abnormal').length}</p>
 </div>
 </div>
 <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search patient or test ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("test_id", "Test ID")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("patient", "Patient")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("test_type", "Test Type")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("result_range", "Result & Range")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(res => {
 return (
 <tr key={res.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-mono text-xs font-semibold text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{res.resultId}</td>
 <td className="px-6 py-4 font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Link to="/hospital/patients" className="text-primary hover:underline">{res.patient}</Link>
 </td>
 <td className="px-6 py-4 text-primary font-medium">{res.testType}</td>
 <td className="px-6 py-4">
 <p className={`font-semibold ${res.status === 'Abnormal' ? 'text-red-600' : 'text-card-foreground'}`}>{res.result}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{res.range}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center items-center">
 <span className={`flex items-center gap-2.5 text-xs font-semibold px-2.5 py-1 rounded-md-full ${statusColors[res.status] || 'bg-slate-100 text-primary/90'}`}>
 {statusIcons[res.status]} {res.status}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-right flex gap-2 justify-end">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewResult(res)}>
 {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(res)}>
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleDeleteFromDb(res.id)} className="text-red-600">
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
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
 <p>{t(
 "no_lab_results_found_click_upl",
 "No lab results found. Click \"Upload Results\" to add one."
 )}</p>
 </div>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-md-2xl w-full max-w-md p-6 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Upload className="w-5 h-5 text-primary"/> {t("upload_lab_result", "Upload Lab Result")}</h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("patient", "Patient")}</label>
 <Input value={formData.patient} onChange={e => setFormData({ ...formData, patient: e.target.value})} className="mt-1" placeholder="Search patient..." />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("test_type", "Test Type")}</label>
 <select value={formData.testType} onChange={e => setFormData({ ...formData, testType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("complete_blood_count_cbc", "Complete Blood Count (CBC)")}</option>
 <option>{t("lipid_panel", "Lipid Panel")}</option>
 <option>{t("fasting_blood_sugar", "Fasting Blood Sugar")}</option>
 <option>{t("liver_function_test", "Liver Function Test")}</option>
 <option>{t("kidney_function_test", "Kidney Function Test")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("result_value", "Result Value")}</label>
 <Input value={formData.result} onChange={e => setFormData({ ...formData, result: e.target.value})} className="mt-1" placeholder="e.g. Normal, High LDL, 120 mg/dL" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("reference_range", "Reference Range")}</label>
 <Input value={formData.range} onChange={e => setFormData({ ...formData, range: e.target.value})} className="mt-1" placeholder="e.g. Ref: Standard, Ref: < 100 mg/dL" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status_flag", "Status Flag")}</label>
 <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm">
 <option>{t("completed", "Completed")}</option>
 <option>{t("abnormal", "Abnormal")}</option>
 <option>{t("pending", "Pending")}</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingResult(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb}>{t("save_results", "Save Results")}</Button>
 </div>
 </div>
 </div>
 )}
 <Sheet open={!!viewResult} onOpenChange={(open) => !open && setViewResult(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("lab_result_details", "Lab Result Details")}</SheetTitle>
 <SheetDescription>{t(
 "view_complete_laboratory_test_",
 "View complete laboratory test information"
 )}</SheetDescription>
 </SheetHeader>
 {viewResult && (
 <div className="mt-6 space-y-4">
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("test_id", "Test ID")}</h3>
 <p className="text-base font-semibold">{viewResult.resultId}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("patient", "Patient")}</h3>
 <Link to="/hospital/patients" className="text-base font-semibold text-primary hover:underline">{viewResult.patient}</Link>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("test_type", "Test Type")}</h3>
 <p className="text-base font-semibold">{viewResult.testType}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("result_value", "Result Value")}</h3>
 <p className="text-base font-semibold">{viewResult.result}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("reference_range", "Reference Range")}</h3>
 <p className="text-base">{viewResult.range}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("status", "Status")}</h3>
 <p className="text-base">{viewResult.status}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-[#71717a] dark:text-gray-400">{t("date", "Date")}</h3>
 <p className="text-base">{viewResult.date}</p>
 </div>
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}

