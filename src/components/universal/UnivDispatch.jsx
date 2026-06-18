import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { motion } from 'framer-motion';
import { Search, MapPin, Navigation, User, Plus, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Package, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDispatch() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [dispatch, setDispatch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: drivers = [] } = useIndustryRecords('driver');
  const { data: shipments = [] } = useIndustryRecords('shipment');
  const mutateRecord = useMutateIndustryRecord();

  const [form, setForm] = useState({
    driver_name: '',
    status: 'Available',
    current_location: '',
    shipment_id: '',
  });

  useEffect(() => {
    if (companyId) {
      fetchDispatch();
      const channel = supabase.channel('dispatch_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_dispatch', filter: `company_id=eq.${companyId}` }, () => {
          fetchDispatch();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchDispatch = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_dispatch WHERE company_id = ? ORDER BY driver_name ASC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setDispatch(data || []);
    } catch (err) {
      // Mock data removed
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.driver_name) return toast.error('Select a driver');

    const newDispatch = {
      id: crypto.randomUUID(),
      company_id: companyId,
      driver_name: form.driver_name,
      status: form.status,
      current_location: form.current_location || 'Depot',
      shipment_id: form.shipment_id || null,
    };

    try {
      const _payload = newDispatch;
      const _keys = Object.keys(_payload);
      const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      const _plhdr = _keys.map(() => '?').join(', ');
      await powerSync.execute(`INSERT INTO univ_dispatch (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
      
      // Update Shipment status to 'In Transit' if assigned
      if (form.shipment_id) {
         const targetShipment = shipments.find(s => s.id === form.shipment_id);
         if (targetShipment) {
            mutateRecord.mutate({
               id: form.shipment_id,
               recordType: 'shipment',
               data: { ...targetShipment.data, status: 'In Transit' }
            });
         }
      }

      toast.success('Dispatch assigned successfully');
      setIsModalOpen(false);
      setForm({ driver_name: '', status: 'Available', current_location: '', shipment_id: '' });
      fetchDispatch();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to assign dispatch');
    }
  };

  const markDelivered = async (dispatchRecord) => {
    try {
       await powerSync.execute(`UPDATE univ_dispatch SET status = ? WHERE id = ?`, ['Delivered', dispatchRecord.id]);
       if (dispatchRecord.shipment_id) {
          const targetShipment = shipments.find(s => s.id === dispatchRecord.shipment_id);
          if (targetShipment) {
             mutateRecord.mutate({
                id: dispatchRecord.shipment_id,
                recordType: 'shipment',
                data: { ...targetShipment.data, status: 'Delivered' }
             });
             toast.success('Shipment marked as Delivered!');
          }
       }
       fetchDispatch();
    } catch (err) {
       toast.error('Failed to update status');
    }
  };

  const filtered = dispatch.filter(d =>
    `${d.driver_name} ${d.status} ${d.current_location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Driver Dispatch</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage driver assignments and real-time status.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Dispatch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">On Route</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'On Route').length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Navigation className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'Available').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Delivered</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{dispatch.filter(d => d.status === 'Delivered').length}</h3>
          </div>
          <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 rounded-xl"><CheckSquare className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drivers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Driver Name</th>
                <th className="p-4 font-semibold">Shipment</th>
                <th className="p-4 font-semibold">Current Location</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d, idx) => {
                const shipment = shipments.find(s => s.id === d.shipment_id);
                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={d.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> {d.driver_name}
                    </td>
                    <td className="p-4">
                      {shipment ? (
                        <div className="flex items-center gap-1.5 text-primary font-bold">
                          <Package className="w-4 h-4" /> {shipment.data?.trackingNumber || 'Active'}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {d.current_location || 'Unknown'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                          d.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          d.status === 'Delivered' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          d.status === 'On Route' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          d.status === 'Resting' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-background text-foreground border-primary/40'
                        }`}>
                        {d.status === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                        {d.status === 'On Route' && <Navigation className="w-3 h-3" />}
                        {d.status === 'Resting' && <Clock className="w-3 h-3" />}
                        {d.status === 'Delivered' && <CheckSquare className="w-3 h-3" />}
                        {d.status === 'Off Duty' && <AlertCircle className="w-3 h-3" />}
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {d.status !== 'Delivered' && d.shipment_id && (
                        <button onClick={(e) => { e.stopPropagation(); markDelivered(d); }} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors mr-2">
                          Mark Delivered
                        </button>
                      )}
                      <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-primary/40 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-primary/40 flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-black text-foreground">Assign Dispatch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-full"><AlertCircle className="w-5 h-5 rotate-45" /></button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Select Driver *</label>
                <select required value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:outline-none text-sm">
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(drv => (
                    <option key={drv.id} value={drv.data?.driverName}>{drv.data?.driverName} ({drv.data?.driverId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Assign Shipment</label>
                <select value={form.shipment_id} onChange={e => setForm({ ...form, shipment_id: e.target.value })} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:outline-none text-sm">
                  <option value="">-- Unassigned --</option>
                  {shipments.filter(s => s.status !== 'Delivered').map(ship => (
                    <option key={ship.id} value={ship.id}>{ship.data?.trackingNumber} - to {ship.data?.destination}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Initial Status</label>
                <select required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:outline-none text-sm">
                  <option>Available</option>
                  <option>On Route</option>
                  <option>Resting</option>
                  <option>Off Duty</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Current Location</label>
                <input type="text" placeholder="e.g. Main Depot" value={form.current_location} onChange={e => setForm({ ...form, current_location: e.target.value })} className="w-full h-10 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:outline-none text-sm" />
              </div>
              <div className="pt-4 border-t border-primary/40 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">Assign Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
