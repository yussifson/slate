import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, User, DollarSign, Percent, Calendar, ArrowUpRight, Plus, MoreVertical } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  paid: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
  overdue: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  scheduled: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' }
};

export default function Commissions() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [commissions, setCommissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalPending: 0,
    avgCommission: 0,
    agents: []
  });

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_commissions WHERE company_id = ? ORDER BY payment_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setCommissions(data);

        const totalEarned = data.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const totalPending = data.filter(c => c.status !== 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const avgCommission = data.length > 0 ? data.reduce((sum, c) => sum + (c.commission_amount || 0), 0) / data.length : 0;
        
        const uniqueAgents = [...new Set(data.map(c => c.agent_name))];
        setStats({ totalEarned, totalPending, avgCommission, agents: uniqueAgents });
      } catch (e) {
        console.error('[Commissions]:', e);
        toast.error('Failed to load commissions');
      }
      setIsLoading(false);
    };
    if (companyId) fetchCommissions();
  }, [companyId]);

  const getFilteredCommissions = () => {
    let filtered = commissions;
    if (selectedAgent !== 'all') {
      filtered = filtered.filter(c => c.agent_name === selectedAgent);
    }
    return filtered;
  };

  const getAgentStats = (agentName) => {
    const agentCommissions = commissions.filter(c => c.agent_name === agentName);
    const earned = agentCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const pending = agentCommissions.filter(c => c.status !== 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    return { earned, pending, total: earned + pending, count: agentCommissions.length };
  };

  const filteredCommissions = getFilteredCommissions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-7 h-7 text-green-600" /></div>
              Commission Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage agent commissions</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-semibold mb-1">Total Earned</p>
                  <p className="text-3xl font-bold">${(stats.totalEarned / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-green-200 mt-2">Paid commissions</p>
                </div>
                <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-semibold mb-1">Pending</p>
                  <p className="text-3xl font-bold">${(stats.totalPending / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-amber-200 mt-2">Awaiting payment</p>
                </div>
                <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                  <ArrowUpRight className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">Average</p>
                  <p className="text-3xl font-bold">${(stats.avgCommission / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-blue-200 mt-2">Per commission</p>
                </div>
                <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                  <Percent className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.agents.map((agent) => {
            const agentStats = getAgentStats(agent);
            return (
              <Card
                key={agent}
                onClick={() => setSelectedAgent(selectedAgent === agent ? 'all' : agent)}
                className={`border-2 cursor-pointer transition-all ${selectedAgent === agent ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs font-bold text-white px-2 py-1 rounded-full bg-green-600">{agentStats.count}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate mb-2">{agent}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Earned</span>
                      <span className="font-bold text-green-600">${(agentStats.earned / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-bold text-amber-600">${(agentStats.pending / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Commissions List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Commission Details
              </CardTitle>
              <span className="text-sm font-normal bg-white bg-opacity-20 px-3 py-1 rounded-full">
                {filteredCommissions.length} commissions
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Transaction</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission, idx) => (
                    <tr
                      key={commission.id}
                      onClick={() => { setSelectedCommission(commission); setShowDetails(true); }}
                      className={`border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-full"><User className="w-4 h-4 text-green-600" /></div>
                          <p className="font-semibold text-gray-900">{commission.agent_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{commission.transaction_id}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-green-600">{(commission.commission_rate * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-green-600">${commission.commission_amount?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4" /> {commission.payment_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusConfig[commission.status]?.badge}>{commission.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Details Sheet */}
        <Sheet open={showDetails} onOpenChange={setShowDetails}>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Commission Details</SheetTitle>
            </SheetHeader>
            {selectedCommission && (
              <div className="space-y-6 mt-6">
                <div className={`p-4 rounded-lg border-l-4 ${statusConfig[selectedCommission.status]?.bg}`}>
                  <p className={`text-sm font-bold ${statusConfig[selectedCommission.status]?.color}`}>
                    {selectedCommission.status.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Agent</p>
                    <p className="text-lg font-bold text-gray-900">{selectedCommission.agent_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Commission Amount</p>
                    <p className="text-3xl font-bold text-green-600">${selectedCommission.commission_amount?.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Commission Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{(selectedCommission.commission_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Payment Date</p>
                      <p className="text-sm text-gray-900">{selectedCommission.payment_date}</p>
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
