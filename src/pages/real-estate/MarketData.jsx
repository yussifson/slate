import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import { RealEstateIntelligence } from '@/api/RealEstateIntelligence';

export default function MarketData() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await RealEstateIntelligence.getMarketData(companyId);
        setMarketData(data);
      } catch (error) {
        console.error('Error loading market data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Market Intelligence</h1>
        <p className="text-muted-foreground">View market trends and data for your regions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketData.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No market data available
          </div>
        ) : (
          marketData.map(data => (
            <div key={data.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{data.market_region}</h3>
                <p className="text-sm text-muted-foreground">{data.market_level} Market</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-accent rounded">
                    <p className="text-xs text-muted-foreground">Average Price</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(data.average_price)}</p>
                  </div>
                  <div className="p-3 bg-accent rounded">
                    <p className="text-xs text-muted-foreground">Median Price</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(data.median_price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-accent rounded">
                    <p className="text-xs text-muted-foreground">Price/SqFt</p>
                    <p className="text-lg font-bold text-foreground">${data.price_per_sqft}</p>
                  </div>
                  <div className="p-3 bg-accent rounded">
                    <p className="text-xs text-muted-foreground">Days on Market</p>
                    <p className="text-lg font-bold text-foreground">{data.days_on_market_average}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sold</p>
                    <p className="font-medium">{data.sold_listings_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className="font-medium">{data.active_listings_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trend</p>
                    <p className={`font-medium ${trendColors[data.market_trend] || ''}`}>{data.market_trend}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>Data Date: {new Date(data.data_date).toLocaleDateString()}</p>
                  <p>Source: {data.data_source}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
