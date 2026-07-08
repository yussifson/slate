import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function StaffRoster() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    ward_or_department: '',
    shift_date: '',
    shift_type: 'Morning',
    on_call: 'false'
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['univ_profiles_list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute("SELECT id, COALESCE(first_name, 'Unknown') || ' ' || COALESCE(last_name, 'Staff') as name FROM profiles WHERE company_id = ?", [companyId]);
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_staff_shifts (id, company_id, created_at, updated_at, staff_id, shift_date, shift_type, ward_or_department, on_call)
         VALUES (uuid(), ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?)`,
        [companyId, payload.staff_id, payload.shift_date, payload.shift_type, payload.ward_or_department, payload.on_call]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_duty_rosters']);
      toast.success('Shift assigned successfully!');
      setShowModal(false);
      setFormData({ staff_id: '', ward_or_department: '', shift_date: '', shift_type: 'Morning', on_call: 'false' });
    },
    onError: (err) => {
      toast.error('Failed to assign shift: ' + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.staff_id || !formData.shift_date) return toast.error('Please fill required fields');
    createMutation.mutate(formData);
  };


  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['univ_duty_rosters', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT r.*, s.first_name, s.last_name, s.role 
         FROM univ_staff_shifts r
         LEFT JOIN profiles s ON s.id = r.staff_id AND s.company_id = r.company_id
         WHERE r.company_id = ? ORDER BY r.shift_date ASC`,
        [companyId]
      );
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const filteredRoster = roster.filter(r => 
    (r.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.ward_or_department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Staff Duty Roster</h1>
          <p className="text-slate-500">Manage shift scheduling and on-call assignments.</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => setShowModal(true)}>
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
                <th className="px-4 py-3">On Call</th>
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
                    <td className="px-4 py-3">{r.ward_or_department}</td>
                    <td className="px-4 py-3 flex items-center gap-2 text-slate-600">
                      <CalendarIcon className="w-4 h-4"/> {r.shift_date}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.shift_type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${r.is_on_call === 'true' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {r.is_on_call === 'true' ? 'Yes' : 'No'}
                      </span>
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
            <DialogTitle>Schedule Staff Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Staff Name</label>
              <Input value={formData.staff_id} onChange={e => setFormData({...formData, staff_id: e.target.value})} placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. ER, ICU" />
            </div>
            <div>
              <label className="text-sm font-medium">Shift Type</label>
              <select className="w-full h-10 px-3 py-2 border rounded-md" value={formData.shift_type} onChange={e => setFormData({...formData, shift_type: e.target.value})}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Schedule Shift</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
