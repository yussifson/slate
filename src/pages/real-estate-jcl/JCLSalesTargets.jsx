import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Award, TrendingUp, Users, Plus, CheckCircle2, Clock, 
  Calendar, AlertCircle, Sparkles, Filter, ChevronRight, UserCheck, 
  Layers, ArrowUpRight, Check, Trash2, Edit3, RefreshCw
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function JCLSalesTargets() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [targets, setTargets] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & tab
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed', 'my_targets'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Permissions: Admin or Marketing Manager can create targets
  const userRole = (user?.role || '').toLowerCase();
  const isManager = ['admin', 'super_admin', 'company_admin', 'managing_partner', 'marketing', 'marketing_manager', 'director'].includes(userRole);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    target_type: 'leads_closed', // 'leads_closed', 'revenue', 'viewings'
    target_value: 10,
    period_start: format(new Date(), 'yyyy-MM-dd'),
    period_end: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
    assigned_to: 'all', // 'all', 'selected', 'single'
    assignee_ids: [],
    notes: '',
  });

  const loadData = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      // 1. Fetch sales targets
      const { data: targetsData, error: targetsErr } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (!targetsErr && targetsData) {
        setTargets(targetsData);
      } else {
        // Fallback to local storage if table not yet migrated
        const stored = localStorage.getItem(`jcl_sales_targets_${companyId}`);
        if (stored) {
          try { setTargets(JSON.parse(stored)); } catch (e) {}
        }
      }

      // 2. Fetch staff/marketers
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department')
        .eq('company_id', companyId);

      if (profilesData) {
        const markStaff = profilesData.filter(p => {
          const r = (p.role || '').toLowerCase();
          const d = (p.department || '').toLowerCase();
          return d.includes('market') || d.includes('sales') || ['marketer', 'marketing', 'agent', 'field_tracker'].includes(r);
        });
        setMarketers(markStaff.length > 0 ? markStaff : profilesData);
      }

      // 3. Fetch leads for auto-calculation
      const { data: leadsData } = await supabase
        .from('univ_re_leads')
        .select('id, assigned_agent_id, status, created_at, lead_value')
        .eq('company_id', companyId);
      if (leadsData) setLeads(leadsData);

      // 4. Fetch viewings
      const { data: viewingsData } = await supabase
        .from('univ_re_viewings')
        .select('id, agent_id, viewing_date, status')
        .eq('company_id', companyId);
      if (viewingsData) setViewings(viewingsData);

      // 5. Fetch transactions / revenue
      const { data: transData } = await supabase
        .from('univ_re_transactions')
        .select('id, agent_id, total_amount, transaction_date')
        .eq('company_id', companyId);
      if (transData) setTransactions(transData);

    } catch (e) {
      console.warn('Sales targets load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Compute progress for a specific target and optional specific marketer
  const calculateProgress = (target, specificMarketerId = null) => {
    const start = new Date(target.period_start);
    const end = new Date(target.period_end + 'T23:59:59');

    // Eligible assignee IDs
    let eligibleIds = [];
    if (target.assigned_to === 'all') {
      eligibleIds = marketers.map(m => m.id);
    } else {
      eligibleIds = (target.assignee_ids || []).map(a => typeof a === 'object' ? a.id : a);
    }

    if (specificMarketerId) {
      eligibleIds = eligibleIds.filter(id => id === specificMarketerId);
    }

    let achieved = 0;

    if (target.target_type === 'leads_closed') {
      achieved = leads.filter(l => {
        const isAssigned = eligibleIds.includes(l.assigned_agent_id);
        const isClosed = (l.status || '').toLowerCase() === 'closed';
        const d = new Date(l.created_at);
        return isAssigned && isClosed && d >= start && d <= end;
      }).length;
    } else if (target.target_type === 'revenue') {
      achieved = transactions.filter(t => {
        const isAssigned = eligibleIds.includes(t.agent_id);
        const d = new Date(t.transaction_date);
        return isAssigned && d >= start && d <= end;
      }).reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0);
    } else if (target.target_type === 'viewings') {
      achieved = viewings.filter(v => {
        const isAssigned = eligibleIds.includes(v.agent_id);
        const d = new Date(v.viewing_date);
        return isAssigned && d >= start && d <= end;
      }).length;
    }

    const targetVal = Number(target.target_value) || 1;
    const percent = Math.min(Math.round((achieved / targetVal) * 100), 100);
    const isCompleted = achieved >= targetVal;

    return { achieved, targetVal, percent, isCompleted };
  };

  // Create new Target
  const handleCreateTarget = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.target_value) {
      toast.error('Please enter a target title and value');
      return;
    }

    try {
      const payload = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'tgt_' + Date.now(),
        company_id: companyId,
        title: formData.title,
        target_type: formData.target_type,
        target_value: Number(formData.target_value),
        period_start: formData.period_start,
        period_end: formData.period_end,
        assigned_to: formData.assigned_to,
        assignee_ids: formData.assignee_ids,
        notes: formData.notes,
        status: 'active',
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('sales_targets').insert([payload]);
      
      // Also sync to local persistence for offline reliability
      const currentList = [...targets, payload];
      localStorage.setItem(`jcl_sales_targets_${companyId}`, JSON.stringify(currentList));
      setTargets(currentList);

      toast.success('Sales target assigned successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        target_type: 'leads_closed',
        target_value: 10,
        period_start: format(new Date(), 'yyyy-MM-dd'),
        period_end: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
        assigned_to: 'all',
        assignee_ids: [],
        notes: '',
      });
    } catch (err) {
      toast.error('Failed to save sales target');
      console.error(err);
    }
  };

  // Toggle selection of marketer for "selected" target
  const toggleMarketerSelection = (marketer) => {
    const exists = formData.assignee_ids.some(a => (typeof a === 'object' ? a.id : a) === marketer.id);
    if (exists) {
      setFormData({
        ...formData,
        assignee_ids: formData.assignee_ids.filter(a => (typeof a === 'object' ? a.id : a) !== marketer.id)
      });
    } else {
      setFormData({
        ...formData,
        assignee_ids: [...formData.assignee_ids, { id: marketer.id, name: marketer.full_name || marketer.email, email: marketer.email }]
      });
    }
  };

  const myId = user?.id;

  // Filtered targets
  const filteredTargets = useMemo(() => {
    return targets.filter(t => {
      if (activeTab === 'active') return t.status === 'active';
      if (activeTab === 'completed') {
        const { isCompleted } = calculateProgress(t);
        return isCompleted || t.status === 'completed';
      }
      if (activeTab === 'my_targets') {
        if (t.assigned_to === 'all') return true;
        const ids = (t.assignee_ids || []).map(a => typeof a === 'object' ? a.id : a);
        return ids.includes(myId);
      }
      return true;
    });
  }, [targets, activeTab, leads, viewings, transactions]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── 1. Top Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Marketer Sales Targets
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set monthly acquisition targets, track closed leads, and evaluate team performance in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs h-9">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          {isManager && (
            <Button 
              onClick={() => setShowCreateModal(true)} 
              size="sm" 
              className="gap-1.5 text-xs h-9 font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Target
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Summary KPI Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Targets</span>
              <p className="text-2xl font-black text-foreground">{targets.filter(t => t.status === 'active').length}</p>
              <p className="text-[11px] text-muted-foreground">Running campaign goals</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marketers Tracked</span>
              <p className="text-2xl font-black text-foreground">{marketers.length}</p>
              <p className="text-[11px] text-muted-foreground">Sales & field officers</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Closed Leads (Won)</span>
              <p className="text-2xl font-black text-emerald-600">{leads.filter(l => (l.status || '').toLowerCase() === 'closed').length}</p>
              <p className="text-[11px] text-muted-foreground">Successfully converted</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Achieved Goals</span>
              <p className="text-2xl font-black text-purple-600">
                {targets.filter(t => calculateProgress(t).isCompleted).length}
              </p>
              <p className="text-[11px] text-muted-foreground">100% target reached</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Tabs / Filter ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1.5">All Targets</TabsTrigger>
            <TabsTrigger value="active" className="text-xs font-semibold px-3 py-1.5">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs font-semibold px-3 py-1.5">Achieved 🎉</TabsTrigger>
            <TabsTrigger value="my_targets" className="text-xs font-semibold px-3 py-1.5">My Assigned Targets</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── 4. Target Cards Grid ── */}
      {filteredTargets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/40 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">No Sales Targets Found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {isManager 
                ? 'Create a monthly sales target to assign to marketers and monitor their lead closing progress.'
                : 'No targets currently assigned to you. When your marketing manager assigns one, it will appear here.'}
            </p>
          </div>
          {isManager && (
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="mt-2 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create First Target
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTargets.map(target => {
            const { achieved, targetVal, percent, isCompleted } = calculateProgress(target);

            // Determine unit label
            let unitLabel = 'Leads Closed';
            if (target.target_type === 'revenue') unitLabel = 'GH₵ Revenue';
            if (target.target_type === 'viewings') unitLabel = 'Client Viewings';

            return (
              <Card 
                key={target.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md",
                  isCompleted 
                    ? "border-emerald-500/40 bg-linear-to-b from-card to-emerald-500/5"
                    : "border-border/80 bg-card"
                )}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0 px-2 bg-muted/60">
                          {target.target_type?.replace(/_/g, ' ')}
                        </Badge>
                        {isCompleted && (
                          <Badge className="text-[10px] font-bold bg-emerald-500 text-white border-0 gap-1">
                            <Award className="w-3 h-3" /> Achieved!
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {target.title}
                      </h3>
                    </div>
                  </div>

                  {/* Progress Bar & Big Number */}
                  <div className="space-y-2 bg-muted/30 p-3.5 rounded-xl border border-border/50">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Progress</span>
                      <span className="text-lg font-black text-foreground">
                        {achieved} <span className="text-xs font-semibold text-muted-foreground">/ {targetVal} {unitLabel}</span>
                      </span>
                    </div>

                    <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          isCompleted ? "bg-emerald-500" : percent > 50 ? "bg-indigo-600" : "bg-amber-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-0.5">
                      <span className="font-bold text-foreground">{percent}% Completed</span>
                      <span className="text-muted-foreground">
                        {targetVal - achieved > 0 ? `${targetVal - achieved} remaining` : 'Target met!'}
                      </span>
                    </div>
                  </div>

                  {/* Assignment Scope */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {target.assigned_to === 'all' 
                          ? `All Marketers (${marketers.length})` 
                          : target.assigned_to === 'single'
                          ? `1 Assigned Officer`
                          : `${(target.assignee_ids || []).length} Marketers`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Due {target.period_end}</span>
                    </div>
                  </div>

                  {/* Per-Marketer Breakdown (If selected or all) */}
                  {target.assigned_to !== 'single' && (
                    <div className="pt-2 space-y-2 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Marketer Breakdown
                      </span>
                      <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {marketers
                          .filter(m => {
                            if (target.assigned_to === 'all') return true;
                            const ids = (target.assignee_ids || []).map(a => typeof a === 'object' ? a.id : a);
                            return ids.includes(m.id);
                          })
                          .slice(0, 5)
                          .map(m => {
                            const mProg = calculateProgress(target, m.id);
                            return (
                              <div key={m.id} className="flex items-center justify-between p-1.5 rounded-lg bg-card border border-border/60">
                                <span className="font-semibold truncate max-w-[140px] text-foreground">
                                  {m.full_name || m.email}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-muted-foreground">
                                    {mProg.achieved}/{targetVal}
                                  </span>
                                  {mProg.isCompleted ? (
                                    <Badge className="text-[9px] bg-emerald-500 text-white px-1.5 py-0">Won</Badge>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground font-semibold">{mProg.percent}%</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Notes if any */}
                  {target.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded-lg border border-border/40">
                      "{target.notes}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 5. Create Target Modal (Manager Only) ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Create Marketer Sales Target</span>
            </DialogTitle>
            <DialogDescription>
              Assign monthly closing quotas and monitor individual vs team progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTarget} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Target Title *</Label>
              <Input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. November Q4 Land Sales Blitz"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Target Metric</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={v => setFormData({ ...formData, target_type: v })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads_closed">Leads Closed (Won)</SelectItem>
                    <SelectItem value="revenue">Revenue (GH₵)</SelectItem>
                    <SelectItem value="viewings">Client Viewings Conducted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Goal Target Value *</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.target_value}
                  onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="10"
                  className="mt-1 h-9 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Period Start Date</Label>
                <Input
                  type="date"
                  value={formData.period_start}
                  onChange={e => setFormData({ ...formData, period_start: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Period End Date (Deadline)</Label>
                <Input
                  type="date"
                  value={formData.period_end}
                  onChange={e => setFormData({ ...formData, period_end: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Assignment Mode */}
            <div>
              <Label className="text-xs font-semibold">Assign Target To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={v => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketers in Company</SelectItem>
                  <SelectItem value="selected">Selected Marketers</SelectItem>
                  <SelectItem value="single">Single Individual Marketer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marketer picker if not 'all' */}
            {formData.assigned_to !== 'all' && (
              <div className="space-y-2 border border-border p-3 rounded-xl bg-muted/20">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">
                  Select Assignee(s) ({formData.assignee_ids.length} selected)
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {marketers.map(m => {
                    const isSelected = formData.assignee_ids.some(a => (typeof a === 'object' ? a.id : a) === m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMarketerSelection(m)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-card border-border hover:bg-muted text-foreground"
                        )}
                      >
                        <div>
                          <p>{m.full_name || m.email}</p>
                          <span className="text-[10px] text-muted-foreground">{m.role || 'Marketer'}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Strategic Notes / Instructions</Label>
              <Input
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Focus on Aburi Ridge Phase 2 residential plots"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                Save & Assign Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
