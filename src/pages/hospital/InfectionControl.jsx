import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery } from '@tanstack/react-query';

export default function InfectionControl() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['univ_infection_logs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT l.*, p.first_name, p.last_name 
         FROM univ_infection_logs l
         LEFT JOIN univ_patients p ON p.id = l.patient_id AND p.company_id = l.company_id
         WHERE l.company_id = ? ORDER BY l.infection_date DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const filteredLogs = logs.filter(l => 
    (l.organism || '').toLowerCase().includes(search.toLowerCase()) || 
    (l.first_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Infection Control</h1>
          <p className="text-slate-500">Log and track hospital-acquired infections.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Log Infection
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search type, organism, or patient..."
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
                <th className="px-4 py-3">Infection Date</th>
                <th className="px-4 py-3">Organism</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Control Measures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No infection logs found</td></tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{l.infection_date}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{l.organism}</td>
                    <td className="px-4 py-3">{l.first_name ? `${l.first_name} ${l.last_name}` : 'Unknown'}</td>
                    <td className="px-4 py-3">{l.suspected_source || 'N/A'}</td>
                    <td className="px-4 py-3">{l.ward_location || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${l.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">{l.control_measures_taken}</td>
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
