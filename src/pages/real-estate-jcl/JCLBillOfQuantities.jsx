import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, Calculator, 
  FileSpreadsheet, CheckCircle2, Clock, DollarSign, Download,
  Printer, ArrowUpDown, ChevronDown, Filter, FileText, 
  Layers, Settings, Sparkles, FolderPlus, Copy, Save, Check,
  Variable, Play, BookOpen, Sigma, PlusCircle, HelpCircle, X
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

// Built-in presets for quantity surveyors & civil estimators
const DEFAULT_PRESET_FORMULAS = [
  { id: 'f_standard', name: 'Standard Item Cost', expression: 'quantity * unit_rate', description: 'Direct total from measured quantity and unit rate' },
  { id: 'f_waste', name: 'Material Cost + 5% Wastage Allowance', expression: 'quantity * unit_rate * 1.05', description: 'Includes 5% civil material breakage/wastage factor' },
  { id: 'f_vat', name: 'Total with 15% VAT / Levies', expression: 'quantity * unit_rate * 1.15', description: 'Includes standard tax and municipal charges' },
  { id: 'f_labor', name: 'Cost + 20% Labor & Installation', expression: 'quantity * unit_rate * 1.20', description: 'Material cost plus 20% on-site craftsmanship installation' },
  { id: 'f_contractor', name: 'Contractor Margin (Cost + 15% Profit)', expression: 'quantity * unit_rate * 1.15', description: 'Full supply and contract markup' }
];

/**
 * Safely evaluates math expressions supporting spreadsheet variable names:
 * Variables supported:
 *  - quantity (or qty)
 *  - unit_rate (or rate, price)
 *  - vat / tax (0.15)
 *  - waste (1.05)
 *  - Math functions: round, ceil, floor, max, min, sqrt
 */
