import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, TrendingUp, Home, User, Calendar, DollarSign, Percent, Plus, Search, Filter } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  accepted: { color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
  rejected: { color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
  expired: { color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' }
};

export default function Offers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showForm, setShowForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, avgOffer: 0 });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY offer_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setOffers(data);

        const pending = data.filter(o => o.status === 'pending').length;
        const accepted = data.filter(o => o.status === 'accepted').length;
        const avgOffer = data.length > 0 ? data.reduce((sum, o) => sum + (o.offer_amount || 0), 0) / data.length : 0;
        setStats({ total: data.length, pending, accepted, avgOffer });
      } catch (e) {
        console.error('[Offers]:', e);
        toast.error('Failed to load offers');
      }
      setIsLoading(false);
    };
    if (companyId) fetchOffers();
  }, [companyId]);

  useEffect(() => {
    let filtered = offers;
    if (search) {
      filtered = filtered.filter(o =>
        o.property_address?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    if (sortBy === 'amount') {
      filtered.sort((a, b) => b.offer_amount - a.offer_amount);
    }
    setFilteredOffers(filtered);
  }, [offers, search, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><FileText className="w-7 h-7 text-amber-600" /></div>
              Offer Management
            </h1>
            <p className="text-gray-600 mt-1">Track and negotiate property offers</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Plus className="w-4 h-4" /> New Offer
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50">
            <CardContent className="p-5">
              <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Total Offers</p>
              <p className="text-3xl font-bold text-amber-600">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-orange-50">
            <CardContent className="p-5">
              <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting response</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-5">
              <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              <p className="text-xs text-gray-500 mt-2">Converted</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50">
            <CardContent className="p-5">
              <p className="text-gray-600 text-xs uppercase font-semibold mb-2">Avg Offer</p>
              <p className="text-3xl font-bold text-blue-600">${(stats.avgOffer / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-2">Mean value</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search property or buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-gray-200"
            icon={<Search className="w-4 h-4" />}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
          >
            <option value="date">Newest First</option>
            <option value="amount">Highest Amount</option>
          </select>
        </div>

        {/* Offers Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            <CardTitle>Active Offers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Buyer</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Offer Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Earnest Money</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer, idx) => (
                    <tr
                      key={offer.id}
                      onClick={() => setSelectedOffer(offer)}
                      className={`border-b border-gray-100 hover:bg-amber-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded"><Home className="w-4 h-4 text-amber-600" /></div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{offer.property_address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-full"><User className="w-3 h-3 text-blue-600" /></div>
                          <p className="font-medium text-gray-900 text-sm">{offer.buyer_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-amber-600">${offer.offer_amount?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-700">${offer.earnest_money?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                          <Calendar className="w-4 h-4" /> {offer.expiration_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusConfig[offer.status]?.badge}>{offer.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Offer Details Sheet */}
        <Sheet open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle>Offer Details</SheetTitle>
            </SheetHeader>
            {selectedOffer && (
              <div className="space-y-6 mt-6">
                <div className={`p-4 rounded-lg ${statusConfig[selectedOffer.status]?.bg} border-l-4`}>
                  <p className={`text-sm font-semibold ${statusConfig[selectedOffer.status]?.color}`}>
                    {selectedOffer.status.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Property</p>
                    <p className="text-lg font-bold text-gray-900">{selectedOffer.property_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Buyer</p>
                    <p className="font-medium text-gray-900">{selectedOffer.buyer_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Offer Amount</p>
                      <p className="text-2xl font-bold text-amber-600">${selectedOffer.offer_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Earnest Money</p>
                      <p className="text-2xl font-bold text-orange-600">${selectedOffer.earnest_money?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Contingencies</p>
                    <p className="text-sm text-gray-700">{selectedOffer.contingencies || 'None specified'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Offer Date</p>
                      <p className="text-sm text-gray-900">{selectedOffer.offer_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Expires</p>
                      <p className="text-sm text-gray-900">{selectedOffer.expiration_date}</p>
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
