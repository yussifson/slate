import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import AnalyticsAPI from '@/api/RealEstateAnalytics';

export default function AgentMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsAPI.getAgentMetrics(companyId);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading agent metrics:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Agent Metrics</h1>
        <p className="text-muted-foreground">Track performance metrics for your agents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No agent metrics found
          </div>
        ) : (
          metrics.map(metric => (
            <div key={metric.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Agent ID: {metric.agent_id}</h3>
                <p className="text-sm text-muted-foreground">{metric.metric_period} Period</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-accent rounded">
                  <p className="text-xs text-muted-foreground">Listings Taken</p>
                  <p className="text-2xl font-bold text-foreground">{metric.listings_taken_count}</p>
                </div>
                <div className="p-3 bg-accent rounded">
                  <p className="text-xs text-muted-foreground">Listings Sold</p>
                  <p className="text-2xl font-bold text-primary">{metric.listings_sold_count}</p>
                </div>
                <div className="p-3 bg-accent rounded">
                  <p className="text-xs text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-foreground">{metric.client_count}</p>
                </div>
                <div className="p-3 bg-accent rounded">
                  <p className="text-xs text-muted-foreground">Return Client Rate</p>
                  <p className="text-2xl font-bold text-foreground">{metric.return_client_rate}%</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-accent rounded">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sales Volume:</span>
                  <span className="font-semibold">{formatCurrency(metric.sales_volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Sale Price:</span>
                  <span className="font-semibold">{formatCurrency(metric.average_sale_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commission Earned:</span>
                  <span className="font-semibold text-primary">{formatCurrency(metric.commission_earned)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Days on Market:</span>
                  <span className="font-semibold">{metric.average_days_on_market}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <span className="font-semibold">{metric.average_client_rating}/5</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
