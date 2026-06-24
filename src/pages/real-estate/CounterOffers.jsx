import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import { RealEstateOffers } from '@/api/RealEstateOffers';

export default function CounterOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await RealEstateAPI.getCounterOffers(companyId);
        setOffers(data);
      } catch (error) {
        console.error('Error loading counter offers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Counter Offers</h1>
        <p className="text-muted-foreground">Manage offer negotiations and counter-offers</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Original Offer ID</th>
              <th className="text-left py-3 px-4">Counter Price</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Closing Date</th>
              <th className="text-left py-3 px-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-muted-foreground">No counter offers found</td>
              </tr>
            ) : (
              offers.map(offer => (
                <tr key={offer.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 font-medium">{offer.original_offer_id}</td>
                  <td className="py-3 px-4">{formatCurrency(offer.counter_offer_price)}</td>
                  <td className="py-3 px-4"><span className="badge">{offer.counter_offer_status}</span></td>
                  <td className="py-3 px-4">{new Date(offer.closing_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(offer.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
