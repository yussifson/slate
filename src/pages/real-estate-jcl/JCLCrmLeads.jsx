import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Edit, Trash2, Star, Phone, Mail, TrendingUp,
  MessageSquare, UserCheck, CheckCircle2, Clock, Calendar,
  ArrowRight, ShieldCheck, Search, Filter
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';
import GenericKanban from '@/components/views/GenericKanban';
import { formatCurrency } from '@/lib/constants';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const statusColors = {
  'new': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200',
  'contacted': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200',
  'qualified': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200',
  'negotiating': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200',
  'closed': 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400 border-teal-200',
  'lost': 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200',
};

export default function JCLCrmLeads() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useViewPreference('jcl_crm_leads', 'grid');

  // Modals / Drawers
  const [showForm, setShowForm] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    if (companyId) fetchLeads();
  }, [companyId]);

  useEffect(() => {
    let filtered = leads;
    if (search) {
      filtered = filtered.filter(l =>
        l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    setFilteredLeads(filtered);
  }, [leads, search, statusFilter]);

  // Save Lead
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
        toast.success('New lead captured');
      }

      setShowForm(false);
      setEditingId(null);
      fetchLeads();
    } catch (err) {
      console.error('[JCLCrmLeads] Save error:', err);
      toast.error('Failed to save lead');
    }
  };

  // 1-Click Convert Lead to Client
  const handleConvertToClient = async (lead) => {
    if (!window.confirm(`Convert "${lead.first_name} ${lead.last_name}" to a registered Customer?`)) return;
    try {
      const clientId = generateUUID();
      const now = new Date().toISOString();
      const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();

      // 1. Insert into univ_re_clients
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

      // 2. Mark lead as closed / converted
      await powerSync.execute(
        `UPDATE univ_re_leads SET status = 'closed' WHERE id = ? AND company_id = ?`,
        [lead.id, companyId]
      );

      // 3. Log converted activity
      const actId = generateUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (
          id, created_at, company_id, lead_id, lead_name, activity_type, subject, description, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          actId, now, companyId, lead.id, fullName, 'conversion',
          'Converted to Registered Customer Profile',
          `Promoted from lead to formal customer account by ${user?.full_name || 'Admin'}`,
          'closed_deal'
        ]
      ).catch(() => {});

      toast.success(`🎉 ${fullName} successfully converted to Customer!`);
      fetchLeads();
    } catch (err) {
      console.error('[JCLCrmLeads] Convert error:', err);
      toast.error('Failed to convert lead to customer');
    }
  };

  // Log Activity for Lead
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

      // Auto update status if outcome is qualified
      if (activityData.outcome === 'qualified' && selectedLead.status === 'new') {
        await powerSync.execute(
          `UPDATE univ_re_leads SET status = 'qualified' WHERE id = ? AND company_id = ?`,
          [selectedLead.id, companyId]
        );
      }

      toast.success('Activity logged to lead history');
      setShowActivityModal(false);
      fetchLeads();
    } catch (err) {
      console.error('[JCLCrmLeads] Activity save error:', err);
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

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-28">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                CRM & Leads Engine
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300">
                  JCL Pipeline
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Lead capture, multi-channel activities, scoring & 1-click customer conversion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ViewToggle view={view} onViewChange={setView} />
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Capture New Lead
          </Button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead by name, email, phone..."
            className="pl-9 h-10 rounded-xl bg-background text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-40 rounded-xl text-xs font-medium">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New Inquiry</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="closed">Converted / Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Leads Feed / Kanban / Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-muted rounded-2xl" />)}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">No leads found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all' ? 'Adjust your search filters.' : 'Add your first prospective buyer or investor lead.'}
          </p>
        </div>
      ) : view === 'kanban' ? (
        <GenericKanban
          items={filteredLeads}
          columns={[
            { id: 'new', title: 'New Leads' },
            { id: 'contacted', title: 'Contacted' },
            { id: 'qualified', title: 'Qualified' },
            { id: 'negotiating', title: 'Negotiating' },
            { id: 'closed', title: 'Converted / Closed' },
          ]}
          onStatusChange={async (id, newStatus) => {
            try {
              await powerSync.execute(
                `UPDATE univ_re_leads SET status = ? WHERE id = ? AND company_id = ?`,
                [newStatus, id, companyId]
              );
              fetchLeads();
            } catch(e) {
              toast.error('Status update failed');
            }
          }}
          renderCard={(lead) => (
            <div className="p-3.5 space-y-2.5 bg-card rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-foreground">{lead.first_name} {lead.last_name}</span>
                <Badge className={statusColors[lead.status] || ''}>{lead.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{lead.email}</div>
                <div>{lead.phone}</div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t font-semibold">
                <span className="capitalize text-emerald-600">{lead.lead_type || 'Buyer'}</span>
                <span>{lead.budget_max ? formatCurrency(lead.budget_max, 'USD') : 'Budget Open'}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleConvertToClient(lead)}
                  className="w-full text-[11px] h-7 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <UserCheck className="w-3 h-3" /> Convert
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setSelectedLead(lead);
                    setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 15, outcome: 'qualified' });
                    setShowActivityModal(true);
                  }}
                  className="h-7 w-7 p-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => openEditDrawer(lead)}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        />
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="rounded-2xl border bg-card hover:shadow-md transition-all flex flex-col">
              <div className="p-5 flex-1 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-foreground tracking-tight">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] capitalize bg-muted/40">
                        {lead.lead_type || 'Buyer'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">Source: {lead.source || 'Referral'}</span>
                    </div>
                  </div>
                  <Badge className={statusColors[lead.status] || ''}>
                    {lead.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lead.phone || 'No phone'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Target Budget:</span>
                  <span className="font-bold text-foreground">
                    {lead.budget_max ? formatCurrency(lead.budget_max, 'USD') : 'Flexible'}
                  </span>
                </div>

                {lead.notes && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2 bg-muted/10 p-2 rounded-lg">
                    "{lead.notes}"
                  </p>
                )}
              </div>

              <div className="p-4 border-t bg-muted/10 flex items-center justify-between mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConvertToClient(lead)}
                  className="text-xs h-8 px-2.5 font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1 rounded-xl"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Convert to Client
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedLead(lead);
                      setActivityData({ activityType: 'call', subject: '', description: '', durationMinutes: 15, outcome: 'qualified' });
                      setShowActivityModal(true);
                    }}
                    className="h-8 w-8 p-0 rounded-xl"
                    title="Log Activity"
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDrawer(lead)}
                    className="h-8 w-8 p-0 rounded-xl"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Slide-Over Form: Capture / Edit Lead ── */}
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
                placeholder="Looking for 2 acres in Airport Hills or Cantonments..."
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
        <DialogContent className="sm:max-w-md rounded-2xl">
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
                placeholder="Lead requested survey plan copy and 12-month payment option..."
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
    </div>
  );
}
