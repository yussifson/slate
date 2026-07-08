import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function InfectionControl() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    ward_id: '',
    infection_type: '',
    detection_date: '',
    severity: 'moderate',
    status: 'active'
  });

  const { data: patientsList = [] } = useQuery({
    queryKey: ['univ_patients_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute("SELECT id, COALESCE(first_name, 'Unknown') || ' ' || COALESCE(last_name, 'Patient') as name FROM univ_patients WHERE company_id = ?", [companyId]);
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_infection_logs (id, created_at, company_id, patient_id, ward_id, infection_type, organism, source, detection_date, control_measures, status, reported_by)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyId, payload.patient_id, payload.ward_id, payload.infection_type, payload.severity, 'Hospital Acquired', payload.detection_date || new Date().toISOString().split('T')[0], 'Standard Precautions', payload.status, 'System Admin']
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_infection_logs']);
      toast.success('Infection log recorded!');
      setShowModal(false);
      setFormData({ patient_id: '', ward_id: '', infection_type: '', detection_date: '', severity: 'moderate', status: 'active' });
    },
    onError: (err) => {
      toast.error('Failed to log infection: ' + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.patient_id || !formData.infection_type) return toast.error('Please fill required fields');
    createMutation.mutate(formData);
  };


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
      return res.rows._array || Array.from(res.rows);
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
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowModal(true)}>
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
    
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Infection Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Patient</label>
              <select className="w-full h-10 px-3 py-2 border rounded-md bg-white" value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Select Patient...</option>
                {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Infection Type/Name</label>
              <Input value={formData.infection_type} onChange={e => setFormData({...formData, infection_type: e.target.value})} placeholder="e.g. MRSA, COVID-19" />
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. ICU" />
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select className="w-full h-10 px-3 py-2 border rounded-md" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details of the incident" />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Report Incident</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
