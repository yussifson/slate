import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, Calculator, 
  FileSpreadsheet, CheckCircle2, Clock, DollarSign, Download,
  Printer, ArrowUpDown, ChevronDown, Filter, FileText, 
  Layers, Settings, Sparkles, FolderPlus, Copy, Save, Check
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects } from '@/services/ProjectLookupService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExportButton from '@/components/shared/ExportButton';
import { printCorporateDoc } from '@/lib/exportUtils';
import { useCompany } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Standard Construction Work Breakdown Sections
const DEFAULT_SECTIONS = [
  'All Sections',
  '1.0 Substructure & Earthworks',
  '2.0 Reinforced Concrete Frame',
  '3.0 Blockwork & Masonry',
  '4.0 Roofing & Waterproofing',
  '5.0 Carpentry & Joinery',
  '6.0 Windows & Doors',
  '7.0 Finishes (Plaster, Screed & Tiles)',
  '8.0 MEP (Electrical & Plumbing)',
  '9.0 External Works & Landscaping'
];

const STANDARD_UNITS = ['m3', 'm2', 'm', 'kg', 'ton', 'pcs', 'bags', 'trips', 'set', 'lot', 'sum', 'hrs'];

export default function JCLBillOfQuantities() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { company } = useCompany();

  // Core Data
  const [boqs, setBoqs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [activeSection, setActiveSection] = useState('All Sections');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Spreadsheet In-Grid State
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // New Project Dialog
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // New Row Rapid Entry Modal
  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [quickRow, setQuickRow] = useState({
    project_id: '',
    project_name: '',
    section: '1.0 Substructure & Earthworks',
    item_code: '',
    item_description: '',
    unit: 'm3',
    quantity: '1',
    unit_rate: '0',
    status: 'Approved'
  });

  // Load Projects and BOQ Items
  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [boqRes, projList] = await Promise.all([
        supabase.from('univ_boqs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (boqRes.error && boqRes.error.code !== '42P01') {
        console.warn('BOQ load error:', boqRes.error);
      }
      setBoqs(boqRes.data || []);
      setProjects(projList || []);
    } catch (err) {
      console.error('Failed to load BOQs', err);
      toast.error('Failed to load engineering spreadsheet data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase.channel('jcl_boqs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_boqs', filter: `company_id=eq.${companyId}` }, () => {
        loadData();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, loadData]);

  // Handle Quick Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const payload = {
        company_id: companyId,
        name: newProjectName.trim(),
        project_code: `JCL-PRJ-${Date.now().toString().slice(-4)}`,
        status: 'active'
      };

      const { data, error } = await supabase.from('ops_projects').insert(payload).select().maybeSingle();
      if (error) {
        // Fallback to univ_projects
        await supabase.from('univ_projects').insert(payload);
      }
      toast.success(`Project "${newProjectName}" created!`);
      setNewProjectName('');
      setNewProjectOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  // Add Rapid Blank Row Directly into Spreadsheet
  const handleAddBlankRow = async () => {
    if (!companyId) return;
    try {
      const defaultProj = projects[0] || { name: 'General Engineering' };
      const newPayload = {
        company_id: companyId,
        project_name: selectedProjectId !== 'all' ? (projects.find(p => p.id === selectedProjectId)?.name || 'General') : defaultProj.name,
        item_description: 'New Bill Item (Click to edit description)',
        unit: 'm3',
        quantity: '1',
        unit_rate: '0',
        status: 'Draft'
      };

      const { data, error } = await supabase.from('univ_boqs').insert(newPayload).select().single();
      if (error) throw error;
      setBoqs(prev => [data, ...prev]);
      toast.success('New line item added to spreadsheet');
    } catch (err) {
      toast.error('Failed to insert new row');
    }
  };

  // Save Inline Cell Edit
  const handleSaveCell = async (id, field, value) => {
    setEditingCell(null);
    setSyncingId(id);
    try {
      const updateData = { [field]: value };
      const { error } = await supabase
        .from('univ_boqs')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;

      // Update local state smoothly
      setBoqs(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    } catch (err) {
      toast.error('Failed to save edit');
      loadData();
    } finally {
      setSyncingId(null);
    }
  };

  // Delete Row
  const handleDeleteRow = async (id, description) => {
    if (!confirm(`Are you sure you want to delete "${description || 'this item'}"?`)) return;
    try {
      const { error } = await supabase
        .from('univ_boqs')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      setBoqs(prev => prev.filter(r => r.id !== id));
      toast.success('Line item removed');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Filtered dataset
  const filteredBoqs = useMemo(() => {
    return boqs.filter(b => {
      const matchProject = selectedProjectId === 'all' || b.project_id === selectedProjectId || b.project_name === projects.find(p => p.id === selectedProjectId)?.name;
      const matchQuery = `${b.item_description || ''} ${b.project_name || ''} ${b.unit || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchProject && matchQuery && matchStatus;
    });
  }, [boqs, selectedProjectId, projects, query, statusFilter]);

  // Aggregate Calculations
  const metrics = useMemo(() => {
    let totalItems = filteredBoqs.length;
    let totalQty = 0;
    let grandTotal = 0;

    filteredBoqs.forEach(b => {
      const q = Number(b.quantity) || 0;
      const r = Number(b.unit_rate) || 0;
      totalQty += q;
      grandTotal += (q * r);
    });

    const approvedTotal = filteredBoqs
      .filter(b => (b.status || '').toLowerCase() === 'approved')
      .reduce((s, b) => s + ((Number(b.quantity) || 0) * (Number(b.unit_rate) || 0)), 0);

    const draftTotal = filteredBoqs
      .filter(b => (b.status || '').toLowerCase() === 'draft')
      .reduce((s, b) => s + ((Number(b.quantity) || 0) * (Number(b.unit_rate) || 0)), 0);

    return { totalItems, totalQty, grandTotal, approvedTotal, draftTotal };
  }, [filteredBoqs]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-background text-foreground font-sans">
      
      {/* ── 1. Spreadsheet Header Bar ── */}
      <div className="border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-[#005A9C] flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Engineering BOQ Spreadsheet</h1>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
                  Pro Engine
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Interactive bill of quantities, rates, materials estimations & project budgeting
              </p>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewProjectOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-border"
            >
              <FolderPlus className="w-3.5 h-3.5 text-primary" /> New Project
            </Button>

            <ExportButton
              data={filteredBoqs.map((b, i) => ({
                item_no: i + 1,
                project: b.project_name || 'General',
                description: b.item_description,
                unit: b.unit || 'm3',
                quantity: Number(b.quantity) || 0,
                unit_rate_ghs: Number(b.unit_rate) || 0,
                total_ghs: (Number(b.quantity) || 0) * (Number(b.unit_rate) || 0),
                status: b.status || 'Draft'
              }))}
              filename="engineering_boq_spreadsheet"
              title="Bill of Quantities (BOQ) Specification"
              subtitle="JCL Real Estate • Engineering & Project Procurement"
              label="Export & Print"
            />

            <Button
              size="sm"
              onClick={handleAddBlankRow}
              className="h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Line Item
            </Button>
          </div>
        </div>

        {/* ── 2. Formula & Project Context Ribbon ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-border/60">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Project Picker */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/80">
              <span className="text-[11px] font-bold text-muted-foreground uppercase px-2">Project:</span>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="h-7 text-xs font-semibold bg-background border-border/60 min-w-[170px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects Combined</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/80">
              <span className="text-[11px] font-bold text-muted-foreground uppercase px-2">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs font-semibold bg-background border-border/60 min-w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Procuring">Procuring</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search items, specs, units..."
              className="h-8 text-xs pl-8 bg-background border-border"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Executive KPI Summary Cards ── */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/10 shrink-0 border-b border-border/40">
        <div className="p-3 bg-card rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Grand BOQ</span>
            <p className="text-xl font-extrabold text-foreground mt-0.5">
              GH₵{metrics.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-card rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Approved Value</span>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              GH₵{metrics.approvedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-card rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending / Draft</span>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              GH₵{metrics.draftTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-card rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Bill Items</span>
            <p className="text-xl font-extrabold text-foreground mt-0.5">{metrics.totalItems} entries</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 4. Interactive Spreadsheet Table View ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="border border-border/90 rounded-2xl bg-card shadow-sm overflow-hidden min-w-[900px]">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Spreadsheet Column Headers (Excel Style with Column Letters) */}
            <thead>
              <tr className="bg-muted/80 text-muted-foreground font-bold border-b border-border">
                <th className="py-2.5 px-3 w-12 text-center border-r border-border/60 text-[10px]">#</th>
                <th className="py-2.5 px-3 w-44 border-r border-border/60">Project</th>
                <th className="py-2.5 px-3 border-r border-border/60 min-w-[280px]">Item Description & Specification</th>
                <th className="py-2.5 px-3 w-28 text-center border-r border-border/60">Unit</th>
                <th className="py-2.5 px-3 w-32 text-right border-r border-border/60">Quantity</th>
                <th className="py-2.5 px-3 w-36 text-right border-r border-border/60">Unit Rate (GH₵)</th>
                <th className="py-2.5 px-3 w-40 text-right border-r border-border/60">Total Amount (GH₵)</th>
                <th className="py-2.5 px-3 w-32 text-center border-r border-border/60">Status</th>
                <th className="py-2.5 px-3 w-16 text-center">Actions</th>
              </tr>
            </thead>

            {/* Spreadsheet Body with Inline Cell Editing */}
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading interactive spreadsheet data...
                  </td>
                </tr>
              ) : filteredBoqs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-bold text-sm text-foreground">No Bill of Quantities Items</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Click the "+ Add Line Item" button above to insert rows into this spreadsheet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBoqs.map((row, idx) => {
                  const qty = Number(row.quantity) || 0;
                  const rate = Number(row.unit_rate) || 0;
                  const total = qty * rate;
                  const isSyncing = syncingId === row.id;

                  return (
                    <tr 
                      key={row.id} 
                      className={cn(
                        "group hover:bg-primary/[0.03] transition-colors",
                        idx % 2 === 0 ? "bg-card" : "bg-muted/15"
                      )}
                    >
                      {/* Row Index */}
                      <td className="py-2 px-3 text-center border-r border-border/60 text-[11px] font-mono font-medium text-muted-foreground">
                        {isSyncing ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-primary mx-auto" />
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Project Name Cell */}
                      <td className="py-2 px-3 border-r border-border/60 font-semibold text-foreground truncate max-w-[180px]">
                        {row.project_name || 'General Project'}
                      </td>

                      {/* Item Description (In-Grid Editable) */}
                      <td className="py-1 px-2 border-r border-border/60 font-medium text-foreground">
                        {editingCell?.id === row.id && editingCell?.field === 'item_description' ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(row.id, 'item_description', editValue)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCell(row.id, 'item_description', editValue);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="h-8 text-xs bg-background ring-2 ring-primary"
                          />
                        ) : (
                          <div 
                            onClick={() => { setEditingCell({ id: row.id, field: 'item_description' }); setEditValue(row.item_description || ''); }}
                            className="p-1.5 rounded hover:bg-muted/50 cursor-text flex items-center justify-between"
                            title="Click to edit item description"
                          >
                            <span className="truncate">{row.item_description}</span>
                            <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-2 shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Unit Cell */}
                      <td className="py-1 px-2 text-center border-r border-border/60">
                        <Select
                          value={row.unit || 'm3'}
                          onValueChange={(val) => handleSaveCell(row.id, 'unit', val)}
                        >
                          <SelectTrigger className="h-7 text-xs font-mono font-semibold justify-center border-transparent hover:border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_UNITS.map(u => (
                              <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Quantity Cell (In-Grid Numeric Formula Input) */}
                      <td className="py-1 px-2 text-right border-r border-border/60 font-mono">
                        {editingCell?.id === row.id && editingCell?.field === 'quantity' ? (
                          <Input
                            type="number"
                            step="any"
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(row.id, 'quantity', editValue)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCell(row.id, 'quantity', editValue);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="h-8 text-xs text-right bg-background ring-2 ring-primary"
                          />
                        ) : (
                          <div 
                            onClick={() => { setEditingCell({ id: row.id, field: 'quantity' }); setEditValue(row.quantity || '0'); }}
                            className="p-1.5 rounded hover:bg-muted/50 cursor-text font-bold text-foreground"
                            title="Click to edit quantity"
                          >
                            {Number(row.quantity || 0).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Unit Rate Cell (In-Grid Numeric Input) */}
                      <td className="py-1 px-2 text-right border-r border-border/60 font-mono">
                        {editingCell?.id === row.id && editingCell?.field === 'unit_rate' ? (
                          <Input
                            type="number"
                            step="any"
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(row.id, 'unit_rate', editValue)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveCell(row.id, 'unit_rate', editValue);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="h-8 text-xs text-right bg-background ring-2 ring-primary"
                          />
                        ) : (
                          <div 
                            onClick={() => { setEditingCell({ id: row.id, field: 'unit_rate' }); setEditValue(row.unit_rate || '0'); }}
                            className="p-1.5 rounded hover:bg-muted/50 cursor-text font-bold text-foreground"
                            title="Click to edit unit rate"
                          >
                            GH₵{Number(row.unit_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Computed Total Cell (Quantity × Unit Rate) */}
                      <td className="py-2 px-3 text-right border-r border-border/60 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.03]">
                        GH₵{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status Selector Cell */}
                      <td className="py-1 px-2 text-center border-r border-border/60">
                        <Select
                          value={row.status || 'Draft'}
                          onValueChange={(val) => handleSaveCell(row.id, 'status', val)}
                        >
                          <SelectTrigger className="h-7 text-[10px] font-bold uppercase rounded-full border-transparent hover:border-border justify-center">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Approved" className="text-xs text-emerald-600 font-bold">Approved</SelectItem>
                            <SelectItem value="Draft" className="text-xs text-amber-600 font-bold">Draft</SelectItem>
                            <SelectItem value="Procuring" className="text-xs text-blue-600 font-bold">Procuring</SelectItem>
                            <SelectItem value="Completed" className="text-xs text-purple-600 font-bold">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRow(row.id, row.item_description)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Recapitulation Footer */}
            {filteredBoqs.length > 0 && (
              <tfoot>
                <tr className="bg-muted/90 font-extrabold border-t-2 border-border text-foreground">
                  <td colSpan={4} className="py-3 px-4 text-left uppercase text-xs tracking-wider">
                    Total Estimated Bill Value ({filteredBoqs.length} line items)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs">
                    {metrics.totalQty.toLocaleString()} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-muted-foreground">
                    —
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    GH₵{metrics.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-xs text-muted-foreground">
                    Auto-Calculated
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── 5. Create Project Dialog ── */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              <span>Create New Engineering Project</span>
            </DialogTitle>
            <DialogDescription>
              Add a new development site to organize bills of quantities, architectural drawings, and procurement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Project / Site Name *</Label>
              <Input
                required
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="e.g. East Legon Luxury Villas - Phase 2"
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewProjectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creatingProject} className="bg-primary text-white font-semibold">
                {creatingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
