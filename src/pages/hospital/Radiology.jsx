import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Microscope, Search, Plus, CheckCircle2, FileText, Trash2, MoreVertical, Image as ImageIcon, AlertCircle, Maximize, ZoomIn, Eye, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles } from 'lucide-react';

export default function Radiology() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['univ_imaging', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT i.*, 
                p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name
         FROM univ_imaging i
         LEFT JOIN univ_patients p ON i.patient_id = p.id
         WHERE i.company_id = ?
         ORDER BY i.scan_date DESC`,
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
  const [dicomScan, setDicomScan] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    scan_type: 'X-Ray',
    body_part: '',
    scan_date: '',
    radiologist_name: '',
    report_summary: ''
  });

  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleAISummarize = async () => {
    if (!formData.scan_type || !formData.body_part) return toast.error("Select scan type and body part first.");
    setIsSummarizing(true);
    try {
      const prompt = `You are an expert Radiologist AI. Write a concise clinical indication and summary of typical things to look out for during a ${formData.scan_type} of the ${formData.body_part}. Keep it under 3 sentences.`;
      const response = await generateText(prompt);
      setFormData(prev => ({ ...prev, report_summary: response }));
    } catch (e) {
      toast.error('AI Summary generation failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_imaging (id, created_at, company_id, patient_id, scan_type, body_part, scan_date, radiologist_name, status, report_summary)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
        [companyId, payload.patient_id, payload.scan_type, payload.body_part, payload.scan_date || new Date().toISOString().split('T')[0], payload.radiologist_name, payload.report_summary]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_imaging']);
      toast.success('Imaging request added!');
      setShowModal(false);
      setFormData({ patient_id: '', scan_type: 'X-Ray', body_part: '', scan_date: '', radiologist_name: '', report_summary: '' });
    },
    onError: (err) => toast.error('Failed to add: ' + err.message)
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute("UPDATE univ_imaging SET status = ? WHERE id = ?", [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_imaging']);
      toast.success('Report status updated');
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute("DELETE FROM univ_imaging WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_imaging']);
      toast.success('Scan record deleted');
    }
  });

  const filtered = scans.filter(s =>
    (s.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.scan_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.body_part || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Abnormal': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-[#71717a]">Loading Imaging Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{t("radiology", "Medical Imaging")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_radiology", "Track X-Rays, MRIs, CT Scans, and Ultrasound results")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md">
          <ImageIcon className="w-4 h-4" /> {t("new_scan", "New Scan Request")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Pending Reports</h3>
            <Microscope className="w-5 h-5 text-amber-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {scans.filter(s => s.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Completed Normal</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {scans.filter(s => s.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Abnormal Results</h3>
            <AlertCircle className="w-5 h-5 text-red-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {scans.filter(s => s.status === 'Abnormal').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Scans</h3>
            <ImageIcon className="w-5 h-5 text-purple-500 opacity-80" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {scans.length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient, scan type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-black/9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Scan Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase tracking-wider">Radiologist</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#71717a]">
                    {new Date(s.scan_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-card-foreground">{s.patient_name}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/> {s.scan_type}</p>
                    <p className="text-xs text-[#71717a] mt-0.5">{s.body_part}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#71717a]">{s.radiologist_name ? `Dr. ${s.radiologist_name}` : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDicomScan(s)} className="font-medium"><Eye className="w-4 h-4 mr-2"/> View Scan</DropdownMenuItem>
                        {s.status === 'Pending' && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Completed' })} className="text-emerald-600 font-medium">Mark Normal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: s.id, status: 'Abnormal' })} className="text-red-600 font-medium">Mark Abnormal</DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete record?')) deleteRecord.mutate(s.id); }} className="text-red-600">Delete Record</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-[#71717a]">No imaging records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-card-foreground">New Scan Request</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm font-medium">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Scan Type</label>
                <select value={formData.scan_type} onChange={e => setFormData({ ...formData, scan_type: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm">
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="PET Scan">PET Scan</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Body Part</label>
                <Input placeholder="e.g. Chest, Left Knee" value={formData.body_part} onChange={e => setFormData({ ...formData, body_part: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Radiologist</label>
                <Input placeholder="e.g. Smith" value={formData.radiologist_name} onChange={e => setFormData({ ...formData, radiologist_name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Date</label>
                <Input type="date" value={formData.scan_date} onChange={e => setFormData({ ...formData, scan_date: e.target.value})} className="mt-1" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Clinical Indication / Summary</label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAISummarize} disabled={isSummarizing} className="h-6 text-xs text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100">
                    {isSummarizing ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Bot className="w-3 h-3 mr-1" />}
                    {isSummarizing ? 'Generating...' : 'AI Auto-Fill'}
                  </Button>
                </div>
                <textarea rows={2} value={formData.report_summary} onChange={e => setFormData({ ...formData, report_summary: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm" placeholder="Reason for scan or initial findings..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md" onClick={() => mutateRecord.mutate(formData)} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Saving...' : 'Add Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DICOM Viewer Stub */}
      {dicomScan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-black border border-white/20 rounded-xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50 text-white">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400"/> DICOM Viewer</h3>
                <p className="text-sm text-gray-400">{dicomScan.patient_name} - {dicomScan.scan_type} ({dicomScan.body_part})</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"><ZoomIn className="w-5 h-5"/></Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"><Maximize className="w-5 h-5"/></Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 ml-4" onClick={() => setDicomScan(null)}>Close</Button>
              </div>
            </div>
            {/* Main Viewer Area */}
            <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
              <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                <ImageIcon className="w-64 h-64 text-white" />
              </div>
              <div className="absolute top-4 left-4 text-xs font-mono text-gray-500 space-y-1">
                <p>PATIENT: {dicomScan.patient_name.toUpperCase()}</p>
                <p>ID: {dicomScan.patient_id.substring(0, 8)}</p>
                <p>DATE: {new Date(dicomScan.scan_date).toLocaleDateString()}</p>
              </div>
              <div className="absolute top-4 right-4 text-xs font-mono text-gray-500 text-right space-y-1">
                <p>{dicomScan.scan_type.toUpperCase()}</p>
                <p>{dicomScan.body_part.toUpperCase()}</p>
                <p>WL: 40 WW: 400</p>
              </div>
              
              {/* Fake X-Ray/Scan Image */}
              <div className="w-[400px] h-[500px] bg-gradient-to-tr from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-white/5 flex items-center justify-center relative overflow-hidden group cursor-crosshair">
                 <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(0,0,0,0.8)_100%)] mix-blend-overlay"></div>
                 <ImageIcon className="w-32 h-32 text-gray-600 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                 {dicomScan.status === 'Abnormal' && (
                    <div className="absolute top-1/3 left-1/2 w-16 h-16 border-2 border-red-500/50 rounded-full animate-pulse flex items-center justify-center">
                       <span className="text-[10px] text-red-500 font-bold bg-black/50 px-1">ANOMALY</span>
                    </div>
                 )}
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                 <div className="w-8 h-1 bg-white/20 rounded-full"></div>
                 <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                 <div className="w-8 h-1 bg-white/20 rounded-full"></div>
              </div>
            </div>
            {/* Footer / Report */}
            <div className="p-4 border-t border-white/10 bg-black/80 text-white">
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Radiologist Report</h4>
              <p className="text-sm">{dicomScan.report_summary || 'No report generated yet.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
