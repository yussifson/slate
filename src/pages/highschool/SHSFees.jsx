import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';
import { Banknote, Plus, Search, CheckCircle2 } from "lucide-react";

export default function SHSFees() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    studentName: '', amount: '', description: 'Term 1 Fees', status: 'Pending', type: 'Tuition'
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["shs_fees", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'shs_fee' }), 
    enabled: !!companyId 
  });

  const mutateFee = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shs_fees", companyId] });
      toast.success("Fee record saved");
      setShowModal(false);
    }
  });

  const fees = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      studentName: r.title,
      description: r.description || '',
      status: r.status || 'Pending',
      amount: extra.amount || 0,
      type: extra.type || 'Tuition',
      date: new Date(r.created_at).toLocaleDateString()
    };
  });

  const filtered = fees.filter(f => f.studentName.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.studentName || !formData.amount) return toast.error("Student Name and Amount are required");
    mutateFee.mutate({
      company_id: companyId,
      case_type: 'shs_fee',
      title: formData.studentName,
      description: formData.description,
      status: formData.status,
      notes: JSON.stringify({
        amount: formData.amount,
        type: formData.type
      })
    });
  };

  const totalCollected = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("fees_billing", "Fees & Billing")} 
        subtitle="Manage student billing, PTA dues, and boarding fees." 
        metrics={[
          { title: "Total Collected", value: `$${totalCollected.toLocaleString()}`, icon: Banknote },
          { title: "Pending Invoices", value: fees.filter(f => f.status === 'Pending').length, icon: Banknote }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => {
          setFormData({ studentName: '', amount: '', description: 'Term 1 Fees', status: 'Pending', type: 'Tuition' });
          setShowModal(true);
        }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Issue Invoice
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Student Name', 'Description', 'Type', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(f => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{f.studentName}</td>
                <td className="px-4 py-3 text-slate-600">{f.description}</td>
                <td className="px-4 py-3 text-slate-500">{f.type}</td>
                <td className="px-4 py-3 font-bold text-slate-900">${parseFloat(f.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${f.status === 'Paid' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{f.date}</td>
                <td className="px-4 py-3">
                  {f.status === 'Pending' && (
                    <Button variant="ghost" size="sm" onClick={() => mutateFee.mutate({ id: f.id, status: 'Paid' })} className="text-[#6F00FF] hover:text-purple-700 hover:bg-purple-50 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Paid
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8 text-slate-500">No fee records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Issue Fee Invoice</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Student Name / ID</label>
                <Input value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="e.g. Kwame Osei" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Term 1 Tuition" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount ($)</label>
                  <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="500" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Fee Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Tuition</option><option>Boarding</option><option>PTA Dues</option><option>Exam Fee</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Initial Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Pending</option><option>Paid</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Save Invoice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
