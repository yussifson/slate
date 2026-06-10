import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Truck, Plus, Activity, AlertTriangle, Settings, Wrench, MoreHorizontal, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivFleet() {
  const companyId = useCompanyId();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchVehicles();
      const channel = supabase.channel('fleet_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_fleet', filter: `company_id=eq.${companyId}` }, () => {
          fetchVehicles();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_fleet')
        .select('*')
        .eq('company_id', companyId)
        .order('vehicle_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setVehicles(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setVehicles([
          { id: '1', vehicle_name: 'Truck Alpha', license_plate: 'XYZ-1234', vehicle_type: 'Heavy Truck', status: 'Active', mileage: 45000, last_service_date: '2026-05-10' },
          { id: '2', vehicle_name: 'Van Bravo', license_plate: 'ABC-5678', vehicle_type: 'Delivery Van', status: 'Maintenance', mileage: 82000, last_service_date: '2026-01-15' },
          { id: '3', vehicle_name: 'Truck Charlie', license_plate: 'LMN-9012', vehicle_type: 'Light Truck', status: 'Active', mileage: 12000, last_service_date: '2026-06-01' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    const newVehicle = {
      company_id: companyId,
      vehicle_name: `Vehicle ${Math.floor(100 + Math.random() * 900)}`,
      license_plate: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle_type: 'Van',
      status: 'Active',
      mileage: 0,
      last_service_date: new Date().toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_fleet').insert(newVehicle);
      if (error) throw error;
      toast.success('Vehicle added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add vehicle');
    }
  };

  const filtered = vehicles.filter(v => 
    `${v.vehicle_name} ${v.license_plate} ${v.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Fleet Management</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage vehicles, maintenance, and mileage.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAddVehicle} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Fleet</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{vehicles.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Truck className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Active Vehicles</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{vehicles.filter(v => v.status === 'Active').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><Activity className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">In Maintenance</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{vehicles.filter(v => v.status === 'Maintenance').length}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Wrench className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search fleet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Vehicle</th>
                <th className="p-4 font-semibold">License Plate</th>
                <th className="p-4 font-semibold">Mileage</th>
                <th className="p-4 font-semibold">Last Service</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={v.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                       <Truck className="w-4 h-4 text-primary" /> {v.vehicle_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{v.vehicle_type}</div>
                  </td>
                  <td className="p-4">
                    <code className="bg-muted px-2 py-1 rounded border border-border font-mono text-xs font-bold tracking-wider">{v.license_plate}</code>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {Number(v.mileage).toLocaleString()} mi
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {v.last_service_date || '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      v.status === 'Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {v.status === 'Active' && <Activity className="w-3 h-3" />}
                      {v.status === 'Maintenance' && <Wrench className="w-3 h-3" />}
                      {v.status === 'Out of Service' && <AlertTriangle className="w-3 h-3" />}
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
