import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { Plus, Edit3, Check, Trash2, LayoutGrid, XCircle, Database, TrendingUp, Users, Activity, Save } from 'lucide-react';

// Available data sources for the workspace
const AVAILABLE_SOURCES = [
  { label: 'Employees', table: 'univ_hr_employees', icon: Users },
  { label: 'CRM Leads', table: 'univ_crm_leads', icon: TrendingUp },
  { label: 'Projects', table: 'univ_projects', icon: Activity },
  { label: 'Support Tickets', table: 'univ_support_tickets', icon: Database },
  { label: 'Inventory Items', table: 'univ_inventory', icon: Database },
  { label: 'Assets', table: 'univ_assets', icon: Database },
  { label: 'Invoices', table: 'univ_invoices', icon: Database },
  { label: 'Procurement POs', table: 'univ_procurement', icon: Database },
  { label: 'Payroll Records', table: 'univ_payroll', icon: Database },
  { label: 'Bookings', table: 'univ_bookings', icon: Database },
  { label: 'Recruitment', table: 'univ_recruitment', icon: Users },
  { label: 'Attendance', table: 'univ_attendance', icon: Activity },
];

const DEFAULT_LAYOUT = [
  { id: '1', title: 'Total Employees', table: 'univ_hr_employees', type: 'metric' },
  { id: '2', title: 'Active CRM Leads', table: 'univ_crm_leads', type: 'metric' },
  { id: '3', title: 'Support Tickets', table: 'univ_support_tickets', type: 'metric' },
];

export default function UnivDashboard({
  title = "Dashboard",
  subtitle = "Dynamic overview of your workspace.",
}) {
  const companyId = useCompanyId();
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widgetData, setWidgetData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWidget, setNewWidget] = useState({ title: '', table: 'univ_hr_employees', type: 'metric' });
  const [saveStatus, setSaveStatus] = useState('');

  const LOCAL_KEY = `dashboard_layout_${companyId}`;

  useEffect(() => {
    if (companyId) {
      fetchLayout();
    }
  }, [companyId]);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      // 1. Try to get from localStorage first for instant display
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        setLayout(parsed);
        fetchAllWidgetData(parsed);
      }

      // 2. Try to get from Supabase (may fail if table doesn't exist yet)
      const { data, error } = await supabase
        .from('univ_dashboard_configs')
        .select('layout')
        .eq('company_id', companyId)
        .maybeSingle();

      if (!error && data?.layout && data.layout.length > 0) {
        // Supabase has data — use it and update localStorage
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data.layout));
        setLayout(data.layout);
        fetchAllWidgetData(data.layout);
      } else if (!local) {
        // No local and no DB — use default
        setLayout(DEFAULT_LAYOUT);
        fetchAllWidgetData(DEFAULT_LAYOUT);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      // Fall back to default if everything fails
      const local = localStorage.getItem(LOCAL_KEY);
      const fallback = local ? JSON.parse(local) : DEFAULT_LAYOUT;
      setLayout(fallback);
      fetchAllWidgetData(fallback);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWidgetData = async (currentLayout) => {
    if (!companyId) return;
    const newData = {};
    for (const w of currentLayout) {
      if (w.type === 'metric') {
        try {
          const { count, error } = await supabase
            .from(w.table)
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);
          newData[w.id] = error ? 'N/A' : (count ?? 0);
        } catch {
          newData[w.id] = 'N/A';
        }
      }
    }
    setWidgetData(prev => ({ ...prev, ...newData }));
  };

  const saveLayout = async (newLayout) => {
    setSaving(true);
    setSaveStatus('saving');
    
    // 1. Always persist to localStorage immediately (guaranteed to work)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newLayout));
    setLayout(newLayout);

    // 2. Try to also save to Supabase
    try {
      const { error } = await supabase
        .from('univ_dashboard_configs')
        .upsert(
          { company_id: companyId, layout: newLayout },
          { onConflict: 'company_id' }
        );
      if (error) throw error;
      setSaveStatus('saved');
    } catch (e) {
      // Supabase failed (table may not exist) — localStorage already saved it
      console.warn('Supabase dashboard save failed, using local storage:', e.message);
      setSaveStatus('local');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const addWidget = () => {
    if (!newWidget.title) return;
    const w = { id: Date.now().toString(), ...newWidget };
    const updated = [...layout, w];
    saveLayout(updated);
    fetchAllWidgetData([w]);
    setIsModalOpen(false);
    setNewWidget({ title: '', table: 'univ_hr_employees', type: 'metric' });
  };

  const removeWidget = (id) => {
    const updated = layout.filter(w => w.id !== id);
    saveLayout(updated);
  };

  const statusLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved to cloud' : saveStatus === 'local' ? '✓ Saved locally' : '';

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-8">
      {/* Header */}
      <div className="view-header flex items-center justify-between mb-6 shrink-0 px-1 pt-2 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${saveStatus === 'saving' ? 'bg-muted text-muted-foreground animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
              {statusLabel}
            </span>
          )}
          {isEditing ? (
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-secondary/80 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Widget
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" /> Done
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-muted/80 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit Dashboard
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {layout.map((w, idx) => {
            const source = AVAILABLE_SOURCES.find(s => s.table === w.table);
            const Icon = source?.icon || Database;
            const count = widgetData[w.id];
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={w.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {isEditing && (
                  <button
                    onClick={() => removeWidget(w.id)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm hover:bg-red-200 transition-colors z-10"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{w.title}</p>
                    <h3 className="text-3xl font-black text-foreground mt-2">
                      {count !== undefined ? count : <span className="text-muted-foreground text-base font-medium animate-pulse">Loading...</span>}
                    </h3>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs font-medium text-muted-foreground">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" /> {source?.label || w.table}
                </div>
              </motion.div>
            );
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" /> Add Widget
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Widget Title</label>
                <input
                  type="text"
                  value={newWidget.title}
                  onChange={e => setNewWidget({ ...newWidget, title: e.target.value })}
                  placeholder="e.g. Total Active Leads"
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Data Source</label>
                <select
                  value={newWidget.table}
                  onChange={e => setNewWidget({ ...newWidget, table: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"
                >
                  {AVAILABLE_SOURCES.map(s => <option key={s.table} value={s.table}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-border">
                <button onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={addWidget} disabled={!newWidget.title} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  Add Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
