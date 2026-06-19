import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { FlaskConical, Search, Plus, Upload, CheckCircle2, AlertTriangle, FileText, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

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
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: labResults = [], isLoading } = useQuery({
    queryKey: ['univ_labs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
        const res = await powerSync.execute(
          `SELECT l.*, test_name AS test_type, result_value AS result,
                  p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name
           FROM univ_labs l
           LEFT JOIN univ_patients p ON l.patient_id = p.id
           WHERE l.company_id = ? ORDER BY l.created_at DESC`,
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

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewResult, setViewResult] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: '',
    testType: 'Complete Blood Count (CBC)',
    result: '',
    range: 'Ref: Standard',
    status: 'Completed'
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (payload.id) {
        await powerSync.execute(
          `UPDATE univ_labs SET 
             patient_id = ?, test_name = ?, result_value = ?, reference_range = ?, status = ?, document_url = ?
           WHERE id = ?`,
          [payload.patient_id, payload.testType, payload.result, payload.range, payload.status, payload.document_url, payload.id]
        );
      } else {
        await powerSync.execute(
          `INSERT INTO univ_labs (id, created_at, company_id, patient_id, test_name, test_date, result_value, reference_range, status, document_url)
           VALUES (uuid(), datetime('now'), ?, ?, ?, datetime('now'), ?, ?, ?, ?)`,
          [companyId, payload.patient_id, payload.testType, payload.result, payload.range, payload.status, payload.document_url]
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_labs']);
      toast.success(editingResult ? 'Lab results updated!' : 'Lab results uploaded successfully!');
      setShowModal(false);
      setEditingResult(null);
      setFormData({ patient_id: '', testType: 'Complete Blood Count (CBC)', result: '', range: 'Ref: Standard', status: 'Completed', document_url: '' });
    },
    onError: (err) => toast.error('Failed to save lab result: ' + err.message)
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_labs WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_labs']);
      toast.success('Lab result deleted successfully!');
    },
    onError: (err) => toast.error('Failed to delete record: ' + err.message)
  });

  const handleSaveToDb = () => {
    if (!formData.patient_id) return toast.error("Please select a patient");
    if (!formData.result.trim()) return toast.error("Please enter findings");

    mutateRecord.mutate({
      id: editingResult?.id,
      patient_id: formData.patient_id,
      testType: formData.testType,
      result: formData.result,
      range: formData.range,
      status: formData.status,
      document_url: formData.document_url
    });
  };

  const handleDeleteFromDb = (id) => {
    if (window.confirm('Are you sure you want to delete this lab result?')) {
      deleteRecord.mutate(id);
    }
  };

  const filtered = labResults.filter(res =>
    res.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    res.test_type?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (res) => {
    setEditingResult(res);
    setFormData({
      patient_id: res.patient_id || '',
      testType: res.test_type || 'Complete Blood Count (CBC)',
      result: res.result || '',
      range: res.reference_range || 'Ref: Standard',
      status: res.status || 'Completed'
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!companyId) return toast.error("Company context missing");
    
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = "${companyId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}";
    
    try {
      const { data, error } = await supabase.storage
        .from('hospital-documents')
        .upload(fileName, file);
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('hospital-documents')
        .getPublicUrl(fileName);
        
      setFormData({ ...formData, document_url: urlData.publicUrl });
      toast.success("File uploaded successfully!");
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading lab results...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("laboratory_results", "Laboratory Results")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("track_and_manage_patient_lab_t", "Track and manage patient lab tests and reports")}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setEditingResult(null); setFormData({ patient_id: '', testType: 'Complete Blood Count (CBC)', result: '', range: 'Ref: Standard', status: 'Completed', document_url: '' }); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Upload className="w-4 h-4" /> {t("upload_results", "Upload Results")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-amber-500">
          <h3 className="font-semibold text-foreground">{t("pending_tests", "Pending Tests")}</h3>
          <p className="text-3xl font-semibold text-amber-600 mt-1">{labResults.filter(r => r.status === 'Pending').length}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-green-500">
          <h3 className="font-semibold text-foreground">{t("completed", "Completed")}</h3>
          <p className="text-3xl font-semibold text-primary mt-1">{labResults.filter(r => r.status === 'Completed').length}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-red-500">
          <h3 className="font-semibold text-foreground">{t("critical_abnormal", "Critical / Abnormal")}</h3>
          <p className="text-3xl font-semibold text-red-600 mt-1">{labResults.filter(r => r.status === 'Abnormal').length}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient or test type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Test Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Result & Range</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(res => (
                <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-[#71717a]">
                    {new Date(res.test_date).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">
                    <span className="text-primary hover:underline cursor-pointer">{res.patient_name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-primary font-medium">{res.test_type}</td>
                  <td className="px-6 py-4">
                    <p className={`font-semibold ${res.status === 'Abnormal' ? 'text-red-600' : 'text-card-foreground'}`}>{res.result}</p>
                    <p className="text-xs text-[#71717a] tracking-[0.04em]">{res.reference_range}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center">
                      <span className={`flex items-center gap-2.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[res.status] || 'bg-slate-100 text-primary/90'}`}>
                        {statusIcons[res.status]} {res.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewResult(res)}>View Report</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(res)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFromDb(res.id)} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#71717a]">No lab results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">{editingResult ? 'Edit Lab Results' : 'Upload Lab Results'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Test Type</label>
                <select value={formData.testType} onChange={e => setFormData({ ...formData, testType: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>Complete Blood Count (CBC)</option>
                  <option>Comprehensive Metabolic Panel (CMP)</option>
                  <option>Lipid Panel</option>
                  <option>Urinalysis</option>
                  <option>Thyroid Panel</option>
                  <option>COVID-19 PCR</option>
                  <option>Malaria RDT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Findings / Value</label>
                  <Input value={formData.result} onChange={e => setFormData({ ...formData, result: e.target.value})} className="mt-1" placeholder="e.g. 14.5 g/dL" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Reference Range</label>
                  <Input value={formData.range} onChange={e => setFormData({ ...formData, range: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option>Pending</option><option>Completed</option><option>Abnormal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Attachment URL (Optional)</label>
                <Input type="url" value={formData.document_url} onChange={e => setFormData({ ...formData, document_url: e.target.value})} className="mt-1" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Results'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Sheet open={!!viewResult} onOpenChange={(open) => !open && setViewResult(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Laboratory Report</SheetTitle>
            <SheetDescription>Detailed test findings</SheetDescription>
          </SheetHeader>
          {viewResult && (
            <div className="mt-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-primary/20 space-y-3">
                <div><h3 className="text-xs font-semibold text-[#71717a] uppercase">Patient</h3><p className="text-base font-semibold">{viewResult.patient_name}</p></div>
                <div><h3 className="text-xs font-semibold text-[#71717a] uppercase">Test Type</h3><p className="text-base text-primary font-medium">{viewResult.test_type}</p></div>
                <div><h3 className="text-xs font-semibold text-[#71717a] uppercase">Date Requested</h3><p className="text-base">{new Date(viewResult.test_date).toLocaleString()}</p></div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2">Status</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${viewResult.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' : viewResult.status === 'Abnormal' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>{viewResult.status}</span>
                </div>
                {viewResult.document_url && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2">Attachment</h3>
                    <a href={viewResult.document_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline break-all">
                      {viewResult.document_url}
                    </a>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2">Findings</h3>
                <div className={`p-4 rounded-xl border ${viewResult.status === 'Abnormal' ? 'bg-red-50 border-red-200' : 'bg-card border-primary/20'}`}>
                  <p className={`text-2xl font-bold ${viewResult.status === 'Abnormal' ? 'text-red-700' : 'text-card-foreground'}`}>{viewResult.result}</p>
                  <p className="text-sm text-[#71717a] mt-1">{viewResult.reference_range}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button className="w-full bg-slate-100 hover:bg-slate-200 text-foreground gap-2"><FileText className="w-4 h-4"/> Print Full Report</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}


