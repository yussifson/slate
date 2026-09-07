import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, MessageSquare, Calendar, Compass,
  Home, DollarSign, User, Plus,
  Search
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

const moduleConfig = {
  crm: {
    label: 'CRM & Outreach',
    icon: MessageSquare,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
    nodeColor: 'bg-emerald-500',
  },
  land: {
    label: 'Land Allocation',
    icon: Compass,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
    nodeColor: 'bg-amber-500',
  },
  property: {
    label: 'Viewing & Tenancy',
    icon: Home,
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
    nodeColor: 'bg-blue-500',
  },
  finance: {
    label: 'Offers & Finance',
    icon: DollarSign,
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200',
    nodeColor: 'bg-indigo-500',
  },
};

export default function CustomerTimeline({ customerId = null, compact = false }) {
  const companyId = useCompanyId();
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
  });

  const fetchTimelineData = async () => {
    try {
      setIsLoading(true);

      const [clientRes, leadsRes, leadActRes, viewingRes, offerRes, txnRes, leaseRes, propRes] = await Promise.all([
        powerSync.execute(`SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC`, [companyId]),
        powerSync.execute(`SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_lead_activities WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC`, [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute(`SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).catch(() => ({ rows: [] })),
      ]);

      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);
      const leadsList = leadsRes.rows._array || Array.from(leadsRes.rows || []);
      setClients(clientList);

      const clientNameMap = {};
      clientList.forEach(c => { clientNameMap[c.id] = c.name; });
      leadsList.forEach(l => {
        const fullLeadName = `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.email || 'Prospect Lead';
        clientNameMap[l.id] = fullLeadName;
      });

      const events = [];

      // 1. CRM Lead Activities
      (leadActRes.rows._array || Array.from(leadActRes.rows || [])).forEach(act => {
        const resolvedName = (act.lead_id ? clientNameMap[act.lead_id] : null) || 'Client Interaction';
        events.push({
          id: `crm_${act.id}`,
          clientId: act.lead_id || '',
          clientName: resolvedName,
          module: 'crm',
          activityType: act.activity_type || 'activity',
          title: act.subject || `CRM ${act.activity_type || 'Interaction'}`,
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
        try { if (p.features) meta = JSON.parse(p.features); } catch(_e) {}
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
    } catch (_e) {
      toast.error('Failed to load timeline events');
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
          id, created_at, company_id, lead_id, activity_type, subject, description, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          now,
          companyId,
          logForm.clientId || null,
          logForm.activityType,
          logForm.title,
          logForm.description || null,
          logForm.outcome || 'completed'
        ]
      );

      toast.success('Interaction logged to timeline');
      setShowLogModal(false);
      fetchTimelineData();
    } catch (_err) {
      toast.error('Failed to log interaction');
    }
  };

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 sm:p-6 pb-28 font-sans'}`}>
      {/* ── Header (Only if standalone page) ── */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Customer Timeline ({timelineEvents.length})
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Omni-channel activity audit across CRM, Land Allocations, Property Viewings, and Financial Deals
            </p>
          </div>

          <Button
            onClick={() => setShowLogModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 shadow-sm text-xs h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            Log Interaction
          </Button>
        </div>
      )}

      {/* ── Filters Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-card/90 backdrop-blur-xl p-3 sm:p-4 rounded-[20px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interaction, notes, client..."
            className="pl-8 h-9 rounded-xl text-xs bg-background border-border/80"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {!customerId && (
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="h-9 w-44 rounded-xl text-xs font-medium bg-background border-border/80">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients ({clients.length})</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="h-9 w-40 rounded-xl text-xs font-medium bg-background border-border/80">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="crm">CRM & Outreach</SelectItem>
              <SelectItem value="land">Land Allocations</SelectItem>
              <SelectItem value="property">Viewings & Leases</SelectItem>
              <SelectItem value="finance">Offers & Deals</SelectItem>
            </SelectContent>
          </Select>

          {compact && (
            <Button
              size="sm"
              onClick={() => setShowLogModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 px-3 gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Log Event
            </Button>
          )}
        </div>
      </div>

      {/* ── Chronological Vertical Timeline Stem ── */}
      {isLoading ? (
        <div className="space-y-4 py-8 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 h-24 bg-muted rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-card/60 backdrop-blur-xl rounded-[24px] border border-dashed border-border/80 p-8 space-y-3">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-foreground">No timeline events found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedModule !== 'all' || selectedCustomerId !== 'all'
              ? 'Try resetting your active search queries or department filters.'
              : 'Log your first customer interaction, land booking, or inspection tour to begin timeline tracking.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
          {filteredEvents.map((ev) => {
            const mod = moduleConfig[ev.module] || moduleConfig.crm;
            const Icon = ev.icon || mod.icon;

            return (
              <div key={ev.id} className="relative group">
                {/* Timeline Colored Circular Node */}
                <div className={cn(
                  "absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110",
                  mod.nodeColor
                )}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Event Card */}
                <div className="p-4 sm:p-5 bg-card/90 backdrop-blur-xl rounded-[22px] border border-border/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-500/40 transition-all space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-[10px] font-extrabold uppercase border", mod.badgeColor)}>
                        {mod.label}
                      </Badge>
                      <span className="font-extrabold text-[13px] text-foreground">{ev.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{ev.date ? format(new Date(ev.date), 'dd MMM yyyy, HH:mm') : 'Recent'}</span>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-foreground/80 font-medium leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      {ev.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                      <User className="w-3 h-3 text-indigo-600" />
                      <span className="text-foreground">{ev.clientName}</span>
                    </div>

                    <Badge variant="outline" className="text-[10px] uppercase font-black bg-muted/30">
                      {ev.status}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Log Client Interaction Modal ── */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Plus className="w-5 h-5 text-indigo-600" />
              Log Customer Interaction
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a call, consultation, physical parcel tour, or contract note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {clients.length > 0 && !customerId && (
              <div className="space-y-1">
                <Label className="font-bold">Select Client</Label>
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
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue placeholder="Choose a registered client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="font-bold">Event Subject / Title *</Label>
              <Input
                required
                value={logForm.title}
                onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                placeholder="e.g. Discussed installment payment terms for Airport Hills Plot"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="font-bold">Interaction Medium</Label>
                <Select
                  value={logForm.activityType}
                  onValueChange={(v) => setLogForm({ ...logForm, activityType: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="viewing">Site Inspection</SelectItem>
                    <SelectItem value="email">Email Follow-Up</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp / Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-bold">Department / Module</Label>
                <Select
                  value={logForm.module}
                  onValueChange={(v) => setLogForm({ ...logForm, module: v })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crm">CRM & Outreach</SelectItem>
                    <SelectItem value="land">Land Allocation</SelectItem>
                    <SelectItem value="property">Viewing & Tenancy</SelectItem>
                    <SelectItem value="finance">Offers & Deals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-bold">Detailed Event Notes</Label>
              <Input
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="Client requested site layout deed survey and certified title copy..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogModal(false)}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveLog}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
            >
              Record Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
