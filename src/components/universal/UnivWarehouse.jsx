import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Warehouse, Plus, Layers, AlertCircle, MoreHorizontal, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivWarehouse() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState({
    zone_name: '',
    bay_number: '',
    capacity: '',
    current_occupancy: '',
    status: 'Active'
  });

  useEffect(() => {
    if (companyId) {
      fetchZones();
      const channel = supabase.channel('warehouse_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_warehouses', filter: `company_id=eq.${companyId}` }, () => {
          fetchZones();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_warehouses')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('zone_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setZones(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch warehouse zones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingZone(null);
    setForm({
      zone_name: 'Zone A',
      bay_number: `BAY-${Math.floor(10 + Math.random() * 90)}`,
      capacity: '500',
      current_occupancy: '0',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setForm({
      zone_name: zone.zone_name || '',
      bay_number: zone.bay_number || '',
      capacity: zone.capacity ? String(zone.capacity) : '',
      current_occupancy: zone.current_occupancy ? String(zone.current_occupancy) : '',
      status: zone.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.zone_name.trim()) {
      toast.error('Zone Name is required');
      return;
    }

    const capacityNum = Number(form.capacity) || 0;
    const occupancyNum = Number(form.current_occupancy) || 0;

    if (occupancyNum > capacityNum) {
      toast.error('Current occupancy cannot exceed capacity');
      return;
    }

    const payload = {
      company_id: companyId,
      zone_name: form.zone_name.trim(),
      bay_number: form.bay_number.trim() || null,
      capacity: capacityNum,
      current_occupancy: occupancyNum,
      status: form.status
    };

    try {
      if (editingZone) {
        const { error } = await supabase
          .from('univ_warehouses')
          .update(payload)
          .eq('id', editingZone.id);
        if (error) throw error;
        toast.success('Warehouse zone updated');
      } else {
        const { error } = await supabase
          .from('univ_warehouses')
          .insert(payload);
        if (error) throw error;
        toast.success('Warehouse zone added');
      }
      setIsModalOpen(false);
      fetchZones();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse zone?')) return;
    try {
      const { error } = await supabase
        .from('univ_warehouses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Warehouse zone deleted');
      fetchZones();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = zones.filter(z => 
    `${z.zone_name} ${z.bay_number} ${z.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Warehouse Zones</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage storage capacity, bays, and utilization.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Zone/Bay
          </button>
      </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search zones, bays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((z, idx) => {
              const cap = Number(z.capacity) || 1;
              const occ = Number(z.current_occupancy) || 0;
              const utilPercent = Math.min(100, Math.round((occ / cap) * 100)) || 0;
              const isHighUtil = utilPercent > 85;
              
              return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                key={z.id} 
                className="bg-background border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors shadow-sm group relative"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex flex-col">
                     <span className="font-bold text-lg text-foreground">{z.bay_number || 'N/A'}</span>
                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{z.zone_name}</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenEdit(z)} className="text-muted-foreground hover:text-primary p-1">
                       <Edit className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => handleDelete(z.id)} className="text-muted-foreground hover:text-red-500 p-1">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Capacity Used</span>
                    <span className={`text-xs font-bold ${isHighUtil ? 'text-red-500' : 'text-emerald-500'}`}>{utilPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isHighUtil ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${utilPercent}%` }}></div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">
                    {occ} / {cap} units
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${
                    z.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-background text-foreground border-border'
                  }`}>
                    {z.status}
                  </span>
                  {isHighUtil && <AlertCircle className="w-4 h-4 text-red-500" title="High Utilization" />}
                </div>
              </motion.div>
            )})}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No warehouse zones found.</p>
             </div>
           )}
        </div>
      </div>

      {/* Warehouse Zone/Bay Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingZone ? 'Edit Warehouse Zone/Bay' : 'Add Warehouse Zone/Bay'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  value={form.zone_name}
                  onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
                  placeholder="e.g. North Sector"
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Bay Number / Code</label>
                <input 
                  type="text" 
                  value={form.bay_number}
                  onChange={(e) => setForm({ ...form, bay_number: e.target.value })}
                  placeholder="e.g. BAY-12"
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Total Capacity *</label>
                  <input 
                    type="number" 
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    required
                    min="1"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Current Occupancy</label>
                  <input 
                    type="number" 
                    value={form.current_occupancy}
                    onChange={(e) => setForm({ ...form, current_occupancy: e.target.value })}
                    min="0"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status</label>
                <select 
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted/50 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
