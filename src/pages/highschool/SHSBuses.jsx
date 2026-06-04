import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Bus, Settings, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSBuses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBus, setNewBus] = useState({
    registrationNumber: '',
    capacity: '',
    driverName: '',
    driverPhone: '',
    status: 'Active'
  });

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_transport_bus', user?.company_id);
      setBuses(records);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchBuses();
    }
  }, [user]);

  const handleSaveBus = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_transport_bus',
        title: `Bus ${newBus.registrationNumber}`,
        case_number: `BUS-${Math.floor(Math.random() * 1000)}`,
        status: newBus.status,
        data: {
          ...newBus,
          capacity: parseInt(newBus.capacity) || 0
        }
      };
      
      await base44.createEntity(payload);
      setIsModalOpen(false);
      setNewBus({ registrationNumber: '', capacity: '', driverName: '', driverPhone: '', status: 'Active' });
      fetchBuses();
    } catch (error) {
      console.error('Failed to save bus:', error);
    }
  };

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Maintenance' : 'Active';
    try {
      await base44.updateEntity(id, { status: newStatus });
      fetchBuses();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredBuses = buses.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.data?.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            School Fleet
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage transportation vehicles, capacities, and driver assignments.
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="h-9 gap-2 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md shadow-purple-500/20">
          <Plus className="w-4 h-4" /> Register Bus
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white/60 backdrop-blur-xl ring-1 ring-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-[#6F00FF] shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Fleet</p>
              <h3 className="text-2xl font-black text-slate-800">{buses.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Vehicle Roster</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search registration or driver..." 
                className="pl-9 h-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#6F00FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading fleet...</div>
          ) : filteredBuses.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
                <Bus className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No vehicles registered</h3>
              <p className="text-sm text-slate-500">Add a bus to start managing your fleet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Registration</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Driver Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-sm tracking-widest">{bus.data?.registrationNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Users className="w-4 h-4 text-slate-400" /> {bus.data?.capacity} Seats
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{bus.data?.driverName}</p>
                        <p className="text-xs text-slate-500">{bus.data?.driverPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          bus.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }>
                          {bus.status === 'Maintenance' && <Settings className="w-3 h-3 mr-1 inline" />}
                          {bus.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateStatus(bus.id, bus.status)}
                          className={`h-8 text-xs font-semibold ${bus.status === 'Active' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                        >
                          {bus.status === 'Active' ? 'Send to Maintenance' : 'Set Active'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Register Vehicle</DialogTitle>
              <DialogDescription className="text-purple-100">
                Add a new bus to the school transport fleet.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Registration Number</label>
                <Input 
                  placeholder="e.g. GR-234-21"
                  className="bg-white border-slate-200 rounded-xl uppercase"
                  value={newBus.registrationNumber}
                  onChange={e => setNewBus({...newBus, registrationNumber: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacity (Seats)</label>
                <Input 
                  type="number"
                  placeholder="e.g. 60"
                  className="bg-white border-slate-200 rounded-xl"
                  value={newBus.capacity}
                  onChange={e => setNewBus({...newBus, capacity: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Driver Name</label>
              <Input 
                placeholder="e.g. John Mensah"
                className="bg-white border-slate-200 rounded-xl"
                value={newBus.driverName}
                onChange={e => setNewBus({...newBus, driverName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Driver Phone</label>
              <Input 
                placeholder="e.g. 0541234567"
                className="bg-white border-slate-200 rounded-xl"
                value={newBus.driverPhone}
                onChange={e => setNewBus({...newBus, driverPhone: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-semibold text-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBus} 
              disabled={!newBus.registrationNumber || !newBus.capacity}
              className="rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white font-bold"
            >
              Save Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
