import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import TrustAccountingAPI from '@/api/RealEstateTrustAccounting';

export default function EscrowAccounts() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await TrustAccountingAPI.getEscrowAccounts(companyId);
        setEscrows(data);
      } catch (error) {
        console.error('Error loading escrow accounts:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Escrow Accounts</h1>
        <p className="text-muted-foreground">Manage escrow holdings for transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {escrows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            No escrow accounts found
          </div>
        ) : (
          escrows.map(escrow => (
            <div key={escrow.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{escrow.escrow_type}</h3>
                  <p className="text-sm text-muted-foreground">Release Status: {escrow.release_status}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(escrow.escrow_amount)}</div>
                  <p className="text-xs text-muted-foreground">{escrow.escrow_agent_company}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div><span className="text-muted-foreground">Buyer:</span> {escrow.buyer_id}</div>
                <div><span className="text-muted-foreground">Seller:</span> {escrow.seller_id}</div>
                <div><span className="text-muted-foreground">Property ID:</span> {escrow.property_id}</div>
              </div>
              {escrow.release_date && (
                <div className="text-sm text-muted-foreground">Released: {new Date(escrow.release_date).toLocaleDateString()}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
