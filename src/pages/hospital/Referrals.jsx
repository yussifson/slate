import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, FileText, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery } from '@tanstack/react-query';

export default function Referrals() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

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
        <Button className="bg-primary text-white">
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
    </div>
  );
}
