import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, User } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function UnivOrgChart() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    role: '',
    department: '',
    reports_to: '',
    level: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('univ_orgchart').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('univ_orgchart').insert([{ ...formData, company_id: companyId }]);
    if (!error) {
      setShowForm(false);
      setFormData({ employee_name: '', role: '', department: '', reports_to: '', level: '' });
      fetchItems();
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  
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
    <div className="p-6 max-w-4xl mx-auto font-sans ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <User className="text-blue-600" /> Org Chart
        </h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Dashboard"].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={fetchItems} className="p-2 bg-muted hover:bg-muted/60 rounded-full transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} /> Add New
          </button>
      </div>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-6 rounded-xl shadow-lg border border-border mb-8 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground">
            <X size={20} />
          </button>
          <h2 className="text-xl font-semibold mb-4 text-foreground">New Org Chart Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">employee name</label>
              <input
                type="text"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter employee name`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter role`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter department`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">reports to</label>
              <input
                type="text"
                value={formData.reports_to}
                onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })}
                className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter reports to`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1 capitalize">level</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="border border-border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter level`}
              />
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="mt-6 flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
            <Save size={20} /> Save Entry
          </button>
        </motion.div>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">employee name</p>
                <p className="text-foreground font-medium">{item.employee_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">role</p>
                <p className="text-foreground font-medium">{item.role || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">department</p>
                <p className="text-foreground font-medium">{item.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">reports to</p>
                <p className="text-foreground font-medium">{item.reports_to || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">level</p>
                <p className="text-foreground font-medium">{item.level || '-'}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground bg-background rounded-xl border border-dashed border-border">
            <p>No org chart records found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
