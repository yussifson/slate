import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Home, User, DollarSign, CheckCircle, AlertCircle, Plus, MoreVertical, Search, Edit, Trash2 } from 'lucide-react';
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
  { id: 'appraisal', label: 'Appraisal', color: 'bg-blue-50/80 border-blue-200/60 dark:bg-blue-950/30 dark:border-blue-900/40 border-l-4 border-l-blue-500 dark:border-l-blue-500', badge: 'bg-blue-500 text-white shadow-sm shadow-blue-500/20' },
  { id: 'financing', label: 'Financing', color: 'bg-indigo-50/80 border-indigo-200/60 dark:bg-indigo-950/30 dark:border-indigo-900/40 border-l-4 border-l-indigo-500 dark:border-l-indigo-500', badge: 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20' },
  { id: 'ready_close', label: 'Ready to Close', color: 'bg-purple-50/80 border-purple-200/60 dark:bg-purple-950/30 dark:border-purple-900/40 border-l-4 border-l-purple-500 dark:border-l-purple-500', badge: 'bg-purple-500 text-white shadow-sm shadow-purple-500/20' },
  { id: 'closed', label: 'Closed', color: 'bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 border-l-4 border-l-emerald-500 dark:border-l-emerald-500', badge: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' }
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
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 min-h-[600px] flex flex-col border border-gray-200/50 dark:border-white/10 flex-shrink-0 w-96 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out">
      <div className="mb-5 pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pipelineStages.find(s => s.id === stage)?.badge}`}></span>
            {pipelineStages.find(s => s.id === stage)?.label}
          </h3>
          <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium border-0">{transactions.length}</Badge>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(transactions.length / Math.max(...pipelineStages.map(() => 3), 1)) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full opacity-70">
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-full mb-3 shadow-inner">
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
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md font-bold shadow-sm border border-emerald-200/50 dark:border-emerald-800/30">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-sm">${(transaction.sale_price / 1000).toFixed(0)}K</span>
                </div>
                <span className="text-[10px] font-bold bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 uppercase tracking-wider shadow-sm">{transaction.status.replace('_', ' ')}</span>
              </div>
              <div className="flex gap-2 pt-4 mt-2 border-t border-gray-200/50 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="sm" variant="outline" className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(transaction.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8 transition-colors duration-300 ease-in-out">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-xl"><Banknote className="w-7 h-7 text-primary dark:text-primary-foreground" /></div>
                Sales Pipeline
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base font-medium">Track property transactions through the sales pipeline</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', sellerName: '', salePrice: 0, closingDate: '', agentName: '', status: 'offer_accepted', notes: '' }); }} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 dark:shadow-primary/10 gap-2 rounded-xl transition-all duration-300 hover:scale-105">
              <Plus className="w-5 h-5" /> New Transaction
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-xl dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl dark:border dark:border-white/10 transition-all duration-300 ease-in-out group rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 group-hover:text-primary transition-colors">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
                  </div>
                  <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform duration-300"><Banknote className="w-7 h-7 text-primary dark:text-primary-foreground" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-xl dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl dark:border dark:border-white/10 transition-all duration-300 ease-in-out group rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 group-hover:text-emerald-500 transition-colors">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${(stats.value / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300"><DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-xl dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl dark:border dark:border-white/10 transition-all duration-300 ease-in-out group rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 group-hover:text-blue-500 transition-colors">Closed Deals</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.closed}</p>
                  </div>
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300"><CheckCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kanban Board */}
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

        {/* Transaction Details Sheet */}
        <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <SheetContent side="right" className="w-full sm:w-[450px] border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
            <SheetHeader className="border-b border-gray-100 dark:border-white/10 pb-6">
              <SheetTitle className="text-2xl font-bold dark:text-white">Transaction Details</SheetTitle>
            </SheetHeader>
            {selectedTransaction && (
              <div className="space-y-8 mt-8">
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl mt-1">
                      <Home className="w-6 h-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Property</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{selectedTransaction.property_address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Buyer</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.buyer_name}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Seller</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.seller_name}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider mb-2">Sale Price</p>
                  <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">${selectedTransaction.sale_price?.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Agent</p>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">{selectedTransaction.agent_name?.charAt(0) || '?'}</div>
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
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl italic border border-gray-100 dark:border-white/5">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Form Modal */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full sm:w-[500px] border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-y-auto custom-scrollbar">
            <SheetHeader className="border-b border-gray-100 dark:border-white/10 pb-6">
              <SheetTitle className="text-2xl font-bold dark:text-white">{editingId ? 'Edit Transaction' : 'New Transaction'}</SheetTitle>
              <SheetDescription className="dark:text-gray-400">Fill in the transaction details below</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Property Address <span className="text-red-500">*</span></label>
                <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white" value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Buyer <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Seller</label>
                  <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white" value={formData.sellerName} onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sale Price <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white font-medium text-emerald-600 dark:text-emerald-400" type="number" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Closing Date <span className="text-red-500">*</span></label>
                  <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white" type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Agent</label>
                <Input className="dark:bg-slate-900 dark:border-white/10 dark:text-white" value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="dark:bg-slate-900 dark:border-white/10 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-white/10">
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
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded-xl text-sm dark:bg-slate-900 dark:border-white/10 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" rows="3" placeholder="Add any additional notes here..." />
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
