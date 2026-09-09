import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, User, DollarSign, Percent, Calendar, ArrowUpRight, Plus, MoreVertical,
  RefreshCw, CheckCircle2, Award, Building2, UserCheck, Shield
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const STATUS_CONFIG = {
  paid: { label: 'Paid Out', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  pending: { label: 'Pending Payout', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  scheduled: { label: 'Scheduled', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
};

export default function JCLCommissions() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [commissions, setCommissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');

  // Sheet / Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    agentName: user?.user_metadata?.full_name || 'Lead Broker',
    propertyAddress: '',
    salePrice: 500000,
    commissionRate: 3.0, // 3%
    commissionAmount: 15000,
    brokerageSplitRate: 70, // 70% agent / 30% broker
    agentPayoutAmount: 10500,
    status: 'pending',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const fetchCommissionsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_commissions WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setCommissions(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load commission data');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCommissionsData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const totalEarned = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
    const totalPending = commissions.filter(c => c.status !== 'paid').reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
    const avgCommission = commissions.length > 0 ? (totalEarned + totalPending) / commissions.length : 0;
    const uniqueAgents = [...new Set(commissions.map(c => c.agent_name).filter(Boolean))];

    return { totalEarned, totalPending, avgCommission, agents: uniqueAgents };
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    if (selectedAgent === 'all') return commissions;
    return commissions.filter(c => c.agent_name === selectedAgent);
  }, [commissions, selectedAgent]);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    if (!formData.agentName || !formData.propertyAddress) {
      toast.error('Agent name and property address are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      const grossComm = (Number(formData.salePrice) * Number(formData.commissionRate)) / 100;
      const netAgentPayout = (grossComm * Number(formData.brokerageSplitRate)) / 100;

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_commissions SET
            agent_name = ?, property_address = ?, sale_price = ?,
            commission_rate = ?, commission_amount = ?, brokerage_split_rate = ?,
            agent_payout_amount = ?, status = ?, payment_date = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.agentName, formData.propertyAddress, Number(formData.salePrice) || 0,
            Number(formData.commissionRate) || 0, grossComm, Number(formData.brokerageSplitRate) || 0,
            netAgentPayout, formData.status, formData.paymentDate || null, formData.notes || null,
            editingId, companyId
          ]
        );
        toast.success('Commission record updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_commissions (
            id, created_at, company_id, agent_name, property_address,
            sale_price, commission_rate, commission_amount, brokerage_split_rate,
            agent_payout_amount, status, payment_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId, formData.agentName, formData.propertyAddress,
            Number(formData.salePrice) || 0, Number(formData.commissionRate) || 0, grossComm,
            Number(formData.brokerageSplitRate) || 0, netAgentPayout, formData.status,
            formData.paymentDate || null, formData.notes || null
          ]
        );
        toast.success('Commission split logged');
      }

      setShowForm(false);
      fetchCommissionsData();
    } catch (_err) {
      toast.error('Failed to save commission record');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await powerSync.execute(
        `UPDATE univ_re_commissions SET status = ? WHERE id = ? AND company_id = ?`,
        [nextStatus, id, companyId]
      );
      toast.success(`Commission status updated to ${nextStatus}`);
      fetchCommissionsData();
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Commission Splits & Agent Payouts
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Brokerage commission splits, tiered performance rates, and agent earnings ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCommissionsData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                agentName: user?.user_metadata?.full_name || 'Lead Broker', propertyAddress: '',
                salePrice: 500000, commissionRate: 3.0, commissionAmount: 15000,
                brokerageSplitRate: 70, agentPayoutAmount: 10500, status: 'pending',
                paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: ''
              });
              setShowForm(true);
            }}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Log Commission Split
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid Payouts</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalEarned, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600/80">Disbursed to agents</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Payout Pipeline</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(stats.totalPending, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Pending closing release</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Deal Commission</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.avgCommission, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Gross avg per transaction</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Agents</p>
              <p className="text-2xl font-bold text-foreground">{stats.agents.length}</p>
              <p className="text-[11px] text-muted-foreground">Commission earners</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="h-9 text-xs w-[200px] bg-background">
              <SelectValue placeholder="Filter by Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Agents & Brokers</SelectItem>
              {stats.agents.map(a => (
                <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 4. Table ── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">Agent / Broker</th>
                <th className="py-3 px-4">Property / Deal</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Gross Comm.</th>
                <th className="py-3 px-4">Split (Agent/Firm)</th>
                <th className="py-3 px-4">Net Agent Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No commission records found.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(item => {
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const gross = item.commission_amount || (item.sale_price * (item.commission_rate || 3)) / 100;
                  const agentNet = item.agent_payout_amount || (gross * (item.brokerage_split_rate || 70)) / 100;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {item.agent_name || 'Assigned Broker'}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">{item.property_address || 'Property Deal'}</td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {formatCurrency(item.sale_price, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">{item.commission_rate || 3.0}%</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {formatCurrency(gross, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {item.brokerage_split_rate || 70}% / {100 - (item.brokerage_split_rate || 70)}%
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(agentNet, 'USD')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border gap-1", st.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="xs"
                          variant={item.status === 'paid' ? 'outline' : 'default'}
                          onClick={() => handleStatusToggle(item.id, item.status)}
                          className={cn(
                            "text-[10px] h-7 px-2 font-bold",
                            item.status === 'paid' ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          )}
                        >
                          {item.status === 'paid' ? 'Mark Pending' : 'Mark Paid Out'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Form Sheet ── */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Log Commission Split</SheetTitle>
            <SheetDescription>Set up agent split percentage and deal commission calculation</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveCommission} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Agent / Broker Name</Label>
              <Input
                value={formData.agentName}
                onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                placeholder="Agent full name"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Property Address</Label>
              <Input
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                placeholder="Property address"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sale Price ($)</Label>
                <Input
                  type="number"
                  value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Gross Comm. Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={e => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Agent Split % (Rest to Brokerage)</Label>
              <Input
                type="number"
                value={formData.brokerageSplitRate}
                onChange={e => setFormData({ ...formData, brokerageSplitRate: e.target.value })}
                placeholder="70"
                className="h-9 text-xs mt-1"
                required
              />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
              Log Commission
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
