import { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePowerSync } from '@powersync/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function Claims() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, [companyId]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const result = await powerSync.execute(
        'SELECT * FROM univ_pharmacy_insurance_claims WHERE company_id = ? ORDER BY submission_date DESC',
        [companyId]
      );
      setClaims(result.rows._array || []);
    } catch (e) {
      console.error('[Claims] Fetch error:', e);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(c =>
    c.claim_number?.includes(search) ||
    c.insurance_provider?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'Submitted': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Denied': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Insurance Claims</h1>
          <p className="text-muted-foreground mt-2">Track and manage insurance reimbursement claims</p>
        </div>

        <Card className="p-4 mb-6 border border-border bg-card">
          <Input placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-3xl font-bold text-foreground mt-2">{claims.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{claims.filter(c => c.claim_status === 'Submitted').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-3xl font-bold text-green-600 mt-2">${claims.filter(c => c.claim_status === 'Approved').reduce((s, c) => s + (c.approval_amount || 0), 0).toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Claim #</th>
                    <th className="text-left p-4 font-medium text-foreground">Insurance</th>
                    <th className="text-left p-4 font-medium text-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-foreground">Approved</th>
                    <th className="text-left p-4 font-medium text-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClaims.map(c => (
                    <tr key={c.id} className="hover:bg-muted/50">
                      <td className="p-4 font-semibold text-foreground">{c.claim_number}</td>
                      <td className="p-4">{c.insurance_provider}</td>
                      <td className="p-4">${parseFloat(c.claim_amount || 0).toFixed(2)}</td>
                      <td className="p-4">${parseFloat(c.approval_amount || 0).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(c.claim_status)}`}>
                          {c.claim_status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(c.submission_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
