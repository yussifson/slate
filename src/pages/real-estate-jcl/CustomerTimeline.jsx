import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock, MessageSquare, Phone, Mail, Calendar, Compass,
  Home, DollarSign, FileText, CheckCircle2, User, Plus,
  Filter, Search, ArrowUpRight, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
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
    label: 'CRM & Lead',
    icon: MessageSquare,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200'
  },
  land: {
    label: 'Land Allocation',
    icon: Compass,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200'
  },
  property: {
    label: 'Property & Lease',
    icon: Home,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200'
  },
  finance: {
    label: 'Deals & Finance',
    icon: DollarSign,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200'
  },
};

export default function CustomerTimeline({ customerId = null, compact = false }) {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

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
    eventDate: new Date().toISOString().split('T')[0],
  });

  const fetchTimelineData = async () => {
    try {
      setIsLoading(true);

      // Fetch across CRM lead activities, viewings, offers, transactions, leases, properties (land allocations), and manual notes
      const [clientRes, leadActRes, viewingRes, offerRes, txnRes, leaseRes, propRes] = await Promise.all([
        powerSync.execute(`SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC`, [companyId]),
        powerSync.execute(`SELECT * FROM univ_re_lead_activities WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
      ]);

      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);
      setClients(clientList);

      const events = [];

      // 1. CRM Lead Activities
      (leadActRes.rows._array || Array.from(leadActRes.rows || [])).forEach(act => {
        events.push({
          id: `crm_${act.id}`,
          clientId: act.lead_id || '',
          clientName: act.lead_name || 'Prospect Lead',
          module: 'crm',
          activityType: act.activity_type || 'activity',
          title: act.subject || `CRM ${act.activity_type || 'Log'}`,
          description: act.description || act.notes || '',
          date: act.created_at || new Date().toISOString(),
          status: act.outcome || 'completed',
          icon: MessageSquare,
        });
      });

      // 2. Property Viewings
      (viewingRes.rows._array || Array.from(viewingRes.rows || [])).forEach(v => {
        events.push({
          id: `view_${v.id}`,
          clientId: v.client_id || '',
          clientName: v.client_name || 'Client',
          module: 'property',
          activityType: 'viewing',
          title: `Property Inspection Tour: ${v.property_address || 'Scheduled Viewing'}`,
          description: `Agent: ${v.agent_name || 'Assigned Agent'}. ${v.notes || ''}`,
          date: v.viewing_date || v.created_at || new Date().toISOString(),
          status: v.status || 'scheduled',
          icon: Home,
        });
      });

      // 3. Purchase Offers
      (offerRes.rows._array || Array.from(offerRes.rows || [])).forEach(o => {
        events.push({
          id: `offer_${o.id}`,
          clientId: '',
          clientName: o.buyer_name || 'Buyer',
          module: 'finance',
          activityType: 'offer',
          title: `Purchase Offer: ${formatCurrency(o.offer_amount, 'USD')} for ${o.property_address || 'Property'}`,
          description: `Earnest Deposit: ${formatCurrency(o.earnest_money, 'USD')}. Terms: ${o.contingencies || 'Standard'}`,
          date: o.created_at || new Date().toISOString(),
          status: o.status || 'pending',
          icon: DollarSign,
        });
      });

      // 4. Deals & Transactions
      (txnRes.rows._array || Array.from(txnRes.rows || [])).forEach(t => {
        events.push({
          id: `txn_${t.id}`,
          clientId: '',
          clientName: t.buyer_name || t.seller_name || 'Client',
          module: 'finance',
          activityType: 'transaction',
          title: `Sales Deal Stage: ${t.status?.replace('_', ' ').toUpperCase()} on ${t.property_address || 'Property'}`,
          description: `Closing Price: ${formatCurrency(t.sale_price, 'USD')}. Agent: ${t.agent_name || 'N/A'}`,
          date: t.closing_date || t.created_at || new Date().toISOString(),
          status: t.status || 'in_progress',
          icon: DollarSign,
        });
      });

      // 5. Land Allocations
      (propRes.rows._array || Array.from(propRes.rows || [])).forEach(p => {
        let meta = {};
        try { if (p.features) meta = JSON.parse(p.features); } catch(e) {}
        if (meta.allocation?.customerName) {
          events.push({
            id: `alloc_${p.id}`,
            clientId: meta.allocation.customerId || '',
            clientName: meta.allocation.customerName,
            module: 'land',
            activityType: 'allocation',
            title: `Land Parcel Allocated: ${meta.parcelName || p.address}`,
            description: `Plot ${meta.plotNumber || ''} (${meta.lotSizeAcres || p.lot_size || ''} Acres). Deposit: ${formatCurrency(meta.allocation.depositAmount, 'USD')}. Terms: ${meta.allocation.paymentTerms}`,
            date: meta.allocation.allocatedAt || meta.allocation.allocationDate || p.created_at || new Date().toISOString(),
            status: meta.allocation.allocationStatus || 'active_reserved',
            icon: Compass,
          });
        }
      });

      // 6. Leases
      (leaseRes.rows._array || Array.from(leaseRes.rows || [])).forEach(l => {
        events.push({
          id: `lease_${l.id}`,
          clientId: l.tenant_id || '',
          clientName: l.tenant_name || 'Tenant',
          module: 'property',
          activityType: 'lease',
          title: `Tenancy Lease Agreement: ${l.property_address || 'Unit'}`,
          description: `Rent: ${formatCurrency(l.monthly_rent, 'USD')}/month. Term: ${l.start_date} to ${l.end_date}`,
          date: l.start_date || l.created_at || new Date().toISOString(),
          status: l.status || 'active',
          icon: Home,
        });
      });

      // Sort descending by date
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineEvents(events);
    } catch (e) {
      console.error('[CustomerTimeline] Fetch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchTimelineData();
  }, [companyId]);

  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(ev => {
      const matchClient = selectedCustomerId === 'all' ||
        ev.clientId === selectedCustomerId ||
        ev.clientName?.toLowerCase().includes(
          (clients.find(c => c.id === selectedCustomerId)?.name || '').toLowerCase()
        );

      const matchModule = selectedModule === 'all' || ev.module === selectedModule;

      const matchSearch = search === '' ||
        ev.title?.toLowerCase().includes(search.toLowerCase()) ||
        ev.description?.toLowerCase().includes(search.toLowerCase()) ||
        ev.clientName?.toLowerCase().includes(search.toLowerCase());

      return matchClient && matchModule && matchSearch;
    });
  }, [timelineEvents, selectedCustomerId, selectedModule, search, clients]);

  const handleSaveLog = async () => {
    if (!logForm.title) {
      toast.error('Subject/Title is required');
      return;
    }

    try {
      const newId = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (
          id, created_at, company_id, lead_id, lead_name, activity_type, subject, description, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          now,
          companyId,
          logForm.clientId || 'general',
          logForm.clientName || 'General Client Interaction',
          logForm.activityType,
          logForm.title,
          logForm.description,
          logForm.outcome
        ]
      );

      toast.success('Interaction logged to timeline');
      setShowLogModal(false);
      fetchTimelineData();
    } catch (err) {
      console.error('[CustomerTimeline] Save error:', err);
      toast.error('Failed to log interaction');
    }
  };

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 sm:p-6 pb-28'}`}>
      {/* ── Header ── */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Customer Interaction Timeline
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-300">
                    Cross-Module Audit
                  </Badge>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Complete activity history across CRM, Land Allocations, Property Viewings, and Financial Deals
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowLogModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Client Interaction
          </Button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-card p-3 rounded-2xl border shadow-sm text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interaction, notes, client..."
            className="pl-8 h-9 rounded-xl text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {!customerId && (
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="h-9 w-40 rounded-xl text-xs">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="h-9 w-36 rounded-xl text-xs">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="crm">CRM & Leads</SelectItem>
              <SelectItem value="land">Land Allocations</SelectItem>
              <SelectItem value="property">Property & Leases</SelectItem>
              <SelectItem value="finance">Deals & Finance</SelectItem>
            </SelectContent>
          </Select>

          {compact && (
            <Button
              size="sm"
              onClick={() => setShowLogModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-9 gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log
            </Button>
          )}
        </div>
      </div>

      {/* ── Timeline Activity Feed ── */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-dashed text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold text-foreground">No timeline interactions found</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log an interaction or perform a land allocation / property viewing to see it in the timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
          {filteredEvents.map((ev, index) => {
            const modInfo = moduleConfig[ev.module] || moduleConfig.crm;
            const Icon = ev.icon || modInfo.icon;

            return (
              <div key={ev.id || index} className="relative group">
                {/* Timeline Dot Icon */}
                <div className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-white shadow-sm ${
                  ev.module === 'land' ? 'bg-amber-500' :
                  ev.module === 'property' ? 'bg-blue-500' :
                  ev.module === 'finance' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>

                {/* Card */}
                <Card className="rounded-2xl border bg-card/70 hover:bg-card hover:shadow-md transition-all">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold ${modInfo.color}`}>
                            {modInfo.label}
                          </Badge>
                          <span className="text-xs font-bold text-foreground">
                            {ev.clientName}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground tracking-tight pt-0.5">
                          {ev.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {ev.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-xl border">
                        {ev.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Log Client Interaction ── */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Clock className="w-5 h-5 text-indigo-600" />
              Log Customer Interaction
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a call, meeting, site visit, or email note to the cross-department timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label>Customer / Client</Label>
              <Select
                value={logForm.clientId}
                onValueChange={(cid) => {
                  const found = clients.find(c => c.id === cid);
                  setLogForm(prev => ({
                    ...prev,
                    clientId: cid,
                    clientName: found?.name || ''
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Pick a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Interaction Type</Label>
                <Select
                  value={logForm.activityType}
                  onValueChange={(v) => setLogForm({ ...logForm, activityType: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="site_visit">Land / Site Visit</SelectItem>
                    <SelectItem value="email">Email Note</SelectItem>
                    <SelectItem value="negotiation">Price Negotiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Department / Module</Label>
                <Select
                  value={logForm.module}
                  onValueChange={(v) => setLogForm({ ...logForm, module: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crm">CRM & Prospect</SelectItem>
                    <SelectItem value="land">Land Allocation</SelectItem>
                    <SelectItem value="property">Property & Unit</SelectItem>
                    <SelectItem value="finance">Deals & Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Subject / Title *</Label>
              <Input
                required
                value={logForm.title}
                onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                placeholder="e.g. Discussed Sector 4 land survey terms"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label>Detailed Notes</Label>
              <Input
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="Client agreed on 10% earnest deposit, awaiting draft deed..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label>Outcome Status</Label>
              <Select
                value={logForm.outcome}
                onValueChange={(v) => setLogForm({ ...logForm, outcome: v })}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="successful">Successful / Positive</SelectItem>
                  <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                  <SelectItem value="negotiating">Pending Negotiation</SelectItem>
                  <SelectItem value="closed_deal">Agreement Finalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogModal(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveLog}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Log Interaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
