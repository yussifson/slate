import React, { useState, useEffect } from 'react';
import { useRealEstateAPI } from '../../hooks/useRealEstateAPI';
import { formatCurrency } from '../../utils/formatters';
import LeaseAPI from '../../api/RealEstateLeaseAutomation';

export default function LeaseRenewals() {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useRealEstateAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await LeaseAPI.getLeaseRenewals(companyId);
        setRenewals(data);
      } catch (error) {
        console.error('Error loading lease renewals:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Lease Renewals</h1>
        <p className="text-muted-foreground">Manage lease renewal offers and track tenant responses</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {renewals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No lease renewals found
          </div>
        ) : (
          renewals.map(renewal => (
            <div key={renewal.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lease ID: {renewal.lease_id}</h3>
                  <p className="text-sm text-muted-foreground">Status: {renewal.renewal_status}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(renewal.new_rent_amount)}</div>
                  {renewal.rent_increase_percentage && (
                    <p className="text-sm text-muted-foreground">+{renewal.rent_increase_percentage}% increase</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4 p-4 bg-accent rounded">
                <div>
                  <span className="text-muted-foreground">Offer Date</span>
                  <p className="font-medium">{new Date(renewal.renewal_offer_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Deadline</span>
                  <p className="font-medium">{new Date(renewal.response_deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Term</span>
                  <p className="font-medium">{renewal.renewal_term_months} months</p>
                </div>
              </div>

              {renewal.tenant_response_date && (
                <div className="text-sm mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-muted-foreground">Tenant Response:</span>
                  <p className="font-medium">{new Date(renewal.tenant_response_date).toLocaleDateString()}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-accent">
                  Send Reminder
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
