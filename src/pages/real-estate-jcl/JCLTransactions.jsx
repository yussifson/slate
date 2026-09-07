import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote, DollarSign, Plus, Search, Edit, Trash2,
  TrendingUp, RefreshCw, Eye, Grid, List, CheckCircle2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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

const PIPELINE_STAGES = [
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'border-orange-500/40 bg-orange-500/5', badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30' },
  { id: 'inspection', label: 'Under Inspection', color: 'border-amber-500/40 bg-amber-500/5', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { id: 'appraisal', label: 'Appraisal & Title', color: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { id: 'financing', label: 'Escrow Financing', color: 'border-indigo-500/40 bg-indigo-500/5', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30' },
  { id: 'ready_close', label: 'Ready to Close', color: 'border-purple-500/40 bg-purple-500/5', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  { id: 'closed', label: 'Closed / Finalized', color: 'border-emerald-500/40 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' }
];

export default function JCLTransactions() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Sheet / Modal State
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorTxn, setInspectorTxn] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyAddress: '',
    sellerName: '',
    buyerName: '',
    salePrice: 500000,
    closingDate: format(new Date(), 'yyyy-MM-dd'),
    agentName: user?.user_metadata?.full_name || 'Assigned Broker',
    status: 'offer_accepted',
    notes: ''
  });

  const fetchTransactionsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [txnRes, propRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY created_at DESC', [companyId]),
        powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      const txnList = txnRes.rows._array || Array.from(txnRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);

      setTransactions(txnList);
      setProperties(propList);
    } catch (_err) {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, [companyId]);

  // Statistics
  const stats = useMemo(() => {
    const total = transactions.length;
    const totalVolume = transactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
    const closedVolume = transactions
      .filter(t => t.status === 'closed')
      .reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
    const activeDeals = transactions.filter(t => t.status !== 'closed').length;

    return { total, totalVolume, closedVolume, activeDeals };
  }, [transactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search ||
        t.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        t.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.agent_name?.toLowerCase().includes(search.toLowerCase());

      const matchStage = stageFilter === 'all' || t.status === stageFilter;

      return matchSearch && matchStage;
    });
  }, [transactions, search, stageFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || '',
      propertyAddress: properties[0]?.address || '',
      sellerName: '',
      buyerName: '',
      salePrice: 500000,
      closingDate: format(new Date(), 'yyyy-MM-dd'),
      agentName: user?.user_metadata?.full_name || 'Assigned Broker',
      status: 'offer_accepted',
      notes: ''
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (txn) => {
    setEditingId(txn.id);
    setFormData({
      propertyId: txn.property_id || '',
      propertyAddress: txn.property_address || '',
      sellerName: txn.seller_name || '',
      buyerName: txn.buyer_name || '',
      salePrice: txn.sale_price || 0,
      closingDate: txn.closing_date || '',
      agentName: txn.agent_name || '',
      status: txn.status || 'offer_accepted',
      notes: txn.notes || ''
    });
    setShowFormSheet(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.buyerName) {
      toast.error('Property address and buyer name are required');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_transactions SET
            property_id = ?, property_address = ?, seller_name = ?, buyer_name = ?,
            sale_price = ?, closing_date = ?, status = ?, agent_name = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null, formData.propertyAddress,
            formData.sellerName || null, formData.buyerName,
            Number(formData.salePrice) || 0, formData.closingDate || null,
            formData.status, formData.agentName || null, formData.notes || null,
            editingId, companyId
          ]
        );
        toast.success('Transaction updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_transactions (
            id, created_at, company_id, property_id, property_address,
            seller_name, buyer_name, sale_price, closing_date, status,
            agent_id, agent_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, now, companyId,
            formData.propertyId || null, formData.propertyAddress,
            formData.sellerName || null, formData.buyerName,
            Number(formData.salePrice) || 0, formData.closingDate || null,
            formData.status, user?.id || null, formData.agentName || null,
            formData.notes || null
          ]
        );
        toast.success('Deal logged to transaction pipeline');
      }

      setShowFormSheet(false);
      fetchTransactionsData();
      if (inspectorTxn && inspectorTxn.id === editingId) {
        setInspectorTxn(prev => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error('Failed to save transaction');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_transactions WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success('Transaction removed');
      setDeleteTarget(null);
      if (inspectorTxn?.id === deleteTarget.id) setInspectorTxn(null);
      fetchTransactionsData();
    } catch (_err) {
      toast.error('Failed to delete transaction');
    }
  };

  // Kanban Drag-and-Drop Handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStage = destination.droppableId;

    // Optimistic Update
    setTransactions(prev =>
      prev.map(t => (t.id === draggableId ? { ...t, status: newStage } : t))
    );

    try {
      await powerSync.execute(
        `UPDATE univ_re_transactions SET status = ? WHERE id = ? AND company_id = ?`,
        [newStage, draggableId, companyId]
      );
      toast.success(`Moved to ${PIPELINE_STAGES.find(s => s.id === newStage)?.label || newStage}`);
    } catch (_err) {
      toast.error('Failed to update stage');
      fetchTransactionsData();
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Transactions & Deal Pipeline
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-stage property acquisitions, escrow closing workflows, and sales milestones
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactionsData}
            className="h-9 px-3 text-xs gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Hero Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Deals</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeDeals}</p>
              <p className="text-[11px] text-muted-foreground">In active negotiation / escrow</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pipeline Volume</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(stats.totalVolume, 'USD')}
              </p>
              <p className="text-[11px] text-muted-foreground">Total across all stages</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Closed Revenue</p>
              <p className="text-2xl font-bold text-foreground truncate">
                {formatCurrency(stats.closedVolume, 'USD')}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">Finalized contracts</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Deals Logged</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Historical transaction volume</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Filters & View Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, buyer, seller, agent..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Pipeline Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Pipeline Stages</SelectItem>
              {PIPELINE_STAGES.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'kanban' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Kanban Board"
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="List View"
          >
            <List className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Body: Kanban or List ── */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map(stage => {
              const stageDeals = filteredTransactions.filter(t => (t.status || 'offer_accepted') === stage.id);
              const stageVolume = stageDeals.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 min-w-[240px] bg-card/50",
                    stage.color
                  )}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-foreground truncate">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-mono">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-3">
                    {formatCurrency(stageVolume, 'USD')}
                  </p>

                  {/* Droppable Column */}
                  <Droppable droppableId={stage.id}>
                    {(providedDroppable, snapshot) => (
                      <div
                        ref={providedDroppable.innerRef}
                        {...providedDroppable.droppableProps}
                        className={cn(
                          "flex-1 space-y-2.5 min-h-[300px] rounded-lg p-1 transition-colors",
                          snapshot.isDraggingOver && "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                        )}
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(providedDraggable, snapshotDraggable) => (
                              <div
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                {...providedDraggable.dragHandleProps}
                                style={{ ...providedDraggable.draggableProps.style }}
                                onClick={() => setInspectorTxn(deal)}
                                className={cn(
                                  "p-3 rounded-lg border border-border bg-card shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
                                  snapshotDraggable.isDragging && "shadow-xl ring-2 ring-emerald-500 z-50 bg-background"
                                )}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                    {deal.property_address}
                                  </span>
                                </div>

                                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
                                  {formatCurrency(deal.sale_price, 'USD')}
                                </p>

                                <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span>Buyer:</span>
                                    <strong className="text-foreground truncate max-w-[110px]">{deal.buyer_name || 'N/A'}</strong>
                                  </div>
                                  {deal.closing_date && (
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span>Close:</span>
                                      <span className="font-mono text-foreground">{deal.closing_date}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {providedDroppable.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        /* List View */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-4">Property / Deal</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4">Target Closing</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map(deal => {
                  const stage = PIPELINE_STAGES.find(s => s.id === deal.status) || PIPELINE_STAGES[0];
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setInspectorTxn(deal)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {deal.property_address}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">{deal.buyer_name || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{deal.seller_name || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(deal.sale_price, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{deal.closing_date || 'TBD'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn("text-[10px] font-medium border", stage.badge)}>
                          {stage.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{deal.agent_name || 'Assigned'}</td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInspectorTxn(deal)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(deal)}
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteTarget(deal)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Slide-Over Deal Inspector ── */}
      <Sheet open={!!inspectorTxn} onOpenChange={open => !open && setInspectorTxn(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorTxn && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    Deal Room
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border",
                      (PIPELINE_STAGES.find(s => s.id === inspectorTxn.status) || PIPELINE_STAGES[0]).badge
                    )}
                  >
                    {(PIPELINE_STAGES.find(s => s.id === inspectorTxn.status) || PIPELINE_STAGES[0]).label}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorTxn.property_address}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Target Closing: <strong className="text-foreground">{inspectorTxn.closing_date || 'Pending'}</strong>
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                {/* Financial Overview Card */}
                <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract Price</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inspectorTxn.sale_price, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Assigned Broker</p>
                    <p className="text-sm font-bold text-foreground">{inspectorTxn.agent_name || 'Lead Broker'}</p>
                  </div>
                </div>

                {/* Counterparties */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Involved Parties</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                      <p className="text-[10px] uppercase text-muted-foreground">Purchaser / Buyer</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{inspectorTxn.buyer_name || 'N/A'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                      <p className="text-[10px] uppercase text-muted-foreground">Seller / Vendor</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{inspectorTxn.seller_name || 'Owner of Record'}</p>
                    </div>
                  </div>
                </div>

                {/* Deal Notes */}
                {inspectorTxn.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deal Terms & Notes</h4>
                    <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed">
                      {inspectorTxn.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(inspectorTxn)}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Deal
                </Button>

                <Button
                  size="sm"
                  onClick={() => setInspectorTxn(null)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Close Deal Sheet
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 6. Create / Edit Transaction Modal ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          <SheetHeader className="p-6 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Transaction Record' : 'Log New Transaction Deal'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Record contract price, buyer & seller details, and escrow timeline
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Property Address *</Label>
              <Input
                required
                placeholder="e.g. 104 Oceanfront Boulevard"
                value={formData.propertyAddress}
                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Buyer Name *</Label>
                <Input
                  required
                  placeholder="e.g. Arthur Pendelton"
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Seller Name</Label>
                <Input
                  placeholder="e.g. Eleanor Vance"
                  value={formData.sellerName}
                  onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sale Price ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                  className="text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Closing Date</Label>
                <Input
                  type="date"
                  value={formData.closingDate}
                  onChange={e => setFormData({ ...formData, closingDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Pipeline Stage</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Agent / Broker</Label>
                <Input
                  placeholder="e.g. Marcus Vance"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Terms, Contingencies & Notes</Label>
              <textarea
                rows={3}
                placeholder="Financing contingencies, inspection deadlines, escrow notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormSheet(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {editingId ? 'Save Changes' : 'Log Transaction'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 7. Delete Confirmation Alert ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Transaction Deal?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove the transaction for <strong className="text-foreground">{deleteTarget?.property_address}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
