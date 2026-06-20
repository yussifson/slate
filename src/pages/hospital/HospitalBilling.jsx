import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Receipt, Search, Plus, CheckCircle2, AlertCircle, FileText, Trash2, MoreVertical, Send, Wand2 } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';

export default function HospitalBilling() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['univ_medicalbillings', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT b.*, 
                p.COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') as patient_name,
                p.email as patient_email
         FROM univ_medicalbillings b
         LEFT JOIN univ_patients p ON b.patient_id = p.id
         WHERE b.company_id = ?
         ORDER BY b.issue_date DESC`,
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

  const { data: patientPrescriptions = [] } = useQuery({
    queryKey: ['univ_prescriptions_unbilled', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`
        SELECT p.*, ph.drug_name, ph.unit_price 
        FROM univ_prescriptions p 
        LEFT JOIN univ_pharmacy ph ON p.medication = ph.id 
        WHERE p.company_id = ? AND p.status = 'Completed'
      `, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { user } = useAuth();
  const isProOrAbove = user?.role === 'system_admin' || user?.subscription_plan === 'Pro' || user?.subscription_plan === 'Enterprise';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewBill, setViewBill] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  const handleAIAnalyze = async (billObj) => {
    if (!isProOrAbove) {
      toast.error('AI Invoice Analysis is available on Pro or Enterprise plans.');
      return;
    }
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const prompt = `You are an expert Medical Billing AI. Analyze the following bill for patient ${billObj.patient_name}.\nService: ${billObj.service_provided}\nTotal Cost: $${billObj.total_cost}\nInsurance Covered: $${billObj.insurance_covered}\nAmount Due: $${billObj.amount_due}\n\nProvide a concise 2-sentence summary of the bill's validity, any potential insurance coding discrepancies to watch out for, and payment collection recommendations.`;
      const response = await generateText(prompt);
      setAiAnalysis(response);
    } catch (e) {
      toast.error('AI Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [formData, setFormData] = useState({
    patient_id: '',
    service_provided: '',
    total_cost: '',
    insurance_covered: '',
    due_date: ''
  });

  const handleAutoFill = () => {
    if (!formData.patient_id) return toast.error("Please select a patient first.");
    
    // Find completed prescriptions for this patient
    const rx = patientPrescriptions.filter(p => p.patient_id === formData.patient_id);
    
    if (rx.length === 0) {
      return toast.error("No unbilled completed prescriptions found for this patient.");
    }
    
    const services = rx.map(p => `Prescription: ${p.drug_name || 'Medication'}`).join(', ');
    const totalCost = rx.reduce((sum, p) => sum + (p.unit_price || 15), 0); // fallback price
    
    setFormData(prev => ({
      ...prev,
      service_provided: services,
      total_cost: totalCost.toString(),
      insurance_covered: (totalCost * 0.8).toFixed(2), // Simulate 80% coverage
    }));
    
    toast.success("Auto-filled from patient records!");
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload) => {
      // Create both the medical bill and the main system invoice
      await powerSync.execute('BEGIN TRANSACTION');

      const billId = uuidv4();
      const invoiceId = uuidv4();
      const amountDue = payload.total_cost - payload.insurance_covered;

      // 1. Insert Medical Bill
      await powerSync.execute(
        `INSERT INTO univ_medicalbillings (id, created_at, company_id, patient_id, service_provided, total_cost, insurance_covered, amount_due, status, issue_date, due_date)
         VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, 'Unpaid', datetime('now'), ?)`,
        [billId, companyId, payload.patient_id, payload.service_provided, payload.total_cost, payload.insurance_covered, amountDue, payload.due_date]
      );

      // 2. Insert into univ_invoices (Global Invoice System)
      const patient = patientsList.find(p => p.id === payload.patient_id);
      
      await powerSync.execute(
        `INSERT INTO univ_invoices (id, created_at, company_id, client_name, client_email, invoice_number, amount, currency, status, due_date, issue_date, notes)
         VALUES (?, datetime('now'), ?, ?, '', ?, ?, 'USD', 'draft', ?, datetime('now'), ?)`,
        [invoiceId, companyId, patient?.name || 'Patient', `INV-${Math.floor(1000 + Math.random() * 9000)}`, amountDue, payload.due_date, `Medical Bill: ${payload.service_provided}`]
      );

      await powerSync.execute('COMMIT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalbillings']);
      queryClient.invalidateQueries(['univ_invoices']); // Refresh global billing dashboard if used
      toast.success('Medical bill and system invoice generated successfully!');
      setShowModal(false);
      setFormData({ patient_id: '', service_provided: '', total_cost: '', insurance_covered: '', due_date: '' });
    },
    onError: async (err) => {
      await powerSync.execute('ROLLBACK');
      toast.error('Failed to generate bill: ' + err.message);
    }
  });

  const markAsPaid = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute("UPDATE univ_medicalbillings SET status = 'Paid' WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalbillings']);
      toast.success('Bill marked as paid!');
    },
    onError: (err) => toast.error('Failed to update: ' + err.message)
  });

  const deleteBill = useMutation({
    mutationFn: async (id) => {
      await powerSync.execute('DELETE FROM univ_medicalbillings WHERE id = ?', [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_medicalbillings']);
      toast.success('Bill deleted successfully!');
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message)
  });

  const handleSaveToDb = () => {
    if (!formData.patient_id) return toast.error("Please select a patient");
    if (!formData.service_provided) return toast.error("Please describe the service");
    if (!formData.total_cost) return toast.error("Please provide total cost");

    createInvoiceMutation.mutate({
      patient_id: formData.patient_id,
      service_provided: formData.service_provided,
      total_cost: parseFloat(formData.total_cost),
      insurance_covered: parseFloat(formData.insurance_covered) || 0,
      due_date: formData.due_date || new Date().toISOString().split('T')[0]
    });
  };

  const filtered = bills.filter(b =>
    b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.service_provided?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center p-8">Loading billing data...</div>;

  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("medical_billing", "Medical Billing")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_patient_invoices", "Generate and track patient bills and payments")}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("create_bill", "Create Bill")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Unpaid</h3>
          <p className="text-3xl font-semibold text-red-600 mt-1">
            ${bills.filter(b => b.status === 'Unpaid').reduce((sum, b) => sum + (b.amount_due || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Paid</h3>
          <p className="text-3xl font-semibold text-primary mt-1">
            ${bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount_due || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5">
          <h3 className="font-semibold text-[#71717a] text-sm uppercase">Total Insurance Covered</h3>
          <p className="text-3xl font-semibold text-card-foreground mt-1">
            ${bills.reduce((sum, b) => sum + (b.insurance_covered || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search patient or service..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Service Provided</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Total Cost</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Amount Due</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-[#71717a]">{new Date(b.issue_date).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4 font-semibold text-card-foreground">{b.patient_name}</td>
                  <td className="px-6 py-4 text-primary font-medium">{b.service_provided}</td>
                  <td className="px-6 py-4 text-right">${(b.total_cost || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold">${(b.amount_due || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-700'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    {b.status === 'Unpaid' && (
                      <Button onClick={() => markAsPaid.mutate(b.id)} size="sm" variant="outline" className="h-8">
                        Mark Paid
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewBill(b)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if(window.confirm('Delete bill?')) deleteBill.mutate(b.id); }} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[#71717a]">No billing records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">Generate Medical Bill</h2>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Patient</label>
                  <select value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option value="">-- Select Patient --</option>
                    {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <Button variant="outline" onClick={handleAutoFill} className="gap-2 text-primary border-primary/30 hover:bg-primary/10">
                  <Wand2 className="w-4 h-4"/> Auto-Fill
                </Button>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Service Provided</label>
                <Input value={formData.service_provided} onChange={e => setFormData({ ...formData, service_provided: e.target.value})} className="mt-1" placeholder="e.g. Consultation, Lab Test, Surgery..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Total Cost ($)</label>
                  <Input type="number" step="0.01" value={formData.total_cost} onChange={e => setFormData({ ...formData, total_cost: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Insurance Cover ($)</label>
                  <Input type="number" step="0.01" value={formData.insurance_covered} onChange={e => setFormData({ ...formData, insurance_covered: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value})} className="mt-1" />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-primary/20 text-sm">
                <div className="flex justify-between"><span>Patient Amount Due:</span> <span className="font-bold">${((parseFloat(formData.total_cost) || 0) - (parseFloat(formData.insurance_covered) || 0)).toFixed(2)}</span></div>
                <p className="text-xs text-[#71717a] mt-1">This will automatically log an invoice to the global accounting system.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSaveToDb} disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? 'Generating...' : 'Generate Bill'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Sheet open={!!viewBill} onOpenChange={(open) => {
        if (!open) {
          setViewBill(null);
          setAiAnalysis('');
        }
      }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Invoice Details</SheetTitle>
                <SheetDescription>Medical billing breakdown</SheetDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => handleAIAnalyze(viewBill)} disabled={isAnalyzing}>
                {isAnalyzing ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
              </Button>
            </div>
          </SheetHeader>
          {viewBill && (
            <div className="mt-6 space-y-4">
              <div><h3 className="text-sm font-medium text-[#71717a]">Patient</h3><p className="text-base font-semibold">{viewBill.patient_name}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Service Provided</h3><p className="text-base">{viewBill.service_provided}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Total Cost</h3><p className="text-base font-semibold">${viewBill.total_cost}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Insurance Covered</h3><p className="text-base">${viewBill.insurance_covered}</p></div>
              <div className="pt-2 border-t"><h3 className="text-sm font-medium text-[#71717a]">Amount Due</h3><p className="text-xl font-bold text-red-600">${viewBill.amount_due}</p></div>
              <div><h3 className="text-sm font-medium text-[#71717a]">Status</h3><span className={`text-xs font-semibold px-2 py-1 rounded-md border ${viewBill.status === 'Paid' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-50 text-red-700 border-red-200'}`}>{viewBill.status}</span></div>
            </div>
          )}
          
          {aiAnalysis && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold text-[#71717a] uppercase mb-2 flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> AI Analysis</h3>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="text-sm font-medium text-foreground">
                  {aiAnalysis}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
