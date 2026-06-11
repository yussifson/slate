import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle2, Clock, Truck, MapPin, MoreHorizontal, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDelivery() {
  const companyId = useCompanyId();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchDeliveries();
      const channel = supabase.channel('deliveries_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_deliveries', filter: `company_id=eq.${companyId}` }, () => {
          fetchDeliveries();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_deliveries')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setDeliveries(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    const newDelivery = {
      company_id: companyId,
      tracking_number: `TRK-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      recipient_name: 'New Recipient',
      delivery_address: 'Pending Address',
      status: 'Pending'
    };
    try {
      const { error } = await supabase.from('univ_deliveries').insert(newDelivery);
      if (error) throw error;
      toast.success('Package scanned into system');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = deliveries.filter(d => 
    `${d.tracking_number} ${d.recipient_name} ${d.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Delivery Tracking</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage shipments, track statuses, and capture Proof of Delivery (POD).</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleScan} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <QrCode className="w-4 h-4" /> Scan Package
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tracking numbers..."
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
                <th className="p-4 font-semibold">Tracking #</th>
                <th className="p-4 font-semibold">Recipient</th>
                <th className="p-4 font-semibold">Destination</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Last Updated</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={d.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <Package className="w-4 h-4 text-primary" />
                       <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold tracking-wider text-xs border border-border">{d.tracking_number}</code>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-foreground">
                    {d.recipient_name}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {d.delivery_address}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      d.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      d.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {d.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                      {d.status === 'In Transit' && <Truck className="w-3 h-3" />}
                      {d.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(d.updated_at).toLocaleString()}
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
