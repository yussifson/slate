import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { CrmSalesService } from '@/services/CrmSalesService';
import { CorePartyService } from '@/services/CorePartyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Filter,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

export default function CrmWorkspace({ initialTab = 'pipeline' }) {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [parties, setParties] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // New Opp Form
  const [newOpp, setNewOpp] = useState({
    title: '',
    party_id: '',
    stage_id: '',
    expected_revenue: '',
    expected_close_date: ''
  });

  // New Quote Form
  const [newQuote, setNewQuote] = useState({
    title: '',
    party_id: '',
    opportunity_id: '',
    lines: [{ item_description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]
  });

  // New Activity Form
  const [newActivity, setNewActivity] = useState({
    activity_type: 'call',
    title: '',
    party_id: '',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    if (companyId) {
      loadWorkspaceData();
    }
  }, [companyId]);

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [pipeList, partyList] = await Promise.all([
        CrmSalesService.getPipelines(companyId),
        CorePartyService.listParties(companyId, { roleType: 'client' })
      ]);

      setPipelines(pipeList || []);
      setParties(partyList || []);

      const activePipe = pipeList?.[0];
      if (activePipe) {
        setSelectedPipelineId(activePipe.id);
        const [opps, actList] = await Promise.all([
          CrmSalesService.listOpportunities(companyId, { pipelineId: activePipe.id }),
          CrmSalesService.getActivityTimeline(companyId)
        ]);
        setOpportunities(opps || []);
        setActivities(actList || []);
      }
    } catch (err) {
      console.warn('[CrmWorkspace] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activePipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  const stages = activePipeline?.crm_pipeline_stages || [];

  // KPI Calculations
  const totalPipelineValue = opportunities.reduce((acc, o) => acc + (Number(o.expected_revenue) || 0), 0);
  const weightedPipelineValue = opportunities.reduce((acc, o) => {
    const prob = o.probability_override !== null && o.probability_override !== undefined
      ? Number(o.probability_override)
      : (Number(o.crm_pipeline_stages?.probability_percentage) || 0);
    return acc + ((Number(o.expected_revenue) || 0) * (prob / 100));
  }, 0);
  const openDealsCount = opportunities.filter(o => o.status === 'open').length;
  const wonDealsCount = opportunities.filter(o => o.status === 'won').length;

  // Handle Stage Transition
  const handleStageMove = async (oppId, newStageId) => {
    try {
      await CrmSalesService.updateOpportunityStage(companyId, oppId, newStageId, user?.id);
      toast({ title: 'Stage Updated', description: 'Opportunity moved successfully.' });
      loadWorkspaceData();
    } catch (err) {
      toast({ title: 'Stage Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Create Opportunity
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!newOpp.title || !newOpp.stage_id) return;

    try {
      await CrmSalesService.createOpportunity(companyId, {
        ...newOpp,
        pipeline_id: selectedPipelineId
      }, user?.id);

      toast({ title: 'Opportunity Created', description: `Deal "${newOpp.title}" added to pipeline.` });
      setIsOppModalOpen(false);
      setNewOpp({ title: '', party_id: '', stage_id: '', expected_revenue: '', expected_close_date: '' });
      loadWorkspaceData();
    } catch (err) {
      toast({ title: 'Failed to create opportunity', description: err.message, variant: 'destructive' });
    }
  };

  // Create Quotation
  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!newQuote.title || !newQuote.party_id) return;

    try {
      await CrmSalesService.createQuotation(companyId, {
        title: newQuote.title,
        party_id: newQuote.party_id,
        opportunity_id: newQuote.opportunity_id || null
      }, newQuote.lines, user?.id);

      toast({ title: 'Quotation Created', description: 'Draft commercial quote saved.' });
      setIsQuoteModalOpen(false);
      loadWorkspaceData();
    } catch (err) {
      toast({ title: 'Failed to create quotation', description: err.message, variant: 'destructive' });
    }
  };

  // Log Activity
  const handleLogActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.title) return;

    try {
      await CrmSalesService.logActivity(companyId, newActivity, user?.id);
      toast({ title: 'Activity Logged', description: 'Activity added to customer timeline.' });
      setIsActivityModalOpen(false);
      setNewActivity({ activity_type: 'call', title: '', party_id: '', description: '', due_date: '' });
      loadWorkspaceData();
    } catch (err) {
      toast({ title: 'Failed to log activity', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--slate-v2-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>CRM & Commercial Operations</span>
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-950/40 text-indigo-300 border-indigo-700/50">
              V2 Enterprise
            </Badge>
          </div>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Connected lead lifecycle, multi-stage sales pipelines, commercial quotes, and A/R traceability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsActivityModalOpen(true)}
            className="text-xs border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-1)] hover:bg-[var(--slate-v2-surface-2)] text-white"
          >
            <Activity className="w-3.5 h-3.5 mr-1 text-sky-400" />
            Log Activity
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQuoteModalOpen(true)}
            className="text-xs border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-1)] hover:bg-[var(--slate-v2-surface-2)] text-white"
          >
            <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            New Quote
          </Button>

          <Button
            size="sm"
            onClick={() => setIsOppModalOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* 2. Commercial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-white">
              ${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              Across all open deal stages
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Weighted Forecast</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-indigo-300">
              ${weightedPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              Probability-adjusted forecast
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Active Deals</span>
              <Briefcase className="w-4 h-4 text-sky-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-white">
              {openDealsCount}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              In active sales cycle
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-[var(--slate-v2-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Won Deals</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-300">
              {wonDealsCount}
            </div>
            <p className="text-[11px] text-[var(--slate-v2-text-tertiary)] mt-1">
              Converted & closed won
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Workspace Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)]">
          <TabsTrigger value="pipeline" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Pipeline Kanban
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Opportunities Table
          </TabsTrigger>
          <TabsTrigger value="activities" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Customer Timeline
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kanban Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
            {stages.map((stage) => {
              const stageOpps = opportunities.filter(o => o.stage_id === stage.id);
              const stageValue = stageOpps.reduce((acc, o) => acc + (Number(o.expected_revenue) || 0), 0);

              return (
                <div
                  key={stage.id}
                  className="w-72 flex-shrink-0 bg-[var(--slate-v2-surface-1)]/70 border border-[var(--slate-v2-border-subtle)] rounded-xl flex flex-col max-h-[650px]"
                >
                  {/* Stage Header */}
                  <div className="p-3 border-b border-[var(--slate-v2-border-subtle)] bg-[var(--slate-v2-surface-2)]/40 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{stage.name}</span>
                      <span className="text-[10px] font-mono text-[var(--slate-v2-text-tertiary)] bg-[var(--slate-v2-surface-3)] px-1.5 py-0.5 rounded-full">
                        {stageOpps.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--slate-v2-text-tertiary)]">
                      <span>{stage.probability_percentage}% win prob</span>
                      <span className="font-mono text-emerald-400">${stageValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Stage Cards */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] hover:border-indigo-500/50 transition-all text-xs space-y-2 group"
                      >
                        <div className="font-semibold text-white line-clamp-1">{opp.title}</div>
                        {opp.core_parties && (
                          <div className="text-[11px] text-[var(--slate-v2-text-secondary)] flex items-center gap-1.5">
                            <Users className="w-3 h-3 opacity-70" />
                            <span className="truncate">{opp.core_parties.primary_name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--slate-v2-border-subtle)]">
                          <span className="font-mono font-bold text-emerald-400">
                            ${Number(opp.expected_revenue).toLocaleString()}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {stages.filter(s => s.id !== stage.id).slice(0, 2).map(nextS => (
                              <button
                                key={nextS.id}
                                onClick={() => handleStageMove(opp.id, nextS.id)}
                                title={`Move to ${nextS.name}`}
                                className="px-1.5 py-0.5 rounded bg-[var(--slate-v2-surface-3)] hover:bg-indigo-600 text-[10px] text-white flex items-center gap-0.5"
                              >
                                <span>{nextS.name.slice(0, 4)}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageOpps.length === 0 && (
                      <div className="h-24 border border-dashed border-[var(--slate-v2-border-subtle)] rounded-lg flex items-center justify-center text-[11px] text-[var(--slate-v2-text-tertiary)]">
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Opportunities Table */}
        <TabsContent value="opportunities">
          <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--slate-v2-surface-2)] text-[var(--slate-v2-text-secondary)] border-b border-[var(--slate-v2-border-subtle)] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Deal Title</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--slate-v2-border-subtle)]">
                    {opportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-[var(--slate-v2-surface-2)]/50">
                        <td className="py-3 px-4 font-semibold text-white">{opp.title}</td>
                        <td className="py-3 px-4 text-[var(--slate-v2-text-secondary)]">
                          {opp.core_parties?.primary_name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--slate-v2-surface-3)] text-indigo-300">
                            {opp.crm_pipeline_stages?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-[10px] ${
                            opp.status === 'won' ? 'text-emerald-400 border-emerald-800' :
                            opp.status === 'lost' ? 'text-rose-400 border-rose-800' : 'text-sky-400 border-sky-800'
                          }`}>
                            {opp.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ${Number(opp.expected_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {opportunities.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--slate-v2-text-tertiary)]">
                          No opportunities recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Customer Activities Timeline */}
        <TabsContent value="activities">
          <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
            <CardHeader className="p-4 border-b border-[var(--slate-v2-border-subtle)]">
              <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Unified Customer Activity Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--slate-v2-surface-2)]/60 border border-[var(--slate-v2-border-subtle)]">
                  <div className="w-8 h-8 rounded-full bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center flex-shrink-0 text-indigo-400">
                    {act.activity_type === 'call' && <Phone className="w-4 h-4" />}
                    {act.activity_type === 'email' && <Mail className="w-4 h-4" />}
                    {act.activity_type === 'meeting' && <Users className="w-4 h-4" />}
                    {act.activity_type === 'task' && <CheckCircle className="w-4 h-4" />}
                    {!['call', 'email', 'meeting', 'task'].includes(act.activity_type) && <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{act.title}</span>
                      <span className="text-[10px] font-mono text-[var(--slate-v2-text-tertiary)]">
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {act.core_parties && (
                      <div className="text-[11px] text-indigo-300 mt-0.5">
                        Party: {act.core_parties.primary_name}
                      </div>
                    )}
                    {act.description && (
                      <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="py-8 text-center text-xs text-[var(--slate-v2-text-tertiary)]">
                  No activities logged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: New Opportunity */}
      <Dialog open={isOppModalOpen} onOpenChange={setIsOppModalOpen}>
        <DialogContent className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Create Opportunity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOpportunity} className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Deal Title</Label>
              <Input
                required
                value={newOpp.title}
                onChange={e => setNewOpp({ ...newOpp, title: e.target.value })}
                placeholder="Enterprise Software License"
                className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Customer (Core Party)</Label>
              <Select
                value={newOpp.party_id}
                onValueChange={val => setNewOpp({ ...newOpp, party_id: val })}
              >
                <SelectTrigger className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--slate-v2-surface-2)] text-white border-[var(--slate-v2-border-subtle)]">
                  {parties.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.primary_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pipeline Stage</Label>
                <Select
                  value={newOpp.stage_id}
                  onValueChange={val => setNewOpp({ ...newOpp, stage_id: val })}
                >
                  <SelectTrigger className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1">
                    <SelectValue placeholder="Select Stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--slate-v2-surface-2)] text-white border-[var(--slate-v2-border-subtle)]">
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.probability_percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Expected Revenue ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newOpp.expected_revenue}
                  onChange={e => setNewOpp({ ...newOpp, expected_revenue: e.target.value })}
                  placeholder="50000"
                  className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOppModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Log Activity */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Log Customer Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogActivity} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Activity Type</Label>
                <Select
                  value={newActivity.activity_type}
                  onValueChange={val => setNewActivity({ ...newActivity, activity_type: val })}
                >
                  <SelectTrigger className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--slate-v2-surface-2)] text-white border-[var(--slate-v2-border-subtle)]">
                    <SelectItem value="call" className="text-xs">Phone Call</SelectItem>
                    <SelectItem value="meeting" className="text-xs">Meeting</SelectItem>
                    <SelectItem value="task" className="text-xs">Task</SelectItem>
                    <SelectItem value="note" className="text-xs">Note</SelectItem>
                    <SelectItem value="email" className="text-xs">Email</SelectItem>
                    <SelectItem value="follow_up" className="text-xs">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Associated Party</Label>
                <Select
                  value={newActivity.party_id}
                  onValueChange={val => setNewActivity({ ...newActivity, party_id: val })}
                >
                  <SelectTrigger className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1">
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--slate-v2-surface-2)] text-white border-[var(--slate-v2-border-subtle)]">
                    {parties.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.primary_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Title / Subject</Label>
              <Input
                required
                value={newActivity.title}
                onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                placeholder="Introductory Discovery Call"
                className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Notes / Details</Label>
              <Input
                value={newActivity.description}
                onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="Client requested custom quotation by Friday..."
                className="bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                Save Activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
