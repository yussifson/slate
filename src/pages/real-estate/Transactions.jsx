import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Home, User, DollarSign, CheckCircle, AlertCircle, Plus, MoreVertical } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const pipelineStages = [
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'bg-purple-100 border-purple-300', badge: 'bg-purple-200 text-purple-900' },
  { id: 'inspection', label: 'Under Inspection', color: 'bg-blue-100 border-blue-300', badge: 'bg-blue-200 text-blue-900' },
  { id: 'appraisal', label: 'Appraisal', color: 'bg-cyan-100 border-cyan-300', badge: 'bg-cyan-200 text-cyan-900' },
  { id: 'financing', label: 'Financing', color: 'bg-indigo-100 border-indigo-300', badge: 'bg-indigo-200 text-indigo-900' },
  { id: 'ready_close', label: 'Ready to Close', color: 'bg-green-100 border-green-300', badge: 'bg-green-200 text-green-900' },
  { id: 'closed', label: 'Closed', color: 'bg-emerald-100 border-emerald-300', badge: 'bg-emerald-200 text-emerald-900' }
];

export default function Transactions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [stats, setStats] = useState({ total: 0, value: 0, closed: 0 });

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

  const getTransactionsByStage = (stage) => {
    return transactions.filter(t => t.status === stage);
  };

  const KanbanColumn = ({ stage, transactions }) => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col border border-gray-200">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${pipelineStages.find(s => s.id === stage)?.badge}`}></span>
            {pipelineStages.find(s => s.id === stage)?.label}
          </h3>
          <Badge variant="secondary" className="text-xs">{transactions.length}</Badge>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-1">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 rounded-full" style={{ width: `${(transactions.length / Math.max(...pipelineStages.map(() => 3), 1)) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs">No transactions</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
              className={`p-3 rounded-lg border-l-4 border-l-purple-500 cursor-pointer transform transition-all hover:shadow-md hover:scale-105 ${pipelineStages.find(s => s.id === stage)?.color} border`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900 text-sm truncate">{transaction.property_address}</p>
                <MoreVertical className="w-3 h-3 text-gray-400" />
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-600 truncate">Buyer: {transaction.buyer_name}</p>
                <p className="text-xs text-gray-600 truncate">Agent: {transaction.agent_name}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">${(transaction.sale_price / 1000).toFixed(0)}K</span>
                <span className="text-xs bg-white px-2 py-1 rounded text-gray-700">{transaction.status}</span>
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
            <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 gap-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {pipelineStages.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage.id}
              transactions={getTransactionsByStage(stage.id)}
            />
          ))}
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
      </div>
    </div>
  );
}
