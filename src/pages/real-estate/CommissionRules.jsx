import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import OffersAPI from '../../api/RealEstateOffers';

export default function CommissionRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await OffersAPI.getCommissionRules(companyId);
        setRules(data);
      } catch (error) {
        console.error('Error loading commission rules:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Commission Rules</h1>
        <p className="text-muted-foreground">Configure commission structures for transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {rules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No commission rules configured
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{rule.rule_name}</h3>
                  <p className="text-sm text-muted-foreground">{rule.rule_type}</p>
                </div>
                <div className="text-right">
                  {rule.commission_percentage && (
                    <div className="text-2xl font-bold text-primary">{rule.commission_percentage}%</div>
                  )}
                  {rule.flat_fee && (
                    <div className="text-sm text-muted-foreground">Flat Fee: ${rule.flat_fee}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-muted-foreground">Property Types:</span> {rule.property_types}</div>
                <div><span className="text-muted-foreground">Status:</span> {rule.is_active ? 'Active' : 'Inactive'}</div>
              </div>
              {rule.price_range_min && rule.price_range_max && (
                <div className="text-sm text-muted-foreground">
                  Price Range: ${rule.price_range_min.toLocaleString()} - ${rule.price_range_max.toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
