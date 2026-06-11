import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { Plus, Edit3, Check, Trash2, LayoutGrid, XCircle, Database, TrendingUp, Users, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Available data sources for the workspace
const AVAILABLE_SOURCES = [
  { label: 'Employees', table: 'univ_hr_employees', icon: Users },
  { label: 'CRM Leads', table: 'univ_crm_leads', icon: TrendingUp },
  { label: 'Projects', table: 'univ_projects', icon: Activity },
  { label: 'Support Tickets', table: 'univ_support_tickets', icon: Database },
  { label: 'Inventory Items', table: 'univ_inventory', icon: Database },
  { label: 'Assets', table: 'univ_assets', icon: Database },
  { label: 'Invoices', table: 'univ_invoices', icon: Database },
  { label: 'Procurement POs', table: 'univ_procurement', icon: Database }
];

export default function UnivDashboard({
  title = "Dashboard",
  subtitle = "Dynamic overview of your workspace.",
}) {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Widget Data Cache
  const [widgetData, setWidgetData] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWidget, setNewWidget] = useState({ title: '', table: 'univ_hr_employees', type: 'metric' });

  useEffect(() => {
    if (companyId) {
      fetchLayout();
    }
  }, [companyId]);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_dashboard_configs')
        .select('layout')
        .eq('company_id', companyId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Dashboard Config Error:", error);
      }
      
      let currentLayout = data?.layout || [];
      if (currentLayout.length === 0) {
        // Default Layout
        currentLayout = [
          { id: '1', title: 'Total Employees', table: 'univ_hr_employees', type: 'metric' },
          { id: '2', title: 'Active CRM Leads', table: 'univ_crm_leads', type: 'metric' },
          { id: '3', title: 'Support Tickets', table: 'univ_support_tickets', type: 'metric' }
        ];
      }
      
      setLayout(currentLayout);
      fetchAllWidgetData(currentLayout);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWidgetData = async (currentLayout) => {
    const newData = { ...widgetData };
    for (const w of currentLayout) {
      if (!newData[w.id]) {
        if (w.type === 'metric') {
          const { count, error } = await supabase
            .from(w.table)
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);
          if (!error) {
            newData[w.id] = count;
          }
        }
      }
    }
    setWidgetData(newData);
  };

  const saveLayout = async (newLayout) => {
    setLayout(newLayout);
    try {
      const { error } = await supabase
        .from('univ_dashboard_configs')
        .upsert({ company_id: companyId, layout: newLayout });
      if (error) throw error;
      toast.success("Dashboard layout saved!");
    } catch (e) {
      toast.error("Failed to save dashboard.");
    }
  };

  const addWidget = () => {
    const w = {
      id: Date.now().toString(),
      ...newWidget
    };
    const updated = [...layout, w];
    saveLayout(updated);
    fetchAllWidgetData(updated);
    setIsModalOpen(false);
    setNewWidget({ title: '', table: 'univ_hr_employees', type: 'metric' });
  };

  const removeWidget = (id) => {
    const updated = layout.filter(w => w.id !== id);
    saveLayout(updated);
  };

  return (
    <div className={`flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8 ${view !== 'Default' ? 'hide-default' : ''}`}>
      {/* Header */}
      <div className="view-header flex items-center justify-between mb-6 shrink-0 px-1 pt-2">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-secondary/80 transition-colors">
                <Plus className="w-4 h-4" /> Add Widget
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                <Check className="w-4 h-4" /> Done Editing
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-muted/80 transition-colors">
              <Edit3 className="w-4 h-4" /> Edit Dashboard
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {layout.map((w, idx) => {
            const source = AVAILABLE_SOURCES.find(s => s.table === w.table);
            const Icon = source?.icon || Database;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={w.id} 
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {isEditing && (
                  <button onClick={() => removeWidget(w.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm hover:bg-red-200 transition-colors z-10">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{w.title}</p>
                    <h3 className="text-3xl font-black text-foreground mt-2">
                      {widgetData[w.id] !== undefined ? widgetData[w.id] : '...'}
                    </h3>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs font-medium text-muted-foreground">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Source: {source?.label || w.table}
                </div>
              </motion.div>
            )
          })}
          
          {layout.length === 0 && !isEditing && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl">
              <h3 className="text-lg font-bold text-foreground">Your Dashboard is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Edit Dashboard" to add your first widget.</p>
              <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                <Edit3 className="w-4 h-4" /> Edit Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Widget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Add Widget</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Widget Title</label>
                <input type="text" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} placeholder="e.g. Total Active Leads" className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Data Source</label>
                <select value={newWidget.table} onChange={e => setNewWidget({...newWidget, table: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                  {AVAILABLE_SOURCES.map(s => <option key={s.table} value={s.table}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Widget Type</label>
                <select value={newWidget.type} onChange={e => setNewWidget({...newWidget, type: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                  <option value="metric">Metric Count (Total Rows)</option>
                  {/* Future visualization types can be added here */}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-border">
                <button onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={addWidget} disabled={!newWidget.title} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">Add Widget</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
