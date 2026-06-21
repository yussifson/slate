import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, User, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery } from '@tanstack/react-query';

export default function Queue() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['univ_hospital_queues', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        \`SELECT q.*, p.first_name, p.last_name 
         FROM univ_hospital_queues q
         LEFT JOIN univ_patients p ON p.id = q.patient_id AND p.company_id = q.company_id
         WHERE q.company_id = ? AND q.status != 'completed' AND q.status != 'no_show'
         ORDER BY q.priority_score DESC, q.created_at ASC\`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const filteredQueue = queue.filter(q => 
    (q.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (q.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">OPD Queue</h1>
          <p className="text-slate-500">Live waiting room and patient queue management.</p>
        </div>
        <Button className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> Add to Queue
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search queue..."
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
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Priority Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Wait Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filteredQueue.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Queue is empty</td></tr>
              ) : (
                filteredQueue.map((q, index) => {
                  const waitTimeMins = Math.floor((new Date() - new Date(q.created_at)) / 60000);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400"/> {q.first_name} {q.last_name}
                      </td>
                      <td className="px-4 py-3">{q.department}</td>
                      <td className="px-4 py-3">
                        <span className={\`px-2 py-1 text-xs rounded-full \${q.priority_score > 50 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}\`}>
                          {q.priority_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={\`px-2 py-1 text-xs rounded-full \${q.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}\`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3"/> {waitTimeMins} mins
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          Call <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
