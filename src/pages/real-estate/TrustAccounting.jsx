import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { formatCurrency } from '@/lib/constants';
import { RealEstateTrustAccounting } from '@/api/RealEstateTrustAccounting';

export default function TrustAccounting() {
  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const accountsData = await RealEstateTrustAccounting.getTrustAccounts(companyId);
        const ledgerData = await RealEstateTrustAccounting.getTrustLedger(companyId);
        setAccounts(accountsData);
        setLedger(ledgerData);
      } catch (error) {
        console.error('Error loading trust accounting data:', error);
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Trust Accounting</h1>
        <p className="text-muted-foreground">Manage trust accounts, escrow, and ledger transactions</p>
      </div>

      <div className="tabs mb-6 flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 ${activeTab === 'accounts' ? 'border-b-2 border-primary' : ''}`}
        >
          Trust Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 ${activeTab === 'ledger' ? 'border-b-2 border-primary' : ''}`}
        >
          Ledger Transactions ({ledger.length})
        </button>
      </div>

      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 gap-6">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No trust accounts found</div>
          ) : (
            accounts.map(account => (
              <div key={account.id} className="border border-border rounded-lg p-6 bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{account.account_name}</h3>
                    <p className="text-sm text-muted-foreground">{account.account_type}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(account.balance)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Bank:</span> {account.bank_name}</div>
                  <div><span className="text-muted-foreground">Status:</span> {account.reconciliation_status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Reference</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted-foreground">No ledger transactions found</td>
                </tr>
              ) : (
                ledger.map(entry => (
                  <tr key={entry.id} className="border-b border-border hover:bg-accent">
                    <td className="py-3 px-4">{new Date(entry.transaction_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><span className="font-medium">{entry.transaction_type}</span></td>
                    <td className="py-3 px-4">{entry.description}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(entry.amount)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{entry.reference_number}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
