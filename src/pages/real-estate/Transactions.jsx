import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Home, User, DollarSign, CheckCircle, AlertCircle, Plus, MoreVertical, Search, Edit, Trash2 } from 'lucide-react';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewPreference } from '@/hooks/useViewPreference';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const pipelineStages = [
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'bg-orange-50/80 border-orange-200/60 dark:bg-orange-950/30 dark:border-orange-900/40 border-l-4 border-l-orange-500 dark:border-l-orange-500', badge: 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' },
  { id: 'inspection', label: 'Under Inspection', color: 'bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40 border-l-4 border-l-amber-500 dark:border-l-amber-500', badge: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' },
  { id: 'appraisal', label: 'Appraisal', color: 'bg-primary/5/80 border-primary/20/60 dark:bg-blue-950/30 dark:border-primary/30/40 border-l-4 border-l-primary dark:border-l-primary', badge: 'bg-primary text-white shadow-sm shadow-primary/20' },
  { id: 'financing', label: 'Financing', color: 'bg-primary/5/80 border-primary/20/60 dark:bg-indigo-950/30 dark:border-primary/30/40 border-l-4 border-l-primary dark:border-l-primary', badge: 'bg-primary text-white shadow-sm shadow-primary/20' },
  { id: 'ready_close', label: 'Ready to Close', color: 'bg-primary/5/80 border-primary/20/60 dark:bg-purple-950/30 dark:border-primary/30/40 border-l-4 border-l-primary dark:border-l-primary', badge: 'bg-primary text-white shadow-sm shadow-primary/20' },
  { id: 'closed', label: 'Closed', color: 'bg-primary/5/80 border-primary/20/60 dark:bg-emerald-950/30 dark:border-primary/30/40 border-l-4 border-l-primary dark:border-l-primary', badge: 'bg-primary text-white shadow-sm shadow-primary/20' }
];

export default function Transactions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useViewPreference('re_transactions', 'kanban');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, value: 0, closed: 0 });
  const [formData, setFormData] = useState({
    propertyAddress: '',
    buyerName: '',
    sellerName: '',
    salePrice: 0,
    closingDate: '',
    agentName: '',
    status: 'offer_accepted',
    notes: '',
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setTransactions(data);
        
        const totalValue = data.reduce((sum, t) => sum + (t.sale_price || 0), 0);
        const closedCount = data.filter(t => t.status === 'closed').length;
        setStats({ total: data.length, value: totalValue, closed: closedCount });
      } catch (e) {
        console.error('[Transactions]:', e);
        toast.error('Failed to load transactions');
      }
      setIsLoading(false);
    };
    if (companyId) fetchTransactions();
  }, [companyId]);

  useEffect(() => {
    let filtered = transactions;
    if (search) {
      filtered = filtered.filter(t =>
        t.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        t.buyer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    setFilteredTransactions(filtered);
  }, [transactions, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.propertyAddress || !formData.buyerName || !formData.salePrice || !formData.closingDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingId) {
        await RealEstateAPI.updateTransaction(companyId, editingId, formData, user.id);
        toast.success('Transaction updated');
      } else {
        await RealEstateAPI.createTransaction(companyId, formData, user.id);
        toast.success('Transaction created');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ propertyAddress: '', buyerName: '', sellerName: '', salePrice: 0, closingDate: '', agentName: '', status: 'offer_accepted', notes: '' });

      const res = await powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      const data = res.rows._array || Array.from(res.rows);
      setTransactions(data);
      const totalValue = data.reduce((sum, t) => sum + (t.sale_price || 0), 0);
      const closedCount = data.filter(t => t.status === 'closed').length;
      setStats({ total: data.length, value: totalValue, closed: closedCount });
    } catch (e) {
      console.error('[Transactions] Submit failed:', e);
      toast.error('Failed to save transaction');
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      propertyAddress: transaction.property_address || '',
      buyerName: transaction.buyer_name || '',
      sellerName: transaction.seller_name || '',
      salePrice: transaction.sale_price || 0,
      closingDate: transaction.closing_date || '',
      agentName: transaction.agent_name || '',
      status: transaction.status || 'offer_accepted',
      notes: transaction.notes || '',
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await RealEstateAPI.deleteTransaction(companyId, id, user.id);
      toast.success('Transaction deleted');
      setTransactions(prev => prev.filter(t => t.id !== id));
      setStats(prev => {
        const t = transactions.find(tx => tx.id === id);
        return {
          total: prev.total - 1,
          value: prev.value - (t?.sale_price || 0),
          closed: prev.closed - (t?.status === 'closed' ? 1 : 0)
        };
      });
    } catch (e) {
      console.error('[Transactions] Delete failed:', e);
      toast.error('Failed to delete transaction');
    }
  };

  const getTransactionsByStage = (stage) => {
    return filteredTransactions.filter(t => t.status === stage);
  };

  const KanbanColumn = ({ stage, transactions }) => (
    <div className="bg-card/60 dark:bg-card/60 backdrop-blur-md rounded-2xl p-5 min-h-[600px] flex flex-col border border-border/40 flex-shrink-0 w-96 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out">
      <div className="mb-5 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pipelineStages.find(s => s.id === stage)?.badge}`}></span>
            {pipelineStages.find(s => s.id === stage)?.label}
          </h3>
          <Badge className="bg-primary/10/50 text-primary/90 dark:bg-primary/30/30 dark:text-primary/80 text-xs px-2.5 py-0.5 rounded-full font-medium border-0">{transactions.length}</Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-teal-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(transactions.length / Math.max(...pipelineStages.map(() => 3), 1)) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full opacity-70">
            <div className="bg-gray-50 dark:bg-secondary/50 p-4 rounded-full mb-3 shadow-inner">
              <AlertCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium">No transactions</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div
              key={transaction.id}
              className={`p-5 rounded-xl border cursor-pointer transform transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 ${pipelineStages.find(s => s.id === stage)?.color} group relative`}
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0" onClick={() => setSelectedTransaction(transaction)}>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug break-words line-clamp-2 hover:text-primary transition-colors">{transaction.property_address}</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm -mx-5 px-5 py-3 border-y border-white/20 dark:border-white/5" onClick={() => setSelectedTransaction(transaction)}>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-500 dark:text-gray-400">Buyer:</span> {transaction.buyer_name || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-500 dark:text-gray-400">Seller:</span> {transaction.seller_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1" onClick={() => setSelectedTransaction(transaction)}>
                <div className="flex items-center gap-1.5 text-primary/90 dark:text-primary/80 bg-primary/10/50 dark:bg-primary/30/30 px-2.5 py-1 rounded-md font-bold shadow-sm border border-primary/20/50 dark:border-primary/40/30">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-sm">${(transaction.sale_price / 1000).toFixed(0)}K</span>
                </div>
                <span className="text-[10px] font-bold bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 uppercase tracking-wider shadow-sm">{transaction.status.replace('_', ' ')}</span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }} className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Edit">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(transaction.id); }} className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-foreground flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-primary/10 dark:bg-primary/30 rounded-xl border border-primary/20 shrink-0"><Banknote className="w-5 h-5 sm:w-7 sm:h-7 text-primary" /></div>
                Sales Pipeline
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">Track property transactions through the sales pipeline</p>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <ViewToggle view={view} onViewChange={setView} allowedViews={['kanban', 'list']} />
              <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', sellerName: '', salePrice: 0, closingDate: '', agentName: '', status: 'offer_accepted', notes: '' }); }} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0 gap-1.5 rounded-xl h-9 sm:h-10 text-xs sm:text-sm px-3.5 sm:px-4">
                <Plus className="w-4 h-4" /> New Transaction
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 bg-white dark:bg-card border border-slate-200/60 dark:border-border rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 group-hover:text-primary transition-colors">Total Transactions</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{stats.total}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-primary/10 dark:bg-primary/30 rounded-2xl group-hover:scale-110 transition-transform duration-300"><Banknote className="w-5 h-5 sm:w-7 sm:h-7 text-primary" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 sm:p-6 bg-white dark:bg-card border border-slate-200/60 dark:border-border rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 group-hover:text-primary transition-colors">Total Value</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">${(stats.value / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-primary/10 dark:bg-primary/30 rounded-2xl group-hover:scale-110 transition-transform duration-300"><DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-primary" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 sm:p-6 bg-white dark:bg-card border border-slate-200/60 dark:border-border rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 group-hover:text-primary transition-colors">Closed Deals</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{stats.closed}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-primary/10 dark:bg-primary/30 rounded-2xl group-hover:scale-110 transition-transform duration-300"><CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary" /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Views */}
        {view === 'kanban' ? (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-6 min-w-min">
              {pipelineStages.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage.id}
                  transactions={getTransactionsByStage(stage.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-foreground">Property</th>
                    <th className="p-4 font-semibold text-foreground">Buyer</th>
                    <th className="p-4 font-semibold text-foreground">Sale Price</th>
                    <th className="p-4 font-semibold text-foreground">Closing Date</th>
                    <th className="p-4 font-semibold text-foreground">Status</th>
                    <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedTransaction(transaction)}>
                          {transaction.property_address}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{transaction.buyer_name}</td>
                      <td className="p-4 font-bold text-primary dark:text-primary/80">
                        ${Number(transaction.sale_price || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(transaction.closing_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge className={`${pipelineStages.find(s => s.id === transaction.status)?.badge} border-0 shadow-sm px-2.5 py-0.5`}>
                          {transaction.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/5 text-primary dark:hover:bg-primary/30/30" onClick={() => handleEdit(transaction)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-t border-border">No transactions found.</div>
              )}
            </div>
          </Card>
        )}

        {/* Transaction Details Sheet */}
        <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <SheetContent side="right" className="w-full sm:w-[450px] border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-background/95 backdrop-blur-xl">
            <SheetHeader className="border-b border-gray-100 dark:border-white/10 pb-6">
              <SheetTitle className="text-2xl font-bold dark:text-white">Transaction Details</SheetTitle>
            </SheetHeader>
            {selectedTransaction && (
              <div className="space-y-8 mt-8">
                <div className="bg-gray-50 dark:bg-card/50 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 dark:bg-primary/30/30 rounded-xl mt-1 border border-primary/20/50 dark:border-primary/40/30">
                      <Home className="w-6 h-6 text-primary dark:text-primary/80" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Property</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{selectedTransaction.property_address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-card rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Buyer</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.buyer_name}</p>
                  </div>
                  <div className="bg-white dark:bg-card rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Seller</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.seller_name}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 border border-primary/10 dark:border-primary/30/30">
                  <p className="text-xs text-primary dark:text-primary/80 uppercase font-bold tracking-wider mb-2">Sale Price</p>
                  <p className="text-4xl font-black text-primary/90 dark:text-primary/80">${selectedTransaction.sale_price?.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Agent</p>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/30/30 flex items-center justify-center text-xs text-primary dark:text-primary/80 font-bold border border-primary/20/50 dark:border-primary/40/30">{selectedTransaction.agent_name?.charAt(0) || '?'}</div>
                      {selectedTransaction.agent_name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Status</p>
                    <Badge className="mt-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0">{selectedTransaction.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
                
                {selectedTransaction.notes && (
                  <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-card p-4 rounded-xl italic border border-gray-100 dark:border-white/5">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Form Modal */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full sm:w-[500px] border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-background/95 backdrop-blur-xl overflow-y-auto custom-scrollbar">
            <SheetHeader className="border-b border-gray-100 dark:border-white/10 pb-6">
              <SheetTitle className="text-2xl font-bold dark:text-white">{editingId ? 'Edit Transaction' : 'New Transaction'}</SheetTitle>
              <SheetDescription className="dark:text-gray-400">Fill in the transaction details below</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-8 pb-28 sm:pb-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Property Address <span className="text-red-500">*</span></label>
                <Input className="dark:bg-card dark:border-white/10 dark:text-white" value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Buyer <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-card dark:border-white/10 dark:text-white" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Seller</label>
                  <Input className="dark:bg-card dark:border-white/10 dark:text-white" value={formData.sellerName} onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sale Price <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-card dark:border-white/10 dark:text-white font-medium text-primary dark:text-primary/80" type="number" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Closing Date <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-card dark:border-white/10 dark:text-white" type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Agent</label>
                <Input className="dark:bg-card dark:border-white/10 dark:text-white" value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="dark:bg-card dark:border-white/10 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card dark:border-white/10">
                    <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                    <SelectItem value="inspection">Under Inspection</SelectItem>
                    <SelectItem value="appraisal">Appraisal</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="ready_close">Ready to Close</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded-xl text-sm dark:bg-card dark:border-white/10 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" rows="3" placeholder="Add any additional notes here..." />
              </div>
              <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 dark:shadow-primary/10 rounded-xl transition-all duration-300">
                  {editingId ? 'Update' : 'Create'} Transaction
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
