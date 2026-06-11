import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileSpreadsheet, Plus, CheckCircle2, Clock, Calculator, MoreHorizontal, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  project_name: '',
  item_description: '',
  unit: 'pcs',
  quantity: 1,
  unit_rate: 0,
  status: 'Draft'
};

export default function UnivBOQ() {
  const companyId = useCompanyId();
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetchBOQs();
      const channel = supabase.channel('boqs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_boqs', filter: `company_id=eq.${companyId}` }, () => {
          fetchBOQs();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchBOQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_boqs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setBoqs(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch BOQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_id: companyId,
        project_id: '00000000-0000-0000-0000-000000000000',
        item_description: `${form.item_description} (Project: ${form.project_name})`,
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        unit_rate: Number(form.unit_rate) || 0,
        total_amount: (Number(form.quantity) || 0) * (Number(form.unit_rate) || 0),
        status: form.status
      };

      const { error } = await supabase.from('univ_boqs').insert(payload);
      if (error) throw error;
      toast.success('BOQ item added');
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to add BOQ item');
    }
  };

  const filtered = boqs.filter(b => 
    `${b.item_description} ${b.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Bill of Quantities (BOQ)</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage project materials, quantities, rates, and costs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search descriptions..."
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
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Unit</th>
                <th className="p-4 font-semibold text-right">Quantity</th>
                <th className="p-4 font-semibold text-right">Unit Rate</th>
                <th className="p-4 font-semibold text-right">Total Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={b.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-medium text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" /> {b.item_description}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs uppercase tracking-wider">
                    {b.unit}
                  </td>
                  <td className="p-4 font-mono font-semibold text-right">
                    {Number(b.quantity).toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-muted-foreground text-right">
                    ${Number(b.unit_rate).toFixed(2)}
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-600 text-right">
                    ${Number(b.total_amount).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'Procuring' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {b.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : b.status === 'Procuring' ? <Clock className="w-3 h-3" /> : <Calculator className="w-3 h-3" />}
                      {b.status}
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Add BOQ Item</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Project Name</label>
                  <input required value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Item Description</label>
                  <input required value={form.item_description} onChange={e => setForm({...form, item_description: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                    <input type="number" step="any" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Unit</label>
                    <input required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Unit Rate</label>
                    <input type="number" step="any" required value={form.unit_rate} onChange={e => setForm({...form, unit_rate: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                      <option>Draft</option>
                      <option>Approved</option>
                      <option>Procuring</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Save Item</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
