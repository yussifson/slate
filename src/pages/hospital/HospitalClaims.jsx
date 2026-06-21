import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Shield, Search, Plus, CheckCircle2, AlertCircle, FileText, Trash2, MoreVertical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { generateText } from '@/lib/cloudflareAI';
import { Bot, Sparkles, Lock } from 'lucide-react';

export default function HospitalClaims() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['univ_medicalclaims', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT c.*, 
                p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name
         FROM univ_medicalclaims c
         LEFT JOIN univ_patients p ON c.patient_id = p.id
         WHERE c.company_id = ?
         ORDER BY c.claim_date DESC`,
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

  const { user } = useAuth();
  const isProOrAbove = user?.role === 'system_admin' || user?.subscription_plan === 'Pro' || user?.subscription_plan === 'Enterprise';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewClaim, setViewClaim] = useState(null);

  const [isScoring, setIsScoring] = useState(false);
  const [aiScore, setAiScore] = useState('');

  const handleAIScore = async (claimObj) => {
    if (!isProOrAbove) {
      toast.error('AI Claim Predictor is available on Pro or Enterprise plans.');
      return;
    }
    setIsScoring(true);
    setAiScore('');
    try {
      const prompt = `You are an expert Medical Billing AI. Predict the probability of approval for this insurance claim.\nProvider: ${claimObj.insurance_provider}\nAmount: $${claimObj.claim_amount}\nNotes: ${claimObj.notes}\nProvide a single percentage score and a 1-sentence reason.`;
      const response = await generateText(prompt);
      setAiScore(response);
    } catch (e) {
      toast.error('AI Prediction failed.');
    } finally {
      setIsScoring(false);
    }
  };

  const [formData, setFormData] = useState({
    patient_id: '',
    claim_amount: '',
    insurance_provider: '',
    policy_number: '',
    notes: ''
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_medicalclaims (id, created_at, company_id, patient_id, claim_amount, claim_date, insurance_provider, policy_number, status, notes)
         VALUES (uuid(), datetime('now'), ?, ?, ?, datetime('now'), ?, ?, 'Pending', ?)`,
        [companyId, payload.patient_id, payload.claim_amount, payload.insurance_provider, payload.policy_number, payload.notes]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalclaims']);
      toast.success('Insurance claim filed successfully!');
      setShowModal(false);
      setFormData({ patient_id: '', claim_amount: '', insurance_provider: '', policy_number: '', notes: '' });
    },
    onError: (err) => toast.error('Failed to file claim: ' + err.message)
  });

  const markStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await powerSync.execute("UPDATE univ_medicalclaims SET status = ? WHERE id = ?", [status, id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalclaims']);
      toast.success('Claim status updated!');
    },
    onError: (err) => toast.error('Failed to update: ' + err.message)
  });

  const deleteClaim = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_medicalclaims WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalclaims']);
      toast.success('Claim deleted successfully!');
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message)
  });

  const handleSaveToDb = () => {
    if (!formData.patient_id) return toast.error("Please select a patient");
    if (!formData.insurance_provider) return toast.error("Please specify insurance provider");
    if (!formData.claim_amount) return toast.error("Please provide claim amount");

    mutateRecord.mutate({
      patient_id: formData.patient_id,
      claim_amount: parseFloat(formData.claim_amount),
      insurance_provider: formData.insurance_provider,
      policy_number: formData.policy_number,
      notes: formData.notes
    });
  };

  const filtered = claims.filter(c =>
    c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.insurance_provider?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center p-8">Loading claims data...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("insurance_claims", "Insurance Claims")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_claims", "File and track insurance claims for patients")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("file_claim", "File Claim")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Pending Claims</h3>
          <p className="text-3xl font-semibold text-amber-600 mt-1">
            {claims.filter(c => c.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Approved</h3>
          <p className="text-3xl font-semibold text-primary mt-1">
            {claims.filter(c => c.status === 'Approved').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Rejected</h3>
          <p className="text-3xl font-semibold text-red-600 mt-1">
            {claims.filter(c => c.status === 'Rejected').length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient or provider..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Provider & Policy</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Amount</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-[#71717a]">{new Date(c.claim_date).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">{c.patient_name}</td>
                  <td className="px-6 py-4">
                    <p className="text-primary font-medium">{c.insurance_provider}</p>
                    <p className="text-xs text-[#71717a]">{c.policy_number}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">${(c.claim_amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full 
                      ${c.status === 'Approved' ? 'bg-primary/10 text-primary' : 
                        c.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status}
                    </span>
                    {c.denial_risk_score > 0.6 && (
                      <div className="mt-2" title={c.denial_warnings}>
                         <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                           High Denial Risk
                         </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewClaim(c)}>View Details</DropdownMenuItem>
                        {c.status === 'Pending' && (
                          <>
                            <DropdownMenuItem onClick={() => markStatus.mutate({ id: c.id, status: 'Approved' })} className="text-primary">Approve</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markStatus.mutate({ id: c.id, status: 'Rejected' })} className="text-red-600">Reject</DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete claim?')) deleteClaim.mutate(c.id); }} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#71717a]">No claims found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">File Insurance Claim</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Provider</label>
                  <Input value={formData.insurance_provider} onChange={e => setFormData({ ...formData, insurance_provider: e.target.value})} className="mt-1" placeholder="e.g. NHIS, Bupa" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Policy No.</label>
                  <Input value={formData.policy_number} onChange={e => setFormData({ ...formData, policy_number: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Claim Amount ($)</label>
                <Input type="number" step="0.01" value={formData.claim_amount} onChange={e => setFormData({ ...formData, claim_amount: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value})} className="mt-1" placeholder="Description of services..." />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={mutateRecord.isPending}>
                {mutateRecord.isPending ? 'Filing...' : 'File Claim'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Sheet open={!!viewClaim} onOpenChange={(open) => {
        if (!open) {
          setViewClaim(null);
          setAiScore('');
        }
      }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Claim Details</SheetTitle>
                <SheetDescription>Insurance claim breakdown</SheetDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => handleAIScore(viewClaim)} disabled={isScoring}>
                {isScoring ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                {isScoring ? 'Scoring...' : 'AI Score Predictor'}
              </Button>
            </div>
          </SheetHeader>
          {viewClaim && (
            <div className="mt-6 space-y-4">
              <div><h3 className="text-sm font-medium text-[#71717a]">Patient</h3><p className="text-base font-semibold">{viewClaim.patient_name}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Provider</h3><p className="text-base">{viewClaim.insurance_provider}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Policy No.</h3><p className="text-base font-mono">{viewClaim.policy_number}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Notes</h3><p className="text-base">{viewClaim.notes}</p></div>
              <div className="pt-2 border-t"><h3 className="text-sm font-medium text-[#71717a]">Claim Amount</h3><p className="text-xl font-bold text-card-foreground">${viewClaim.claim_amount}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Status</h3><span className={`text-xs font-semibold px-2 py-1 rounded-md border ${viewClaim.status === 'Approved' ? 'bg-primary/10 text-primary border-primary/20' : viewClaim.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{viewClaim.status}</span></div>
              {viewClaim.denial_risk_score > 0.6 && (
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-medium text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> High Denial Risk (Score: {viewClaim.denial_risk_score})</h3>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2 border border-red-100">{viewClaim.denial_warnings}</p>
                </div>
              )}
            </div>
          )}
          
          {aiScore && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2 flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> AI Approval Prediction</h3>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="text-sm font-medium text-foreground">
                  {aiScore}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