export function evaluateFormula(expr, context = {}) {
  if (!expr || typeof expr !== 'string') return 0;
  try {
    let clean = expr.trim();
    if (clean.startsWith('=')) clean = clean.substring(1).trim();

    // Mapping contextual variables
    const qty = Number(context.quantity) || 0;
    const rate = Number(context.unit_rate) || 0;
    const vat = 0.15;
    const waste = 1.05;

    // Replace variables case-insensitively with their numeric values
    let sanitized = clean
      .replace(/\bquantity\b/gi, `(${qty})`)
      .replace(/\bqty\b/gi, `(${qty})`)
      .replace(/\bunit_rate\b/gi, `(${rate})`)
      .replace(/\brate\b/gi, `(${rate})`)
      .replace(/\bprice\b/gi, `(${rate})`)
      .replace(/\bvat\b/gi, `(${vat})`)
      .replace(/\bwaste\b/gi, `(${waste})`);

    // Allow standard math functions
    sanitized = sanitized
      .replace(/\bround\(/gi, 'Math.round(')
      .replace(/\bceil\(/gi, 'Math.ceil(')
      .replace(/\bfloor\(/gi, 'Math.floor(')
      .replace(/\bmax\(/gi, 'Math.max(')
      .replace(/\bmin\(/gi, 'Math.min(')
      .replace(/\bsqrt\(/gi, 'Math.sqrt(');

    // Whitelist only numbers, operators, parens, Math methods, decimals
    if (!/^[0-9+\-*/()., Math\w]+$/.test(sanitized)) {
      return qty * rate;
    }

    // Function constructor execution with bound arguments
    const compute = new Function(`return (${sanitized});`);
    const result = Number(compute());
    return isFinite(result) ? result : qty * rate;
  } catch (err) {
    return (Number(context.quantity) || 0) * (Number(context.unit_rate) || 0);
  }
}

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
  const [activeFormulaBar, setActiveFormulaBar] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Custom Formula Library State (Saved formulas per company)
  const [formulaLibrary, setFormulaLibrary] = useState(DEFAULT_PRESET_FORMULAS);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [customFormulasOpen, setCustomFormulasOpen] = useState(false);
  const [newFormula, setNewFormula] = useState({ name: '', expression: '', description: '' });

  // Custom Columns State
  const [customColumns, setCustomColumns] = useState([]);
  const [newColumnModalOpen, setNewColumnModalOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: '', type: 'text', formula: '' });

  // New Project Dialog
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Load Saved Formula Library from LocalStorage
  useEffect(() => {
    if (!companyId) return;
    try {
      const saved = localStorage.getItem(`jcl_boq_formulas_${companyId}`);
      if (saved) {
        setFormulaLibrary(JSON.parse(saved));
      }
      const savedCols = localStorage.getItem(`jcl_boq_cols_${companyId}`);
      if (savedCols) {
        setCustomColumns(JSON.parse(savedCols));
      }
    } catch (e) {}
  }, [companyId]);

  // Load Projects and BOQ Items
  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let fetchedBoqs = [];
      try {
        const boqRes = await supabase.from('univ_boqs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (!boqRes.error && Array.isArray(boqRes.data)) {
          fetchedBoqs = boqRes.data;
        } else if (boqRes.error) {
          console.warn('univ_boqs supabase query issue:', boqRes.error.message);
        }
      } catch (be) {
        console.warn('univ_boqs query exception:', be);
      }

      // Read local cache if database returned empty
      if (fetchedBoqs.length === 0) {
        try {
          const cached = localStorage.getItem(`jcl_boqs_${companyId}`);
          if (cached) fetchedBoqs = JSON.parse(cached);
        } catch (ce) {}
      } else {
        try {
          localStorage.setItem(`jcl_boqs_${companyId}`, JSON.stringify(fetchedBoqs));
        } catch (ce) {}
      }

      const projList = await getCompanyProjects(companyId);
      setBoqs(fetchedBoqs);
      setProjects(projList || []);
    } catch (err) {
      console.error('Failed to load BOQs', err);
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
    try {
      let defaultProj = projects[0] || { id: null, name: 'Default Construction Project' };
      if (selectedProjectId !== 'all') {
        const found = projects.find(p => p.id === selectedProjectId);
        if (found) defaultProj = found;
      }

      const newPayload = {
        company_id: companyId,
        project_name: selectedProjectId !== 'all' ? (projects.find(p => p.id === selectedProjectId)?.name || 'General') : defaultProj.name,
        item_description: 'New Bill Item (Click to edit description)',
        unit: 'm3',
        quantity: '1',
        unit_rate: '0',
        status: 'Draft'
      };

      let newRow = {
        ...newPayload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      try {
        const { data, error } = await supabase.from('univ_boqs').insert(newPayload).select().maybeSingle();
        if (!error && data) {
          newRow = data;
        }
      } catch (insertErr) {
        console.warn('Direct univ_boqs insert fell back to local cache:', insertErr);
      }

      setBoqs(prev => {
        const updated = [newRow, ...prev];
        try { localStorage.setItem(`jcl_boqs_${companyId}`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      setSelectedRowId(newRow.id);
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
      try {
        await supabase
          .from('univ_boqs')
          .update(updateData)
          .eq('id', id)
          .eq('company_id', companyId);
      } catch (supaErr) {
        console.warn('univ_boqs update exception:', supaErr);
      }

      // Update local state smoothly & cache
      setBoqs(prev => {
        const next = prev.map(row => row.id === id ? { ...row, [field]: value } : row);
        try { localStorage.setItem(`jcl_boqs_${companyId}`, JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch (err) {
      console.warn('Inline edit warning:', err);
    } finally {
      setSyncingId(null);
    }
  };

  // Delete Row
  const handleDeleteRow = async (id, description) => {
    if (!confirm(`Are you sure you want to delete "${description || 'this item'}"?`)) return;
    try {
      try {
        await supabase
          .from('univ_boqs')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);
      } catch (supaErr) {
        console.warn('univ_boqs delete exception:', supaErr);
      }

      setBoqs(prev => {
        const next = prev.filter(r => r.id !== id);
        try { localStorage.setItem(`jcl_boqs_${companyId}`, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      if (selectedRowId === id) setSelectedRowId(null);
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Save a new reusable formula into library
  const handleSaveCustomFormula = (e) => {
    e.preventDefault();
    if (!newFormula.name || !newFormula.expression) {
      toast.error('Please specify both a formula name and mathematical expression');
      return;
    }

    const created = {
      id: `f_${Date.now()}`,
      name: newFormula.name.trim(),
      expression: newFormula.expression.trim(),
      description: newFormula.description.trim() || 'Custom user formula'
    };

    const nextList = [created, ...formulaLibrary];
    setFormulaLibrary(nextList);
    try {
      localStorage.setItem(`jcl_boq_formulas_${companyId}`, JSON.stringify(nextList));
    } catch (e) {}

    setNewFormula({ name: '', expression: '', description: '' });
    setFormulaModalOpen(false);
    toast.success(`Formula "${created.name}" saved to library!`);
  };

  // Apply a formula to a row or to all selected items
  const handleApplyFormulaToRow = async (rowId, formulaExpr) => {
    const row = boqs.find(b => b.id === rowId);
    if (!row) return;

    let meta = {};
    try { if (row.item_code && row.item_code.startsWith('{')) meta = JSON.parse(row.item_code); } catch (e) {}
    meta.custom_formula = formulaExpr;

    const updatedItemCode = JSON.stringify(meta);
    await handleSaveCell(rowId, 'item_code', updatedItemCode);
    toast.success(`Formula applied to item`);
  };

  // Add Custom Column
  const handleAddCustomColumn = (e) => {
    e.preventDefault();
    if (!newColumn.name) return;

    const col = {
      id: `col_${Date.now()}`,
      name: newColumn.name.trim(),
      type: newColumn.type,
      formula: newColumn.formula.trim()
    };

    const next = [...customColumns, col];
    setCustomColumns(next);
    try {
      localStorage.setItem(`jcl_boq_cols_${companyId}`, JSON.stringify(next));
    } catch (e) {}

    setNewColumn({ name: '', type: 'text', formula: '' });
    setNewColumnModalOpen(false);
    toast.success(`Added custom column "${col.name}"`);
  };

  // Filtered BOQ List
  const filteredBoqs = useMemo(() => {
    return boqs.filter(b => {
      if (selectedProjectId !== 'all') {
        const proj = projects.find(p => p.id === selectedProjectId);
        if (proj && b.project_name && b.project_name.toLowerCase() !== proj.name.toLowerCase()) {
          return false;
        }
      }

      if (statusFilter !== 'all' && (b.status || 'Draft') !== statusFilter) {
        return false;
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const matchDesc = b.item_description?.toLowerCase().includes(q);
        const matchProj = b.project_name?.toLowerCase().includes(q);
        const matchUnit = b.unit?.toLowerCase().includes(q);
        if (!matchDesc && !matchProj && !matchUnit) return false;
      }

      return true;
    });
  }, [boqs, selectedProjectId, projects, query, statusFilter]);

  // Aggregate Metrics & Grand Recapitulation
  const metrics = useMemo(() => {
    let grandTotal = 0;
    let approvedTotal = 0;
    let draftTotal = 0;
    let totalQty = 0;

    filteredBoqs.forEach(b => {
      let meta = {};
      try { if (b.item_code && b.item_code.startsWith('{')) meta = JSON.parse(b.item_code); } catch (e) {}

      let rowVal = 0;
      if (meta.custom_formula) {
        rowVal = evaluateFormula(meta.custom_formula, { quantity: b.quantity, unit_rate: b.unit_rate });
      } else {
        rowVal = (Number(b.quantity) || 0) * (Number(b.unit_rate) || 0);
      }

      grandTotal += rowVal;
      totalQty += Number(b.quantity) || 0;

      if (b.status === 'Approved') {
        approvedTotal += rowVal;
      } else {
        draftTotal += rowVal;
      }
    });

    return {
      grandTotal,
      approvedTotal,
      draftTotal,
      totalQty,
      totalItems: filteredBoqs.length
    };
  }, [filteredBoqs]);

  // Active selected row for formula bar
  const activeSelectedRow = useMemo(() => {
    return boqs.find(b => b.id === selectedRowId) || filteredBoqs[0] || null;
  }, [boqs, selectedRowId, filteredBoqs]);

  return (
    <div className="h-full flex flex-col bg-background font-sans overflow-hidden">
      
      {/* ── 1. Top Ribbon & Excel Navigation Bar ── */}
      <div className="p-4 border-b border-border bg-card shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-[#005A9C] flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">Bill of Quantities (BOQ)</h1>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomFormulasOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-border bg-background shadow-xs hover:bg-muted"
            >
              <Sigma className="w-3.5 h-3.5 text-primary" /> Formula Library ({formulaLibrary.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewColumnModalOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-border bg-background shadow-xs hover:bg-muted"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Custom Column
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewProjectOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-border bg-background shadow-xs hover:bg-muted"
            >
              <FolderPlus className="w-3.5 h-3.5 text-primary" /> New Project
            </Button>

            <ExportButton
              data={filteredBoqs.map((b, i) => {
                let meta = {};
                try { if (b.item_code && b.item_code.startsWith('{')) meta = JSON.parse(b.item_code); } catch (e) {}
                const rowTotal = meta.custom_formula 
                  ? evaluateFormula(meta.custom_formula, { quantity: b.quantity, unit_rate: b.unit_rate })
                  : (Number(b.quantity) || 0) * (Number(b.unit_rate) || 0);

                return {
                  item_no: i + 1,
                  project: b.project_name || 'General',
                  description: b.item_description,
                  unit: b.unit || 'm3',
                  quantity: Number(b.quantity) || 0,
                  unit_rate_ghs: Number(b.unit_rate) || 0,
                  formula: meta.custom_formula || 'quantity * unit_rate',
                  total_ghs: rowTotal,
                  status: b.status || 'Draft'
                };
              })}
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

        {/* ── 3. Real-Time Formula Bar (Excel-Style `fx`) ── */}
        <div className="mt-3 flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border/80 font-mono text-xs">
          <div className="flex items-center gap-1 text-primary font-bold px-2 py-1 bg-primary/10 rounded-lg shrink-0">
            <Variable className="w-3.5 h-3.5" />
            <span>fx</span>
          </div>

          <div className="text-[11px] font-bold text-muted-foreground shrink-0 border-r border-border/80 pr-2">
            {activeSelectedRow ? (activeSelectedRow.item_description?.slice(0, 24) || 'Row') : 'Select Row'}:
          </div>

          <div className="relative flex-1">
            <Input
              value={activeFormulaBar || (activeSelectedRow ? (() => {
                try {
                  if (activeSelectedRow.item_code?.startsWith('{')) {
                    const m = JSON.parse(activeSelectedRow.item_code);
                    return m.custom_formula || 'quantity * unit_rate';
                  }
                } catch (e) {}
                return 'quantity * unit_rate';
              })() : '')}
              onChange={e => setActiveFormulaBar(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && activeSelectedRow) {
                  await handleApplyFormulaToRow(activeSelectedRow.id, activeFormulaBar);
                  setActiveFormulaBar('');
                }
              }}
              placeholder="e.g. quantity * unit_rate * 1.05  (Press Enter to apply formula)"
              className="h-8 text-xs font-mono bg-background border-border"
            />
          </div>

          <Select
            onValueChange={async (fExpr) => {
              if (activeSelectedRow) {
                await handleApplyFormulaToRow(activeSelectedRow.id, fExpr);
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs font-sans font-medium w-48 bg-background border-border shrink-0">
              <SelectValue placeholder="Preset Formulas" />
            </SelectTrigger>
            <SelectContent>
              {formulaLibrary.map(f => (
                <SelectItem key={f.id} value={f.expression} className="text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{f.expression}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => setFormulaModalOpen(true)}
            className="h-8 px-3 text-xs bg-primary text-white font-semibold gap-1 shrink-0"
            title="Save current formula as preset"
          >
            <Save className="w-3.5 h-3.5" /> Save Formula
          </Button>
        </div>
      </div>

      {/* ── 4. Executive KPI Summary Cards ── */}
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

      {/* ── 5. Interactive Spreadsheet Table View ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="border border-border/90 rounded-2xl bg-card shadow-sm overflow-hidden min-w-[980px]">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Spreadsheet Column Headers (Excel Style) */}
            <thead>
              <tr className="bg-muted/80 text-muted-foreground font-bold border-b border-border">
                <th className="py-2.5 px-3 w-12 text-center border-r border-border/60 text-[10px]">#</th>
                <th className="py-2.5 px-3 w-40 border-r border-border/60">Project</th>
                <th className="py-2.5 px-3 border-r border-border/60 min-w-[260px]">Item Description & Specification</th>
                <th className="py-2.5 px-3 w-24 text-center border-r border-border/60">Unit</th>
                <th className="py-2.5 px-3 w-28 text-right border-r border-border/60">Quantity</th>
                <th className="py-2.5 px-3 w-32 text-right border-r border-border/60">Unit Rate (GH₵)</th>
                <th className="py-2.5 px-3 w-40 border-r border-border/60">Formula (fx)</th>
                <th className="py-2.5 px-3 w-36 text-right border-r border-border/60">Total Amount (GH₵)</th>
                {customColumns.map(col => (
                  <th key={col.id} className="py-2.5 px-3 w-32 text-center border-r border-border/60">
                    {col.name}
                  </th>
                ))}
                <th className="py-2.5 px-3 w-28 text-center border-r border-border/60">Status</th>
                <th className="py-2.5 px-3 w-16 text-center">Actions</th>
              </tr>
            </thead>

            {/* Spreadsheet Body with Inline Cell Editing & Row Focus */}
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={10 + customColumns.length} className="py-12 text-center text-muted-foreground font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading interactive spreadsheet data...
                  </td>
                </tr>
              ) : filteredBoqs.length === 0 ? (
                <tr>
                  <td colSpan={10 + customColumns.length} className="py-16 text-center">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-bold text-sm text-foreground">No Bill of Quantities Items</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Click the "+ Add Line Item" button above to insert rows into this spreadsheet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBoqs.map((row, idx) => {
                  let meta = {};
                  try { if (row.item_code && row.item_code.startsWith('{')) meta = JSON.parse(row.item_code); } catch (e) {}

                  const qty = Number(row.quantity) || 0;
                  const rate = Number(row.unit_rate) || 0;
                  const currentFormula = meta.custom_formula || 'quantity * unit_rate';
                  const total = evaluateFormula(currentFormula, { quantity: qty, unit_rate: rate });
                  const isSyncing = syncingId === row.id;
                  const isRowSelected = selectedRowId === row.id;

                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => setSelectedRowId(row.id)}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        isRowSelected ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : (idx % 2 === 0 ? "bg-card hover:bg-muted/30" : "bg-muted/15 hover:bg-muted/30")
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
                      <td className="py-2 px-3 border-r border-border/60 font-semibold text-foreground truncate max-w-[160px]">
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
                            onClick={(e) => { e.stopPropagation(); setEditingCell({ id: row.id, field: 'item_description' }); setEditValue(row.item_description || ''); }}
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
                            onClick={(e) => { e.stopPropagation(); setEditingCell({ id: row.id, field: 'quantity' }); setEditValue(row.quantity || '0'); }}
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
                            onClick={(e) => { e.stopPropagation(); setEditingCell({ id: row.id, field: 'unit_rate' }); setEditValue(row.unit_rate || '0'); }}
                            className="p-1.5 rounded hover:bg-muted/50 cursor-text font-bold text-foreground"
                            title="Click to edit unit rate"
                          >
                            GH₵{Number(row.unit_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Applied Formula Expression */}
                      <td className="py-1 px-2 border-r border-border/60 font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                        <div 
                          className="px-2 py-1 bg-muted/40 rounded border border-border/40 hover:border-primary/50 flex items-center justify-between"
                          title={`Formula: ${currentFormula}`}
                        >
                          <span className="truncate">{currentFormula}</span>
                          <Variable className="w-3 h-3 text-primary ml-1 shrink-0 opacity-70" />
                        </div>
                      </td>

                      {/* Computed Total Cell with Formula Evaluation */}
                      <td className="py-2 px-3 text-right border-r border-border/60 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.03]">
                        GH₵{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Custom Columns Rendering */}
                      {customColumns.map(col => {
                        let customVal = '—';
                        if (col.formula) {
                          customVal = `GH₵${evaluateFormula(col.formula, { quantity: qty, unit_rate: rate }).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        } else if (meta[col.id]) {
                          customVal = meta[col.id];
                        }
                        return (
                          <td key={col.id} className="py-2 px-3 text-center border-r border-border/60 font-mono text-xs">
                            {customVal}
                          </td>
                        );
                      })}

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
                      <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
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
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-muted-foreground">
                    Custom Formulas
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    GH₵{metrics.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {customColumns.map(col => (
                    <td key={col.id} className="py-3 px-3 text-center font-mono text-xs text-muted-foreground">—</td>
                  ))}
                  <td colSpan={2} className="py-3 px-3 text-center text-xs text-muted-foreground">
                    Auto-Evaluated
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── 6. Create Project Dialog ── */}
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

      {/* ── 7. Save Custom Formula Modal ── */}
      <Dialog open={formulaModalOpen} onOpenChange={setFormulaModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Variable className="w-5 h-5 text-primary" />
              <span>Save Formula to Library</span>
            </DialogTitle>
            <DialogDescription>
              Create and save mathematical formulas to reuse across any column or line item in your Bill of Quantities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomFormula} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Formula Name *</Label>
              <Input
                required
                value={newFormula.name}
                onChange={e => setNewFormula({ ...newFormula, name: e.target.value })}
                placeholder="e.g. Substructure Breakage Factor"
                className="mt-1.5 text-xs"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Mathematical Expression *</Label>
                <span className="text-[10px] text-muted-foreground font-mono">Variables: quantity, unit_rate</span>
              </div>
              <Input
                required
                value={newFormula.expression}
                onChange={e => setNewFormula({ ...newFormula, expression: e.target.value })}
                placeholder="quantity * unit_rate * 1.05"
                className="mt-1.5 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Supported operators: <code className="bg-muted px-1 rounded">+ - * / ( )</code> and math functions <code className="bg-muted px-1 rounded">round, ceil, max</code>.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description / Notes</Label>
              <Input
                value={newFormula.description}
                onChange={e => setNewFormula({ ...newFormula, description: e.target.value })}
                placeholder="e.g. Adds 5% standard allowance for site waste and concrete spillage"
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFormulaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                Save to Library
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 8. Formula Library & Manager Modal ── */}
      <Dialog open={customFormulasOpen} onOpenChange={setCustomFormulasOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sigma className="w-5 h-5 text-primary" />
                <span>Formula Library & Presets</span>
              </DialogTitle>
              <Button
                size="sm"
                onClick={() => { setCustomFormulasOpen(false); setFormulaModalOpen(true); }}
                className="h-7 text-xs bg-primary text-white font-semibold gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Formula
              </Button>
            </div>
            <DialogDescription>
              Pre-configured mathematical rules for quantity surveying, material waste, contractor markups, and taxes.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[380px] overflow-y-auto space-y-2 py-2 pr-1">
            {formulaLibrary.map((f) => (
              <div 
                key={f.id} 
                className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">{f.name}</span>
                    <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-primary">
                      {f.expression}
                    </code>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{f.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (activeSelectedRow) {
                        await handleApplyFormulaToRow(activeSelectedRow.id, f.expression);
                        setCustomFormulasOpen(false);
                      } else {
                        toast('Select a row first to apply this formula');
                      }
                    }}
                    className="h-7 text-[11px] font-semibold gap-1"
                  >
                    <Play className="w-3 h-3 text-emerald-600" /> Apply to Row
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCustomFormulasOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 9. Add Custom Column Modal ── */}
      <Dialog open={newColumnModalOpen} onOpenChange={setNewColumnModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Add Custom Column to Spreadsheet</span>
            </DialogTitle>
            <DialogDescription>
              Extend the BOQ table with custom calculated columns like freight, supplier markups, or inspection notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCustomColumn} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Column Name *</Label>
              <Input
                required
                value={newColumn.name}
                onChange={e => setNewColumn({ ...newColumn, name: e.target.value })}
                placeholder="e.g. 5% Retention Fund"
                className="mt-1.5 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Column Type</Label>
              <Select value={newColumn.type} onValueChange={v => setNewColumn({ ...newColumn, type: v })}>
                <SelectTrigger className="mt-1.5 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">General Text / Notes</SelectItem>
                  <SelectItem value="formula">Calculated Formula (GH₵)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newColumn.type === 'formula' && (
              <div>
                <Label className="text-xs font-semibold">Column Calculation Formula</Label>
                <Input
                  value={newColumn.formula}
                  onChange={e => setNewColumn({ ...newColumn, formula: e.target.value })}
                  placeholder="e.g. quantity * unit_rate * 0.05"
                  className="mt-1.5 text-xs font-mono"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewColumnModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                Add Column
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
