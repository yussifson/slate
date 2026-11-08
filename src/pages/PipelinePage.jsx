import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch, Plus, Search, Edit2, Trash2, Eye, User, Calendar,
  DollarSign, Tag, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Filter, Shield, Users, Briefcase, ChevronRight, MoreVertical
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_STAGES = [
  { id: 'lead_capture', name: 'Lead Capture', color: '#3B82F6', order: 0 },
  { id: 'qualification', name: 'Qualification', color: '#8B5CF6', order: 1 },
  { id: 'proposal', name: 'Proposal / Viewing', color: '#F59E0B', order: 2 },
  { id: 'negotiation', name: 'Negotiation', color: '#10B981', order: 3 },
  { id: 'closed_won', name: 'Closed Won', color: '#059669', order: 4 },
  { id: 'closed_lost', name: 'Closed Lost', color: '#EF4444', order: 5 },
];

export default function PipelinePage() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [pipelines, setPipelines] = useState([]);
  const [pipelineItems, setPipelineItems] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Drawers & Modals
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [inspectorItem, setInspectorItem] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [pipelineStages, setPipelineStages] = useState(DEFAULT_STAGES);
  const [newStageName, setNewStageName] = useState('');

  // Forms
  const [itemForm, setItemForm] = useState({
    title: '',
    stageId: 'lead_capture',
    priority: 'medium',
    assignee: '',
    value: 0,
    dueDate: '',
    tags: '',
    description: '',
  });

  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    category: 'real_estate',
    item_label: 'Deal',
    description: '',
  });

  const isAdmin = useMemo(() => {
    const r = (user?.role || '').toLowerCase();
    return ['admin', 'super_admin', 'company_admin', 'owner', 'managing_partner'].includes(r);
  }, [user?.role]);

  // ── Load Pipelines & Items (PowerSync + Supabase Fallback) ──
  const fetchAllData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);

      // 1. Fetch Pipelines
      let pipelineRows = [];
      try {
        const res = await powerSync.execute(
          `SELECT * FROM case_pipelines WHERE company_id = ? ORDER BY created_at ASC`,
          [companyId]
        );
        pipelineRows = res.rows._array || Array.from(res.rows || []);
      } catch (e) {
        console.warn('[PipelinePage] PowerSync pipeline query failed:', e);
      }

      if (!pipelineRows || pipelineRows.length === 0) {
        const { data: supaPipes } = await supabase
          .from('case_pipelines')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });
        if (supaPipes && supaPipes.length > 0) {
          pipelineRows = supaPipes;
        }
      }

      // If still no pipeline exists, create default sales pipeline
      if (!pipelineRows || pipelineRows.length === 0) {
        const defaultPipeId = generateUUID();
        const now = new Date().toISOString();
        const defaultPayload = {
          id: defaultPipeId,
          company_id: companyId,
          name: 'Sales Pipeline',
          category: 'real_estate',
          item_label: 'Deal',
          stages: JSON.stringify(DEFAULT_STAGES),
          is_default: 'true',
          created_at: now,
          updated_at: now,
        };
        try {
          await supabase.from('case_pipelines').insert(defaultPayload);
        } catch (_) {}
        try {
          await powerSync.execute(
            `INSERT INTO case_pipelines (id, company_id, name, category, item_label, stages, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [defaultPipeId, companyId, 'Sales Pipeline', 'real_estate', 'Deal', JSON.stringify(DEFAULT_STAGES), 'true', now, now]
          );
        } catch (_) {}
        pipelineRows = [defaultPayload];
      }

      setPipelines(pipelineRows);
      const activeId = activePipelineId || pipelineRows[0]?.id;
      if (!activePipelineId && pipelineRows[0]?.id) {
        setActivePipelineId(pipelineRows[0].id);
      }

      // 2. Fetch Pipeline Items (case_pipeline_states)
      let itemRows = [];
      try {
        const res = await powerSync.execute(
          `SELECT * FROM case_pipeline_states WHERE company_id = ? ORDER BY created_at DESC`,
          [companyId]
        );
        itemRows = res.rows._array || Array.from(res.rows || []);
      } catch (e) {
        console.warn('[PipelinePage] PowerSync states query failed:', e);
      }

      if (!itemRows || itemRows.length === 0) {
        const { data: supaItems } = await supabase
          .from('case_pipeline_states')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (supaItems && supaItems.length > 0) {
          itemRows = supaItems;
        }
      }

      setPipelineItems(itemRows);

      // 3. Fetch Staff / Team for Assignees
      try {
        const empRes = await powerSync.execute(
          `SELECT id, name, first_name, last_name, email, role FROM univ_hr_employees WHERE company_id = ? ORDER BY name ASC`,
          [companyId]
        );
        const empList = (empRes.rows._array || Array.from(empRes.rows || [])).map(e => ({
          id: e.id,
          name: e.name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email,
          email: e.email,
          role: e.role
        }));
        if (empList.length > 0) {
          setEmployees(empList);
        } else {
          const { data: supaProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('company_id', companyId);
          if (supaProfiles) {
            setEmployees(supaProfiles.map(p => ({
              id: p.id,
              name: p.full_name || p.email,
              email: p.email,
              role: p.role
            })));
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('[PipelinePage] Failed to load pipelines:', err);
      toast.error('Failed to load pipeline data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (companyId) {
      const channel1 = supabase
        .channel(`case_pipelines_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'case_pipelines', filter: `company_id=eq.${companyId}` }, fetchAllData)
        .subscribe();
      const channel2 = supabase
        .channel(`case_pipeline_states_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'case_pipeline_states', filter: `company_id=eq.${companyId}` }, fetchAllData)
        .subscribe();
      return () => {
        supabase.removeChannel(channel1);
        supabase.removeChannel(channel2);
      };
    }
  }, [companyId]);

  const activePipeline = useMemo(() => {
    return pipelines.find(p => p.id === activePipelineId) || pipelines[0] || null;
  }, [pipelines, activePipelineId]);

  const stages = useMemo(() => {
    if (!activePipeline?.stages) return DEFAULT_STAGES;
    try {
      const parsed = typeof activePipeline.stages === 'string' ? JSON.parse(activePipeline.stages) : activePipeline.stages;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAGES;
    } catch (e) {
      return DEFAULT_STAGES;
    }
  }, [activePipeline]);

  // Normalize parsed items for active pipeline
  const normalizedItems = useMemo(() => {
    if (!activePipeline) return [];
    return pipelineItems
      .filter(item => item.pipeline_id === activePipeline.id)
      .map(item => {
        let meta = {};
        try {
          meta = typeof item.stage_history === 'string' ? JSON.parse(item.stage_history) : item.stage_history || {};
        } catch (_) {}
        const stageObj = stages.find(s => s.id === item.current_stage_id) || stages[0];
        return {
          ...item,
          title: item.case_title || meta.title || 'Untitled Deal',
          stageId: item.current_stage_id || stages[0]?.id,
          stageName: item.current_stage_name || stageObj?.name || 'Lead Capture',
          priority: meta.priority || 'medium',
          assignee: meta.assignee || 'Unassigned',
          value: Number(meta.value) || 0,
          dueDate: meta.dueDate || meta.due_date || '',
          description: meta.description || '',
          tags: Array.isArray(meta.tags) ? meta.tags : [],
        };
      });
  }, [pipelineItems, activePipeline, stages]);

  const filteredItems = useMemo(() => {
    return normalizedItems.filter(item => {
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.assignee?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === 'all' || item.stageId === stageFilter;
      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchSearch && matchStage && matchPriority;
    });
  }, [normalizedItems, search, stageFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = normalizedItems.length;
    const closedCount = normalizedItems.filter(i => i.stageId === 'closed_won' || i.stageName?.toLowerCase().includes('won') || i.stageName?.toLowerCase().includes('closed')).length;
    const inProgressCount = totalCount - closedCount;
    const totalValue = normalizedItems.reduce((acc, i) => acc + (i.value || 0), 0);
    return { totalCount, inProgressCount, closedCount, totalValue };
  }, [normalizedItems]);

  // ── Handlers: Item Creation / Update / Delete ──
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.title.trim()) {
      toast.error('Item title is required');
      return;
    }

    try {
      const now = new Date().toISOString();
      const currentStage = stages.find(s => s.id === itemForm.stageId) || stages[0];
      const tagsArray = typeof itemForm.tags === 'string' ? itemForm.tags.split(',').map(t => t.trim()).filter(Boolean) : itemForm.tags || [];

      const metaPayload = {
        title: itemForm.title.trim(),
        priority: itemForm.priority,
        assignee: itemForm.assignee,
        value: Number(itemForm.value) || 0,
        dueDate: itemForm.dueDate,
        tags: tagsArray,
        description: itemForm.description,
      };

      if (editingItemId) {
        // Direct Supabase update
        await supabase
          .from('case_pipeline_states')
          .update({
            case_title: itemForm.title.trim(),
            current_stage_id: currentStage.id,
            current_stage_name: currentStage.name,
            stage_history: JSON.stringify(metaPayload),
            updated_at: now,
          })
          .eq('id', editingItemId)
          .eq('company_id', companyId);

        // PowerSync write-through
        try {
          await powerSync.execute(
            `UPDATE case_pipeline_states SET
              case_title = ?, current_stage_id = ?, current_stage_name = ?,
              stage_history = ?, updated_at = ?
            WHERE id = ? AND company_id = ?`,
            [itemForm.title.trim(), currentStage.id, currentStage.name, JSON.stringify(metaPayload), now, editingItemId, companyId]
          );
        } catch (_) {}

        toast.success(`${activePipeline?.item_label || 'Deal'} updated successfully`);
      } else {
        const newItemId = generateUUID();
        const insertPayload = {
          id: newItemId,
          company_id: companyId,
          pipeline_id: activePipeline?.id,
          pipeline_name: activePipeline?.name,
          current_stage_id: currentStage.id,
          current_stage_name: currentStage.name,
          case_title: itemForm.title.trim(),
          stage_history: JSON.stringify(metaPayload),
          stage_entered_at: now,
          created_at: now,
          updated_at: now,
        };

        // Direct Supabase insert
        await supabase.from('case_pipeline_states').insert(insertPayload);

        // PowerSync write-through
        try {
          await powerSync.execute(
            `INSERT INTO case_pipeline_states (
              id, company_id, pipeline_id, pipeline_name, current_stage_id,
              current_stage_name, case_title, stage_history, stage_entered_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newItemId, companyId, activePipeline?.id, activePipeline?.name,
              currentStage.id, currentStage.name, itemForm.title.trim(),
              JSON.stringify(metaPayload), now, now, now
            ]
          );
        } catch (_) {}

        toast.success(`New ${activePipeline?.item_label || 'Deal'} created`);
      }

      setShowItemForm(false);
      setEditingItemId(null);
      fetchAllData();
    } catch (err) {
      console.error('[PipelinePage] Save item error:', err);
      toast.error('Failed to save item');
    }
  };

  const handleUpdateItemStage = async (itemId, newStageId) => {
    const nextStage = stages.find(s => s.id === newStageId);
    if (!nextStage) return;

    try {
      const now = new Date().toISOString();
      await supabase
        .from('case_pipeline_states')
        .update({
          current_stage_id: nextStage.id,
          current_stage_name: nextStage.name,
          stage_entered_at: now,
          updated_at: now,
        })
        .eq('id', itemId)
        .eq('company_id', companyId);

      try {
        await powerSync.execute(
          `UPDATE case_pipeline_states SET current_stage_id = ?, current_stage_name = ?, stage_entered_at = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
          [nextStage.id, nextStage.name, now, now, itemId, companyId]
        );
      } catch (_) {}

      toast.success(`Stage moved to ${nextStage.name}`);
      fetchAllData();
    } catch (_) {
      toast.error('Failed to update stage');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await supabase.from('case_pipeline_states').delete().eq('id', itemId).eq('company_id', companyId);
      try {
        await powerSync.execute(`DELETE FROM case_pipeline_states WHERE id = ? AND company_id = ?`, [itemId, companyId]);
      } catch (_) {}
      toast.success('Item deleted');
      setDeleteItemId(null);
      if (inspectorItem?.id === itemId) setInspectorItem(null);
      fetchAllData();
    } catch (_) {
      toast.error('Failed to delete item');
    }
  };

  // ── Handlers: Pipeline Creation ──
  const handleSavePipeline = async (e) => {
    e.preventDefault();
    if (!pipelineForm.name.trim()) {
      toast.error('Pipeline name required');
      return;
    }

    try {
      const newPipeId = generateUUID();
      const now = new Date().toISOString();
      const stagesToSave = pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES;
      const payload = {
        id: newPipeId,
        company_id: companyId,
        name: pipelineForm.name.trim(),
        category: pipelineForm.category || 'real_estate',
        item_label: pipelineForm.item_label || 'Deal',
        description: pipelineForm.description || '',
        stages: JSON.stringify(stagesToSave),
        is_default: 'false',
        created_at: now,
        updated_at: now,
      };

      await supabase.from('case_pipelines').insert(payload);
      try {
        await powerSync.execute(
          `INSERT INTO case_pipelines (id, company_id, name, category, item_label, description, stages, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newPipeId, companyId, payload.name, payload.category, payload.item_label, payload.description, payload.stages, 'false', now, now]
        );
      } catch (_) {}

      toast.success('New pipeline created');
      setShowPipelineModal(false);
      setActivePipelineId(newPipeId);
      setPipelineForm({ name: '', category: 'real_estate', item_label: 'Deal', description: '' });
      fetchAllData();
    } catch (_) {
      toast.error('Failed to create pipeline');
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 pb-24 w-full max-w-full space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      {/* ── 1. Top Native Header (Clean, dedicated for Pipelines, exact CRM Leads design) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
              Pipeline Deals
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button
              onClick={() => setShowPipelineModal(true)}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial h-9 px-3 text-xs font-bold border-border rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>New Pipeline</span>
            </Button>
          )}

          <Button
            onClick={() => {
              setEditingItemId(null);
              setItemForm({
                title: '',
                stageId: stages[0]?.id || 'lead_capture',
                priority: 'medium',
                assignee: user?.user_metadata?.full_name || '',
                value: 50000,
                dueDate: format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'),
                tags: '',
                description: '',
              });
              setShowItemForm(true);
            }}
            size="sm"
            className="flex-1 sm:flex-initial h-9 px-3.5 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add {activePipeline?.item_label || 'Deal'}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Dedicated Mobile 2x2 Stats Grid (< md) & Desktop Row (>= md) ── */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Briefcase className="w-3.5 h-3.5 text-[#005A9C]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Deals</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{stats.totalCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">In active flow</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-sm font-black text-amber-600 truncate">{stats.inProgressCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Active stages</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Closed Won</span>
          </div>
          <p className="text-sm font-black text-emerald-600 truncate">{stats.closedCount}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Converted</span>
        </div>
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline Value</span>
          </div>
          <p className="text-sm font-black text-[#005A9C] truncate">{formatCurrency(stats.totalValue, 'USD')}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Gross deal value</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Pipeline Deals</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{stats.totalCount}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">{activePipeline?.name || 'Sales Flow'}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#005A9C]/10 text-[#005A9C] flex items-center justify-center border border-[#005A9C]/20 shadow-inner">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">In Progress</span>
              <p className="text-2xl font-extrabold text-amber-600 tracking-tight">{stats.inProgressCount}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Active deal cycles</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Closed / Converted</span>
              <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">{stats.closedCount}</p>
              <p className="text-[11px] text-emerald-600/80 font-semibold">Won milestones</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Valuation</span>
              <p className="text-2xl font-extrabold text-[#005A9C] tracking-tight">{formatCurrency(stats.totalValue, 'USD')}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Pipeline deal value</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Pipeline Selector Pill Bar (Scrollable on Mobile) ── */}
      {pipelines.length > 1 && (
        <div className="w-full overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1.5 min-w-max bg-card/90 border border-border/80 p-1.5 rounded-2xl shadow-xs">
            {pipelines.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePipelineId(p.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                  activePipeline?.id === p.id
                    ? 'bg-[#005A9C] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <GitBranch className="h-3.5 w-3.5 shrink-0" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Search & Filter Bar (Matching CRM Leads Exactly) ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-card border border-border/80 p-2.5 sm:p-3 rounded-2xl shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${activePipeline?.item_label?.toLowerCase() || 'deal'} title, assignee, details...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 sm:pl-9 h-9 text-xs bg-background rounded-xl"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] sm:w-[160px] bg-background border-border/80 rounded-xl shrink-0">
              <SelectValue placeholder="Stage Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Stages ({normalizedItems.length})</SelectItem>
              {stages.map(st => (
                <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-xs w-[110px] sm:w-[130px] bg-background border-border/80 rounded-xl shrink-0">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 5. Pure List View (No Kanban Board, Dedicated Mobile Cards < md & Desktop Table >= md) ── */}
      {/* Mobile Native Card View (< md) */}
      <div className="md:hidden space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            No pipeline items found. Tap "Add {activePipeline?.item_label || 'Deal'}" to create one.
          </div>
        ) : (
          filteredItems.map(item => {
            const stageObj = stages.find(s => s.id === item.stageId) || stages[0];
            return (
              <div
                key={item.id}
                onClick={() => setInspectorItem(item)}
                className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.assignee || 'Unassigned'}</p>
                  </div>
                  <span className="font-bold font-mono text-sm text-[#005A9C] shrink-0">
                    {formatCurrency(item.value, 'USD')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-[10px]">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: stageObj?.color || '#3B82F6', color: stageObj?.color || '#3B82F6' }}
                  >
                    {stageObj?.name || 'In Progress'}
                  </Badge>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <Select
                      value={item.stageId}
                      onValueChange={v => handleUpdateItemStage(item.id, v)}
                    >
                      <SelectTrigger className="h-7 text-[10px] w-[110px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map(st => (
                          <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Data Table (>= md) */}
      <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground border-b font-extrabold">
              <tr>
                <th className="p-3.5 pl-4">{activePipeline?.item_label || 'Deal'} Title</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5 font-right">Est. Valuation</th>
                <th className="p-3.5">Target Date</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No pipeline items found. Click "Add {activePipeline?.item_label || 'Deal'}" to capture a deal.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const stageObj = stages.find(s => s.id === item.stageId) || stages[0];
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setInspectorItem(item)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 pl-4 font-bold text-foreground text-xs">
                        {item.title}
                      </td>
                      <td className="p-3.5" onClick={e => e.stopPropagation()}>
                        <Select
                          value={item.stageId}
                          onValueChange={v => handleUpdateItemStage(item.id, v)}
                        >
                          <SelectTrigger className="h-7 text-[10px] font-bold w-[130px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map(st => (
                              <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5',
                            item.priority === 'high' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                            item.priority === 'low' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          )}
                        >
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted-foreground font-medium">
                        {item.assignee || 'Unassigned'}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-sm text-[#005A9C]">
                        {formatCurrency(item.value, 'USD')}
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        {item.dueDate || 'N/A'}
                      </td>
                      <td className="p-3.5 pr-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setItemForm({
                                title: item.title,
                                stageId: item.stageId,
                                priority: item.priority,
                                assignee: item.assignee,
                                value: item.value,
                                dueDate: item.dueDate,
                                tags: (item.tags || []).join(', '),
                                description: item.description,
                              });
                              setShowItemForm(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-over Inspector Drawer ── */}
      <Sheet open={!!inspectorItem} onOpenChange={open => !open && setInspectorItem(null)}>
        <SheetContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6">
          {inspectorItem && (
            <div className="space-y-4">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {inspectorItem.priority} priority
                  </Badge>
                  <Badge className="bg-[#005A9C]/10 text-[#005A9C] border-[#005A9C]/30 text-[10px]">
                    {inspectorItem.stageName}
                  </Badge>
                </div>
                <SheetTitle className="text-base font-bold text-foreground mt-2">
                  {inspectorItem.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Est. Valuation: <span className="font-bold text-[#005A9C]">{formatCurrency(inspectorItem.value, 'USD')}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-muted/30 rounded-xl space-y-1.5 border border-border/60">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignee:</span>
                    <span className="font-semibold text-foreground">{inspectorItem.assignee || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Date:</span>
                    <span className="font-mono text-foreground">{inspectorItem.dueDate || 'None set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pipeline:</span>
                    <span className="font-semibold text-foreground">{activePipeline?.name}</span>
                  </div>
                </div>

                {inspectorItem.description && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Notes & Overview</Label>
                    <p className="p-3 bg-card border border-border/80 rounded-xl text-xs text-foreground whitespace-pre-wrap">
                      {inspectorItem.description}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Stage Progression</Label>
                  <Select
                    value={inspectorItem.stageId}
                    onValueChange={v => {
                      handleUpdateItemStage(inspectorItem.id, v);
                      setInspectorItem(prev => ({ ...prev, stageId: v }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(st => (
                        <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    onClick={() => {
                      setEditingItemId(inspectorItem.id);
                      setItemForm({
                        title: inspectorItem.title,
                        stageId: inspectorItem.stageId,
                        priority: inspectorItem.priority,
                        assignee: inspectorItem.assignee,
                        value: inspectorItem.value,
                        dueDate: inspectorItem.dueDate,
                        tags: (inspectorItem.tags || []).join(', '),
                        description: inspectorItem.description,
                      });
                      setInspectorItem(null);
                      setShowItemForm(true);
                    }}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Deal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteItemId(inspectorItem.id);
                      setInspectorItem(null);
                    }}
                    className="h-9 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Add / Edit Item Sheet ── */}
      <Sheet open={showItemForm} onOpenChange={setShowItemForm}>
        <SheetContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6">
          <SheetHeader className="mb-3">
            <SheetTitle>{editingItemId ? 'Edit Deal' : `New ${activePipeline?.item_label || 'Deal'}`}</SheetTitle>
            <SheetDescription>Configure deal parameters and track workflow status</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
            <div>
              <Label className="text-xs font-semibold">Title *</Label>
              <Input
                value={itemForm.title}
                onChange={e => setItemForm({ ...itemForm, title: e.target.value })}
                placeholder="e.g. 4-Bedroom Penthouse Acquisition"
                className="h-9 rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Stage</Label>
                <Select value={itemForm.stageId} onValueChange={v => setItemForm({ ...itemForm, stageId: v })}>
                  <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(st => (
                      <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={itemForm.priority} onValueChange={v => setItemForm({ ...itemForm, priority: v })}>
                  <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high" className="text-xs">🔴 High</SelectItem>
                    <SelectItem value="medium" className="text-xs">🟡 Medium</SelectItem>
                    <SelectItem value="low" className="text-xs">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Estimated Value ($)</Label>
                <Input
                  type="number"
                  value={itemForm.value}
                  onChange={e => setItemForm({ ...itemForm, value: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Target Close Date</Label>
                <Input
                  type="date"
                  value={itemForm.dueDate}
                  onChange={e => setItemForm({ ...itemForm, dueDate: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Assignee (Team Members)</Label>
              {employees.length > 0 ? (
                <div className="space-y-1.5 mt-1">
                  <div className="border border-border/70 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-background">
                    {employees.map(emp => {
                      const selectedAssignees = (itemForm.assignee || '').split(',').map(s => s.trim()).filter(Boolean);
                      const isSelected = selectedAssignees.includes(emp.name);
                      return (
                        <label key={emp.id} className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5 hover:bg-muted/30 px-1 rounded-lg">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let next;
                              if (e.target.checked) {
                                next = [...selectedAssignees, emp.name];
                              } else {
                                next = selectedAssignees.filter(n => n !== emp.name);
                              }
                              setItemForm({ ...itemForm, assignee: next.join(', ') });
                            }}
                            className="rounded text-[#005A9C] focus:ring-[#005A9C]"
                          />
                          <span className="font-medium text-foreground">{emp.name}</span>
                          {emp.role && <span className="text-[10px] text-muted-foreground">({emp.role})</span>}
                        </label>
                      );
                    })}
                  </div>
                  <Input
                    value={itemForm.assignee}
                    onChange={e => setItemForm({ ...itemForm, assignee: e.target.value })}
                    placeholder="Selected assignees or type custom name..."
                    className="h-8 rounded-xl text-xs"
                  />
                </div>
              ) : (
                <Input
                  value={itemForm.assignee}
                  onChange={e => setItemForm({ ...itemForm, assignee: e.target.value })}
                  placeholder="Agent / Team lead"
                  className="h-9 rounded-xl text-xs mt-1"
                />
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold">Notes & Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Key requirements, client conditions, milestone notes..."
                rows={3}
                className="rounded-xl text-xs mt-1 resize-none"
              />
            </div>

            <Button type="submit" className="w-full h-9 rounded-xl text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white mt-2">
              {editingItemId ? 'Update Deal' : 'Save Deal to Pipeline'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── New Pipeline Dialog ── */}
      <Dialog open={showPipelineModal} onOpenChange={setShowPipelineModal}>
        <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-4 sm:p-6 bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Create Workflow Pipeline</DialogTitle>
            <DialogDescription>Define a dedicated pipeline category and label</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePipeline} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Pipeline Name *</Label>
              <Input
                value={pipelineForm.name}
                onChange={e => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                placeholder="e.g. Commercial Leasing Pipeline"
                className="h-9 rounded-xl text-xs mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={pipelineForm.category} onValueChange={v => setPipelineForm({ ...pipelineForm, category: v })}>
                  <SelectTrigger className="h-9 rounded-xl text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_estate" className="text-xs">Real Estate</SelectItem>
                    <SelectItem value="sales" className="text-xs">Sales</SelectItem>
                    <SelectItem value="projects" className="text-xs">Projects</SelectItem>
                    <SelectItem value="procurement" className="text-xs">Procurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Item Label</Label>
                <Input
                  value={pipelineForm.item_label}
                  onChange={e => setPipelineForm({ ...pipelineForm, item_label: e.target.value })}
                  placeholder="Deal, Property, Lead"
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                value={pipelineForm.description}
                onChange={e => setPipelineForm({ ...pipelineForm, description: e.target.value })}
                placeholder="Pipeline purpose..."
                className="h-9 rounded-xl text-xs mt-1"
              />
            </div>

            {/* Pipeline Stage Builder */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Pipeline Stages ({pipelineStages.length})</Label>
                <button
                  type="button"
                  onClick={() => setPipelineStages(DEFAULT_STAGES)}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                >
                  Reset Default
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {pipelineStages.map((st, idx) => (
                  <div key={st.id || idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color || '#3B82F6' }} />
                      <span className="font-semibold truncate">{st.name}</span>
                    </div>
                    {pipelineStages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPipelineStages(prev => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <Input
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  placeholder="Add custom stage (e.g. Legal Review)"
                  className="h-8 text-xs rounded-xl flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newStageName.trim()) {
                        const newId = newStageName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                        setPipelineStages(prev => [...prev, { id: newId, name: newStageName.trim(), color: '#8B5CF6', order: prev.length }]);
                        setNewStageName('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newStageName.trim()) {
                      const newId = newStageName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
                      setPipelineStages(prev => [...prev, { id: newId, name: newStageName.trim(), color: '#8B5CF6', order: prev.length }]);
                      setNewStageName('');
                    }
                  }}
                  className="h-8 px-2.5 text-xs rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPipelineModal(false)} className="rounded-xl text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs h-9 font-bold">
                Create Pipeline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteItemId} onOpenChange={open => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline Deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item from the pipeline. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteItem(deleteItemId)}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
