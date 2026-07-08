import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function BloodBank() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');

  
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    blood_group: 'A+',
    unit_number: '',
    component_type: 'Whole Blood',
    donor_name: '',
    collection_date: '',
    expiry_date: '',
    units_available: 1,
    status: 'available'
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      await powerSync.execute(
        `INSERT INTO univ_blood_bank (id, created_at, company_id, blood_group, unit_number, component_type, donor_name, collection_date, expiry_date, units_available, status, updated_at)
         VALUES (uuid(), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [companyId, payload.blood_group, payload.unit_number || 'UNIT-' + Math.floor(Math.random() * 90000), payload.component_type, payload.donor_name, payload.collection_date || new Date().toISOString().split('T')[0], payload.expiry_date || new Date().toISOString().split('T')[0], parseInt(payload.units_available) || 1, payload.status]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_blood_bank']);
      toast.success('Blood unit logged successfully!');
      setShowModal(false);
      setFormData({ blood_group: 'A+', unit_number: '', component_type: 'Whole Blood', donor_name: '', collection_date: '', expiry_date: '', units_available: 1, status: 'available' });
    },
    onError: (err) => {
      toast.error('Failed to log blood unit: ' + err.message);
    }
  });

  const handleSave = () => {
    if (!formData.blood_group || !formData.component_type) return toast.error('Please provide blood group and component type');
    createMutation.mutate(formData);
  };


  const { data: bloodUnits = [], isLoading } = useQuery({
    queryKey: ['univ_blood_bank', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM univ_blood_bank WHERE company_id = ? ORDER BY blood_group ASC`,
        [companyId]
      );
      return res.rows._array || Array.from(res.rows);
    },
    enabled: !!companyId
  });

  const filteredUnits = bloodUnits.filter(u => 
    (u.blood_group || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.unit_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Blood Bank</h1>
          <p className="text-slate-500">Manage blood inventory and crossmatch requests.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">Crossmatch Request</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Receive Blood Unit
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by group or unit ID..."
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
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Unit Number</th>
                <th className="px-4 py-3">Component</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filteredUnits.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No blood units in inventory</td></tr>
              ) : (
                filteredUnits.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-red-600 flex items-center gap-2">
                      <Droplet className="w-4 h-4" /> {unit.blood_group}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{unit.unit_number}</td>
                    <td className="px-4 py-3 text-slate-500">{unit.component_type || 'Whole Blood'}</td>
                    <td className="px-4 py-3 text-slate-500">{unit.expiry_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${unit.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {unit.status || 'unknown'}
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
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Receive Blood Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Blood Group</label>
              <select className="w-full h-10 px-3 py-2 border rounded-md" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                <option value="">Select Group...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Component Type</label>
              <Input value={formData.component_type} onChange={e => setFormData({...formData, component_type: e.target.value})} placeholder="e.g. Whole Blood, Plasma" />
            </div>
            <div>
              <label className="text-sm font-medium">Quantity (Bags/Units)</label>
              <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} placeholder="1" />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>Receive Unit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
