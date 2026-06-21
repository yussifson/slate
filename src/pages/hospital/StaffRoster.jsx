import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery } from '@tanstack/react-query';

export default function StaffRoster() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['univ_duty_rosters', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT r.*, s.first_name, s.last_name, s.role 
         FROM univ_duty_rosters r
         LEFT JOIN profiles s ON s.id = r.staff_id AND s.company_id = r.company_id
         WHERE r.company_id = ? ORDER BY r.shift_date ASC, r.start_time ASC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const filteredRoster = roster.filter(r => 
    (r.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Staff Duty Roster</h1>
          <p className="text-slate-500">Manage shift scheduling and on-call assignments.</p>
        </div>
        <Button className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> Assign Shift
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search staff or department..."
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
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Shift Type</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filteredRoster.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No shifts scheduled</td></tr>
              ) : (
                filteredRoster.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400"/> {r.first_name} {r.last_name}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.role || 'Staff'}</td>
                    <td className="px-4 py-3">{r.department}</td>
                    <td className="px-4 py-3 flex items-center gap-2 text-slate-600">
                      <CalendarIcon className="w-4 h-4"/> {r.shift_date}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.shift_type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-500">{r.start_time} - {r.end_time}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full \${r.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {r.status}
                      </span>
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
