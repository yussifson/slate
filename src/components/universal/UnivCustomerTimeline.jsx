import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock, MessageSquare, Phone, Mail, Calendar, Compass,
  Home, DollarSign, FileText, CheckCircle2, User, Plus,
  Filter, Search, ArrowUpRight, ArrowRight, ShieldCheck, Tag,
  Briefcase, Receipt, Wrench, Sparkles, UserCheck, Layers
} from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/constants';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const moduleConfig = {
  crm: {
    label: 'CRM & Leads',
    icon: MessageSquare,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200'
  },
  land: {
    label: 'Land Allocation',
    icon: Compass,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200'
  },
  property: {
    label: 'Properties & Leases',
    icon: Home,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200'
  },
  finance: {
    label: 'Billing & Invoices',
    icon: DollarSign,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200'
  },
  projects: {
    label: 'Projects & Deliverables',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200'
  }
};

export default function UnivCustomerTimeline({ customerId = null, compact = false }) {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [timelineEvents, setTimelineEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || 'all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Quick Log form state
  const [logForm, setLogForm] = useState({
    clientId: customerId || '',
    clientName: '',
    activityType: 'call',
    module: 'crm',
    title: '',
    description: '',
    outcome: 'successful',
    eventDate: new Date().toISOString().split('T')[0]
  });

  const fetchTimelineData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);

      const [clientRes, leadActRes, landAllocRes, viewingRes, offerRes, txnRes, leaseRes, invRes, projRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_lead_activities WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_land_allocations WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_invoices WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_projects WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const clientList = clientRes.rows?._array || Array.from(clientRes.rows || []);
      setClients(clientList);

      const events = [];

      // 1. Lead Activities
      (leadActRes.rows?._array || Array.from(leadActRes.rows || [])).forEach(act => {
        events.push({
          id: `act-${act.id}`,
          date: act.created_at || act.activity_date || new Date().toISOString(),
          module: 'crm',
          type: act.activity_type || 'note',
          title: act.subject || `${act.activity_type || 'Interaction'} with Lead`,
          description: act.notes || act.description || '',
          actor: act.logged_by || act.agent_name || 'System Agent',
          clientId: act.lead_id || act.client_id,
          clientName: act.lead_name || act.client_name || 'Client',
          badge: act.outcome || 'Logged'
        });
      });

      // 2. Land Allocations
      (landAllocRes.rows?._array || Array.from(landAllocRes.rows || [])).forEach(alloc => {
        events.push({
          id: `alloc-${alloc.id}`,
          date: alloc.allocation_date || alloc.created_at,
          module: 'land',
          type: 'land_allocation',
          title: `Plot Allocation: ${alloc.customer_name}`,
          description: `Deposit: ${formatCurrency(alloc.deposit_amount || 0)} | Terms: ${alloc.payment_terms || 'Standard'}. Status: ${alloc.allocation_status}`,
          actor: 'Land Officer',
          clientId: alloc.client_id,
          clientName: alloc.customer_name,
          badge: alloc.allocation_status || 'Allocated',
          amount: alloc.total_agreed_price
        });
      });

      // 3. Property Viewings
      (viewingRes.rows?._array || Array.from(viewingRes.rows || [])).forEach(v => {
        events.push({
          id: `view-${v.id}`,
          date: v.viewing_date || v.created_at,
          module: 'property',
          type: 'viewing',
          title: `Property Viewing: ${v.property_title || 'Site Tour'}`,
          description: `Feedback: ${v.feedback || 'Conducted site inspection'}. Status: ${v.status}`,
          actor: v.agent_name || 'Showing Agent',
          clientId: v.client_id,
          clientName: v.client_name || 'Prospective Buyer',
          badge: v.status || 'Completed'
        });
      });

      // 4. Offers & Transactions
      (offerRes.rows?._array || Array.from(offerRes.rows || [])).forEach(o => {
        events.push({
          id: `offer-${o.id}`,
          date: o.created_at,
          module: 'finance',
          type: 'offer',
          title: `Submitted Offer: ${formatCurrency(o.offer_amount || 0)}`,
          description: `Terms: ${o.conditions || 'Standard purchase offer'}. Status: ${o.status}`,
          actor: o.buyer_name || 'Buyer',
          clientId: o.client_id,
          clientName: o.buyer_name || 'Client',
          badge: o.status || 'Offer Submitted',
          amount: o.offer_amount
        });
      });

      (txnRes.rows?._array || Array.from(txnRes.rows || [])).forEach(t => {
        events.push({
          id: `txn-${t.id}`,
          date: t.closing_date || t.created_at,
          module: 'finance',
          type: 'transaction',
          title: `Transaction Closed: ${t.property_title || 'Deal'}`,
          description: `Total Settlement: ${formatCurrency(t.sale_price || t.amount || 0)} (${t.status})`,
          actor: t.agent_name || 'Closer',
          clientId: t.client_id || t.buyer_id,
          clientName: t.buyer_name || t.client_name || 'Client',
          badge: 'Closed Deal',
          amount: t.sale_price || t.amount
        });
      });

      // 5. Leases
      (leaseRes.rows?._array || Array.from(leaseRes.rows || [])).forEach(l => {
        events.push({
          id: `lease-${l.id}`,
          date: l.start_date || l.created_at,
          module: 'property',
          type: 'lease',
          title: `Lease Executed: ${l.property_title || 'Unit'}`,
          description: `Rent: ${formatCurrency(l.monthly_rent || 0)}/mo | Period: ${l.start_date} to ${l.end_date}`,
          actor: 'Property Manager',
          clientId: l.tenant_id || l.client_id,
          clientName: l.tenant_name || 'Tenant',
          badge: l.status || 'Active Lease',
          amount: l.monthly_rent
        });
      });

      // 6. Invoices
      (invRes.rows?._array || Array.from(invRes.rows || [])).forEach(inv => {
        events.push({
          id: `inv-${inv.id}`,
          date: inv.issue_date || inv.created_at,
          module: 'finance',
          type: 'invoice',
          title: `Invoice Generated #${inv.invoice_number || inv.id.slice(0, 6)}`,
          description: `Amount: ${formatCurrency(inv.total_amount || inv.amount || 0)} | Status: ${inv.status || 'Pending'}`,
          actor: 'Accounts',
          clientId: inv.customer_id || inv.client_id,
          clientName: inv.customer_name || inv.client_name || 'Customer',
          badge: inv.status || 'Invoice'
        });
      });

      // 7. Projects
      (projRes.rows?._array || Array.from(projRes.rows || [])).forEach(p => {
        events.push({
          id: `proj-${p.id}`,
          date: p.created_at,
          module: 'projects',
          type: 'project',
          title: `Project Milestone: ${p.name || 'Project'}`,
          description: `Status: ${p.status || 'In Progress'} | Budget: ${formatCurrency(p.budget || 0)}`,
          actor: p.project_manager || 'Project Manager',
          clientId: p.client_id,
          clientName: p.client_name || 'Stakeholder',
          badge: p.status || 'Milestone'
        });
      });

      // Sort chronological descending
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimelineEvents(events);
    } catch (err) {
      console.error('[UnivCustomerTimeline] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [companyId]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(ev => {
      const matchModule = selectedModule === 'all' || ev.module === selectedModule;
      const matchCustomer = selectedCustomerId === 'all' || ev.clientId === selectedCustomerId;
      const matchSearch = search === '' ||
        ev.title?.toLowerCase().includes(search.toLowerCase()) ||
        ev.description?.toLowerCase().includes(search.toLowerCase()) ||
        ev.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        ev.actor?.toLowerCase().includes(search.toLowerCase());

      return matchModule && matchCustomer && matchSearch;
    });
  }, [timelineEvents, selectedModule, selectedCustomerId, search]);

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!logForm.title.trim()) return toast.error('Activity subject is required');

    try {
      const id = generateUUID();
      const payload = {
        id,
        created_at: new Date().toISOString(),
        company_id: companyId,
        lead_id: logForm.clientId || null,
        activity_type: logForm.activityType,
        subject: logForm.title,
        notes: logForm.description,
        outcome: logForm.outcome,
        logged_by: user?.email || user?.name || 'Staff User'
      };

      const keys = Object.keys(payload);
      const vals = Object.values(payload);
      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        vals
      );

      toast.success('Activity interaction logged');
      setShowLogModal(false);
      setLogForm({
        clientId: '',
        clientName: '',
        activityType: 'call',
        module: 'crm',
        title: '',
        description: '',
        outcome: 'successful',
        eventDate: new Date().toISOString().split('T')[0]
      });
      fetchTimelineData();
    } catch (err) {
      console.error('[UnivCustomerTimeline] Save activity error:', err);
      toast.error('Failed to log interaction');
    }
  };

  return (
    <div className={`flex flex-col gap-6 w-full ${compact ? 'p-0' : 'min-h-[80vh] p-4 md:p-6 bg-background text-foreground'}`}>
      {/* Top Header */}
      {!compact && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Customer Interaction Timeline</h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Universal Timeline
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unified cross-module feed of customer communications, land allocations, viewings, offers, and billing milestones.
            </p>
          </div>
          <Button onClick={() => setShowLogModal(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Log Interaction
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search timeline notes, customers, actions..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Module Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="crm">CRM & Communications</SelectItem>
              <SelectItem value="land">Land Allocations</SelectItem>
              <SelectItem value="property">Property & Leases</SelectItem>
              <SelectItem value="finance">Finance & Deals</SelectItem>
              <SelectItem value="projects">Projects & Milestones</SelectItem>
            </SelectContent>
          </Select>

          {!customerId && (
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Customer Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Clock className="w-5 h-5 animate-spin mr-2" /> Aggregating cross-module customer activities...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed border-border text-center">
          <Clock className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">No Timeline Events Recorded</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            No interactions or module records match your filters. Log a call, note, or site meeting to begin building customer history.
          </p>
          <Button onClick={() => setShowLogModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Log First Interaction
          </Button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
          {filteredEvents.map((ev) => {
            const mod = moduleConfig[ev.module] || moduleConfig.crm;
            const ModIcon = mod.icon;

            return (
              <div key={ev.id} className="relative group">
                {/* Node Icon */}
                <div className="absolute -left-6 sm:-left-8 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-primary ring-4 ring-background shadow-xs">
                  <ModIcon className="w-3 h-3 text-primary" />
                </div>

                {/* Card Container */}
                <Card className="hover:border-primary/40 transition-all shadow-xs">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs border ${mod.color}`}>
                          {mod.label}
                        </Badge>
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">
                          {ev.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(ev.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-xs text-muted-foreground border-t border-border/30">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <strong className="text-foreground">{ev.clientName}</strong>
                        </span>
                        <span>•</span>
                        <span>Logged by: {ev.actor}</span>
                      </div>
                      {ev.badge && (
                        <Badge variant="outline" className="text-xs">
                          {ev.badge}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Interaction Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Customer Interaction</DialogTitle>
            <DialogDescription>
              Record a phone call, email, site viewing note, or meeting log.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveActivity} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Customer / Client</Label>
              <Select
                value={logForm.clientId}
                onValueChange={v => {
                  const cl = clients.find(c => c.id === v);
                  setLogForm({ ...logForm, clientId: v, clientName: cl?.name || '' });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Interaction Type</Label>
                <Select
                  value={logForm.activityType}
                  onValueChange={v => setLogForm({ ...logForm, activityType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting / Site Tour</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp / SMS</SelectItem>
                    <SelectItem value="note">Internal Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Outcome</Label>
                <Select
                  value={logForm.outcome}
                  onValueChange={v => setLogForm({ ...logForm, outcome: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">Successful / Interested</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Required</SelectItem>
                    <SelectItem value="negotiating">In Negotiation</SelectItem>
                    <SelectItem value="closed">Closed / Finalized</SelectItem>
                    <SelectItem value="unresponsive">Unresponsive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Subject / Title *</Label>
              <Input
                value={logForm.title}
                onChange={e => setLogForm({ ...logForm, title: e.target.value })}
                placeholder="e.g. Discussed allocation deposit terms"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Summary Notes</Label>
              <textarea
                className="w-full h-20 p-2 text-sm bg-background border border-border rounded-md"
                value={logForm.description}
                onChange={e => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="Key details agreed upon, next steps..."
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Interaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
