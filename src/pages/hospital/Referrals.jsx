import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, FileText, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function Referrals() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    referred_to: '',
    specialty: '',
    reason: '',
    status: 'pending'
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

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_referrals (id, created_at, updated_at, company_id, patient_id, referring_doctor, referred_to, specialty, reason, referral_date, status, notes)
         VALUES (uuid(), datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, datetime('now'), ?, '')`,
        [companyId, payload.patient_id, 'Internal Doctor', payload.referred_to, payload.specialty, payload.reason, payload.status]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_hospital_referrals']);
      toast.success('Referral created successfully!');
      setShowModal(false);
      setFormData({ patient_id: '', referred_to: '', specialty: '', reason: '', status: 'pending' });
    },
    onError: (err) => {
      toast.error('Failed to create referral: ' + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.patient_id || !formData.referred_to || !formData.reason) {
      return toast.error('Please fill all required fields');
    }
    createMutation.mutate(formData);
  };


  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['univ_hospital_referrals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT r.*, p.first_name, p.last_name 
         FROM univ_referrals r
         LEFT JOIN univ_patients p ON p.id = r.patient_id AND p.company_id = r.company_id
         WHERE r.company_id = ? ORDER BY r.created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const filteredReferrals = referrals.filter(r => 
    (r.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Referrals</h1>
          <p className="text-slate-500">Manage internal and external patient referrals.</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Referral
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search referrals..."
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Department/Facility</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filteredReferrals.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No referrals found</td></tr>
              ) : (
                filteredReferrals.map(ref => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{ref.first_name} {ref.last_name}</td>
                    <td className="px-4 py-3 capitalize">{ref.urgency || 'Normal'}</td>
                    <td className="px-4 py-3">{ref.receiving_facility || ref.receiving_department}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{ref.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full \${ref.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon"><FileText className="w-4 h-4 text-slate-400" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Referral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Patient</label>
              <select className="w-full h-10 px-3 py-2 border rounded-md" value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Select Patient...</option>
                {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Referred To (Doctor/Facility)</label>
              <Input value={formData.referred_to} onChange={e => setFormData({...formData, referred_to: e.target.value})} placeholder="e.g. City General Hospital" />
            </div>
            <div>
              <label className="text-sm font-medium">Specialty</label>
              <Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="e.g. Cardiology" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Referral</label>
              <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Cardiac evaluation" />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Create Referral</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
