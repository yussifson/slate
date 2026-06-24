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
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'bg-orange-100 border-orange-300', badge: 'bg-orange-200 text-orange-900' },
  { id: 'inspection', label: 'Under Inspection', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  { id: 'appraisal', label: 'Appraisal', color: 'bg-green-100 border-green-300', badge: 'bg-green-200 text-green-900' },
  { id: 'financing', label: 'Financing', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  { id: 'ready_close', label: 'Ready to Close', color: 'bg-orange-100 border-orange-300', badge: 'bg-orange-200 text-orange-900' },
  { id: 'closed', label: 'Closed', color: 'bg-green-100 border-green-300', badge: 'bg-green-200 text-green-900' }
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

  const getTransactionsByStage = (stage) => {
    return filteredTransactions.filter(t => t.status === stage);
  };

  const KanbanColumn = ({ stage, transactions }) => (
    <div className="bg-white rounded-lg p-5 min-h-[600px] flex flex-col border-2 border-gray-100 flex-shrink-0 w-96 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-5 pb-4 border-b-2 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${pipelineStages.find(s => s.id === stage)?.badge}`}></span>
            {pipelineStages.find(s => s.id === stage)?.label}
          </h3>
          <Badge className="bg-green-600 text-white text-xs px-2 py-1">{transactions.length}</Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full" style={{ width: `${(transactions.length / Math.max(...pipelineStages.map(() => 3), 1)) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No transactions</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
              className={`p-5 rounded-lg border-l-4 cursor-pointer transform transition-all hover:shadow-lg hover:-translate-y-1 ${pipelineStages.find(s => s.id === stage)?.color} border border-gray-100`}
              style={{ borderLeftColor: stage === 'offer_accepted' || stage === 'ready_close' ? '#f97316' : '#10b981' }}
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-snug break-words line-clamp-2">{transaction.property_address}</p>
                </div>
                <MoreVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
              <div className="space-y-2 mb-4 bg-white bg-opacity-50 -mx-5 px-5 py-3 rounded">
                <p className="text-xs text-gray-700"><span className="font-semibold">Buyer:</span> {transaction.buyer_name || 'N/A'}</p>
                <p className="text-xs text-gray-700"><span className="font-semibold">Seller:</span> {transaction.seller_name || 'N/A'}</p>
                <p className="text-xs text-gray-700"><span className="font-semibold">Agent:</span> {transaction.agent_name || 'N/A'}</p>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-green-700">${(transaction.sale_price / 1000).toFixed(0)}K</span>
                <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full text-gray-700 border border-gray-200">{transaction.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Banknote className="w-7 h-7 text-purple-600" /></div>
                Sales Pipeline
              </h1>
              <p className="text-gray-600 mt-1">Track property transactions through the sales pipeline</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ propertyAddress: '', buyerName: '', sellerName: '', salePrice: 0, closingDate: '', agentName: '', status: 'offer_accepted', notes: '' }); }} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" /> New Transaction
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg"><Banknote className="w-6 h-6 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">${(stats.value / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Closed Deals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
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
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Transaction Details</SheetTitle>
            </SheetHeader>
            {selectedTransaction && (
              <div className="space-y-6 mt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Property</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTransaction.property_address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Buyer</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.buyer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Seller</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.seller_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Sale Price</p>
                    <p className="text-2xl font-bold text-purple-600">${selectedTransaction.sale_price?.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Agent</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.agent_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                      <Badge className="mt-1">{selectedTransaction.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Form Modal */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Transaction' : 'New Transaction'}</SheetTitle>
              <SheetDescription>Fill in the transaction details</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium">Property Address *</label>
                <Input value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Buyer *</label>
                  <Input value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Seller</label>
                  <Input value={formData.sellerName} onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Sale Price *</label>
                  <Input type="number" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Closing Date *</label>
                  <Input type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Agent</label>
                <Input value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                    <SelectItem value="inspection">Under Inspection</SelectItem>
                    <SelectItem value="appraisal">Appraisal</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="ready_close">Ready to Close</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-2 border rounded text-sm" rows="2" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Create'} Transaction
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
