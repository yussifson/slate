import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Edit, Trash2, Phone, Mail,
  MessageSquare, Search,
  RefreshCw, LayoutGrid, List,
  MoreVertical, ChevronRight,
  UserPlus, Download,
  DollarSign, Calendar
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PortalAwareItem } from '@/lib/kanbanPortal.jsx';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STATUS_COLUMNS = [
  { id: 'new', title: 'New Inquiries', dot: 'bg-blue-500', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  { id: 'contacted', title: 'Contact Made', dot: 'bg-amber-500', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  { id: 'qualified', title: 'Qualified', dot: 'bg-purple-500', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200' },
  { id: 'negotiating', title: 'Negotiating', dot: 'bg-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200' },
  { id: 'closed', title: 'Won / Converted', dot: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' },
  { id: 'lost', title: 'Lost', dot: 'bg-slate-400', badgeColor: 'bg-muted text-muted-foreground border-border' },
];

const STATUS_CONFIG = STATUS_COLUMNS.reduce((acc, col) => {
  acc[col.id] = { label: col.title, color: col.badgeColor };
  return acc;
}, {});

const getInitialsBg = (name = '') => {
  const code = (name.charCodeAt(0) || 65) + (name.charCodeAt(1) || 66);
  const colors = [
    'bg-emerald-600 text-white',
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-amber-600 text-white',
    'bg-teal-600 text-white',
    'bg-purple-600 text-white',
    'bg-rose-600 text-white',
  ];
  return colors[code % colors.length];
};

const getInitials = (firstName = '', lastName = '') => {
  return `${firstName?.[0] || ''}${lastName?.[0] || 'L'}`.toUpperCase();
};

// ── Dedicated Self-Contained Kanban Component ──
function LeadKanbanBoardComponent({ leads, onUpdateStatus, onLeadClick, onEdit, onActivity, onConvert, onDelete }) {
  const [optimisticLeads, setOptimisticLeads] = useState(leads);

  useEffect(() => {
    setOptimisticLeads(leads);
  }, [leads]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const leadId = draggableId;

    // Immediately update local optimistic state
    setOptimisticLeads(prev => prev.map(l => String(l.id) === String(leadId) ? { ...l, status: newStatus } : l));

    // Propagate to PowerSync
    onUpdateStatus(leadId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar items-start min-h-[600px]">
        {STATUS_COLUMNS.map(col => {
          const columnLeads = optimisticLeads.filter(l => {
            const s = (l.status || 'new').toLowerCase();
            if (col.id === 'new') {
              return s === 'new' || !STATUS_COLUMNS.some(c => c.id === s);
            }
            return s === col.id;
          });

          const totalBudget = columnLeads.reduce((acc, lead) => acc + (Number(lead.budget_max) || Number(lead.budget_min) || 0), 0);

          return (
            <div key={col.id} className="flex flex-col w-[320px] shrink-0">
              {/* Column Header */}
              <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[18px] p-3.5 mb-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                  <div>
                    <h3 className="font-bold text-xs text-foreground tracking-tight">{col.title}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {columnLeads.length} Leads • {formatCurrency(totalBudget, 'USD')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-extrabold h-5 px-1.5 bg-muted/40">
                  {columnLeads.length}
                </Badge>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 flex flex-col gap-3 min-h-[400px] p-1.5 rounded-[20px] transition-colors border border-transparent",
                      snapshot.isDraggingOver && "bg-muted/40 border-dashed border-emerald-500/30"
                    )}
                  >
                    {columnLeads.map((lead, index) => {
                      const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Prospective Lead';
                      const initials = getInitials(lead.first_name, lead.last_name);
                      const avatarColor = getInitialsBg(lead.first_name || 'L');

                      return (
                        <Draggable key={String(lead.id)} draggableId={String(lead.id)} index={index}>
                          {(providedDraggable, snapshotDraggable) => (
                            <PortalAwareItem provided={providedDraggable} snapshot={snapshotDraggable}>
                              <div
                                onClick={() => onLeadClick(lead)}
                                className={cn(
                                  "p-4 bg-card/95 backdrop-blur-md rounded-[20px] border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group space-y-3",
                                  snapshotDraggable.isDragging && "shadow-2xl border-emerald-500 ring-2 ring-emerald-500/30 rotate-1 z-50 bg-card"
                                )}
                              >
                                {/* Card Top: Avatar & Name */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm", avatarColor)}>
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-[13px] text-foreground truncate group-hover:text-emerald-600 transition-colors">
                                        {fullName}
                                      </h4>
                                      <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 h-4 bg-muted/30">
                                        {lead.lead_type || 'Buyer'}
                                      </Badge>
                                    </div>
                                  </div>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="text-xs">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Lead
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onActivity(lead); }}>
                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Log Activity
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                                        <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Convert to Client
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}>
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* 2x2 Contact / Budget Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                                  {lead.phone && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="truncate">{lead.phone}</span>
                                    </div>
                                  )}
                                  {lead.email && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span className="truncate">{lead.email}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 truncate col-span-2">
                                    <DollarSign className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span className="font-bold text-foreground">
                                      {lead.budget_max ? `${formatCurrency(lead.budget_min || 0, 'USD')} - ${formatCurrency(lead.budget_max, 'USD')}` : (lead.budget_min ? formatCurrency(lead.budget_min, 'USD') : 'Budget Unset')}
                                    </span>
                                  </div>
                                </div>

                                {/* Card Footer: Date & Quick Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-semibold">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span>{lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : 'Recent'}</span>
                                  </div>

                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {lead.phone && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => window.open(`tel:${lead.phone}`)}
                                        className="h-6 w-6 rounded-md hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
                                        title="Call Lead"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {lead.email && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => window.open(`mailto:${lead.email}`)}
                                        className="h-6 w-6 rounded-md hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                                        title="Email Lead"
                                      >
                                        <Mail className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </PortalAwareItem>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

export default function JCLCrmLeads() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'

  // Modals & Drawers
  const [showForm, setShowForm] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [inspectorLead, setInspectorLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [leadActivities, setLeadActivities] = useState([]);

  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    leadType: 'buyer',
    source: 'referral',
    status: 'new',
    budgetMin: '',
    budgetMax: '',
    notes: '',
  });

  const [activityData, setActivityData] = useState({
    activityType: 'call',
    subject: '',
    description: '',
    durationMinutes: 15,
    outcome: 'connected',
  });

  // Fetch Leads
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        `SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      setLeads(res.rows._array || Array.from(res.rows || []));
    } catch (_e) {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadActivities = async (leadId) => {
    try {
      const res = await powerSync.execute(
        `SELECT * FROM univ_re_lead_activities WHERE lead_id = ? AND company_id = ? ORDER BY created_at DESC`,
        [leadId, companyId]
      );
      setLeadActivities(res.rows._array || Array.from(res.rows || []));
    } catch (_e) {
      setLeadActivities([]);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchLeads();
      const channel = supabase.channel(`univ_re_leads_${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_re_leads', filter: `company_id=eq.${companyId}` }, fetchLeads)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('CRM leads synchronized');
    }, 400);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "First Name,Last Name,Email,Phone,Type,Source,Status,Min Budget,Max Budget\n"
      + leads.map(l => `"${l.first_name || ''}","${l.last_name || ''}","${l.email || ''}","${l.phone || ''}","${l.lead_type || ''}","${l.source || ''}","${l.status || ''}","${l.budget_min || 0}","${l.budget_max || 0}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jcl_crm_leads_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported to CSV');
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search ||
        l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, search, statusFilter]);

  // Update Status in PowerSync
  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_leads SET status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, leadId, companyId]
      );
      fetchLeads();
    } catch (_err) {
      toast.error('Failed to update status');
      fetchLeads();
    }
  };

  // Save or Update Lead
  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_leads SET
            first_name = ?, last_name = ?, email = ?, phone = ?,
            lead_type = ?, source = ?, status = ?,
            budget_min = ?, budget_max = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.firstName, formData.lastName, formData.email, formData.phone,
            formData.leadType, formData.source, formData.status,
            Number(formData.budgetMin) || 0, Number(formData.budgetMax) || 0, formData.notes,
            editingId, companyId
          ]
        );
        toast.success('Lead updated successfully');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_leads (
            id, created_at, company_id, first_name, last_name, email, phone,
            lead_type, source, status, budget_min, budget_max, lead_score, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.firstName, formData.lastName, formData.email, formData.phone,
            formData.leadType, formData.source, formData.status,
            Number(formData.budgetMin) || 0, Number(formData.budgetMax) || 0,
            75, formData.notes
          ]
        );
        toast.success('New lead captured successfully');
      }

      setShowForm(false);
      setEditingId(null);
      fetchLeads();
    } catch (_err) {
      toast.error('Failed to save lead');
    }
  };

  // Convert Lead to Registered Customer
  const handleConvertToClient = async (lead) => {
    try {
      const clientId = generateUUID();
      const now = new Date().toISOString();
      const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();

      await powerSync.execute(
        `INSERT INTO univ_re_clients (
          id, created_at, company_id, name, email, phone, type, budget, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId, now, companyId,
          fullName, lead.email, lead.phone,
          lead.lead_type || 'buyer',
          lead.budget_max || lead.budget_min || 0,
          `Converted from CRM Lead (${lead.source || 'Direct'}). Notes: ${lead.notes || ''}`
        ]
      );

      await powerSync.execute(
        `UPDATE univ_re_leads SET status = 'closed' WHERE id = ? AND company_id = ?`,
        [lead.id, companyId]
      );

      toast.success(`🎉 ${fullName} successfully converted to Customer Profile!`);
      if (inspectorLead?.id === lead.id) {
        setInspectorLead(null);
      }
      fetchLeads();
    } catch (_err) {
      toast.error('Failed to convert lead to customer');
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM univ_re_leads WHERE id = ? AND company_id = ?`, [id, companyId]);
      toast.success('Lead deleted');
      setDeleteId(null);
      if (inspectorLead?.id === id) setInspectorLead(null);
      fetchLeads();
    } catch (_err) {
      toast.error('Failed to delete lead');
    }
  };

  // Save Activity
  const handleSaveActivity = async () => {
    if (!selectedLead || !activityData.subject) {
      toast.error('Subject is required');
      return;
    }

    try {
      const actId = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (
          id, created_at, company_id, lead_id, activity_type, subject, description, duration_minutes, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          actId, now, companyId,
          selectedLead.id,
          activityData.activityType,
          activityData.subject,
          activityData.description,
          Number(activityData.durationMinutes) || 15,
          activityData.outcome
        ]
      );

      if (activityData.outcome === 'qualified' && selectedLead.status === 'new') {
        await powerSync.execute(
          `UPDATE univ_re_leads SET status = 'qualified' WHERE id = ? AND company_id = ?`,
          [selectedLead.id, companyId]
        );
      }

      toast.success('Activity logged to lead timeline');
      setShowActivityModal(false);
      fetchLeads();
      if (inspectorLead?.id === selectedLead.id) {
        fetchLeadActivities(selectedLead.id);
      }
    } catch (_err) {
      toast.error('Failed to log activity');
    }
  };

  const openEditDrawer = (lead) => {
    setEditingId(lead.id);
    setFormData({
      firstName: lead.first_name || '',
      lastName: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      leadType: lead.lead_type || 'buyer',
      source: lead.source || 'referral',
      status: lead.status || 'new',
      budgetMin: lead.budget_min || '',
      budgetMax: lead.budget_max || '',
      notes: lead.notes || '',
    });
    setShowForm(true);
  };

  const openInspector = (lead) => {
    setInspectorLead(lead);
    fetchLeadActivities(lead.id);
  };

  return (
    <div className="space-y-6 pb-12 font-sans min-h-screen -m-4 lg:-m-8 p-4 lg:p-8 relative bg-background">
      
      {/* ── Top Header & Breadcrumbs Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            CRM Leads ({leads.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prospect pipeline, multi-channel activity logs & 1-click customer conversion
          </p>
        </div>

        <div className="flex items-center gap-3 text-[13px] font-semibold text-muted-foreground">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground">CRM Leads</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 bg-card border-border text-foreground shadow-sm rounded-xl hover:bg-muted"
            title="Refresh Leads"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full space-y-4">
        {/* ── Search, Filters & Action Hub Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/90 backdrop-blur-xl p-3 sm:p-4 rounded-[20px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lead by name, email, phone..."
                className="pl-9 h-10 rounded-xl bg-background text-xs border-border/80"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-44 rounded-xl text-xs font-medium bg-background border-border/80">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({leads.length})</SelectItem>
                <SelectItem value="new">New Inquiries</SelectItem>
                <SelectItem value="contacted">Contact Made</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="closed">Won / Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
              <TabsTrigger value="board" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg text-xs font-bold gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <List className="w-3.5 h-3.5" /> List
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  firstName: '', lastName: '', email: '', phone: '',
                  leadType: 'buyer', source: 'referral', status: 'new',
                  budgetMin: '', budgetMax: '', notes: '',
                });
                setShowForm(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Capture Lead
            </Button>
          </div>
        </div>

        {/* ── Tab Content: Dedicated Drag-and-Drop Kanban Board ── */}
        <TabsContent value="board" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted rounded-[24px]" />)}
            </div>
          ) : (
            <LeadKanbanBoardComponent
              leads={filteredLeads}
              onUpdateStatus={handleUpdateStatus}
              onLeadClick={openInspector}
              onEdit={openEditDrawer}
              onActivity={(l) => { setSelectedLead(l); setShowActivityModal(true); }}
              onConvert={handleConvertToClient}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </TabsContent>

        {/* ── Tab Content: List View (Data Table) ── */}
        <TabsContent value="list" className="mt-0">
          <div className="bg-card/90 backdrop-blur-xl rounded-[24px] border border-border/80 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 uppercase tracking-wider text-muted-foreground font-bold border-b border-border/60">
                  <tr>
                    <th className="p-4">Lead Contact</th>
                    <th className="p-4">Type & Source</th>
                    <th className="p-4">Budget Range</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date Captured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLeads.map((lead) => {
                    const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead Prospect';
                    const initials = getInitials(lead.first_name, lead.last_name);
                    const avatarColor = getInitialsBg(lead.first_name || 'L');

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => openInspector(lead)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm", avatarColor)}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-[13px] group-hover:text-emerald-600 transition-colors">{fullName}</div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                {lead.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5 text-blue-500" /> {lead.email}</span>}
                                {lead.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-emerald-500" /> {lead.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase capitalize bg-muted/30">
                              {lead.lead_type || 'Buyer'}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground font-semibold capitalize">Source: {lead.source || 'Referral'}</div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          {lead.budget_max
                            ? `${formatCurrency(lead.budget_min || 0, 'USD')} - ${formatCurrency(lead.budget_max, 'USD')}`
                            : (lead.budget_min ? formatCurrency(lead.budget_min, 'USD') : '—')}
                        </td>
                        <td className="p-4">
                          <Badge className={cn("text-[10px] font-bold uppercase border", STATUS_CONFIG[lead.status]?.color || STATUS_CONFIG['new'].color)}>
                            {STATUS_CONFIG[lead.status]?.label || lead.status || 'New'}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground font-medium">
                          {lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="p-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleConvertToClient(lead)}
                            className="text-[11px] h-7 px-2 font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                          >
                            Convert
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => { setSelectedLead(lead); setShowActivityModal(true); }}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Log Activity"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => openEditDrawer(lead)}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleteId(lead.id)}
                            className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Slide-Over Lead Inspector Drawer ── */}
      <Sheet open={!!inspectorLead} onOpenChange={(open) => !open && setInspectorLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 pb-28 space-y-6">
          {inspectorLead && (
            <>
              <SheetHeader className="pb-4 border-b border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow", getInitialsBg(inspectorLead.first_name || 'L'))}>
                      {getInitials(inspectorLead.first_name, inspectorLead.last_name)}
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-extrabold text-foreground">
                        {inspectorLead.first_name} {inspectorLead.last_name}
                      </SheetTitle>
                      <SheetDescription className="text-xs flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{inspectorLead.lead_type || 'Buyer'} Prospect</span>
                        <span>•</span>
                        <span>Source: {inspectorLead.source || 'Referral'}</span>
                      </SheetDescription>
                    </div>
                  </div>

                  <Badge className={cn("text-[10px] font-bold uppercase border", STATUS_CONFIG[inspectorLead.status]?.color || STATUS_CONFIG['new'].color)}>
                    {STATUS_CONFIG[inspectorLead.status]?.label || inspectorLead.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <Button
                    size="sm"
                    onClick={() => handleConvertToClient(inspectorLead)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" /> Convert To Customer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedLead(inspectorLead); setShowActivityModal(true); }}
                    className="font-bold text-xs rounded-xl h-8 gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Log Interaction
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDrawer(inspectorLead)}
                    className="font-bold text-xs rounded-xl h-8 gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                </div>
              </SheetHeader>

              {/* Inspector Content Tabs */}
              <Tabs defaultValue="overview" className="w-full space-y-4">
                <TabsList className="grid grid-cols-2 w-full rounded-xl bg-muted/60 p-1 border border-border/60">
                  <TabsTrigger value="overview" className="text-xs font-bold rounded-lg">Lead Overview</TabsTrigger>
                  <TabsTrigger value="activities" className="text-xs font-bold rounded-lg">Activity History ({leadActivities.length})</TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Target Budget Max</span>
                      <span className="text-lg font-extrabold text-foreground">{formatCurrency(inspectorLead.budget_max || inspectorLead.budget_min || 0, 'USD')}</span>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lead Score</span>
                      <span className="text-lg font-extrabold text-emerald-600">{inspectorLead.lead_score || 75}%</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border/80 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact & Qualifications</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Email Address</span>
                        <span className="font-bold text-foreground">{inspectorLead.email || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Phone Number</span>
                        <span className="font-bold text-foreground">{inspectorLead.phone || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Min Budget Target</span>
                        <span className="font-bold text-foreground">{formatCurrency(inspectorLead.budget_min || 0, 'USD')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Acquisition Channel</span>
                        <span className="font-bold capitalize text-foreground">{inspectorLead.source || 'Direct'}</span>
                      </div>
                    </div>

                    {inspectorLead.notes && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-muted-foreground block text-[10px] mb-1">Requirement Notes</span>
                        <p className="text-xs text-foreground font-medium">{inspectorLead.notes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Activities */}
                <TabsContent value="activities" className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Logged Interactions</h4>
                    <Button
                      size="xs"
                      onClick={() => { setSelectedLead(inspectorLead); setShowActivityModal(true); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg h-7 gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> Log Activity
                    </Button>
                  </div>

                  {leadActivities.length > 0 ? (
                    <div className="space-y-3">
                      {leadActivities.map((act) => (
                        <div key={act.id} className="p-3.5 bg-card rounded-2xl border border-border/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">{act.subject}</span>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">{act.activity_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{act.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                            <span>Duration: {act.duration_minutes || 15}m</span>
                            <span>{act.created_at ? format(new Date(act.created_at), 'dd MMM yyyy, HH:mm') : 'Recent'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed p-6 space-y-2">
                      <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-xs font-bold text-foreground">No Interactions Logged</p>
                      <p className="text-[11px] text-muted-foreground">Keep record of calls, emails, and site viewings for this lead.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Lead Form Drawer (Create / Edit) ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b border-border/80">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit CRM Lead' : 'Capture New CRM Lead'}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Enter buyer/seller details, acquisition source, and investment parameters.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveLead} className="space-y-4 mt-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">First Name *</Label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Kwame"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Last Name *</Label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Mensah"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Email Address *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kwame@example.com"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233 24 000 0000"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Lead Type</Label>
                <Select value={formData.leadType} onValueChange={(v) => setFormData({ ...formData, leadType: v })}>
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="renter">Renter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">Acquisition Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website Form</SelectItem>
                    <SelectItem value="referral">Referral / Agent</SelectItem>
                    <SelectItem value="direct">Direct Walk-in</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="billboard">Outdoor Billboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Min Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  placeholder="50000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Max Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  placeholder="250000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Pipeline Stage</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="rounded-xl text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Inquiry</SelectItem>
                  <SelectItem value="contacted">Contact Made</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="closed">Won / Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">Property Preferences & Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interested in 2-acre residential parcels in Airport Hills..."
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                {editingId ? 'Update Lead' : 'Save Lead'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog: Log Activity Modal ── */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Log Interaction: {selectedLead?.first_name} {selectedLead?.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record calls, meetings, property showings, and email notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-bold">Activity Subject *</Label>
              <Input
                required
                value={activityData.subject}
                onChange={(e) => setActivityData({ ...activityData, subject: e.target.value })}
                placeholder="e.g. Phone consultation regarding Airport Hills parcel"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="font-bold">Activity Type</Label>
                <Select
                  value={activityData.activityType}
                  onValueChange={(v) => setActivityData({ ...activityData, activityType: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="viewing">Site Viewing</SelectItem>
                    <SelectItem value="email">Email Follow-up</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-bold">Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={activityData.durationMinutes}
                  onChange={(e) => setActivityData({ ...activityData, durationMinutes: e.target.value })}
                  placeholder="15"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-bold">Call / Meeting Outcome</Label>
              <Select
                value={activityData.outcome}
                onValueChange={(v) => setActivityData({ ...activityData, outcome: v })}
              >
                <SelectTrigger className="rounded-xl text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected / Productive</SelectItem>
                  <SelectItem value="qualified">Qualified Prospect</SelectItem>
                  <SelectItem value="schedule_viewing">Scheduled Parcel Viewing</SelectItem>
                  <SelectItem value="no_answer">No Answer / Left Voicemail</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="font-bold">Discussion Notes</Label>
              <Input
                value={activityData.description}
                onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                placeholder="Requested price flexibility and C of O verification document..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowActivityModal(false)}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveActivity}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
            >
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete CRM Lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. All activity logs associated with this lead will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteLead(deleteId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
