import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, User, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function Queue() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    department: '',
    doctor_id: '',
    room_number: '',
    status: 'waiting'
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
      const token = Math.floor(100 + Math.random() * 900).toString();
      await powerSync.execute(
        `INSERT INTO univ_opd_queues (id, created_at, company_id, status, token_number, doctor_id, room_number, patient_id, department, updated_at)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [companyId, payload.status, token, payload.doctor_id, payload.room_number, payload.patient_id, payload.department]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_opd_queues']);
      toast.success('Patient added to OPD Queue!');
      setShowModal(false);
      setFormData({ patient_id: '', department: '', doctor_id: '', room_number: '', status: 'waiting' });
    },
    onError: (err) => {
      toast.error('Failed to add to queue: ' + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.patient_id || !formData.department) return toast.error('Please fill required fields');
    createMutation.mutate(formData);
  };


  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['univ_opd_queues', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT q.*, p.first_name, p.last_name 
         FROM univ_opd_queues q
         LEFT JOIN univ_patients p ON p.id = q.patient_id AND p.company_id = q.company_id
         WHERE q.company_id = ? AND q.status != 'completed' AND q.status != 'no_show'
         ORDER BY q.created_at ASC`,
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
        <Button className="bg-primary text-white" onClick={() => setShowModal(true)}>
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
                <th className="px-4 py-3">Token Number</th>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${q.token_number ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {q.token_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full \${q.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
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
