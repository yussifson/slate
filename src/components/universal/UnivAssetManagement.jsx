import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Monitor, Truck, Home, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivAssetManagement() {
  const companyId = useCompanyId();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchAssets();
      const channel = supabase.channel('assets_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_assets', filter: `company_id=eq.${companyId}` }, () => {
          fetchAssets();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_assets')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setAssets(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    const newAsset = {
      company_id: companyId,
      name: 'New Asset',
      category: 'Equipment',
      status: 'Active',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_value: 0
    };
    try {
      const { error } = await supabase.from('univ_assets').insert(newAsset);
      if (error) throw error;
      toast.success('Asset added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add asset');
    }
  };

  const filtered = assets.filter(a => 
    `${a.name} ${a.category} ${a.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Vehicle': return <Truck className="w-4 h-4" />;
      case 'Building': return <Home className="w-4 h-4" />;
      case 'Equipment': default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Asset Management</h2>
           <p className="text-sm text-muted-foreground mt-1">Track and manage company equipment and properties.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddAsset} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Asset Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Value</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Purchase Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={a.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-semibold text-foreground">
                    {a.name}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium flex items-center gap-2">
                    {getCategoryIcon(a.category)} {a.category}
                  </td>
                  <td className="p-4 font-bold text-foreground">
                    ${Number(a.purchase_value).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                      a.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      a.status === 'Under Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {a.status === 'Under Maintenance' && <AlertTriangle className="w-3 h-3" />} {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {a.purchase_date}
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
