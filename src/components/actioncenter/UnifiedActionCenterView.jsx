import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, HelpCircle, Clock, AlertTriangle, 
  Filter, Search, ArrowUpRight, DollarSign, FileText, Check, X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UnifiedActionCenterService } from '@/services/UnifiedActionCenterService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function UnifiedActionCenterView() {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [selectedAction, setSelectedAction] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActions();
  }, [companyId, statusFilter]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? {} : { status: statusFilter };
      const items = await UnifiedActionCenterService.getActionItems(companyId, filter);
      setActions(items);
      if (items.length > 0 && !selectedAction) {
        setSelectedAction(items[0]);
      }
    } catch (err) {
      console.error('Failed to load action items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedAction) return;
    setSubmitting(true);
    try {
      await UnifiedActionCenterService.recordDecision({
        companyId,
        actionItemId: selectedAction.id,
        decision,
        reason: decisionReason,
        decidedByUserId: user?.id
      });

      toast({
        title: `Action ${decision.toUpperCase()}`,
        description: `Successfully processed action item ${selectedAction.title}.`
      });

      setDecisionReason('');
      fetchActions();
    } catch (err) {
      toast({
        title: 'Decision Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-[#E2E8F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--slate-v2-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            Unified Action Center
          </h1>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Centralized decision queue for invoice approvals, document signoffs, and workflow pauses.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1 bg-[var(--slate-v2-surface-1)] p-1 rounded-lg border border-[var(--slate-v2-border-subtle)] text-xs">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md capitalize font-medium transition-all ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Queue (1/3), Right Detail Pane (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading action queue...
            </div>
          ) : actions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)] rounded-xl text-xs">
              No actions matching filter.
            </div>
          ) : (
            actions.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAction(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedAction?.id === item.id
                    ? 'bg-[var(--slate-v2-surface-2)] border-indigo-500/50 shadow-md'
                    : 'bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="uppercase font-mono tracking-wider">{item.origin_module}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    item.priority === 'urgent' || item.priority === 'high'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-slate-700/40 text-slate-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white truncate">{item.title}</h3>
                {item.amount && (
                  <div className="text-xs font-mono text-amber-400 mt-1">
                    ${Number(item.amount).toLocaleString()} {item.currency}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Detail & Decision Controls */}
        <div className="lg:col-span-2">
          {selectedAction ? (
            <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)] text-white">
              <CardHeader className="border-b border-[var(--slate-v2-border-subtle)] pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {selectedAction.action_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        Origin: {selectedAction.origin_module}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-white mt-1">
                      {selectedAction.title}
                    </CardTitle>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedAction.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : selectedAction.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedAction.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-[var(--slate-v2-text-secondary)] leading-relaxed">
                  {selectedAction.description || 'No detailed description provided for this business action.'}
                </p>

                {selectedAction.amount && (
                  <div className="p-3 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Authorization Amount</span>
                    <span className="text-sm font-bold font-mono text-white">
                      ${Number(selectedAction.amount).toLocaleString()} {selectedAction.currency}
                    </span>
                  </div>
                )}

                {/* Supporting Context Data */}
                {selectedAction.supporting_context && Object.keys(selectedAction.supporting_context).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Supporting Context
                    </h4>
                    <pre className="p-3 rounded-lg bg-[#050811] border border-[var(--slate-v2-border-subtle)] text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedAction.supporting_context, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Decision Area (only enabled for pending actions) */}
                {selectedAction.status === 'pending' ? (
                  <div className="pt-4 border-t border-[var(--slate-v2-border-subtle)] space-y-3">
                    <div>
                      <label className="text-xs text-[var(--slate-v2-text-secondary)]">Decision Notes / Reason</label>
                      <Input
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Add review notes or justification..."
                        className="mt-1 bg-[var(--slate-v2-surface-2)] border-[var(--slate-v2-border-subtle)] text-white text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDecision('rejected')}
                        disabled={submitting}
                        className="text-xs gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDecision('info_requested')}
                        disabled={submitting}
                        className="text-xs gap-1.5 text-slate-300"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Request Info
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDecision('approved')}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Authorize & Resume
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-[var(--slate-v2-border-subtle)] text-xs text-slate-400 italic">
                    This action has already been resolved with status: {selectedAction.status}.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)] rounded-xl text-xs">
              Select an action item to review supporting business context and make a decision.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
