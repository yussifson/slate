import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { RotateCcw, Search, Plus, Filter, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function RMAManagement() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [rmas, setRmas] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New RMA Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRMA, setNewRMA] = useState({
    product_id: '',
    supplier_id: '',
    quantity: 1,
    reason: '',
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (companyId === undefined) return;
      try {
        const [rmaRes, productRes, supplierRes] = await Promise.all([
          powerSync.execute('SELECT r.*, p.name as product_name, p.sku FROM univ_retail_rmas r LEFT JOIN univ_retail_products p ON r.product_id = p.id WHERE r.company_id = ? ORDER BY r.created_at DESC', [companyId]),
          powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ? ORDER BY name ASC', [companyId]),
          powerSync.execute('SELECT * FROM univ_retail_suppliers WHERE company_id = ? ORDER BY name ASC', [companyId]) 
        ]);
        
        if (active) {
          setRmas(rmaRes.rows._array || Array.from(rmaRes.rows));
          setProducts(productRes.rows._array || Array.from(productRes.rows));
          setSuppliers(supplierRes.rows._array || Array.from(supplierRes.rows));
        }
      } catch (e) {
        console.error('Error fetching RMA data', e);
      }
    };
    
    // Subscribe to changes
    const rmaWatcher = powerSync.watch('SELECT r.*, p.name as product_name, p.sku FROM univ_retail_rmas r LEFT JOIN univ_retail_products p ON r.product_id = p.id WHERE r.company_id = ? ORDER BY r.created_at DESC', [companyId], (res) => {
      setRmas(res.rows._array || Array.from(res.rows));
    });

    fetchData();
    return () => { 
      active = false; 
    };
  }, [companyId, powerSync]);

  const filteredRmas = rmas.filter(rma => 
    (rma.rma_number || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (rma.product_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (rma.reason || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleCreateRMA = async () => {
    if (!newRMA.product_id || !newRMA.supplier_id || !newRMA.reason || newRMA.quantity < 1) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const id = crypto.randomUUID();
      const rmaNumber = `RMA-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      await powerSync.execute(
        `INSERT INTO univ_retail_rmas (id, created_at, company_id, rma_number, product_id, supplier_id, quantity, reason, status, tracking_number)
         VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, 'Pending', null)`,
        [id, companyId, rmaNumber, newRMA.product_id, newRMA.supplier_id, newRMA.quantity, newRMA.reason]
      );
      
      const newRmaObj = {
        id,
        created_at: new Date().toISOString(),
        company_id: companyId,
        rma_number: rmaNumber,
        product_id: newRMA.product_id,
        supplier_id: newRMA.supplier_id,
        quantity: newRMA.quantity,
        reason: newRMA.reason,
        status: 'Pending',
        product_name: products.find(p => p.id === newRMA.product_id)?.name
      };
      
      setRmas(prev => [newRmaObj, ...prev]);
      
      toast.success(`RMA ${rmaNumber} Created Successfully`);
      setIsDialogOpen(false);
      setNewRMA({ product_id: '', supplier_id: '', quantity: 1, reason: '' });
    } catch (error) {
      console.error('Error creating RMA', error);
      toast.error('Failed to create RMA');
    }
  };

  const updateRMAStatus = async (rmaId, newStatus) => {
    try {
      await powerSync.execute(
        'UPDATE univ_retail_rmas SET status = ? WHERE id = ?',
        [newStatus, rmaId]
      );
      toast.success(`RMA status updated to ${newStatus}`);
    } catch (e) {
      console.error('Error updating status', e);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>;
      case 'Approved': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Approved</Badge>;
      case 'Shipped': return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Shipped</Badge>;
      case 'Completed': return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
      case 'Rejected': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-primary" />
            Returns & RMAs
          </h1>
          <p className="text-slate-500 mt-2">Manage Return Merchandise Authorizations for defective stock.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New RMA
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New RMA</DialogTitle>
              <DialogDescription>Authorize a return for defective or unordered merchandise back to the supplier.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select value={newRMA.product_id} onValueChange={(val) => setNewRMA({...newRMA, product_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select defective product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={newRMA.supplier_id} onValueChange={(val) => setNewRMA({...newRMA, supplier_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length > 0 ? suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    )) : (
                      <SelectItem value="unspecified" disabled>No suppliers found. Add one in Procurement.</SelectItem>
                    )}
                    {/* Fallback mock for testing if no suppliers exist yet */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  value={newRMA.quantity} 
                  onChange={(e) => setNewRMA({...newRMA, quantity: parseInt(e.target.value) || 1})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Return</Label>
                <Textarea 
                  id="reason" 
                  placeholder="e.g. Defective items, expired goods, wrong items received..." 
                  value={newRMA.reason}
                  onChange={(e) => setNewRMA({...newRMA, reason: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRMA}>Submit RMA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle>Active RMAs</CardTitle>
              <CardDescription>Track the status of all outgoing supplier returns.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search RMAs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRmas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No RMAs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRmas.map((rma) => (
                    <TableRow key={rma.id}>
                      <TableCell className="font-medium">{rma.rma_number}</TableCell>
                      <TableCell>{new Date(rma.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{rma.product_name || 'Unknown Product'}</span>
                          <span className="text-xs text-slate-500">SKU: {rma.sku || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{rma.quantity}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={rma.reason}>{rma.reason}</TableCell>
                      <TableCell>{getStatusBadge(rma.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select value={rma.status} onValueChange={(val) => updateRMAStatus(rma.id, val)}>
                          <SelectTrigger className="w-[130px] ml-auto h-8">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
