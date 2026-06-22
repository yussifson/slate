import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/lib/powersync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Network, Plus, Percent } from 'lucide-react';
import { toast } from 'sonner';

export default function FranchiseManager() {
  const { user } = useAuth();
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newName, setNewName] = useState('');
  const [newRoyalty, setNewRoyalty] = useState(5.0);

  useEffect(() => {
    if (user?.company_id) loadFranchises(user.company_id);
  }, [user]);

  const loadFranchises = async (companyId) => {
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_franchises WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setFranchises(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('Failed to load franchises', e);
    } finally {
      setLoading(false);
    }
  };

  const addFranchise = async () => {
    if (!newName || !user?.company_id) return;
    try {
      await powerSync.execute(
        'INSERT INTO univ_retail_franchises (id, company_id, franchisee_name, royalty_percentage, status) VALUES (uuid(), ?, ?, ?, ?)',
        [user.company_id, newName, newRoyalty, 'Active']
      );
      toast.success('Franchise Added');
      setNewName('');
      loadFranchises(user.company_id);
    } catch (e) {
      toast.error('Failed to add franchise');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Franchise Portal...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Network className="w-8 h-8 text-primary" />
          Franchise Management
        </h1>
        <p className="text-slate-500 mt-2">Manage sub-companies, franchisee records, and automated royalty collections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Register Franchisee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Franchisee Entity Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="West Coast Partners LLC" />
              </div>
              <div className="space-y-2">
                <Label>Royalty Percentage (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.1" value={newRoyalty} onChange={e => setNewRoyalty(Number(e.target.value))} className="pl-8" />
                  <Percent className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
              <Button className="w-full mt-4" onClick={addFranchise}><Plus className="w-4 h-4 mr-2" /> Add Franchisee</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Network Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Royalty %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Est. Monthly Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchises.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500">No franchises registered.</TableCell></TableRow>}
                    {franchises.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.franchisee_name}</TableCell>
                        <TableCell>{f.royalty_percentage}%</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                            {f.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-slate-500 italic">Data Pending</TableCell>
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
