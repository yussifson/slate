import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/lib/powersync';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function B2BWholesalePortal() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [newTier, setNewTier] = useState('Silver');
  const [newCreditLimit, setNewCreditLimit] = useState(5000);

  useEffect(() => {
    if (user?.company_id) loadAccounts(user.company_id);
  }, [user]);

  const loadAccounts = async (companyId) => {
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_b2b_accounts WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setAccounts(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('Failed to load B2B accounts', e);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    if (!newClientName || !user?.company_id) return;
    try {
      await powerSync.execute(
        'INSERT INTO univ_retail_b2b_accounts (id, company_id, client_name, tier, credit_limit, outstanding_balance) VALUES (uuid(), ?, ?, ?, ?, 0)',
        [user.company_id, newClientName, newTier, newCreditLimit]
      );
      toast.success('B2B Account Created');
      setNewClientName('');
      loadAccounts(user.company_id);
    } catch (e) {
      toast.error('Failed to create account');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Silver': return 'text-slate-600 bg-slate-100 border-slate-300';
      case 'Bronze': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading B2B Portal...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          B2B Wholesale Portal
        </h1>
        <p className="text-slate-500 mt-2">Manage corporate trade accounts, wholesale pricing tiers, and credit limits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>New Trade Account</CardTitle>
              <CardDescription>Onboard a new wholesale client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Corporate Name</Label>
                <Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gold">Gold (20% Off)</SelectItem>
                    <SelectItem value="Silver">Silver (10% Off)</SelectItem>
                    <SelectItem value="Bronze">Bronze (5% Off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit ($)</Label>
                <Input type="number" value={newCreditLimit} onChange={e => setNewCreditLimit(Number(e.target.value))} />
              </div>
              <Button className="w-full mt-4" onClick={addAccount}><Plus className="w-4 h-4 mr-2" /> Create Account</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active B2B Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Credit Limit</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500">No B2B accounts found.</TableCell></TableRow>}
                    {accounts.map(acc => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.client_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 border rounded-full text-xs font-semibold ${getTierColor(acc.tier)}`}>
                            {acc.tier}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">${acc.credit_limit?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">${acc.outstanding_balance?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
