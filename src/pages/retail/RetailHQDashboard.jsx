import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Building2, Package, GitBranch, ArrowRightLeft, Search, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function RetailHQDashboard() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transfer Dialog State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    quantity: 1,
  });

  useEffect(() => {
    let active = true;
    const fetchHQData = async () => {
      // In a real multi-tenant scenario with HQ, we might look for sub-companies 
      // or "stores" linked to the parent companyId. 
      // For now, we'll fetch companies where parent_id = companyId OR just list the current company as 'Main Store'
      // and allow transferring within sub-locations if we had a store_locations table.
      // Assuming we are simulating branches with `companies` table or a specific `univ_retail_stores` table.
      // Since we don't have univ_retail_stores, let's use `companies` if we have access, or simulate it.
      
      try {
        const [transferRes, productRes, companyRes] = await Promise.all([
          powerSync.execute(`
            SELECT t.*, p.name as product_name, p.sku 
            FROM univ_retail_inventory_transfers t 
            LEFT JOIN univ_retail_products p ON t.product_id = p.id 
            WHERE t.company_id = ? 
            ORDER BY t.created_at DESC
          `, [companyId]),
          powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? ORDER BY name ASC', [companyId]),
          powerSync.execute('SELECT id, name FROM companies WHERE id = ?', [companyId])
        ]);

        if (active) {
          setTransfers(transferRes.rows._array || Array.from(transferRes.rows));
          setProducts(productRes.rows._array || Array.from(productRes.rows));
          setBranches(companyRes.rows._array || Array.from(companyRes.rows));
        }
      } catch (e) {
        console.error('Error fetching HQ data', e);
      }
    };
    
    fetchHQData();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const handleTransfer = async () => {
    if (!newTransfer.from_store_id || !newTransfer.to_store_id || !newTransfer.product_id || newTransfer.quantity < 1) {
      toast.error('Please fill all required fields');
      return;
    }
    if (newTransfer.from_store_id === newTransfer.to_store_id) {
      toast.error('Cannot transfer to the same store');
      return;
    }

    try {
      const id = crypto.randomUUID();
      const tracking = `TRX-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      
      await powerSync.execute(
        `INSERT INTO univ_retail_inventory_transfers (id, created_at, company_id, from_store_id, to_store_id, product_id, quantity, status, tracking_number)
         VALUES (?, datetime('now'), ?, ?, ?, ?, ?, 'In Transit', ?)`,
        [id, companyId, newTransfer.from_store_id, newTransfer.to_store_id, newTransfer.product_id, newTransfer.quantity, tracking]
      );
      
      toast.success(`Transfer ${tracking} Initiated`);
      setIsTransferOpen(false);
      setNewTransfer({ from_store_id: '', to_store_id: '', product_id: '', quantity: 1 });
      
      // Optimistic update
      const product = products.find(p => p.id === newTransfer.product_id);
      setTransfers(prev => [{
        id,
        created_at: new Date().toISOString(),
        company_id: companyId,
        from_store_id: newTransfer.from_store_id,
        to_store_id: newTransfer.to_store_id,
        product_id: newTransfer.product_id,
        product_name: product?.name || 'Unknown',
        sku: product?.sku || '',
        quantity: newTransfer.quantity,
        status: 'In Transit',
        tracking_number: tracking
      }, ...prev]);

    } catch (error) {
      console.error('Error creating transfer', error);
      toast.error('Failed to initiate transfer');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await powerSync.execute('UPDATE univ_retail_inventory_transfers SET status = ? WHERE id = ?', [newStatus, id]);
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(`Transfer marked as ${newStatus}`);
    } catch (e) {
      console.error('Error updating transfer', e);
      toast.error('Failed to update transfer status');
    }
  };

  const getBranchName = (id) => branches.find(b => b.id === id)?.name || id;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Enterprise HQ
          </h1>
          <p className="text-slate-500 mt-2">Multi-store management and cross-branch inventory transfers.</p>
        </div>
        
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cross-Branch Transfer</DialogTitle>
              <DialogDescription>Move stock between your branch locations.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>From Store</Label>
                <Select value={newTransfer.from_store_id} onValueChange={(val) => setNewTransfer({...newTransfer, from_store_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Origin" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>To Store</Label>
                <Select value={newTransfer.to_store_id} onValueChange={(val) => setNewTransfer({...newTransfer, to_store_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select value={newTransfer.product_id} onValueChange={(val) => setNewTransfer({...newTransfer, product_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Quantity to Transfer</Label>
                <Input type="number" min="1" value={newTransfer.quantity} onChange={(e) => setNewTransfer({...newTransfer, quantity: parseInt(e.target.value)||1})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
              <Button onClick={handleTransfer}>Initiate Transfer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Branches</p>
              <h3 className="text-2xl font-bold">{branches.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Transfers</p>
              <h3 className="text-2xl font-bold">{transfers.filter(t => t.status === 'In Transit').length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Enterprise Products</p>
              <h3 className="text-2xl font-bold">{products.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Monitor stock moving between your locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transfers.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transfer history found.</p>
            ) : (
              transfers.map(t => (
                <div key={t.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-card/50">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Package className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{t.product_name} <span className="text-slate-500 font-normal">x{t.quantity}</span></p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span>{getBranchName(t.from_store_id)}</span>
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>{getBranchName(t.to_store_id)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="text-sm text-slate-500 font-mono">
                      {t.tracking_number}
                    </div>
                    <Badge variant="outline" className={
                      t.status === 'In Transit' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      t.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' : ''
                    }>
                      {t.status}
                    </Badge>
                    
                    {t.status === 'In Transit' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, 'Completed')}>
                        Receive
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
