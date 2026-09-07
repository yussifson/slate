import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Edit, Trash2, Phone, Mail,
  MessageSquare, UserCheck, Search,
  RefreshCw, LayoutGrid, List,
  MoreVertical, ChevronRight,
  UserPlus
} from 'lucide-react';
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
import GenericKanban from '@/components/views/GenericKanban';
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

const STATUS_CONFIG = {
  'new': { label: 'New Inquiry', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200' },
  'contacted': { label: 'Contacted', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' },
  'qualified': { label: 'Qualified', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200' },
  'negotiating': { label: 'Negotiating', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200' },
  'closed': { label: 'Converted / Won', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' },
  'lost': { label: 'Lost', color: 'bg-muted text-muted-foreground border-border' },
};

export default function JCLCrmLeads() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // board or list

  // Modals & Drawers
  const [showForm, setShowForm] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [inspectorLead, setInspectorLead] = useState(null);
  const [leadActivities, setLeadActivities] = useState([]);

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
    outcome: 'qualified',
  });

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        `SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      const data = res.rows._array || Array.from(res.rows || []);
      setLeads(data);
    } catch (e) {
      console.error('[JCLCrmLeads] Fetch error:', e);
      toast.error('Failed to load CRM leads');
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
    } catch (err) {
      console.error('[JCLCrmLeads] Save error:', err);
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
    } catch (err) {
      console.error('[JCLCrmLeads] Convert error:', err);
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
    } catch (err) {
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
      const fullName = `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim();

      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (
          id, created_at, company_id, lead_id, lead_name, activity_type, subject, description, duration_minutes, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          actId, now, companyId,
          selectedLead.id, fullName,
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
    } catch (err) {
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
            <LayoutGrid className="w-3.5 h-3.5" /> Export CSV
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
                <SelectItem value="new">New Inquiry</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="closed">Converted / Won</SelectItem>
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

        {/* ── Tab Content: Kanban Board ── */}
        <TabsContent value="board" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted rounded-[24px]" />)}
            </div>
          ) : (
            <GenericKanban
              items={filteredLeads}
              columns={[
                { id: 'new', title: 'New Inquiries' },
                { id: 'contacted', title: 'Contacted' },
                { id: 'qualified', title: 'Qualified' },
                { id: 'negotiating', title: 'Negotiating' },
                { id: 'closed', title: 'Won / Converted' },
              ]}
              onStatusChange={async (id, newStatus) => {
                try {
                  await powerSync.execute(
                    `UPDATE univ_re_leads SET status = ? WHERE id = ? AND company_id = ?`,
                    [newStatus, id, companyId]
                  );
                  fetchLeads();
                } catch (_e) {
                  toast.error('Status update failed');
                }
              }}
              renderCard={(lead) => {
                const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || 'L'}`.toUpperCase();
                return (
                  <div
                    onClick={() => openInspector(lead)}
                    className="p-4 space-y-3 bg-card/95 backdrop-blur-md rounded-[20px] border border-border/80 hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-900 flex items-center justify-center font-extrabold text-xs text-emerald-800 dark:text-emerald-200 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[13px] text-foreground truncate group-hover:text-emerald-600 transition-colors">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {lead.source || 'Referral'}
                          </span>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] font-semibold", STATUS_CONFIG[lead.status]?.color || '')}>
                        {STATUS_CONFIG[lead.status]?.label || lead.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 font-semibold">
                      <span className="capitalize text-emerald-600 dark:text-emerald-400">{lead.lead_type || 'Buyer'}</span>
                      <span className="text-foreground">
                        {lead.budget_max ? formatCurrency(lead.budget_max, 'USD') : 'Open Budget'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConvertToClient(lead)}
                        className="flex-1 text-[11px] h-7 gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg font-bold"
                      >
                        <UserCheck className="w-3 h-3" /> Convert
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLead(lead);
                          setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 15, outcome: 'qualified' });
                          setShowActivityModal(true);
                        }}
                        className="h-7 w-7 p-0 rounded-lg"
                        title="Log Activity"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDrawer(lead)}
                        className="h-7 w-7 p-0 rounded-lg"
                        title="Edit Lead"
                      >
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </TabsContent>

        {/* ── Tab Content: List View (DataTable) ── */}
        <TabsContent value="list" className="mt-0">
          <div className="bg-card/90 backdrop-blur-xl rounded-[24px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Lead Contact</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Type / Interest</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Budget</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Submitted</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No leads matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || 'L'}`.toUpperCase();
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => openInspector(lead)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-900 flex items-center justify-center font-extrabold text-xs text-emerald-800 dark:text-emerald-200 shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-foreground truncate group-hover:text-emerald-600 transition-colors">
                                  {lead.first_name} {lead.last_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <Badge variant="outline" className="text-[11px] capitalize font-medium">
                              {lead.lead_type || 'Buyer'}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Src: {lead.source || 'Referral'}</p>
                          </td>

                          <td className="py-4 px-4">
                            <p className="text-[13px] font-bold text-foreground">
                              {lead.budget_max ? formatCurrency(lead.budget_max, 'USD') : 'Flexible'}
                            </p>
                            {lead.budget_min ? (
                              <p className="text-[10px] text-muted-foreground">Min: {formatCurrency(lead.budget_min, 'USD')}</p>
                            ) : null}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <Badge className={cn("text-[11px] font-semibold py-1 px-3", STATUS_CONFIG[lead.status]?.color || '')}>
                              {STATUS_CONFIG[lead.status]?.label || lead.status}
                            </Badge>
                          </td>

                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "Recent"}
                          </td>

                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {lead.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  title="Email Lead"
                                  onClick={() => window.open(`mailto:${lead.email}`)}
                                >
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                              )}
                              {lead.phone && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  title="Call Lead"
                                  onClick={() => window.open(`tel:${lead.phone}`)}
                                >
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem onClick={() => handleConvertToClient(lead)}>
                                    <UserCheck className="w-4 h-4 mr-2 text-emerald-600" /> Convert to Customer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedLead(lead);
                                    setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 15, outcome: 'qualified' });
                                    setShowActivityModal(true);
                                  }}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Log Activity Note
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDrawer(lead)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteId(lead.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Lead
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        </TabsContent>
      </Tabs>

      {/* ── Slide-Over Inspector: Full Lead Dossier ── */}
      <Sheet open={!!inspectorLead} onOpenChange={(open) => !open && setInspectorLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-6 pb-28">
          {inspectorLead && (
            <div className="space-y-6">
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-200 to-teal-200 dark:from-emerald-900 dark:to-teal-800 flex items-center justify-center font-extrabold text-base text-emerald-800 dark:text-emerald-200 shadow-inner">
                      {`${inspectorLead.first_name?.[0] || ''}${inspectorLead.last_name?.[0] || 'L'}`.toUpperCase()}
                    </div>
                    <div>
                      <SheetTitle className="text-lg font-bold text-foreground">
                        {inspectorLead.first_name} {inspectorLead.last_name}
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        Lead ID: {inspectorLead.id?.substring(0, 8)} · Captured {inspectorLead.created_at ? format(new Date(inspectorLead.created_at), "MMM d, yyyy") : 'Recently'}
                      </SheetDescription>
                    </div>
                  </div>
                  <Badge className={cn("text-xs font-bold py-1 px-3", STATUS_CONFIG[inspectorLead.status]?.color || '')}>
                    {STATUS_CONFIG[inspectorLead.status]?.label || inspectorLead.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    size="sm"
                    onClick={() => handleConvertToClient(inspectorLead)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 h-9"
                  >
                    <UserCheck className="w-4 h-4" /> Convert to Customer Account
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLead(inspectorLead);
                      setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 15, outcome: 'qualified' });
                      setShowActivityModal(true);
                    }}
                    className="rounded-xl text-xs font-semibold gap-1.5 h-9"
                  >
                    <MessageSquare className="w-4 h-4" /> Log Activity
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDrawer(inspectorLead)}
                    className="rounded-xl text-xs font-semibold h-9 px-3"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Tabs inside Inspector */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-muted/60 p-1 rounded-xl h-9 mb-4">
                  <TabsTrigger value="overview" className="rounded-lg text-xs font-bold px-3">Overview</TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-lg text-xs font-bold px-3">Activity History ({leadActivities.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 p-4 rounded-2xl border border-border/60">
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Email Address</span>
                      <span className="font-semibold text-foreground">{inspectorLead.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Phone Number</span>
                      <span className="font-semibold text-foreground">{inspectorLead.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Lead Category</span>
                      <span className="font-semibold text-foreground capitalize">{inspectorLead.lead_type || 'Buyer'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Acquisition Source</span>
                      <span className="font-semibold text-foreground capitalize">{inspectorLead.source || 'Referral'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Target Budget</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {inspectorLead.budget_max ? formatCurrency(inspectorLead.budget_max, 'USD') : 'Flexible'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-bold block">Minimum Range</span>
                      <span className="font-semibold text-foreground">
                        {inspectorLead.budget_min ? formatCurrency(inspectorLead.budget_min, 'USD') : 'None'}
                      </span>
                    </div>
                  </div>

                  {inspectorLead.notes && (
                    <div className="space-y-1 bg-card p-4 rounded-2xl border border-border/80">
                      <span className="text-[11px] font-bold text-foreground">Requirements & Notes</span>
                      <p className="text-muted-foreground leading-relaxed italic">{inspectorLead.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="space-y-3">
                  {leadActivities.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed text-xs text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                      No follow-up activity logged yet.
                    </div>
                  ) : (
                    leadActivities.map(act => (
                      <div key={act.id} className="p-3.5 bg-card rounded-2xl border border-border/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{act.subject}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{act.activity_type}</Badge>
                        </div>
                        {act.description && <p className="text-muted-foreground">{act.description}</p>}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>Outcome: <strong>{act.outcome}</strong></span>
                          <span>{act.created_at ? format(new Date(act.created_at), "MMM d, h:mm a") : ''}</span>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Form: Add / Edit Lead ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6 pb-28">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg font-bold">
              {editingId ? 'Edit CRM Lead' : 'Capture Prospective Lead'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Lead contact info, budget specifications & purchase interest
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveLead} className="space-y-4 mt-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Kwabena"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Osei"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kwabena@example.com"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233 20 000 0000"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lead Type</Label>
                <Select value={formData.leadType} onValueChange={(v) => setFormData({ ...formData, leadType: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Land / Property Buyer</SelectItem>
                    <SelectItem value="investor">Estate Investor</SelectItem>
                    <SelectItem value="tenant">Commercial Tenant</SelectItem>
                    <SelectItem value="seller">Land Seller / Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Lead Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral / Network</SelectItem>
                    <SelectItem value="website">Website Portal</SelectItem>
                    <SelectItem value="walkin">Office Walk-in</SelectItem>
                    <SelectItem value="ad">Marketing Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Budget Min ($)</Label>
                <Input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  placeholder="50000"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Budget Max ($)</Label>
                <Input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  placeholder="250000"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Pipeline Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Inquiry</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="closed">Converted / Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes & Preferred Locations</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Looking for 2 acres in Airport Hills..."
                className="rounded-xl"
              />
            </div>

            <div className="pt-4 border-t flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
                {editingId ? 'Update Lead' : 'Save Lead'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog: Log Structured Activity ── */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Log Activity: {selectedLead?.first_name} {selectedLead?.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record follow-up phone calls, site inspections, and negotiation notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Activity Type</Label>
                <Select
                  value={activityData.activityType}
                  onValueChange={(v) => setActivityData({ ...activityData, activityType: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="viewing">Site / Land Viewing</SelectItem>
                    <SelectItem value="email">Email Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Outcome</Label>
                <Select
                  value={activityData.outcome}
                  onValueChange={(v) => setActivityData({ ...activityData, outcome: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualified">Qualified Prospect</SelectItem>
                    <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input
                required
                value={activityData.subject}
                onChange={(e) => setActivityData({ ...activityData, subject: e.target.value })}
                placeholder="e.g. Discussed financing terms for Cantonments parcel"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label>Detailed Notes</Label>
              <Input
                value={activityData.description}
                onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                placeholder="Lead requested survey plan copy..."
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setShowActivityModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveActivity} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert Dialog: Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete this lead record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. This lead will be removed from your active CRM pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteLead(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
